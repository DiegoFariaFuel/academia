import { getEnvConfigError, isLocalSupabaseUrl } from './env';
import { env } from './env';

/** Mensagem amigável para falhas de auth/rede no cadastro e login */
export function formatAuthError(error: unknown, t?: (key: string) => string): string {
  const tr = (key: string, fallback: string) => (t ? t(key) : fallback);

  if (getEnvConfigError() === 'local_supabase' || isLocalSupabaseUrl(env.supabaseUrl)) {
    return tr(
      'auth.backendLocalOffline',
      'Supabase local não está rodando. Use a URL do projeto na nuvem (Supabase → Settings → API) no .env ou execute: npx supabase start',
    );
  }

  const err = error as { message?: string; status?: number; code?: string };
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : (err.message ?? '');

  const isEmailRateLimit =
    err.status === 429 ||
    err.code === 'over_email_send_rate_limit' ||
    /rate limit exceeded|too many.*email|email.*limit/i.test(msg);

  if (isEmailRateLimit) {
    return tr(
      'auth.emailRateLimit',
      'Limite de envio de e-mails atingido. Aguarde cerca de 1 hora ou desative a confirmação por e-mail no Supabase (Authentication → Providers → Email) para testes.',
    );
  }

  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('ERR_CONNECTION_REFUSED') ||
    msg.includes('Load failed')
  ) {
    return tr(
      'auth.backendUnreachable',
      'Não foi possível conectar ao servidor. Verifique VITE_SUPABASE_URL no .env, sua internet e reinicie npm run dev.',
    );
  }

  return msg || tr('auth.registerFailed', 'Falha ao criar conta');
}
