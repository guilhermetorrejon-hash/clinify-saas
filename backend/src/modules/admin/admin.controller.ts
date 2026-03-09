/**
 * AdminController — Endpoints exclusivos para administradores.
 *
 * Todos os endpoints aqui são protegidos por DOIS guards:
 * 1. JwtAuthGuard → garante que o usuário está logado
 * 2. AdminGuard → garante que o usuário tem role ADMIN
 *
 * Se alguém sem permissão tentar acessar, recebe 403 Forbidden.
 */
import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /** Visão geral: totais, receita, distribuição por plano */
  @Get('overview')
  getOverview() {
    return this.admin.getOverview();
  }

  /** Lista de todos os usuários com plano e uso */
  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.getUsers(
      Number(page) || 1,
      Number(limit) || 50,
    );
  }

  /** Estatísticas de uso e custo estimado da plataforma */
  @Get('usage')
  getUsageStats() {
    return this.admin.getUsageStats();
  }

  /** Lista planos ativos (para o dropdown de troca de plano) */
  @Get('plans')
  getPlans() {
    return this.admin.getPlans();
  }

  /** Trocar o plano de um usuário */
  @Patch('users/:id/plan')
  changeUserPlan(
    @Param('id') id: string,
    @Body() body: { planId: string },
  ) {
    return this.admin.changeUserPlan(id, body.planId);
  }

  /** Log de webhooks da Kiwify */
  @Get('webhooks')
  getWebhookEvents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.getWebhookEvents(
      Number(page) || 1,
      Number(limit) || 50,
    );
  }
}
