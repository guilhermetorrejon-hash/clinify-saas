import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { StorageService } from '../storage/storage.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SuggestThemesDto } from './dto/suggest-themes.dto';
import { RecreatePostDto } from './dto/recreate-post.dto';
import { POST_GENERATION_QUEUE, PostGenerationJob } from '../../queues/post-generation.processor';
import { UsageService } from '../usage/usage.service';
import { Profession } from '@prisma/client';

const QUEUE_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private storage: StorageService,
    private usage: UsageService,
    @InjectQueue(POST_GENERATION_QUEUE) private postsQueue: Queue<PostGenerationJob>,
  ) {}

  async suggestThemes(userId: string, dto: SuggestThemesDto) {
    // Verificar se o usuário ainda tem cota de sugestões de tema no mês
    await this.usage.checkLimit(userId, 'THEME_SUGGESTION');

    const suggestions = await this.ai.generateThemeSuggestions(
      userId,
      dto.category || 'EDUCATIVO',
      dto.format || 'FEED',
      this.prisma,
    );

    // Registrar que consumiu 1 sugestão de tema
    await this.usage.record(userId, 'THEME_SUGGESTION');
    return { suggestions };
  }

  async create(userId: string, dto: CreatePostDto) {
    // Verificar cota: carrossel e post têm limites separados
    const usageType = dto.format === 'CARROSSEL' ? 'CAROUSEL' : 'POST';
    await this.usage.checkLimit(userId, usageType as any);

    // Upload da foto contextual para R2 (se vier como data URL)
    let contextPhotoUrl = dto.contextPhotoUrl || null;
    if (contextPhotoUrl?.startsWith('data:')) {
      const match = contextPhotoUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contextPhotoUrl = await this.storage.uploadBase64Image(
          match[2], match[1], `posts/${userId}/context`,
        );
      }
    }

    // Criar post base com status DRAFT
    const post = await this.prisma.post.create({
      data: {
        userId,
        theme: dto.theme,
        category: dto.category,
        format: dto.format,
        status: 'DRAFT',
        userPhotoUrl: dto.userPhotoUrl || null,
        contextPhotoUrl,
        variations: {
          createMany: {
            data: dto.format === 'CARROSSEL'
              ? (() => {
                  // Carrossel: 1 estilo × 5 slides (user escolhe o estilo)
                  const styleMap: Record<string, string> = {
                    fotografico: 'foto',
                    tipografico: 'tipo',
                    grafico: 'graf',
                  };
                  const prefix = styleMap[dto.carouselStyle || 'fotografico'] || 'foto';
                  return [1, 2, 3, 4, 5].map((n) => ({
                    designStyle: `carrossel_${prefix}_${n}`,
                  }));
                })()
              : [
                  { designStyle: 'fotografico' },
                  { designStyle: 'tipografico' },
                  { designStyle: 'grafico' },
                ],
          },
        },
      },
      include: { variations: true },
    });

    // Registrar que o usuário consumiu 1 post (ou carrossel) do plano dele
    // Isso é feito DEPOIS de criar o post com sucesso no banco
    await this.usage.record(userId, usageType as any);

    // Gerar textos em background — retorna DRAFT imediatamente,
    // frontend faz polling até TEXTS_READY
    this.generateTextsAsync(post.id, userId, dto).catch((err) => {
      this.logger.error(`[post ${post.id}] Geração de textos em background falhou: ${err.message || err}`);
    });

    return post;
  }

  async recreate(userId: string, dto: RecreatePostDto) {
    // Consome 1 POST da cota
    await this.usage.checkLimit(userId, 'POST');

    // Upload da imagem original para R2
    let originalImageUrl: string | null = null;
    const match = dto.originalImageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      originalImageUrl = await this.storage.uploadBase64Image(
        match[2], match[1], `posts/${userId}/recreate-original`,
      );
    }

    // OCR — extrair textos do post original via Gemini Vision
    let extractedTexts = { headline: '', subtitle: '', caption: '' };
    if (match) {
      extractedTexts = await this.ai.extractTextFromImage(match[2], match[1]);
      this.logger.log(`[recreate] Textos extraídos — headline: "${extractedTexts.headline}", subtitle: "${extractedTexts.subtitle}"`);
    }

    // Criar post com 3 variações de recriação
    const post = await this.prisma.post.create({
      data: {
        userId,
        theme: extractedTexts.headline || 'Recriação de post',
        category: 'EDUCATIVO', // categoria padrão para recriações
        format: dto.format,
        status: 'DRAFT',
        headline: extractedTexts.headline,
        subtitle: extractedTexts.subtitle,
        contextPhotoUrl: originalImageUrl,
        userPhotoUrl: dto.userPhotoUrl || null,
        variations: {
          createMany: {
            data: [
              { designStyle: 'recreate_similar' },
              { designStyle: 'recreate_different' },
              { designStyle: 'recreate_bold' },
            ],
          },
        },
      },
      include: { variations: true },
    });

    await this.usage.record(userId, 'POST');

    // Gera legenda em background e depois vai para TEXTS_READY
    this.generateTextsForRecreate(post.id, userId, extractedTexts.headline).catch((err) => {
      this.logger.error(`[recreate ${post.id}] Geração de legenda falhou: ${err.message || err}`);
    });

    return post;
  }

  private async generateTextsForRecreate(postId: string, userId: string, theme: string) {
    const brandKit = await this.prisma.brandKit.findUnique({ where: { userId } });
    const profession: Profession = brandKit?.profession || 'OUTRO';

    let caption = '';
    for (let attempt = 1; attempt <= 2 && !caption; attempt++) {
      try {
        const texts = await this.ai.generatePostTexts({
          theme: theme || 'Post profissional para redes sociais',
          category: 'EDUCATIVO',
          format: 'FEED',
          profession,
          brandKit: brandKit || {},
        });
        caption = texts.caption;
      } catch (err: any) {
        this.logger.error(`[recreate ${postId}] Tentativa ${attempt}/2 de gerar legenda falhou: ${err.message || err}`);
      }
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: {
        caption: caption || null,
        status: 'TEXTS_READY',
      },
    });
    this.logger.log(`[recreate ${postId}] Legenda gerada → TEXTS_READY`);
  }

  private async generateTextsAsync(
    postId: string,
    userId: string,
    dto: CreatePostDto,
  ) {
    const brandKit = await this.prisma.brandKit.findUnique({ where: { userId } });
    const profession: Profession = brandKit?.profession || 'OUTRO';

    let texts: { headline: string; subtitle: string; caption: string } | null = null;
    for (let attempt = 1; attempt <= 2 && !texts; attempt++) {
      try {
        texts = await this.ai.generatePostTexts({
          theme: dto.theme,
          category: dto.category,
          format: dto.format,
          profession,
          brandKit: brandKit || {},
        });
      } catch (err: any) {
        this.logger.error(`[post ${postId}] Tentativa ${attempt}/2 de geração de textos falhou: ${err.message || err}`, err.stack);
      }
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: {
        headline: texts?.headline || null,
        subtitle: texts?.subtitle || null,
        caption: texts?.caption || null,
        status: 'TEXTS_READY',
      },
    });
    this.logger.log(`[post ${postId}] Textos gerados em background → TEXTS_READY`);
  }

  async regenerateTexts(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');
    if (post.userId !== userId) throw new ForbiddenException();

    // Verificar se o usuário ainda tem cota de reescritas de copy no mês
    await this.usage.checkLimit(userId, 'CAPTION_REWRITE');

    const brandKit = await this.prisma.brandKit.findUnique({ where: { userId } });
    const profession: Profession = brandKit?.profession || 'OUTRO';

    const texts = await this.ai.generatePostTexts({
      theme: post.theme,
      category: post.category,
      format: post.format,
      profession,
      brandKit: brandKit || {},
      alternativeApproach: true,
    });

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { headline: texts.headline, subtitle: texts.subtitle, caption: texts.caption },
      include: { variations: true },
    });

    // Registrar que consumiu 1 reescrita de copy após sucesso
    await this.usage.record(userId, 'CAPTION_REWRITE');

    return updated;
  }

  async generateImages(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');
    if (post.userId !== userId) throw new ForbiddenException();

    await this.prisma.post.update({
      where: { id: postId },
      data: { status: 'GENERATING' },
    });

    await this.postsQueue.add('generate-post', { postId, userId }, QUEUE_OPTIONS);

    return { message: 'Geração de imagens iniciada' };
  }

  async update(userId: string, postId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');
    if (post.userId !== userId) throw new ForbiddenException();
    return this.prisma.post.update({
      where: { id: postId },
      data: dto,
      include: { variations: true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.post.findMany({
      where: { userId },
      include: { variations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { variations: true },
    });
    if (!post) throw new NotFoundException('Post não encontrado');
    if (post.userId !== userId) throw new ForbiddenException();
    return post;
  }

  async selectVariation(userId: string, postId: string, variationId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');
    if (post.userId !== userId) throw new ForbiddenException();

    await this.prisma.postVariation.updateMany({
      where: { postId },
      data: { isSelected: false },
    });

    return this.prisma.postVariation.update({
      where: { id: variationId },
      data: { isSelected: true },
    });
  }
}
