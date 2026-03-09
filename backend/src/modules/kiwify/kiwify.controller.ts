/**
 * KiwifyController — Recebe os webhooks da Kiwify.
 *
 * Cada produto na Kiwify aponta para uma URL específica do plano:
 *   Produto Essencial    → POST /api/webhooks/kiwify/essencial
 *   Produto Profissional → POST /api/webhooks/kiwify/profissional
 *   Produto Referência   → POST /api/webhooks/kiwify/referencia
 *
 * Também mantém a rota genérica POST /api/webhooks/kiwify
 * que tenta descobrir o plano pelo payload (fallback).
 */
import { Body, Controller, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { KiwifyService } from './kiwify.service';

@ApiTags('Webhooks')
@UseGuards(ThrottlerGuard)
@Controller('webhooks/kiwify')
export class KiwifyController {
  constructor(private kiwifyService: KiwifyService) {}

  /** Rota por plano — a mais confiável. Configurar na Kiwify por produto. */
  @Public()
  @Throttle({ webhook: { limit: 100, ttl: 3600000 } })
  @Post(':planSlug')
  handleWebhookByPlan(
    @Param('planSlug') planSlug: string,
    @Body() payload: any,
    @Headers('x-kiwify-event') event: string,
    @Headers('x-kiwify-signature') signature: string,
    @Req() req: any,
  ) {
    this.kiwifyService.validateSignature(req.rawBody, signature);
    return this.kiwifyService.handleEvent(event, payload, planSlug);
  }

  /** Rota genérica (fallback) — descobre o plano pelo payload */
  @Public()
  @Throttle({ webhook: { limit: 100, ttl: 3600000 } })
  @Post()
  handleWebhook(
    @Body() payload: any,
    @Headers('x-kiwify-event') event: string,
    @Headers('x-kiwify-signature') signature: string,
    @Req() req: any,
  ) {
    this.kiwifyService.validateSignature(req.rawBody, signature);
    return this.kiwifyService.handleEvent(event, payload);
  }
}
