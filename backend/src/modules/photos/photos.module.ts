import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { StorageModule } from '../storage/storage.module';
import { PHOTO_GENERATION_QUEUE } from '../../queues/photo-generation.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: PHOTO_GENERATION_QUEUE }),
    StorageModule,
  ],
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {}
