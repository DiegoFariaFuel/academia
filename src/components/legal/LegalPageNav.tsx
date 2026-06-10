import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const links = [
  { to: '/privacidade', key: 'footer.privacy' },
  { to: '/termos', key: 'footer.terms' },
  { to: '/cookies', key: 'footer.cookies' },
  { to: '/contato', key: 'footer.contact' },
] as const;

export default function LegalPageNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className="max-w-3xl mx-auto px-6 pt-6 flex flex-wrap gap-3 text-xs">
      {links.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`px-3 py-1.5 rounded-full border ${
            pathname === item.to
              ? 'border-purple-500 text-purple-300 bg-purple-900/30'
              : 'border-gray-700 text-gray-400 hover:border-gray-500'
          }`}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
