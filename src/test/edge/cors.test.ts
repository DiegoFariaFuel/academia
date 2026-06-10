/**
 * Testes das helpers das Edge Functions (espelham supabase/functions/_shared/cors.ts)
 */
import { describe, it, expect } from 'vitest';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function optionsResponse() {
  return new Response('ok', { headers: corsHeaders });
}

describe('Edge Function CORS helpers', () => {
  it('jsonResponse retorna JSON com status', async () => {
    const res = jsonResponse({ ok: true }, 201);
    expect(res.status).toBe(201);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await res.json()).toEqual({ ok: true });
  });

  it('optionsResponse retorna 200 com cors', () => {
    const res = optionsResponse();
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});

describe('registrar-checkin validação', () => {
  function validateBody(body: Record<string, unknown>): string | null {
    if (!body.aluno_id || !body.tipo) return 'aluno_id e tipo são obrigatórios';
    if (body.tipo !== 'facial' && body.tipo !== 'digital') return 'tipo deve ser facial ou digital';
    return null;
  }

  it('aceita payload válido', () => {
    expect(validateBody({ aluno_id: 'uuid', tipo: 'facial' })).toBeNull();
  });

  it('rejeita sem aluno_id', () => {
    expect(validateBody({ tipo: 'facial' })).toMatch(/obrigatório/);
  });

  it('rejeita tipo inválido', () => {
    expect(validateBody({ aluno_id: 'x', tipo: 'iris' })).toMatch(/facial ou digital/);
  });
});

describe('stripe-webhook validação', () => {
  it('lista eventos suportados (plataforma + reembolso)', async () => {
    const { STRIPE_WEBHOOK_EVENTS } = await import('../../lib/stripeWebhook');
    expect(STRIPE_WEBHOOK_EVENTS).toContain('invoice.paid');
    expect(STRIPE_WEBHOOK_EVENTS).toContain('charge.refunded');
    expect(STRIPE_WEBHOOK_EVENTS).toContain('checkout.session.completed');
  });
});
