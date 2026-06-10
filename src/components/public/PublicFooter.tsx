import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PublicFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {t('common.brand')}
          </p>
          <p className="text-gray-500 text-sm mt-2">{t('footer.tagline')}</p>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">{t('footer.product')}</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link to="/precos" className="hover:text-purple-400">
                {t('nav.pricing')}
              </Link>
            </li>
            <li>
              <Link to="/cadastro" className="hover:text-purple-400">
                {t('nav.signup')}
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-purple-400">
                {t('nav.login')}
              </Link>
            </li>
            <li>
              <Link to="/portal/login" className="hover:text-purple-400">
                {t('nav.portal')}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">{t('footer.legal')}</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link to="/privacidade" className="hover:text-purple-400">
                {t('footer.privacy')}
              </Link>
            </li>
            <li>
              <Link to="/termos" className="hover:text-purple-400">
                {t('footer.terms')}
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="hover:text-purple-400">
                {t('footer.cookies')}
              </Link>
            </li>
            <li>
              <Link to="/contato" className="hover:text-purple-400">
                {t('footer.contact')}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 text-center text-xs text-gray-600 py-4">
        © {new Date().getFullYear()} {t('common.brand')}. {t('footer.rights')}
      </div>
    </footer>
  );
}
