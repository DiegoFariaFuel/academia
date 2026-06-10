import { APP_NAME } from './brand';

export const legalConfig = {
  companyName: import.meta.env.VITE_LEGAL_COMPANY_NAME ?? 'Solviz Software Ltda.',
  productName: import.meta.env.VITE_LEGAL_PRODUCT_NAME ?? APP_NAME,
  emailPrivacy: import.meta.env.VITE_LEGAL_EMAIL_PRIVACY ?? 'privacidade@solviz.com.br',
  emailSupport: import.meta.env.VITE_LEGAL_EMAIL_SUPPORT ?? 'suporte@solviz.com.br',
  emailLegal: import.meta.env.VITE_LEGAL_EMAIL_LEGAL ?? 'juridico@solviz.com.br',
  address: import.meta.env.VITE_LEGAL_ADDRESS ?? 'Brasil',
  cnpj: import.meta.env.VITE_LEGAL_CNPJ ?? '',
  website:
    import.meta.env.VITE_SITE_URL ??
    (typeof window !== 'undefined' ? window.location.origin : 'https://solviz.com.br'),
  dpoEmail: import.meta.env.VITE_LEGAL_DPO_EMAIL ?? 'dpo@solviz.com.br',
  lastUpdated: import.meta.env.VITE_LEGAL_LAST_UPDATED ?? '10 de outubro de 2023',
  lastUpdatedEn: import.meta.env.VITE_LEGAL_LAST_UPDATED_EN ?? 'October 10, 2023',
  lastUpdatedEs: import.meta.env.VITE_LEGAL_LAST_UPDATED_ES ?? '10 de octubre de 2023',
};
