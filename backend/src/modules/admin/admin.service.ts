/**
 * AdminService — Consultas usadas pela dashboard de administração.
 *
 * Aqui ficam todas as queries "pesadas" que só o admin precisa:
 * - Visão geral da plataforma (total de usuários, receita, etc.)
 * - Lista de todos os usuários com seus planos e uso
 * - Estatísticas de uso da plataforma (quantos posts, fotos, etc.)
 * - Log de webhooks da Kiwify
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * GET /admin/overview
   * Retorna os números principais da plataforma.
   * É o que aparece nos "cards" no topo da dashboard.
   */
  async getOverview() {
    // Rodar todas as queries em paralelo para ser mais rápido
    const [
      totalUsers,
      activeSubscriptions,
      totalPosts,
      totalPhotos,
      plans,
      recentUsers,
    ] = await Promise.all([
      // Total de usuários cadastrados
      this.prisma.user.count(),

      // Quantas assinaturas estão ativas agora
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),

      // Total de posts já criados na plataforma
      this.prisma.post.count(),

      // Total de sessões de foto
      this.prisma.professionalPhoto.count(),

      // Distribuição por plano (quantos assinantes em cada)
      this.prisma.subscription.groupBy({
        by: ['planId'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),

      // 5 usuários mais recentes
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ]);

    // Buscar nomes dos planos para mostrar no dashboard
    const planIds = plans.map((p) => p.planId);
    const planDetails = await this.prisma.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true, priceInCents: true },
    });

    // Montar distribuição por plano com nome e receita estimada
    const planDistribution = plans.map((p) => {
      const plan = planDetails.find((d) => d.id === p.planId);
      return {
        planName: plan?.name || 'Desconhecido',
        subscribers: p._count,
        monthlyRevenue: ((plan?.priceInCents || 0) * p._count) / 100,
      };
    });

    // Receita mensal estimada (soma de todos os planos ativos)
    const estimatedMonthlyRevenue = planDistribution.reduce(
      (sum, p) => sum + p.monthlyRevenue,
      0,
    );

    return {
      totalUsers,
      activeSubscriptions,
      totalPosts,
      totalPhotos,
      estimatedMonthlyRevenue,
      planDistribution,
      recentUsers,
    };
  }

  /**
   * GET /admin/users
   * Lista todos os usuários com seu plano, status da assinatura e uso.
   */
  async getUsers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          subscription: {
            select: {
              status: true,
              currentPeriodEnd: true,
              plan: { select: { name: true, slug: true } },
            },
          },
          _count: {
            select: { posts: true, photos: true, usageRecords: true },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * GET /admin/usage
   * Estatísticas globais de uso da plataforma — útil para estimar custos.
   *
   * Custo estimado por operação (valores aproximados):
   * - Post (texto IA + 3 imagens Gemini): ~R$0,50
   * - Carrossel (texto + 5 imagens): ~R$0,80
   * - Foto Pro (10 fotos fal.ai): ~R$2,00
   * - Sugestão de tema (chamada Claude): ~R$0,05
   * - Reescrita de copy (chamada Claude): ~R$0,05
   */
  async getUsageStats() {
    // Buscar contagem por tipo de uso no mês atual
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const usageThisMonth = await this.prisma.usageRecord.groupBy({
      by: ['type'],
      where: { createdAt: { gte: monthStart } },
      _count: true,
    });

    const usageAllTime = await this.prisma.usageRecord.groupBy({
      by: ['type'],
      _count: true,
    });

    // Custos estimados por operação (em R$)
    const costPerOperation: Record<string, number> = {
      POST: 0.5,
      CAROUSEL: 0.8,
      PHOTO: 2.0,
      THEME_SUGGESTION: 0.05,
      CAPTION_REWRITE: 0.05,
    };

    // Calcular custo estimado do mês
    let estimatedMonthlyCost = 0;
    const monthlyBreakdown = usageThisMonth.map((u) => {
      const cost = (costPerOperation[u.type] || 0) * u._count;
      estimatedMonthlyCost += cost;
      return { type: u.type, count: u._count, estimatedCost: cost };
    });

    // Calcular custo total acumulado
    let estimatedTotalCost = 0;
    const allTimeBreakdown = usageAllTime.map((u) => {
      const cost = (costPerOperation[u.type] || 0) * u._count;
      estimatedTotalCost += cost;
      return { type: u.type, count: u._count, estimatedCost: cost };
    });

    return {
      thisMonth: {
        breakdown: monthlyBreakdown,
        totalCost: estimatedMonthlyCost,
        period: `${monthStart.toISOString().slice(0, 10)} → hoje`,
      },
      allTime: {
        breakdown: allTimeBreakdown,
        totalCost: estimatedTotalCost,
      },
    };
  }

  /**
   * GET /admin/webhooks
   * Últimos eventos recebidos da Kiwify — útil para debug.
   */
  async getWebhookEvents(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.kiwifyEvent.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.kiwifyEvent.count(),
    ]);

    return { events, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * GET /admin/plans
   * Lista todos os planos ativos — usado no dropdown de troca de plano.
   */
  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceInCents: 'asc' },
      select: { id: true, name: true, slug: true, priceInCents: true },
    });
  }

  /**
   * PATCH /admin/users/:id/plan
   * Troca o plano de um usuário.
   * Se o usuário não tem assinatura, cria uma nova.
   * Reseta o período para 30 dias (ou 1 ano se gratuito).
   */
  async changeUserPlan(userId: string, planId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plano não encontrado');

    const now = new Date();
    // Gratuito: período de 1 ano. Pagos: 30 dias.
    const periodDays = plan.priceInCents === 0 ? 365 : 30;
    const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    return { message: `Plano de ${user.name} alterado para ${plan.name}` };
  }
}
