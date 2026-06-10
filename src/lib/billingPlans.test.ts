import { describe, it, expect } from 'vitest';
import { getPricingPlans } from '../data/pricing';
import { getPlanAmountCents, isValidPlanId, PLAN_AMOUNTS_BRL } from './billingPlans';

describe('billingPlans (Stripe checkout)', () => {
  it('tem os 3 planos da landing', () => {
    expect(Object.keys(PLAN_AMOUNTS_BRL)).toEqual(['essencial', 'profissional', 'premium']);
  });

  it('valores mensais em centavos batem com pricing BRL', () => {
    const plans = getPricingPlans('pt');
    for (const plan of plans) {
      const cents = getPlanAmountCents(plan.id, 'month');
      expect(cents).toBe(plan.priceMonthly * 100);
    }
  });

  it('valores anuais em centavos batem com pricing BRL', () => {
    const plans = getPricingPlans('pt');
    for (const plan of plans) {
      const cents = getPlanAmountCents(plan.id, 'year');
      expect(cents).toBe(plan.priceYearly * 100);
    }
  });

  it('rejeita plano inválido', () => {
    expect(isValidPlanId('enterprise')).toBe(false);
    expect(getPlanAmountCents('enterprise', 'month')).toBeNull();
  });
});
