import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { KiwifyService } from './kiwify.service';

@ApiTags('Webhooks')
@UseGuards(ThrottlerGuard)
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
