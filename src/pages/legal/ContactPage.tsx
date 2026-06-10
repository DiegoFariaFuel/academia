import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../components/public/PublicLayout';
import { legalConfig } from '../../config/legal';

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-white">{t('contact.title')}</h1>
        <p className="text-gray-400 mt-2 text-sm">{t('contact.subtitle')}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
            <h2 className="font-semibold text-white">{t('contact.support')}</h2>
            <p className="text-gray-400 text-sm mt-2">{t('contact.supportDesc')}</p>
            <a href={`mailto:${legalConfig.emailSupport}`} className="text-purple-400 text-sm mt-3 inline-block hover:underline">
              {legalConfig.emailSupport}
            </a>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
            <h2 className="font-semibold text-white">{t('contact.privacy')}</h2>
            <p className="text-gray-400 text-sm mt-2">{t('contact.privacyDesc')}</p>
            <a href={`mailto:${legalConfig.emailPrivacy}`} className="text-purple-400 text-sm mt-3 inline-block hover:underline">
              {legalConfig.emailPrivacy}
            </a>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
            <h2 className="font-semibold text-white">{t('contact.legal')}</h2>
            <p className="text-gray-400 text-sm mt-2">{t('contact.legalDesc')}</p>
            <a href={`mailto:${legalConfig.emailLegal}`} className="text-purple-400 text-sm mt-3 inline-block hover:underline">
              {legalConfig.emailLegal}
            </a>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
            <h2 className="font-semibold text-white">{t('contact.company')}</h2>
            <p className="text-gray-300 text-sm mt-2">{legalConfig.companyName}</p>
            {legalConfig.cnpj && <p className="text-gray-500 text-sm">CNPJ: {legalConfig.cnpj}</p>}
            <p className="text-gray-500 text-sm mt-1">{legalConfig.address}</p>
          </div>
        </div>

        <div className="mt-10 p-6 rounded-xl border border-purple-500/30 bg-purple-900/10">
          <h2 className="font-semibold text-white">{t('contact.adsTitle')}</h2>
          <p className="text-gray-400 text-sm mt-2">{t('contact.adsDesc')}</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/privacidade" className="text-purple-400 hover:underline">
                {t('footer.privacy')}
              </Link>
            </li>
            <li>
              <Link to="/termos" className="text-purple-400 hover:underline">
                {t('footer.terms')}
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="text-purple-400 hover:underline">
                {t('footer.cookies')}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </PublicLayout>
  );
}
