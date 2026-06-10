import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isEnvConfigured } from './env';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!isEnvConfigured()) {
    throw new Error(
      'Supabase não configurado. Crie o arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
    );
  }
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      global: {
        fetch: async (url, options) => {
          const res = await fetch(url, options);
          if (!res.ok) {
            const clone = res.clone();
            try {
              const body = await clone.json();
              console.error(`[🔥 SUPABASE ERROR] ${options?.method} ${url}`, body);
            } catch {
              console.error(`[🔥 SUPABASE ERROR] ${options?.method} ${url} | Status: ${res.status}`);
            }
          }
          return res;
        }
      }
    });
  }
  return client;
}

/** Cliente lazy — não quebra o boot se o .env ainda não existir */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const c = getClient();
    const value = Reflect.get(c, prop, receiver);
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(c) : value;
  },
});
