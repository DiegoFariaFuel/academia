/** Valores Stripe em centavos (BRL) — devem coincidir com supabase/functions/stripe-checkout */
export const PLAN_AMOUNTS_BRL: Record<string, { monthly: number; yearly: number }> = {
  essencial: { monthly: 8900, yearly: 85400 },
  profissional: { monthly: 17900, yearly: 171800 },
  premium: { monthly: 34900, yearly: 335000 },
};

export const VALID_PLAN_IDS = Object.keys(PLAN_AMOUNTS_BRL);

export function isValidPlanId(plano: string): boolean {
  return plano in PLAN_AMOUNTS_BRL;
}

export function getPlanAmountCents(plano: string, interval: 'month' | 'year'): number | null {
  const amounts = PLAN_AMOUNTS_BRL[plano];
  if (!amounts) return null;
  return interval === 'year' ? amounts.yearly : amounts.monthly;
}
