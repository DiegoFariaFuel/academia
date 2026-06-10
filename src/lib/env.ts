import { APP_NAME } from '../config/brand';

function read(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function isValidClientKey(key: string): boolean {
  if (!key || key.startsWith('sb_secret_')) return false;
  if (key.startsWith('sb_publishable_')) return true;
  if (key.startsWith('eyJ')) return true;
  return !/placeholder|sua_chave_anon/i.test(key);
}

function isValidProjectUrl(url: string): boolean {
  if (!url) return false;
  return !/placeholder|SEU_PROJETO|example\.supabase/i.test(url);
}

/** Supabase CLI local (porta 54321) — exige `supabase start` */
export function isLocalSupabaseUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');
    return (host === '127.0.0.1' || host === 'localhost') && (port === '54321' || port === '');
  } catch {
    return /127\.0\.0\.1:54321|localhost:54321/i.test(url);
  }
}

function isLocalSupabaseAllowed(): boolean {
  return read('VITE_SUPABASE_LOCAL_OK' as keyof ImportMetaEnv) === '1';
}

export function isEnvConfigured(): boolean {
  return getEnvConfigError() === null;
}

export type EnvConfigError =
  | 'missing'
  | 'secret_in_client'
  | 'placeholder'
  | 'local_supabase'
  | 'invalid_key';

export function getEnvConfigError(): EnvConfigError | null {
  const url = read('VITE_SUPABASE_URL');
  const key = read('VITE_SUPABASE_ANON_KEY');
  if (!url || !key) return 'missing';
  if (key.startsWith('sb_secret_')) return 'secret_in_client';
  if (/invalid_signature|_test_key$/i.test(key)) return 'invalid_key';
  if (isLocalSupabaseUrl(url) && !isLocalSupabaseAllowed()) return 'local_supabase';
  if (!isValidProjectUrl(url) || !isValidClientKey(key)) return 'placeholder';
  return null;
}

export const env = {
  appName: APP_NAME,
  supabaseUrl: read('VITE_SUPABASE_URL'),
  supabaseAnonKey: read('VITE_SUPABASE_ANON_KEY'),
  checkinApiUrl: read('VITE_CHECKIN_API_URL'),
  isDev: import.meta.env.DEV,
};
