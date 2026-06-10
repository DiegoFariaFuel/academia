import { describe, it, expect } from 'vitest';
import { getPricingPlans, formatMoney, formatBRL } from './pricing';

describe('pricing', () => {
  it('tem 3 planos competitivos em PT', () => {
    const plans = getPricingPlans('pt');
    expect(plans).toHaveLength(3);
    expect(plans[0].priceMonthly).toBeLessThan(plans[1].priceMonthly);
    expect(plans[1].priceMonthly).toBeLessThan(plans[2].priceMonthly);
  });

  it('plano profissional é o popular', () => {
    const pro = getPricingPlans('pt').find((p) => p.id === 'profissional');
    expect(pro?.popular).toBe(true);
    expect(pro?.priceMonthly).toBe(179);
  });

  it('preços USD para EN', () => {
    const us = getPricingPlans('en');
    expect(us[0].priceMonthly).toBe(17);
  });

  it('desconto anual ~20%', () => {
    const plan = getPricingPlans('pt')[0];
    const monthlyYear = plan.priceMonthly * 12;
    expect(plan.priceYearly).toBeLessThan(monthlyYear);
    expect(plan.priceYearly / monthlyYear).toBeCloseTo(0.8, 1);
  });

  it('formata moeda por locale', () => {
    expect(formatBRL(89)).toContain('89');
    expect(formatMoney(17, 'en')).toMatch(/17/);
  });
});
