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

// Máximo de imagens geradas simultaneamente (evita rate limit do Gemini)
const PARALLEL_LIMIT = 3;

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
      const skipPhoto = post.userPhotoUrl === 'none';
      let professionalPhotoUrl: string | undefined = (!skipPhoto && post.userPhotoUrl) || undefined;

      if (!skipPhoto && !professionalPhotoUrl) {
        const photoSession = await this.prisma.professionalPhoto.findFirst({
          where: { userId, status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
        });
        if (photoSession) {
          // Prioridade: favoritas > todas as geradas
          const pool = photoSession.favoritePhotoUrls?.length
            ? photoSession.favoritePhotoUrls
            : photoSession.generatedPhotoUrls;
          if (pool.length) {
            const idx = Math.floor(Math.random() * pool.length);
            professionalPhotoUrl = pool[idx];
            this.logger.log(`[${postId}] Usando foto do enxoval profissional (${photoSession.favoritePhotoUrls?.length ? 'favorita' : 'aleatória'})`);
          }
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

      // Gerar imagens em paralelo (batches de PARALLEL_LIMIT)
      for (let batchStart = 0; batchStart < total; batchStart += PARALLEL_LIMIT) {
        const batch = post.variations.slice(batchStart, batchStart + PARALLEL_LIMIT);

        const results = await Promise.allSettled(
          batch.map(async (variation, batchIdx) => {
            const i = batchStart + batchIdx;
            const designStyle = variation.designStyle || 'fotografico';
            const isCarrossel = designStyle.startsWith('carrossel_');

            this.logger.log(`[${postId}] Gerando ${isCarrossel ? 'slide' : 'variação'} ${i + 1}/${total} (${designStyle})...`);

            const isPhotoVariation = designStyle === 'fotografico'
              || designStyle === 'carrossel_foto_1'
              || designStyle === 'carrossel_foto_5';

            // Foto contextual: enviar para TODAS as variações (o prompt da IA decide como integrar)
            const useContextPhoto = true;

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
              contextPhotoUrl: useContextPhoto ? ((post as any).contextPhotoUrl || undefined) : undefined,
            });

            // Dimensões alvo por formato para o trim
            const formatDimensions: Record<string, { w: number; h: number }> = {
              FEED: { w: 1080, h: 1080 },
              PORTRAIT: { w: 1080, h: 1350 },
              STORIES: { w: 1080, h: 1920 },
              CARROSSEL: { w: 1080, h: 1080 },
            };
            const dims = formatDimensions[post.format] || { w: 1080, h: 1080 };

            // Pós-processamento: remover bordas brancas que o Gemini às vezes gera
            base64 = await this.logoOverlay.trimWhiteBorders(base64, dims.w, dims.h);

            // Logo overlay — usar versão correta conforme fundo claro/escuro
            if (brandKit?.logoUrl || brandKit?.logoWhiteUrl) {
              const isDarkVariation = designStyle === 'grafico'
                || designStyle === 'fotografico'
                || /^carrossel_(foto|graf)_\d+$/.test(designStyle);

              let logoSource: string | null = null;
              if (isDarkVariation) {
                // Fundo escuro → usar logo branca (cadastrada ou gerada automaticamente)
                logoSource = brandKit.logoWhiteUrl || null;
                if (!logoSource && brandKit.logoUrl) {
                  this.logger.log(`[${postId}] Sem logoWhiteUrl — convertendo logo para branca automaticamente`);
                  logoSource = await this.logoOverlay.makeLogoWhite(brandKit.logoUrl);
                }
              } else {
                // Fundo claro → usar logo padrão (escura/colorida)
                logoSource = brandKit.logoUrl || null;
              }

              if (logoSource) {
                base64 = await this.logoOverlay.applyLogo(base64, logoSource);
              }
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

            this.logger.log(`[${postId}] ${isCarrossel ? 'Slide' : 'Variação'} ${i + 1}/${total} pronta`);
          }),
        );

        // Log falhas do batch
        results.forEach((r, batchIdx) => {
          if (r.status === 'rejected') {
            const i = batchStart + batchIdx;
            const v = batch[batchIdx];
            this.logger.error(
              `[${postId}] Falha na variação ${i + 1} (${v.designStyle}): ${r.reason?.message || r.reason}`,
              r.reason?.stack,
            );
          }
        });

        // Progresso após cada batch
        const completed = Math.min(batchStart + batch.length, total);
        await job.updateProgress(30 + Math.round((completed / total) * 65));
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
