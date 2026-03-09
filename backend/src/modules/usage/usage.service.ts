/**
 * UsageService — Controla o uso dos recursos da plataforma por usuário.
 *
 * Cada vez que o usuário cria um post, carrossel, foto pro, etc.,
 * registramos um "UsageRecord" no banco. Antes de permitir a ação,
 * verificamos se ele ainda tem cota disponível no plano atual.
 *
 * A contagem é feita dentro do período da assinatura (currentPeriodStart → currentPeriodEnd).
 * Se o período expirou ou não existe assinatura, nenhum recurso é liberado.
 */
import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UsageType } from '@prisma/client';

// Mapeamento: para cada tipo de uso, qual campo do plano define o limite
const LIMIT_FIELD: Record<UsageType, string> = {
  POST: 'postsPerMonth',
  CAROUSEL: 'carouselsPerMonth',
  PHOTO: 'photosPerMonth',
  THEME_SUGGESTION: 'themeSuggestions',
  CAPTION_REWRITE: 'captionRewrites',
};

// Nomes amigáveis para as mensagens de erro (em português)
const USAGE_LABELS: Record<UsageType, string> = {
  POST: 'posts',
  CAROUSEL: 'carrosséis',
  PHOTO: 'sessões de Foto Pro',
  THEME_SUGGESTION: 'sugestões de tema',
  CAPTION_REWRITE: 'abordagens de copy',
};

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Verifica se o usuário pode usar o recurso.
   * Se não puder, lança um erro ForbiddenException com mensagem amigável.
   * Se puder, retorna silenciosamente (não faz nada).
   */
  async checkLimit(userId: string, type: UsageType): Promise<void> {
    // 1. Buscar a assinatura do usuário com o plano associado
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    // Sem assinatura ativa = sem acesso
    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Você precisa de uma assinatura ativa para usar este recurso. Assine um plano para continuar.',
      );
    }

    // 2. Verificar se o período da assinatura ainda é válido
    const now = new Date();
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < now) {
      throw new ForbiddenException(
        'Sua assinatura expirou. Renove para continuar usando a plataforma.',
      );
    }

    // 3. Contar quantas vezes o usuário já usou este recurso no período atual
    const periodStart = subscription.currentPeriodStart || subscription.createdAt;

    const usedCount = await this.prisma.usageRecord.count({
      where: {
        userId,
        type,
        createdAt: { gte: periodStart },
      },
    });

    // 4. Buscar o limite do plano para esse tipo de recurso
    const plan = subscription.plan;
    const limitField = LIMIT_FIELD[type];
    const limit = (plan as any)[limitField] as number;

    // 5. Se já atingiu o limite, bloquear
    if (usedCount >= limit) {
      const label = USAGE_LABELS[type];
      throw new ForbiddenException(
        `Você atingiu o limite de ${limit} ${label} do plano ${plan.name}. ` +
        `Faça upgrade para ter mais ${label}.`,
      );
    }

    this.logger.debug(`[${userId}] ${type}: ${usedCount + 1}/${limit}`);
  }

  /**
   * Registra que o usuário usou um recurso.
   * Deve ser chamado DEPOIS que a ação foi realizada com sucesso.
   */
  async record(userId: string, type: UsageType): Promise<void> {
    await this.prisma.usageRecord.create({
      data: { userId, type },
    });
  }

  /**
   * Retorna o uso atual do usuário no período, comparado com os limites do plano.
   * Usado na dashboard para mostrar barras de progresso tipo "3/8 posts usados".
   */
  async getUsage(userId: string) {
    // Buscar assinatura + plano
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      return { hasSubscription: false, plan: null, usage: {} };
    }

    const periodStart = subscription.currentPeriodStart || subscription.createdAt;
    const plan = subscription.plan;

    // Contar cada tipo de uso no período
    const types: UsageType[] = ['POST', 'CAROUSEL', 'PHOTO', 'THEME_SUGGESTION', 'CAPTION_REWRITE'];

    const counts = await Promise.all(
      types.map(async (type) => {
        const count = await this.prisma.usageRecord.count({
          where: { userId, type, createdAt: { gte: periodStart } },
        });
        return { type, count };
      }),
    );

    // Montar objeto com uso vs limite
    const usage: Record<string, { used: number; limit: number }> = {};
    for (const { type, count } of counts) {
      const limitField = LIMIT_FIELD[type];
      usage[type] = {
        used: count,
        limit: (plan as any)[limitField] as number,
      };
    }

    return {
      hasSubscription: true,
      plan: { name: plan.name, slug: plan.slug },
      periodStart,
      periodEnd: subscription.currentPeriodEnd,
      status: subscription.status,
      usage,
    };
  }
}
