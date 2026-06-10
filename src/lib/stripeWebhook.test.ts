import { describe, it, expect } from 'vitest';
import {
  STRIPE_WEBHOOK_EVENTS,
  extractStripeCustomerId,
  resolveWebhookEffect,
} from './stripeWebhook';

describe('stripeWebhook', () => {
  it('lista eventos suportados incluindo reembolso e checkout', () => {
    expect(STRIPE_WEBHOOK_EVENTS).toContain('charge.refunded');
    expect(STRIPE_WEBHOOK_EVENTS).toContain('checkout.session.completed');
    expect(STRIPE_WEBHOOK_EVENTS.length).toBeGreaterThanOrEqual(8);
  });

  it('plataforma: pagamento ativa assinatura', () => {
    const effect = resolveWebhookEffect('invoice.paid', 'plataforma');
    expect(effect?.assinaturaStatus).toBe('active');
  });

  it('plataforma: reembolso cancela assinatura', () => {
    const effect = resolveWebhookEffect('charge.refunded', 'plataforma');
    expect(effect?.assinaturaStatus).toBe('canceled');
  });

  it('aluno: reembolso marca pagamento e bloqueia acesso', () => {
    const effect = resolveWebhookEffect('charge.refunded', 'aluno');
    expect(effect?.pagamentoStatus).toBe('reembolsado');
    expect(effect?.alunoAcessoLiberado).toBe(false);
  });

  it('aluno: invoice.paid libera acesso', () => {
    const effect = resolveWebhookEffect('invoice.paid', 'aluno');
    expect(effect?.alunoAcessoLiberado).toBe(true);
    expect(effect?.pagamentoStatus).toBe('pago');
  });

  it('extrai customer id string ou objeto', () => {
    expect(
      extractStripeCustomerId({
        data: { object: { customer: 'cus_abc' } },
      }),
    ).toBe('cus_abc');
    expect(
      extractStripeCustomerId({
        data: { object: { customer: { id: 'cus_obj' } } },
      }),
    ).toBe('cus_obj');
    expect(extractStripeCustomerId({})).toBeNull();
  });
});
