import { useTranslation } from 'react-i18next';
import type { AppLocale } from '../i18n';

export function useLegalLocale(): AppLocale {
  const { i18n } = useTranslation();
  if (i18n.language === 'en' || i18n.language === 'es') return i18n.language;
  return 'pt';
}
