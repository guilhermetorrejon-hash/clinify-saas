/**
 * KiwifyService — Processa os webhooks que a Kiwify envia quando
 * alguém compra, renova ou cancela uma assinatura.
 *
 * Fluxo: Kiwify envia POST /api/webhooks/kiwify → este service
 * identifica o evento, encontra o plano correto, e cria/atualiza
 * a assinatura do usuário no nosso banco.
 *
 * Segurança: valida assinatura HMAC-SHA256 usando KIWIFY_WEBHOOK_SECRET.
 */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

// Mapeamento: se a Kiwify enviar um slug antigo, converter para o novo
// Ex: se alguém ainda tinha o produto "starter", mapeamos para "essencial"
const SLUG_ALIASES: Record<string, string> = {
  starter: 'essencial',
  pro: 'profissional',
  expert: 'referencia',
};

@Injectable()
export class KiwifyService {
  private readonly logger = new Logger(KiwifyService.name);

  // Token secreto para validar que o webhook realmente veio da Kiwify
  private readonly webhookSecret: string | null;

  // Mapa: product_id da Kiwify → slug do nosso plano
  // Configurado via env: KIWIFY_PRODUCT_ESSENCIAL=abc123
  private readonly productPlanMap: Record<string, string>;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.webhookSecret = this.config.get('KIWIFY_WEBHOOK_SECRET') || null;

    // Montar o mapa product_id → slug a partir das env vars
    this.productPlanMap = {};
    const ids: [string, string][] = [
      ['KIWIFY_PRODUCT_ESSENCIAL', 'essencial'],
      ['KIWIFY_PRODUCT_PROFISSIONAL', 'profissional'],
      ['KIWIFY_PRODUCT_REFERENCIA', 'referencia'],
    ];
    for (const [envKey, slug] of ids) {
      const productId = this.config.get(envKey);
      if (productId) this.productPlanMap[productId] = slug;
    }
  }

  /**
   * Valida a assinatura HMAC do webhook.
   * Se KIWIFY_WEBHOOK_SECRET não estiver configurado, pula a validação
   * (útil em desenvolvimento local).
   */
  validateSignature(rawBody: Buffer | undefined, signatureHeader: string | undefined): void {
    if (!this.webhookSecret) return; // sem secret = skip (dev mode)

    if (!rawBody || !signatureHeader) {
      throw new UnauthorizedException('Webhook sem assinatura');
    }

    // HMAC-SHA256: gera o hash esperado usando nosso secret + body cru
    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Comparação segura contra timing attacks
    if (expected.length !== signatureHeader.length || expected !== signatureHeader) {
      this.logger.warn('Assinatura HMAC inválida no webhook Kiwify');
      throw new UnauthorizedException('Assinatura inválida');
    }
  }

  /**
   * Ponto de entrada principal — recebe o evento e o payload do webhook.
   */
  async handleEvent(event: string, payload: any, forcePlanSlug?: string) {
    this.logger.log(`Kiwify evento recebido: ${event}${forcePlanSlug ? ` (plano forçado: ${forcePlanSlug})` : ''}`);

    // Salvar o evento cru no banco para auditoria/debug
    await this.prisma.kiwifyEvent.create({
      data: { eventType: event || 'unknown', payload },
    });

    switch (event) {
      case 'order.approved':
      case 'subscription.active':
        await this.handleSubscriptionActivated(payload, forcePlanSlug);
        break;
      case 'subscription.renewed':
        await this.handleSubscriptionActivated(payload, forcePlanSlug);
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

  /**
   * Descobre qual slug de plano usar a partir do payload da Kiwify.
   *
   * Tenta 3 estratégias, em ordem de prioridade:
   * 1. product_id mapeado via env var (mais confiável)
   * 2. slug do Product no payload (com aliases para slugs antigos)
   * 3. Nome do produto (busca parcial por "essencial", "profissional", etc.)
   */
  private resolvePlanSlug(payload: any): string {
    // Estratégia 1: product_id → mapa de env vars
    const productId = payload?.Product?.product_id || payload?.product_id;
    if (productId && this.productPlanMap[productId]) {
      return this.productPlanMap[productId];
    }

    // Estratégia 2: slug direto (com aliases para slugs antigos)
    const slug = payload?.Product?.slug;
    if (slug) {
      if (SLUG_ALIASES[slug]) return SLUG_ALIASES[slug];
      return slug;
    }

    // Estratégia 3: busca pelo nome do produto
    const name = (payload?.Product?.name || '').toLowerCase();
    if (name.includes('essencial')) return 'essencial';
    if (name.includes('profissional')) return 'profissional';
    if (name.includes('refer')) return 'referencia';

    // Fallback: plano mais básico
    this.logger.warn('Não foi possível determinar o plano pelo payload, usando essencial como fallback');
    return 'essencial';
  }

  /**
   * Ativa ou renova a assinatura do usuário.
   * Se o usuário não existir no banco, cria automaticamente
   * (o email vem do payload da Kiwify).
   */
  private async handleSubscriptionActivated(payload: any, forcePlanSlug?: string) {
    const email = payload?.Customer?.email;
    const kiwifySubscriptionId = payload?.subscription_id;
    const kiwifyCustomerId = payload?.Customer?.id;

    if (!email) {
      this.logger.warn('Webhook sem email do cliente — ignorando');
      return;
    }

    // Se veio pela rota /webhooks/kiwify/:planSlug, usa o slug da URL
    // Senão, tenta descobrir pelo payload (rota genérica)
    const planSlug = forcePlanSlug || this.resolvePlanSlug(payload);

    // Buscar o usuário pelo email (pode já existir se fez cadastro antes de pagar)
    let user = await this.prisma.user.findUnique({ where: { email } });

    // Se não existe, criar o usuário automaticamente
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: payload?.Customer?.name || email,
          passwordHash: '', // será definido quando o usuário acessar pela primeira vez
          brandKit: { create: {} },
        },
      });
      this.logger.log(`Novo usuário criado via webhook: ${email}`);
    }

    // Buscar o plano no banco (só planos ativos)
    const plan = await this.prisma.plan.findFirst({
      where: { slug: planSlug, isActive: true },
    });

    if (!plan) {
      this.logger.error(`Plano "${planSlug}" não encontrado ou inativo — webhook ignorado`);
      return;
    }

    // Período: 30 dias a partir de agora
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // upsert = se já existe assinatura, atualiza; se não, cria
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

    this.logger.log(`Assinatura ${plan.name} ativada para ${email}`);
  }

  /**
   * Marca a assinatura como cancelada.
   * O usuário ainda pode usar até o final do período atual.
   */
  private async handleSubscriptionCancelled(payload: any) {
    const kiwifySubscriptionId = payload?.subscription_id;
    if (!kiwifySubscriptionId) return;

    await this.prisma.subscription.updateMany({
      where: { kiwifySubscriptionId },
      data: { status: 'CANCELLED' },
    });

    this.logger.log(`Assinatura ${kiwifySubscriptionId} cancelada`);
  }

  /**
   * Marca a assinatura como inadimplente (pagamento não foi feito no prazo).
   */
  private async handleSubscriptionOverdue(payload: any) {
    const kiwifySubscriptionId = payload?.subscription_id;
    if (!kiwifySubscriptionId) return;

    await this.prisma.subscription.updateMany({
      where: { kiwifySubscriptionId },
      data: { status: 'PAST_DUE' },
    });

    this.logger.log(`Assinatura ${kiwifySubscriptionId} inadimplente`);
  }
}
