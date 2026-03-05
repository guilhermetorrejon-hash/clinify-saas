import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { AiService } from './modules/ai/ai.service';

@Controller()
export class AppController {
  constructor(private readonly ai: AiService) {}

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

    // Test Google AI
    try {
      const response = await this.ai.testGoogleAI();
      checks.googleAI = { status: 'ok', response };
    } catch (err: any) {
      checks.googleAI = { status: 'error', message: err.message, code: err.status || err.code };
    }

    return checks;
  }
}
