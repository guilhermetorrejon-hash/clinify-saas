/**
 * UsageController — Endpoint para o frontend consultar o uso do usuário.
 *
 * GET /usage → retorna quantos posts, carrosséis, fotos, etc. o usuário
 * já usou no período atual vs. o limite do plano dele.
 * O frontend usa isso para mostrar barrinhas de progresso tipo "3/8 posts".
 */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsageService } from './usage.service';

@ApiTags('Usage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('usage')
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Get()
  getUsage(@CurrentUser() user: any) {
    return this.usage.getUsage(user.id);
  }
}
