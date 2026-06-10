import type { AppLocale } from '../../i18n';
import type { LegalDocument } from './types';
import { getPrivacyDocument } from './privacy';
import { getTermsDocument } from './terms';
import { getCookiesDocument } from './cookies';

export type LegalDocType = 'privacy' | 'terms' | 'cookies';

export function getLegalDocument(type: LegalDocType, locale: AppLocale): LegalDocument {
  switch (type) {
    case 'privacy':
      return getPrivacyDocument(locale);
    case 'terms':
      return getTermsDocument(locale);
    case 'cookies':
      return getCookiesDocument(locale);
    default:
      return getPrivacyDocument(locale);
  }
}
