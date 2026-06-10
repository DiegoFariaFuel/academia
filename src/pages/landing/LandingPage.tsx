import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../components/public/PublicLayout';
import PricingCards from '../../components/public/PricingCards';
import { formatMoney, getPricingPlans } from '../../data/pricing';
import type { AppLocale } from '../../i18n';

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4'] as const;
const FEATURE_KEYS = [
  { icon: 'group', title: 'feat1Title', desc: 'feat1Desc' },
  { icon: 'credit_card', title: 'feat2Title', desc: 'feat2Desc' },
  { icon: 'fingerprint', title: 'feat3Title', desc: 'feat3Desc' },
  { icon: 'meeting_room', title: 'feat4Title', desc: 'feat4Desc' },
  { icon: 'mail', title: 'feat5Title', desc: 'feat5Desc' },
  { icon: 'bar_chart', title: 'feat6Title', desc: 'feat6Desc' },
] as const;

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language === 'en' || i18n.language === 'es' ? i18n.language : 'pt') as AppLocale;
  const plans = getPricingPlans(locale);
  const starterPrice = formatMoney(plans[0].priceMonthly, locale);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden px-6 py-20 md:py-28 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <p className="text-purple-400 text-sm font-semibold uppercase tracking-wider mb-4">
            {t('landing.badge')}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            {t('landing.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {t('landing.titleHighlight')}
            </span>
          </h1>
          <p className="text-gray-400 text-lg mt-6 max-w-2xl mx-auto">
            {t('landing.subtitle', { price: `${starterPrice}${t('pricing.perMonth')}` })}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              to="/cadastro"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90"
            >
              {t('landing.ctaTrial')}
            </Link>
            <Link
              to="/precos"
              className="px-8 py-3 border border-gray-600 text-white rounded-xl hover:bg-gray-800"
            >
              {t('landing.ctaPricing')}
            </Link>
          </div>
        </div>
      </section>

      <section id="recursos" className="px-6 py-20 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">{t('landing.featuresTitle')}</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">{t('landing.featuresSubtitle')}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_KEYS.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-purple-500/50 transition"
              >
                <span className="material-symbols-outlined text-3xl text-purple-400">{f.icon}</span>
                <h3 className="text-lg font-semibold text-white mt-3">{t(`landing.${f.title}`)}</h3>
                <p className="text-gray-400 text-sm mt-2">{t(`landing.${f.desc}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-2">{t('landing.plansTitle')}</h2>
          <p className="text-gray-400 text-center mb-12">{t('landing.plansSubtitle')}</p>
          <PricingCards />
        </div>
      </section>

      <section id="faq" className="px-6 py-16 bg-gray-900/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">{t('landing.faqTitle')}</h2>
          <div className="space-y-4">
            {FAQ_KEYS.map((key) => (
              <details key={key} className="bg-gray-900 border border-gray-800 rounded-lg p-4 group">
                <summary className="font-medium text-white cursor-pointer list-none flex justify-between">
                  {t(`faq.${key}`)}
                  <span className="material-symbols-outlined text-gray-500 group-open:rotate-180 transition text-[20px]">expand_more</span>
                </summary>
                <p className="text-gray-400 text-sm mt-3">{t(`faq.${key.replace('q', 'a')}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-center border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white">{t('landing.ctaFinal')}</h2>
        <Link
          to="/cadastro"
          className="inline-block mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl"
        >
          {t('landing.ctaAccount')}
        </Link>
      </section>
    </PublicLayout>
  );
}
