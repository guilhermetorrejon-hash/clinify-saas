import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { KiwifyService } from './kiwify.service';

@ApiTags('Webhooks')
@Controller('webhooks/kiwify')
export class KiwifyController {
  constructor(private kiwifyService: KiwifyService) {}

  @Public()
  @Throttle({ webhook: { limit: 100, ttl: 3600000 } }) // 100 / 1 hora
  @Post()
  handleWebhook(
    @Body() payload: any,
    @Headers('x-kiwify-event') event: string,
  ) {
    return this.kiwifyService.handleEvent(event, payload);
  }
}
