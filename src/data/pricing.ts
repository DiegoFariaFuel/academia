import type { AppLocale } from '../i18n';

export interface PricingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  popular?: boolean;
  limits: string;
  features: string[];
}

export type PricingRegion = 'br' | 'us' | 'eu';

const PLANS_BR: PricingPlan[] = [
  {
    id: 'essencial',
    name: 'Essencial',
    priceMonthly: 89,
    priceYearly: 854,
    description: 'Para academias pequenas começando a digitalizar.',
    limits: 'Até 60 alunos ativos',
    features: [
      'Dashboard e relatórios',
      'Cadastro de alunos',
      'Controle de pagamentos',
      'Check-in manual',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    priceMonthly: 179,
    priceYearly: 1718,
    description: 'O mais escolhido — automação completa.',
    popular: true,
    limits: 'Até 250 alunos ativos',
    features: [
      'Tudo do Essencial',
      'Biometria facial e digital',
      'Integração Stripe (cobrança automática)',
      'API de catraca / check-in',
      'Mensagens (e-mail, SMS, WhatsApp)*',
      'Webhooks e bloqueio por inadimplência',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 349,
    priceYearly: 3350,
    description: 'Redes e academias de alto volume.',
    limits: 'Alunos ilimitados',
    features: [
      'Tudo do Profissional',
      'Múltiplas unidades',
      'Onboarding dedicado',
      'Suporte prioritário WhatsApp',
      'Exportação avançada de dados',
      'SLA 99,5% uptime',
    ],
  },
];

const PLANS_US: PricingPlan[] = [
  {
    id: 'essencial',
    name: 'Essential',
    priceMonthly: 17,
    priceYearly: 163,
    description: 'Small gyms starting to go digital.',
    limits: 'Up to 60 active members',
    features: PLANS_BR[0].features,
  },
  {
    id: 'profissional',
    name: 'Professional',
    priceMonthly: 35,
    priceYearly: 336,
    description: 'Most popular — full automation.',
    popular: true,
    limits: 'Up to 250 active members',
    features: PLANS_BR[1].features,
  },
  {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 69,
    priceYearly: 662,
    description: 'High-volume gyms and chains.',
    limits: 'Unlimited members',
    features: PLANS_BR[2].features,
  },
];

const PLANS_EU: PricingPlan[] = PLANS_US.map((p, i) => ({
  ...p,
  name: PLANS_BR[i].name === 'Essencial' ? 'Esencial' : p.name,
  priceMonthly: Math.round(p.priceMonthly * 0.92),
  priceYearly: Math.round(p.priceYearly * 0.92),
}));

export function localeToRegion(locale: AppLocale): PricingRegion {
  if (locale === 'en') return 'us';
  if (locale === 'es') return 'eu';
  return 'br';
}

export function getPricingPlans(locale: AppLocale = 'pt'): PricingPlan[] {
  const region = localeToRegion(locale);
  if (region === 'us') return PLANS_US;
  if (region === 'eu') return PLANS_EU;
  return PLANS_BR;
}

/** @deprecated use getPricingPlans */
export const PRICING_PLANS = PLANS_BR;

export const PRICING_FOOTNOTES: Record<AppLocale, string[]> = {
  pt: [
    '* Mensagens via provedores externos (custos de envio não inclusos).',
    'Valores em BRL. Plano anual com 20% de desconto.',
    'Preços competitivos vs Tecnofit, NextFit e similares.',
  ],
  en: [
    '* Messaging via external providers (sending costs not included).',
    'USD pricing. Annual plan saves 20%.',
    'Competitive vs gym software in the US market.',
  ],
  es: [
    '* Mensajes vía proveedores externos (costos de envío no incluidos).',
    'Precios en EUR (aprox.). Plan anual con 20% de descuento.',
    'Competitivo frente a software de gimnasios en España y LATAM.',
  ],
};

export function formatMoney(value: number, locale: AppLocale = 'pt'): string {
  const region = localeToRegion(locale);
  const currency = region === 'br' ? 'BRL' : region === 'us' ? 'USD' : 'EUR';
  const lang = locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US';
  return value.toLocaleString(lang, { style: 'currency', currency });
}

export function formatBRL(value: number) {
  return formatMoney(value, 'pt');
}
