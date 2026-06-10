import { useTranslation } from 'react-i18next';
import PublicLayout from '../../components/public/PublicLayout';
import PricingCards from '../../components/public/PricingCards';

export default function PricingPage() {
  const { t } = useTranslation();

  const comparison = [
    { feature: t('pricingCompare.studentsIncluded'), essencial: '60', pro: '250', premium: t('pricingCompare.unlimited') },
    { feature: t('pricingCompare.stripeAuto'), essencial: <span className="material-symbols-outlined text-gray-500 text-[18px]">remove</span>, pro: <span className="material-symbols-outlined text-green-400 text-[18px]">check</span>, premium: <span className="material-symbols-outlined text-green-400 text-[18px]">check</span> },
    { feature: t('pricingCompare.biometrics'), essencial: <span className="material-symbols-outlined text-gray-500 text-[18px]">remove</span>, pro: <span className="material-symbols-outlined text-green-400 text-[18px]">check</span>, premium: <span className="material-symbols-outlined text-green-400 text-[18px]">check</span> },
    { feature: t('pricingCompare.turnstileApi'), essencial: <span className="material-symbols-outlined text-gray-500 text-[18px]">remove</span>, pro: <span className="material-symbols-outlined text-green-400 text-[18px]">check</span>, premium: <span className="material-symbols-outlined text-green-400 text-[18px]">check</span> },
    { feature: t('pricingCompare.prioritySupport'), essencial: <span className="material-symbols-outlined text-gray-500 text-[18px]">remove</span>, pro: <span className="material-symbols-outlined text-gray-500 text-[18px]">remove</span>, premium: <span className="material-symbols-outlined text-green-400 text-[18px]">check</span> },
  ];

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-white text-center">{t('pricing.title')}</h1>
        <p className="text-gray-400 text-center mt-4 max-w-2xl mx-auto">{t('pricing.subtitle')}</p>
        <div className="mt-12">
          <PricingCards />
        </div>
        <div className="mt-16 overflow-x-auto">
          <h2 className="text-xl font-bold text-white mb-4 text-center">{t('pricing.compareTitle')}</h2>
          <table className="w-full min-w-[500px] border border-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-gray-400">—</th>
                <th className="px-4 py-3 text-center text-gray-300">{t('pricingCompare.planEssential')}</th>
                <th className="px-4 py-3 text-center text-purple-400">{t('pricingCompare.planPro')}</th>
                <th className="px-4 py-3 text-center text-gray-300">{t('pricingCompare.planPremium')}</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature} className="border-t border-gray-800">
                  <td className="px-4 py-3 text-gray-300">{row.feature}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{row.essencial}</td>
                  <td className="px-4 py-3 text-center text-gray-300">{row.pro}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PublicLayout>
  );
}
