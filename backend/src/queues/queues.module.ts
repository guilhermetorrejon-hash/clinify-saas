import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PostGenerationProcessor, POST_GENERATION_QUEUE } from './post-generation.processor';
import { PhotoGenerationProcessor, PHOTO_GENERATION_QUEUE } from './photo-generation.processor';
import { AiModule } from '../modules/ai/ai.module';
import { StorageModule } from '../modules/storage/storage.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: process.env.REDIS_URL
        ? {
            host: new URL(process.env.REDIS_URL).hostname,
            port: Number(new URL(process.env.REDIS_URL).port) || 6379,
            password: new URL(process.env.REDIS_URL).password || undefined,
            tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
            maxRetriesPerRequest: null,
          }
        : {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            maxRetriesPerRequest: null,
          },
    }),
    BullModule.registerQueue({ name: POST_GENERATION_QUEUE }),
    BullModule.registerQueue({ name: PHOTO_GENERATION_QUEUE }),
    AiModule,
    StorageModule,
  ],
  providers: [PostGenerationProcessor, PhotoGenerationProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
