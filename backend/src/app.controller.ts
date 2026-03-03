import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  getHello() {
    return { status: 'ok', service: 'clinify-api', timestamp: new Date().toISOString() };
  }
}
