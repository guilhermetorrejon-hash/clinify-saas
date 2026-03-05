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
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SuggestThemesDto } from './dto/suggest-themes.dto';
import { POST_GENERATION_QUEUE, PostGenerationJob } from '../../queues/post-generation.processor';
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
    @InjectQueue(POST_GENERATION_QUEUE) private postsQueue: Queue<PostGenerationJob>,
  ) {}

  async suggestThemes(userId: string, dto: SuggestThemesDto) {
    const suggestions = await this.ai.generateThemeSuggestions(
      userId,
      dto.category || 'EDUCATIVO',
      dto.format || 'FEED',
      this.prisma,
    );
    return { suggestions };
  }

  async create(userId: string, dto: CreatePostDto) {
    // Criar post base com status DRAFT
    const post = await this.prisma.post.create({
      data: {
        userId,
        theme: dto.theme,
        category: dto.category,
        format: dto.format,
        status: 'DRAFT',
        userPhotoUrl: dto.userPhotoUrl || null,
        variations: {
          createMany: {
            data: dto.format === 'CARROSSEL'
              ? [
                  { designStyle: 'carrossel_foto_1' },
                  { designStyle: 'carrossel_foto_2' },
                  { designStyle: 'carrossel_foto_3' },
                  { designStyle: 'carrossel_foto_4' },
                  { designStyle: 'carrossel_foto_5' },
                  { designStyle: 'carrossel_tipo_1' },
                  { designStyle: 'carrossel_tipo_2' },
                  { designStyle: 'carrossel_tipo_3' },
                  { designStyle: 'carrossel_tipo_4' },
                  { designStyle: 'carrossel_tipo_5' },
                  { designStyle: 'carrossel_graf_1' },
                  { designStyle: 'carrossel_graf_2' },
                  { designStyle: 'carrossel_graf_3' },
                  { designStyle: 'carrossel_graf_4' },
                  { designStyle: 'carrossel_graf_5' },
                ]
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

    // Buscar brand kit do profissional para geração de textos
    const brandKit = await this.prisma.brandKit.findUnique({ where: { userId } });
    const profession: Profession = brandKit?.profession || 'OUTRO';

    // Tentar gerar textos com até 2 tentativas antes de avançar com campos vazios
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
      } catch (err) {
        this.logger.warn(`[post ${post.id}] Tentativa ${attempt}/2 de geração de textos falhou: ${err}`);
      }
    }

    // Sempre avança para TEXTS_READY — profissional revisa antes de gerar imagens
    return this.prisma.post.update({
      where: { id: post.id },
      data: {
        headline: texts?.headline || null,
        subtitle: texts?.subtitle || null,
        caption: texts?.caption || null,
        status: 'TEXTS_READY',
      },
      include: { variations: true },
    });
  }

  async regenerateTexts(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');
    if (post.userId !== userId) throw new ForbiddenException();

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

    return this.prisma.post.update({
      where: { id: postId },
      data: { headline: texts.headline, subtitle: texts.subtitle, caption: texts.caption },
      include: { variations: true },
    });
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
