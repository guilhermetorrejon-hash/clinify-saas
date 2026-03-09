/**
 * UsageModule — Registra o UsageService como módulo GLOBAL.
 *
 * "Global" significa que qualquer outro módulo do backend pode usar
 * o UsageService sem precisar importá-lo manualmente.
 * Isso é útil porque vários módulos (posts, photos, etc.) precisam
 * verificar limites de uso.
 *
 * O controller expõe GET /usage para o frontend consultar
 * quanto do plano o usuário já consumiu.
 */
import { Global, Module } from '@nestjs/common';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';

@Global()
@Module({
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
