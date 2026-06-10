import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import { mockStaffUser, mockSession } from '../test/mocks/supabase';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(),
  },
}));

vi.mock('../lib/supabase', () => ({ supabase: mockSupabase }));

function mockFromChain(responses: Record<string, unknown>) {
  mockSupabase.from.mockImplementation((table: string) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(responses[table] ?? { data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };
    return chain;
  });
}

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      user: null,
      isAuthenticated: false,
      isStaff: false,
      isAluno: false,
      loading: true,
    });
    vi.clearAllMocks();
  });

  it('login com staff via app_metadata', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockStaffUser, session: mockSession },
      error: null,
    });
    mockFromChain({
      staff: { data: { nome: 'Admin', ativo: true, academia_id: 'a1' }, error: null },
    });

    const role = await useAuthStore.getState().login('admin@test.com', 'senha123');

    const state = useAuthStore.getState();
    expect(role).toBe('staff');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isStaff).toBe(true);
    expect(state.user?.role).toBe('staff');
  });

  it('login como aluno quando e-mail existe em alunos', async () => {
    const alunoUser = { ...mockStaffUser, app_metadata: {}, email: 'aluno@test.com' };
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: alunoUser, session: mockSession },
      error: null,
    });
    mockFromChain({
      staff: { data: null, error: null },
      alunos: {
        data: { id: 'aluno-1', nome: 'João', academia_id: 'acad-1', auth_user_id: null },
        error: null,
      },
    });

    const role = await useAuthStore.getState().login('aluno@test.com', 'x');

    expect(role).toBe('aluno');
    expect(useAuthStore.getState().isAluno).toBe(true);
    expect(useAuthStore.getState().isStaff).toBe(false);
  });

  it('logout limpa estado', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      isStaff: true,
      isAluno: false,
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'staff', academiaId: null },
      loading: false,
    });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
