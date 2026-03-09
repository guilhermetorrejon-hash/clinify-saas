/**
 * KiwifyModule — Módulo responsável por receber webhooks da Kiwify.
 *
 * A Kiwify é a plataforma de pagamentos usada para vender as assinaturas.
 * Quando alguém compra, cancela ou renova, a Kiwify nos avisa via webhook.
 */
import { Module } from '@nestjs/common';
import { KiwifyController } from './kiwify.controller';
import { KiwifyService } from './kiwify.service';

@Module({
  controllers: [KiwifyController],
  providers: [KiwifyService],
})
export class KiwifyModule {}
