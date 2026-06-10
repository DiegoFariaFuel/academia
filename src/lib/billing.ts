import { supabase } from './supabase';
import { env, isEnvConfigured } from './env';

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');
  return token;
}

function functionsUrl(path: string) {
  if (!isEnvConfigured()) {
    throw new Error('Supabase não configurado');
  }
  const base = env.supabaseUrl.replace(/\/$/, '');
  return `${base}/functions/v1/${path}`;
}

export async function createCheckoutSession(
  plano: string,
  interval: 'month' | 'year' = 'month',
): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(functionsUrl('stripe-checkout'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plano,
      interval,
      successUrl: `${window.location.origin}/settings`,
      cancelUrl: `${window.location.origin}/settings`,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Falha ao iniciar checkout');
  if (!data.url) throw new Error('URL de checkout não retornada');
  return data.url as string;
}

export async function createBillingPortalSession(): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(functionsUrl('stripe-portal'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ returnUrl: `${window.location.origin}/settings` }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Falha ao abrir portal');
  if (!data.url) throw new Error('URL do portal não retornada');
  return data.url as string;
}

export async function dispatchMessage(mensagemId: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(functionsUrl('enviar-mensagem'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mensagem_id: mensagemId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Falha ao enviar mensagem');
}
