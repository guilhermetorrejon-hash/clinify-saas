import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AiService } from '../modules/ai/ai.service';
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
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<PostGenerationJob>): Promise<void> {
    const { postId, userId } = job.data;
    this.logger.log(`Processando geração de post: ${postId}`);

    // Marcar como gerando
    await this.prisma.post.update({
      where: { id: postId },
      data: { status: 'GENERATING' },
    });

    try {
      // Buscar dados do post e perfil do profissional
      const [post, brandKit] = await Promise.all([
        this.prisma.post.findUnique({
          where: { id: postId },
          include: { variations: true },
        }),
        this.prisma.brandKit.findUnique({ where: { userId } }),
      ]);

      if (!post) throw new Error(`Post ${postId} não encontrado`);

      const profession: Profession = (brandKit?.profession as Profession) || 'OUTRO';

      // Usar textos já aprovados pelo profissional (gerados em POST /posts)
      const headline = (post as any).headline || '';
      const subtitle = (post as any).subtitle || '';
      let caption = post.caption || '';

      // Se não houver legenda (fallback por erro na geração de textos), gerar agora
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

      // Buscar foto do profissional para usar na variação fotográfica
      // Prioridade: 1) foto escolhida no post  2) enxoval Fotos Pro  3) foto de perfil do brand kit
      let professionalPhotoUrl: string | undefined = post.userPhotoUrl || undefined;

      if (!professionalPhotoUrl) {
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

      if (!professionalPhotoUrl && brandKit?.profilePhotoUrl) {
        professionalPhotoUrl = brandKit.profilePhotoUrl;
        this.logger.log(`[${postId}] Usando foto de perfil do brand kit`);
      }

      // Gerar variações/slides — usar designStyle salvo no banco
      const total = post.variations.length;
      const progressStep = Math.floor(65 / total); // 30→95% dividido pelo total de slides

      for (let i = 0; i < total; i++) {
        const variation = post.variations[i];
        const designStyle = variation.designStyle || 'fotografico';
        const isCarrossel = designStyle.startsWith('carrossel_');

        this.logger.log(`[${postId}] Gerando ${isCarrossel ? 'slide' : 'variação'} ${i + 1}/${total} (${designStyle})...`);

        try {
          const { base64, mimeType } = await this.ai.generatePostImage({
            theme: post.theme,
            category: post.category,
            format: post.format,
            designStyle,
            brandKit: brandKit || {},
            headline,
            subtitle,
            caption,
            // Foto do profissional: variação fotográfica e slides 1+5 da série fotográfica do carrossel
            userPhotoUrl: (
              designStyle === 'fotografico' ||
              designStyle === 'carrossel_foto_1' ||
              designStyle === 'carrossel_foto_5'
            ) ? professionalPhotoUrl : undefined,
          });

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
              isSelected: i === 0, // slide 1 ou variação fotográfica selecionada por padrão
            },
          });
        } catch (err) {
          this.logger.warn(`[${postId}] Falha na ${isCarrossel ? 'slide' : 'variação'} ${i + 1}: ${err}`);
        }

        await job.updateProgress(30 + (i + 1) * progressStep);
      }

      // Marcar como concluído
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
