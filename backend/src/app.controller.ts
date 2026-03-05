import { Controller, Get, Param } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Public } from './common/decorators/public.decorator';
import { AiService } from './modules/ai/ai.service';
import { PrismaService } from './database/prisma.service';
import { POST_GENERATION_QUEUE } from './queues/post-generation.processor';

@Controller()
export class AppController {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
    @InjectQueue(POST_GENERATION_QUEUE) private readonly postsQueue: Queue,
  ) {}

  @Get()
  @Public()
  getHello() {
    return { status: 'ok', service: 'clinify-api', timestamp: new Date().toISOString() };
  }

  @Get('health')
  @Public()
  async healthCheck() {
    const checks: Record<string, any> = {
      timestamp: new Date().toISOString(),
      env: {
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? `set (${process.env.OPENROUTER_API_KEY.substring(0, 12)}...)` : 'MISSING',
        OPENROUTER_TEXT_MODEL: process.env.OPENROUTER_TEXT_MODEL || 'NOT SET (default: anthropic/claude-sonnet-4-6)',
        GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY ? `set (${process.env.GOOGLE_AI_API_KEY.substring(0, 8)}...)` : 'MISSING',
        GOOGLE_IMAGE_MODEL: process.env.GOOGLE_IMAGE_MODEL || 'NOT SET (default: nano-banana-pro-preview)',
        R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? 'set' : 'MISSING',
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || 'MISSING',
        REDIS_URL: process.env.REDIS_URL ? 'set' : 'MISSING',
        DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'MISSING',
        FRONTEND_URL: process.env.FRONTEND_URL || 'MISSING',
        NODE_ENV: process.env.NODE_ENV || 'not set',
      },
    };

    // Test OpenRouter
    try {
      const response = await this.ai.testOpenRouter();
      checks.openrouter = { status: 'ok', response };
    } catch (err: any) {
      checks.openrouter = { status: 'error', message: err.message, code: err.status || err.code };
    }

    // Test Google AI (text)
    try {
      const response = await this.ai.testGoogleAI();
      checks.googleAI_text = { status: 'ok', response };
    } catch (err: any) {
      checks.googleAI_text = { status: 'error', message: err.message, code: err.status || err.code };
    }

    // Test Google AI (image generation - the actual feature)
    try {
      const response = await this.ai.testGoogleAIImage();
      checks.googleAI_image = { status: 'ok', response };
    } catch (err: any) {
      checks.googleAI_image = { status: 'error', message: err.message, code: err.status || err.code };
    }

    // Test BullMQ/Redis queue
    try {
      const waiting = await this.postsQueue.getWaitingCount();
      const active = await this.postsQueue.getActiveCount();
      const completed = await this.postsQueue.getCompletedCount();
      const failed = await this.postsQueue.getFailedCount();
      const failedJobs = await this.postsQueue.getFailed(0, 3);
      checks.queue = {
        status: 'ok',
        waiting, active, completed, failed,
        recentFailures: failedJobs.map(j => ({
          id: j.id,
          data: j.data,
          failedReason: j.failedReason,
          attemptsMade: j.attemptsMade,
          finishedOn: j.finishedOn ? new Date(j.finishedOn).toISOString() : null,
        })),
      };
    } catch (err: any) {
      checks.queue = { status: 'error', message: err.message };
    }

    return checks;
  }

  @Get('debug/post/:id')
  @Public()
  async debugPost(@Param('id') id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { variations: true },
    });
    if (!post) return { error: 'Post not found' };
    return {
      id: post.id,
      status: post.status,
      theme: post.theme,
      headline: post.headline ? 'set' : 'empty',
      subtitle: post.subtitle ? 'set' : 'empty',
      caption: post.caption ? `set (${post.caption.length} chars)` : 'empty',
      variations: post.variations.map(v => ({
        id: v.id,
        designStyle: v.designStyle,
        hasImage: !!v.imageUrl,
        imageUrl: v.imageUrl ? v.imageUrl.substring(0, 80) + '...' : null,
      })),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
