import { COOKIE_CONSENT_KEY } from '../config/brand';

const CONSENT_KEY = COOKIE_CONSENT_KEY;
const GTAG_ID = import.meta.env.VITE_GTAG_ID as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function hasAnalyticsConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}

export function loadGoogleTags(): void {
  if (!GTAG_ID || !hasAnalyticsConsent()) return;
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GTAG_ID, { anonymize_ip: true });
}

export function revokeAnalytics(): void {
  document.querySelectorAll('script[src*="googletagmanager"]').forEach((el) => el.remove());
}
