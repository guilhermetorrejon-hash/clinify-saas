import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { POST_GENERATION_QUEUE } from '../../queues/post-generation.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: POST_GENERATION_QUEUE }),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
