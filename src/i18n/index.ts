import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';

export const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

import { LOCALE_STORAGE_KEY } from '../config/brand';

const STORAGE_KEY = LOCALE_STORAGE_KEY;

function detectLocale(): AppLocale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as AppLocale)) {
    return stored as AppLocale;
  }
  const nav = navigator.language.slice(0, 2);
  if (nav === 'en' || nav === 'es') return nav;
  return 'pt';
}

void i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
    es: { translation: es },
  },
  lng: detectLocale(),
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
});

export function setAppLocale(locale: AppLocale) {
  localStorage.setItem(STORAGE_KEY, locale);
  void i18n.changeLanguage(locale);
  document.documentElement.lang = locale === 'pt' ? 'pt-BR' : locale;
}

const urlLang = new URLSearchParams(window.location.search).get('lang');
if (urlLang && SUPPORTED_LOCALES.includes(urlLang as AppLocale)) {
  setAppLocale(urlLang as AppLocale);
}

export default i18n;
