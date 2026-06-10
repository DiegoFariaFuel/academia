/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CHECKIN_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_GTAG_ID?: string;
  readonly VITE_LEGAL_COMPANY_NAME?: string;
  readonly VITE_LEGAL_PRODUCT_NAME?: string;
  readonly VITE_LEGAL_EMAIL_PRIVACY?: string;
  readonly VITE_LEGAL_EMAIL_SUPPORT?: string;
  readonly VITE_LEGAL_EMAIL_LEGAL?: string;
  readonly VITE_LEGAL_DPO_EMAIL?: string;
  readonly VITE_LEGAL_ADDRESS?: string;
  readonly VITE_LEGAL_COUNTRY?: string;
  readonly VITE_LEGAL_CNPJ?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
