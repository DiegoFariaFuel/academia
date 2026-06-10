import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCheckoutSession, createBillingPortalSession } from './billing';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('./supabase', () => ({ supabase: mockSupabase }));

describe('billing (plataforma)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('createCheckoutSession retorna URL em sucesso', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token-test' } },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://checkout.stripe.com/test' }), { status: 200 }),
    );

    const url = await createCheckoutSession('profissional', 'month');
    expect(url).toBe('https://checkout.stripe.com/test');
    expect(fetch).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/stripe-checkout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-test' }),
      }),
    );
  });

  it('createCheckoutSession falha sem sessão', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    await expect(createCheckoutSession('essencial')).rejects.toThrow(/Sessão expirada/);
  });

  it('createCheckoutSession propaga erro da API', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 't' } },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Plano inválido' }), { status: 400 }),
    );
    await expect(createCheckoutSession('invalido')).rejects.toThrow(/Plano inválido/);
  });

  it('createBillingPortalSession retorna URL do portal', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token-test' } },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://billing.stripe.com/portal' }), { status: 200 }),
    );

    const url = await createBillingPortalSession();
    expect(url).toBe('https://billing.stripe.com/portal');
    expect(fetch).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/stripe-portal',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('createBillingPortalSession falha sem URL', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 't' } },
    });
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    await expect(createBillingPortalSession()).rejects.toThrow(/portal não retornada/);
  });
});
