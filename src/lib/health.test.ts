import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEdgeFunctionUrls, runHealthChecks } from './health';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('./supabase', () => ({ supabase: mockSupabase }));

describe('getEdgeFunctionUrls', () => {
  it('monta URLs das edge functions', () => {
    const urls = getEdgeFunctionUrls('https://abc.supabase.co');
    expect(urls.stripeWebhook).toBe('https://abc.supabase.co/functions/v1/stripe-webhook');
    expect(urls.registrarCheckin).toBe('https://abc.supabase.co/functions/v1/registrar-checkin');
  });

  it('remove barra final da URL base', () => {
    const urls = getEdgeFunctionUrls('https://abc.supabase.co/');
    expect(urls.stripeWebhook).toBe('https://abc.supabase.co/functions/v1/stripe-webhook');
  });
});

describe('runHealthChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 5 verificações', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    };

    chain.maybeSingle.mockResolvedValue({ data: { ativo: true }, error: null });
    chain.single.mockResolvedValue({
      data: { total_alunos: 5 },
      error: null,
    });
    chain.limit.mockResolvedValue({ data: [{ id: '1' }], error: null });

    mockSupabase.from.mockReturnValue(chain);
    mockSupabase.rpc.mockResolvedValue({ data: { ok: false }, error: null });

    const checks = await runHealthChecks();
    expect(checks).toHaveLength(5);
    expect(checks.map((c) => c.id)).toEqual(['auth', 'staff', 'dashboard', 'alunos', 'rpc']);
  });

  it('marca auth como falha sem sessão', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    chain.single.mockResolvedValue({ data: null, error: { message: 'err' } });
    chain.limit.mockResolvedValue({ data: null, error: { message: 'rls' } });
    mockSupabase.from.mockReturnValue(chain);
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'rpc err' } });

    const checks = await runHealthChecks();
    expect(checks.find((c) => c.id === 'auth')?.ok).toBe(false);
  });
});
