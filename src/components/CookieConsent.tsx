import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COOKIE_CONSENT_KEY } from '../config/brand';
import { loadGoogleTags } from '../lib/analytics';

const STORAGE_KEY = COOKIE_CONSENT_KEY;

export default function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    } else if (consent === 'accepted') {
      loadGoogleTags();
    }
  }, []);

  const choose = (value: 'accepted' | 'rejected') => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
    if (value === 'accepted') loadGoogleTags();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-4 md:p-5">
        <p className="text-sm text-gray-300">{t('cookies.message')}</p>
        <p className="text-xs text-gray-500 mt-2">
          <Link to="/cookies" className="text-purple-400 hover:underline">
            {t('footer.cookies')}
          </Link>
          {' · '}
          <Link to="/privacidade" className="text-purple-400 hover:underline">
            {t('footer.privacy')}
          </Link>
        </p>
        <div className="flex gap-2 mt-4 shrink-0">
          <button
            type="button"
            onClick={() => choose('rejected')}
            className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800"
          >
            {t('cookies.reject')}
          </button>
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            {t('cookies.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
