import { useTranslation } from 'react-i18next';
import { setAppLocale, SUPPORTED_LOCALES, type AppLocale } from '../i18n';

const LABELS: Record<AppLocale, string> = {
  pt: 'PT',
  en: 'EN',
  es: 'ES',
};

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const current = (SUPPORTED_LOCALES.includes(i18n.language as AppLocale)
    ? i18n.language
    : 'pt') as AppLocale;

  return (
    <select
      aria-label="Language"
      value={current}
      onChange={(e) => setAppLocale(e.target.value as AppLocale)}
      className={`bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg px-2 py-1.5 ${className}`}
    >
      {SUPPORTED_LOCALES.map((loc) => (
        <option key={loc} value={loc}>
          {LABELS[loc]}
        </option>
      ))}
    </select>
  );
}
