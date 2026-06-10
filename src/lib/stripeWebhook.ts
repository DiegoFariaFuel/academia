import type { TipoStripeEvent } from '../types/database';

/** Eventos Stripe que o webhook persiste e processa */
export const STRIPE_WEBHOOK_EVENTS: TipoStripeEvent[] = [
  'invoice.paid',
  'invoice.payment_failed',
  'customer.subscription.deleted',
  'customer.subscription.updated',
  'invoice.upcoming',
  'charge.dispute.created',
  'charge.refunded',
  'checkout.session.completed',
];

export type WebhookTarget = 'aluno' | 'plataforma';

export interface WebhookEffect {
  target: WebhookTarget;
  assinaturaStatus?: string;
  alunoAcessoLiberado?: boolean;
  alunoStatus?: string;
  pagamentoStatus?: string;
}

/** Efeitos esperados por evento (espelha processar_webhook_stripe no Postgres) */
export function resolveWebhookEffect(
  eventType: TipoStripeEvent,
  target: WebhookTarget,
): WebhookEffect | null {
  if (target === 'plataforma') {
    switch (eventType) {
      case 'invoice.paid':
      case 'checkout.session.completed':
      case 'customer.subscription.updated':
        return { target, assinaturaStatus: 'active' };
      case 'invoice.payment_failed':
        return { target, assinaturaStatus: 'past_due' };
      case 'customer.subscription.deleted':
      case 'charge.refunded':
        return { target, assinaturaStatus: 'canceled' };
      default:
        return null;
    }
  }

  switch (eventType) {
    case 'invoice.paid':
      return {
        target,
        alunoAcessoLiberado: true,
        alunoStatus: 'ativo',
        pagamentoStatus: 'pago',
      };
    case 'invoice.payment_failed':
      return { target, alunoAcessoLiberado: false, pagamentoStatus: 'falhou' };
    case 'customer.subscription.deleted':
      return { target, alunoAcessoLiberado: false, alunoStatus: 'cancelado' };
    case 'charge.refunded':
      return {
        target,
        alunoAcessoLiberado: false,
        pagamentoStatus: 'reembolsado',
      };
    case 'charge.dispute.created':
      return { target, alunoAcessoLiberado: false };
    default:
      return null;
  }
}

/** Extrai customer id do payload Stripe (formato webhook) */
export function extractStripeCustomerId(payload: {
  data?: { object?: Record<string, unknown> };
}): string | null {
  const obj = payload?.data?.object;
  if (!obj || typeof obj !== 'object') return null;
  const customer = obj.customer;
  if (typeof customer === 'string') return customer;
  if (customer && typeof customer === 'object' && 'id' in customer) {
    const id = (customer as { id?: unknown }).id;
    return typeof id === 'string' ? id : null;
  }
  return null;
}
