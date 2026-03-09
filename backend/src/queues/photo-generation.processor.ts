import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../modules/storage/storage.service';
import { AiService } from '../modules/ai/ai.service';
import { Profession } from '@prisma/client';

export const PHOTO_GENERATION_QUEUE = 'photo-generation';

export interface PhotoGenerationJob {
  photoSessionId: string;
  userId: string;
}

function getStylePrompts(profession: Profession): string[] {
  // Roupa profissional com contexto variado por profissão
  const outfitVariations: Record<string, string[]> = {
    MEDICO: [
      // Jaleco com estetoscópio (reduzido a apenas 1-2 fotos)
      'vestindo jaleco branco profissional com estetoscópio',
      // Jaleco sem estetoscópio (outra com jaleco mas mais clean)
      'vestindo jaleco branco limpo e profissional',
      // Roupa social (camisa social para homens, blazer para mulheres)
      'vestindo camisa social ou blazer profissional elegante',
      // Mais roupa social e casual-profissional
      'em roupa social clean (camisa social lisa ou blazer)',
      'vestindo roupa smart-casual profissional sem equipamento médico',
    ],
    NUTRICIONISTA: [
      'vestindo jaleco ou roupa profissional clean',
      'vestindo roupa social elegante sem jaleco',
      'em roupa profissional clean e moderna',
    ],
    PSICOLOGO: [
      'vestindo roupa profissional elegante (blazer ou camisa social)',
      'em roupa clean e acolhedora profissional',
      'vestindo blazer ou blazer elegante',
    ],
    ENFERMEIRO: [
      'vestindo uniforme de enfermagem profissional ou jaleco',
      'em roupa profissional clean sem uniforme',
      'vestindo roupa smart-casual profissional',
    ],
    DENTISTA: [
      'vestindo jaleco branco odontológico',
      'em roupa profissional social ou blazer',
      'vestindo roupa clean profissional',
    ],
    FARMACEUTICO: [
      'vestindo jaleco branco de farmácia',
      'em roupa profissional elegante sem jaleco',
      'vestindo roupa social profissional',
    ],
    OUTRO: [
      'vestindo roupa profissional de saúde',
      'em roupa social elegante e profissional',
      'vestindo roupa clean profissional',
    ],
  };

  // Ambiente/fundo para fotos com contexto clínico
  const env: Record<string, string> = {
    MEDICO: 'consultório médico moderno ao fundo levemente desfocado',
    NUTRICIONISTA: 'ambiente clínico clean com elementos naturais ao fundo desfocado',
    PSICOLOGO: 'escritório acolhedor com livros e plantas ao fundo desfocado',
    ENFERMEIRO: 'corredor ou ambiente hospitalar ao fundo desfocado',
    DENTISTA: 'consultório odontológico moderno ao fundo desfocado',
    FARMACEUTICO: 'farmácia ou laboratório ao fundo desfocado',
    OUTRO: 'ambiente de saúde profissional ao fundo desfocado',
  };

  // Seleciona as variações de roupa para a profissão (ou OUTRO como padrão)
  const outfitOptions = outfitVariations[profession] || outfitVariations.OUTRO;
  const e = env[profession] || env.OUTRO;

  // Expressão padrão: boca FECHADA para evitar dentes artificiais
  const expr = 'sorriso leve e sutil com lábios fechados (sem mostrar dentes), olhar confiante e sereno';
  const exprFirm = 'expressão firme e profissional com boca fechada, olhar direto para câmera';
  const exprCalm = 'expressão serena e acolhedora com lábios fechados, sorriso sutil';

  return [
    // ── Estúdio (3 variações com roupas variadas) ──────────────────────────────
    `FOTO DE ESTÚDIO PROFISSIONAL. Headshot frontal, ${outfitOptions[0]}, ${expr}. Fundo: cinza neutro médio de estúdio fotográfico, completamente liso e uniforme, sem nenhum elemento do ambiente ao fundo. Iluminação suave de estúdio com softbox lateral, sem sombras duras.`,
    `FOTO DE ESTÚDIO PROFISSIONAL. Headshot frontal, ${outfitOptions[1]}, ${exprFirm}. Fundo: branco puro de estúdio, completamente liso, sem nenhum ambiente visível ao fundo. Iluminação de três pontos profissional, imagem nítida.`,
    `FOTO DE ESTÚDIO PROFISSIONAL. Retrato 3/4 (cintura para cima), levemente virado, ${outfitOptions[2]}, ${exprCalm}. Fundo: cinza suave gradiente de estúdio fotográfico, sem nenhum ambiente ao fundo. Iluminação difusa profissional.`,

    // ── Ambiente profissional (com roupas variadas) ──────────────────────────────
    `Headshot profissional frontal, ${outfitOptions[0]}, ${expr}, ${e}`,
    `Em pé, postura confiante, braços cruzados, ${outfitOptions[2]}, ${exprFirm}, ${e}`,
    `Sentado(a) em mesa/escrivaninha em posição profissional, ${outfitOptions[1]}, ${exprCalm}, ${e}`,
    `Retrato 3/4 olhando levemente para o lado, expressão pensativa com boca fechada, ${outfitOptions[3] || outfitOptions[2]}, ${e}`,

    // ── Variações de enquadramento/ambiente (com mais variedade de roupa) ───────
    `Retrato próximo (close-up do rosto), ${outfitOptions[4] || outfitOptions[0]}, ${exprCalm}, fundo desfocado neutro cinza claro`,
    `Ambiente externo com luz natural suave, parque ou área arborizada ao fundo desfocado, ${outfitOptions[2]}, postura casual mas profissional, ${expr}`,
    `Em pé encostado(a) em parede branca ou bege clean, ${outfitOptions[3] || outfitOptions[1]}, braços cruzados ou mãos nos bolsos, ${exprFirm}`,
  ];
}

@Processor(PHOTO_GENERATION_QUEUE)
export class PhotoGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(PhotoGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly ai: AiService,
  ) {
    super();
  }

  async process(job: Job<PhotoGenerationJob>): Promise<void> {
    const { photoSessionId, userId } = job.data;
    this.logger.log(`[${photoSessionId}] Iniciando geração de fotos profissionais com Gemini`);

    await this.prisma.professionalPhoto.update({
      where: { id: photoSessionId },
      data: { status: 'PROCESSING' },
    });

    try {
      const [session, brandKit] = await Promise.all([
        this.prisma.professionalPhoto.findUnique({ where: { id: photoSessionId } }),
        this.prisma.brandKit.findUnique({ where: { userId } }),
      ]);

      if (!session) throw new Error(`Sessão ${photoSessionId} não encontrada`);

      const profession: Profession = brandKit?.profession || 'OUTRO';

      // ── Etapa 1: Carregar todas as fotos de referência como base64 ───────────
      this.logger.log(`[${photoSessionId}] Carregando ${session.originalPhotoUrls.length} fotos de referência...`);
      const referencePhotos: { data: string; mimeType: string }[] = [];

      for (const url of session.originalPhotoUrls) {
        try {
          let buffer: Buffer;
          let mimeType = 'image/jpeg';

          if (url.startsWith('data:')) {
            const match = url.match(/^data:([^;]+);base64,(.+)$/);
            if (!match) continue;
            mimeType = match[1];
            buffer = Buffer.from(match[2], 'base64');
          } else {
            const response = await fetch(url);
            if (!response.ok) continue;
            buffer = Buffer.from(await response.arrayBuffer());
            const ct = response.headers.get('content-type');
            if (ct) mimeType = ct.split(';')[0];
          }

          referencePhotos.push({ data: buffer.toString('base64'), mimeType });
        } catch {
          // Pula foto que falhou ao carregar
        }
      }

      if (referencePhotos.length === 0) {
        throw new Error('Nenhuma foto de referência pôde ser carregada');
      }

      this.logger.log(`[${photoSessionId}] ${referencePhotos.length} fotos carregadas para referência`);
      await job.updateProgress(15);

      // ── Etapa 2: Gerar 10 fotos com Gemini ──────────────────────────────────
      const stylePrompts = getStylePrompts(profession);
      const generatedUrls: string[] = [];

      for (let i = 0; i < stylePrompts.length; i++) {
        this.logger.log(`[${photoSessionId}] Gerando foto ${i + 1}/10...`);

        try {
          const { base64, mimeType } = await this.ai.generateProfessionalPhoto({
            referencePhotoBase64s: referencePhotos,
            stylePrompt: stylePrompts[i],
            profession,
          });

          const r2Url = await this.storage.uploadBase64Image(
            base64,
            mimeType,
            `photos/${userId}/generated`,
          );

          generatedUrls.push(r2Url);
          this.logger.log(`[${photoSessionId}] Foto ${i + 1}/10 salva`);
        } catch (err: any) {
          this.logger.error(`[${photoSessionId}] Foto ${i + 1} falhou: ${err?.message}`);
        }

        await job.updateProgress(15 + (i + 1) * 8);
      }

      if (generatedUrls.length === 0) {
        throw new Error('Nenhuma foto foi gerada com sucesso');
      }

      // ── Etapa 3: Salvar resultados ───────────────────────────────────────────
      await this.prisma.professionalPhoto.update({
        where: { id: photoSessionId },
        data: { generatedPhotoUrls: generatedUrls, status: 'COMPLETED' },
      });

      await job.updateProgress(100);
      this.logger.log(`[${photoSessionId}] Enxoval gerado! ${generatedUrls.length}/10 fotos.`);

    } catch (error) {
      this.logger.error(`[${photoSessionId}] Erro na geração: ${error}`);
      await this.prisma.professionalPhoto.update({
        where: { id: photoSessionId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }
}
