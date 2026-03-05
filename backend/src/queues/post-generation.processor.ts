import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AiService } from '../modules/ai/ai.service';
import { LogoOverlayService } from '../modules/ai/logo-overlay.service';
import { StorageService } from '../modules/storage/storage.service';
import { PrismaService } from '../database/prisma.service';
import { BrandKit, Profession } from '@prisma/client';

export const POST_GENERATION_QUEUE = 'post-generation';

export interface PostGenerationJob {
  postId: string;
  userId: string;
}

@Processor(POST_GENERATION_QUEUE)
export class PostGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(PostGenerationProcessor.name);

  constructor(
    private readonly ai: AiService,
    private readonly logoOverlay: LogoOverlayService,
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<PostGenerationJob>): Promise<void> {
    const { postId, userId } = job.data;
    this.logger.log(`Processando geração de post: ${postId}`);

    await this.prisma.post.update({
      where: { id: postId },
      data: { status: 'GENERATING' },
    });

    try {
      const [post, brandKit] = await Promise.all([
        this.prisma.post.findUnique({
          where: { id: postId },
          include: { variations: true },
        }),
        this.prisma.brandKit.findUnique({ where: { userId } }),
      ]);

      if (!post) throw new Error(`Post ${postId} não encontrado`);

      const profession: Profession = (brandKit?.profession as Profession) || 'OUTRO';

      const headline = (post as any).headline || '';
      const subtitle = (post as any).subtitle || '';
      let caption = post.caption || '';

      if (!caption) {
        await job.updateProgress(10);
        this.logger.log(`[${postId}] Gerando legenda com Claude (fallback)...`);
        caption = await this.ai.generateCaption({
          theme: post.theme,
          category: post.category,
          profession,
          brandKit: brandKit || {},
        });
        await this.prisma.post.update({ where: { id: postId }, data: { caption } });
      }

      await job.updateProgress(30);

      // Foto do profissional (retrato) — para variações fotográficas
      // 'none' = usuário optou por não usar foto
      const skipPhoto = post.userPhotoUrl === 'none';
      let professionalPhotoUrl: string | undefined = (!skipPhoto && post.userPhotoUrl) || undefined;

      if (!skipPhoto && !professionalPhotoUrl) {
        const photoSession = await this.prisma.professionalPhoto.findFirst({
          where: { userId, status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
        });
        if (photoSession?.generatedPhotoUrls?.length) {
          const idx = Math.floor(Math.random() * photoSession.generatedPhotoUrls.length);
          professionalPhotoUrl = photoSession.generatedPhotoUrls[idx];
          this.logger.log(`[${postId}] Usando foto do enxoval profissional`);
        }
      }

      if (!skipPhoto && !professionalPhotoUrl && brandKit?.profilePhotoUrl) {
        professionalPhotoUrl = brandKit.profilePhotoUrl;
        this.logger.log(`[${postId}] Usando foto de perfil do brand kit`);
      }

      if (skipPhoto) {
        this.logger.log(`[${postId}] Usuário optou por não usar foto profissional`);
      }

      const total = post.variations.length;
      const progressStep = Math.floor(65 / total);

      for (let i = 0; i < total; i++) {
        const variation = post.variations[i];
        const designStyle = variation.designStyle || 'fotografico';
        const isCarrossel = designStyle.startsWith('carrossel_');

        this.logger.log(`[${postId}] Gerando ${isCarrossel ? 'slide' : 'variação'} ${i + 1}/${total} (${designStyle})...`);

        try {
          // Foto do profissional: apenas para variações fotográficas e slides 1/5 foto
          const isPhotoVariation = designStyle === 'fotografico'
            || designStyle === 'carrossel_foto_1'
            || designStyle === 'carrossel_foto_5';

          let { base64, mimeType } = await this.ai.generatePostImage({
            theme: post.theme,
            category: post.category,
            format: post.format,
            designStyle,
            brandKit: brandKit || {},
            headline,
            subtitle,
            caption,
            userPhotoUrl: isPhotoVariation ? professionalPhotoUrl : undefined,
          });

          // Aplicar logo via overlay (Sharp) — logo fiel, sem reinterpretação da IA
          if (brandKit?.logoUrl) {
            const isDarkVariation = designStyle === 'grafico'
              || designStyle === 'fotografico'
              || /^carrossel_(foto|graf)_\d+$/.test(designStyle);

            const logoSource = (isDarkVariation && brandKit.logoWhiteUrl)
              ? brandKit.logoWhiteUrl
              : brandKit.logoUrl;

            base64 = await this.logoOverlay.applyLogo(base64, logoSource);
          }

          const imageUrl = await this.storage.uploadBase64Image(
            base64,
            mimeType,
            `posts/${userId}/${postId}`,
          );

          await this.prisma.postVariation.update({
            where: { id: variation.id },
            data: {
              imageUrl,
              designStyle,
              isSelected: i === 0,
            },
          });
        } catch (err: any) {
          this.logger.error(`[${postId}] Falha na ${isCarrossel ? 'slide' : 'variação'} ${i + 1} (${designStyle}): ${err.message || err}`, err.stack);
        }

        await job.updateProgress(30 + (i + 1) * progressStep);
      }

      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 'COMPLETED' },
      });

      await job.updateProgress(100);
      this.logger.log(`[${postId}] Post gerado com sucesso!`);
    } catch (error) {
      this.logger.error(`[${postId}] Erro na geração: ${error}`);
      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }
}
