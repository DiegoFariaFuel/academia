/** Nome do produto e chaves de armazenamento local */
export const APP_NAME = import.meta.env.VITE_APP_NAME?.trim() || 'Solviz';

export const COOKIE_CONSENT_KEY = 'solviz_cookie_consent';
export const LOCALE_STORAGE_KEY = 'solviz_locale';

const LEGACY_COOKIE_KEY = 'academia_cookie_consent';
const LEGACY_LOCALE_KEY = 'academia_locale';

export function migrateLegacyStorage(): void {
  try {
    const legacyCookie = localStorage.getItem(LEGACY_COOKIE_KEY);
    if (legacyCookie && !localStorage.getItem(COOKIE_CONSENT_KEY)) {
      localStorage.setItem(COOKIE_CONSENT_KEY, legacyCookie);
    }
    const legacyLocale = localStorage.getItem(LEGACY_LOCALE_KEY);
    if (legacyLocale && !localStorage.getItem(LOCALE_STORAGE_KEY)) {
      localStorage.setItem(LOCALE_STORAGE_KEY, legacyLocale);
    }
  } catch {
    /* ignore */
  }
}
