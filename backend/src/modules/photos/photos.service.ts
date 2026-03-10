import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UsageService } from '../usage/usage.service';
import { StartPhotoSessionDto } from './dto/start-photo-session.dto';
import { PHOTO_GENERATION_QUEUE, PhotoGenerationJob } from '../../queues/photo-generation.processor';

const QUEUE_OPTIONS = {
  attempts: 2,
  backoff: { type: 'exponential', delay: 10000 },
  removeOnComplete: { count: 50 },
  removeOnFail: { count: 20 },
};

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private usage: UsageService,
    @InjectQueue(PHOTO_GENERATION_QUEUE) private photosQueue: Queue<PhotoGenerationJob>,
  ) {}

  async startSession(userId: string, dto: StartPhotoSessionDto) {
    const { mode, photos } = dto;

    // Verificar se o usuário ainda tem cota de sessões de foto no mês
    // Tanto UPLOAD quanto GENERATE consomem 1 sessão de foto
    await this.usage.checkLimit(userId, 'PHOTO');

    if (mode === 'GENERATE' && photos.length < 3) {
      throw new BadRequestException('Para gerar fotos com IA, envie pelo menos 3 fotos de referência.');
    }

    // Fazer upload das fotos para o R2
    const uploadedUrls: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const dataUrl = photos[i];
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) throw new BadRequestException(`Foto ${i + 1} em formato inválido.`);
      const [, mimeType, base64] = match;
      const folder = mode === 'UPLOAD' ? `photos/${userId}/professional` : `photos/${userId}/references`;
      const url = await this.storage.uploadBase64Image(base64, mimeType, folder);
      uploadedUrls.push(url);
    }

    // Modo UPLOAD: fotos já prontas — salvar diretamente como geradas
    if (mode === 'UPLOAD') {
      const session = await this.prisma.professionalPhoto.create({
        data: {
          userId,
          mode: 'UPLOAD',
          originalPhotoUrls: [],
          generatedPhotoUrls: uploadedUrls,
          status: 'COMPLETED',
        },
      });
      // Registrar que consumiu 1 sessão de foto
      await this.usage.record(userId, 'PHOTO');
      return session;
    }

    // Modo GENERATE: criar sessão e enfileirar job
    // O usage.record será chamado no processor após geração com sucesso
    const session = await this.prisma.professionalPhoto.create({
      data: {
        userId,
        mode: 'GENERATE',
        originalPhotoUrls: uploadedUrls,
        generatedPhotoUrls: [],
        status: 'PENDING',
      },
    });

    const job = await this.photosQueue.add(
      'generate-photos',
      { photoSessionId: session.id, userId },
      QUEUE_OPTIONS,
    );

    return this.prisma.professionalPhoto.update({
      where: { id: session.id },
      data: { jobId: job.id as string },
    });
  }

  async findAll(userId: string) {
    return this.prisma.professionalPhoto.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, sessionId: string) {
    const session = await this.prisma.professionalPhoto.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    if (session.userId !== userId) throw new ForbiddenException();
    return session;
  }

  async updateFavorites(userId: string, sessionId: string, favoriteUrls: string[]) {
    const session = await this.prisma.professionalPhoto.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    if (session.userId !== userId) throw new ForbiddenException();

    // Validar que todas as URLs existem nas fotos geradas
    const invalid = favoriteUrls.filter(url => !session.generatedPhotoUrls.includes(url));
    if (invalid.length > 0) {
      throw new BadRequestException('Uma ou mais URLs não pertencem a esta sessão.');
    }

    return this.prisma.professionalPhoto.update({
      where: { id: sessionId },
      data: { favoritePhotoUrls: favoriteUrls },
    });
  }

  async deletePhoto(userId: string, sessionId: string, photoUrl: string) {
    const session = await this.findOne(userId, sessionId);

    if (!session.generatedPhotoUrls.includes(photoUrl)) {
      throw new BadRequestException('Foto não encontrada nesta sessão.');
    }

    const updatedGenerated = session.generatedPhotoUrls.filter(url => url !== photoUrl);
    const updatedFavorites = (session.favoritePhotoUrls || []).filter(url => url !== photoUrl);

    return this.prisma.professionalPhoto.update({
      where: { id: sessionId },
      data: {
        generatedPhotoUrls: updatedGenerated,
        favoritePhotoUrls: updatedFavorites,
      },
    });
  }

  async regeneratePhotos(userId: string, sessionId: string, count: number) {
    const session = await this.findOne(userId, sessionId);

    if (session.mode !== 'GENERATE') {
      throw new BadRequestException('Regeneração só disponível para sessões geradas por IA.');
    }
    if (session.status === 'PROCESSING' || session.status === 'PENDING') {
      throw new BadRequestException('Sessão ainda em processamento.');
    }

    const MAX_REGENERATIONS = 3;
    const remaining = MAX_REGENERATIONS - (session.regenerationsUsed || 0);

    if (remaining <= 0) {
      throw new BadRequestException('Você já usou suas 3 regenerações de cortesia.');
    }

    const toGenerate = Math.min(count, remaining);

    const job = await this.photosQueue.add(
      'regenerate-photos',
      { photoSessionId: sessionId, userId, regenerateCount: toGenerate },
      QUEUE_OPTIONS,
    );

    return this.prisma.professionalPhoto.update({
      where: { id: sessionId },
      data: {
        status: 'PROCESSING',
        regenerationsUsed: (session.regenerationsUsed || 0) + toGenerate,
        jobId: job.id as string,
      },
    });
  }

  async deleteSession(userId: string, sessionId: string) {
    const session = await this.prisma.professionalPhoto.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    if (session.userId !== userId) throw new ForbiddenException();
    await this.prisma.professionalPhoto.delete({ where: { id: sessionId } });
    return { message: 'Sessão removida.' };
  }
}
