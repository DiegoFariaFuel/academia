import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth.store';
import LanguageSwitcher from '../LanguageSwitcher';

export default function PublicHeader() {
  const { t } = useTranslation();
  const { isAuthenticated, isStaff } = useAuthStore();
  const location = useLocation();

  const nav = [
    { to: '/precos', label: t('nav.pricing') },
    { to: '/#recursos', label: t('nav.features') },
    { to: '/#faq', label: 'FAQ' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
        >
          {t('common.brand')}
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm ${location.pathname === item.to ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/portal/login" className="text-sm text-gray-400 hover:text-white">
            {t('nav.portal')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {isAuthenticated && isStaff ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              {t('nav.panel')}
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-300 hover:text-white px-3 py-2 hidden sm:inline">
                {t('nav.login')}
              </Link>
              <Link
                to="/cadastro"
                className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90"
              >
                {t('nav.signup')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
