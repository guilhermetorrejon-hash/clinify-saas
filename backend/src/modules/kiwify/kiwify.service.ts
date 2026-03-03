import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class KiwifyService {
  private readonly logger = new Logger(KiwifyService.name);

  constructor(private prisma: PrismaService) {}

  async handleEvent(event: string, payload: any) {
    this.logger.log(`Kiwify event recebido: ${event}`);

    await this.prisma.kiwifyEvent.create({
      data: { eventType: event || 'unknown', payload },
    });

    switch (event) {
      case 'order.approved':
      case 'subscription.active':
        await this.handleSubscriptionActivated(payload);
        break;
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(payload);
        break;
      case 'subscription.overdue':
        await this.handleSubscriptionOverdue(payload);
        break;
      default:
        this.logger.warn(`Evento Kiwify não tratado: ${event}`);
    }

    return { received: true };
  }

  private async handleSubscriptionActivated(payload: any) {
    const email = payload?.Customer?.email;
    const planSlug = payload?.Product?.slug || 'starter';
    const kiwifySubscriptionId = payload?.subscription_id;
    const kiwifyCustomerId = payload?.Customer?.id;

    if (!email) {
      this.logger.warn('Webhook sem email do cliente');
      return;
    }

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: payload?.Customer?.name || email,
          passwordHash: '',
          brandKit: { create: {} },
        },
      });
    }

    const plan = await this.prisma.plan.findFirst({
      where: { slug: planSlug, isActive: true },
    });

    if (!plan) {
      this.logger.warn(`Plano não encontrado: ${planSlug}`);
      return;
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        planId: plan.id,
        status: 'ACTIVE',
        kiwifySubscriptionId,
        kiwifyCustomerId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        kiwifySubscriptionId,
        kiwifyCustomerId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    this.logger.log(`Assinatura ativada para ${email}`);
  }

  private async handleSubscriptionCancelled(payload: any) {
    const kiwifySubscriptionId = payload?.subscription_id;
    if (!kiwifySubscriptionId) return;

    await this.prisma.subscription.updateMany({
      where: { kiwifySubscriptionId },
      data: { status: 'CANCELLED' },
    });
  }

  private async handleSubscriptionOverdue(payload: any) {
    const kiwifySubscriptionId = payload?.subscription_id;
    if (!kiwifySubscriptionId) return;

    await this.prisma.subscription.updateMany({
      where: { kiwifySubscriptionId },
      data: { status: 'PAST_DUE' },
    });
  }
}
