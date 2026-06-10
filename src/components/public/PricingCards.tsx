import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPricingPlans, PRICING_FOOTNOTES, formatMoney } from '../../data/pricing';
import type { AppLocale } from '../../i18n';

interface PricingCardsProps {
  showAnnual?: boolean;
  compact?: boolean;
}

export default function PricingCards({ showAnnual = true, compact = false }: PricingCardsProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language === 'en' || i18n.language === 'es' ? i18n.language : 'pt') as AppLocale;
  const plans = getPricingPlans(locale);
  const footnotes = PRICING_FOOTNOTES[locale];

  return (
    <div>
      <div className={`grid gap-6 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-3 max-w-5xl mx-auto'}`}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border p-6 flex flex-col ${
              plan.popular
                ? 'border-purple-500 bg-gradient-to-b from-purple-900/40 to-gray-900 shadow-lg shadow-purple-500/20 scale-[1.02]'
                : 'border-gray-700 bg-gray-900/50'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                {t('pricing.popular')}
              </span>
            )}
            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
            <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
            <p className="mt-4">
              <span className="text-4xl font-bold text-white">{formatMoney(plan.priceMonthly, locale)}</span>
              <span className="text-gray-500 text-sm">{t('pricing.perMonth')}</span>
            </p>
            {showAnnual && (
              <p className="text-green-400 text-xs mt-1">
                {t('pricing.orYearly', { price: formatMoney(plan.priceYearly, locale) })}
              </p>
            )}
            <p className="text-purple-300 text-sm font-medium mt-2">{plan.limits}</p>
            <ul className="mt-4 space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="text-sm text-gray-300 flex gap-2">
                  <span className="material-symbols-outlined text-green-400 shrink-0 text-[18px]">check</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to={`/cadastro?plano=${plan.id}`}
              className={`mt-6 block text-center py-2.5 rounded-lg font-semibold text-sm transition ${
                plan.popular
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
              }`}
            >
              {t('pricing.subscribe', { name: plan.name })}
            </Link>
          </div>
        ))}
      </div>
      <ul className="mt-8 text-xs text-gray-500 space-y-1 max-w-3xl mx-auto text-center">
        {footnotes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
