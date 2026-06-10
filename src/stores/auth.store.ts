import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { formatAuthError } from '../lib/authErrors';
import type { Staff } from '../types/database';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'staff' | 'aluno';
  academiaId: string | null;
}

interface SignUpParams {
  email: string;
  password: string;
  nome: string;
  plano: string;
}

interface AuthState {
  session: Session | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  isAluno: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<'staff' | 'aluno'>;
  signUp: (params: SignUpParams) => Promise<{ needsEmailConfirmation: boolean }>;
  forgotPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<() => void>;
}

async function linkAlunoAuth(user: User): Promise<{ role: 'aluno'; name: string; academiaId: string | null } | null> {
  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, academia_id, auth_user_id')
    .eq('email', user.email ?? '')
    .maybeSingle();

  if (!aluno) return null;

  if (!aluno.auth_user_id) {
    await supabase.from('alunos').update({ auth_user_id: user.id }).eq('id', aluno.id);
  }

  return { role: 'aluno', name: aluno.nome, academiaId: aluno.academia_id };
}

async function resolveRole(user: User): Promise<{ role: 'staff' | 'aluno'; name: string; academiaId: string | null }> {
  const metaRole = (user.user_metadata?.role || user.app_metadata?.role) as string | undefined;
  if (metaRole === 'staff') {
    const { data: staffRow, error } = await supabase
      .from('staff')
      .select('nome, academia_id, ativo')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      role: 'staff',
      name: (user.user_metadata?.nome as string) ?? staffRow?.nome ?? user.email ?? 'Staff',
      academiaId: staffRow?.academia_id ?? null,
    };
  }

  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('nome, ativo, academia_id')
    .eq('id', user.id)
    .maybeSingle();

  if (staffError) throw staffError;

  const s = staff as (Staff & { academia_id?: string }) | null;
  if (s?.ativo) {
    return { role: 'staff', name: s.nome, academiaId: s.academia_id ?? null };
  }

  const aluno = await linkAlunoAuth(user);
  if (aluno) return aluno;

  return { role: 'aluno', name: (user.user_metadata?.nome as string) ?? user.email ?? 'Aluno', academiaId: null };
}

async function buildUser(user: User): Promise<AuthUser> {
  const { role, name, academiaId } = await resolveRole(user);
  return {
    id: user.id,
    email: user.email ?? '',
    name,
    role,
    academiaId,
  };
}

async function createAcademia(nome: string): Promise<string> {
  const slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);

  const { data, error } = await supabase
    .from('academias')
    .insert({ nome, slug: `${slug}-${Date.now().toString(36)}` })
    .select('id')
    .single();

  if (error) throw new Error(`Erro ao criar academia: ${error.message}`);
  return data.id as string;
}

async function ensureStaffRecord(userId: string, nome: string, email: string, academiaId?: string, plano?: string) {
  const { data: existingStaff } = await supabase
    .from('staff')
    .select('academia_id')
    .eq('id', userId)
    .maybeSingle();

  let acadId = academiaId || existingStaff?.academia_id;

  if (!acadId) {
    acadId = await createAcademia(nome);
  }

  const { error: staffError } = await supabase.from('staff').upsert(
    { id: userId, nome, email, ativo: true, academia_id: acadId },
    { onConflict: 'id' },
  );
  if (staffError) throw new Error(`Erro ao vincular perfil staff: ${staffError.message}`);

  const planoToUse = plano || 'profissional';
  const { error: assinaturaError } = await supabase.from('assinaturas').upsert(
    { staff_id: userId, plano: planoToUse, status: 'trial' },
    { onConflict: 'staff_id' }
  );
  if (assinaturaError) throw new Error(`Erro ao criar assinatura: ${assinaturaError.message}`);

  return acadId;
}

function applySession(
  set: (s: Partial<AuthState>) => void,
  session: Session | null,
  authUser: AuthUser | null,
) {
  if (session && authUser) {
    set({
      session,
      user: authUser,
      isAuthenticated: true,
      isStaff: authUser.role === 'staff',
      isAluno: authUser.role === 'aluno',
      loading: false,
    });
  } else {
    set({
      session: null,
      user: null,
      isAuthenticated: false,
      isStaff: false,
      isAluno: false,
      loading: false,
    });
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isAuthenticated: false,
  isStaff: false,
  isAluno: false,
  loading: true,

  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Falha ao autenticar');

      const authUser = await buildUser(data.user);
      applySession(set, data.session!, authUser);
      return authUser.role;
    } catch (error: unknown) {
      throw new Error(formatAuthError(error));
    }
  },

  signUp: async ({ email, password, nome, plano }) => {
    const redirectTo = `${window.location.origin}/dashboard`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { nome, plano, role: 'staff' },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Falha ao criar conta');

      const needsEmailConfirmation = !data.session;

      if (data.session) {
        await ensureStaffRecord(data.user.id, nome, email, undefined, plano);
        const authUser = await buildUser(data.user);
        applySession(set, data.session, authUser);
      }

      return { needsEmailConfirmation };
    } catch (error: unknown) {
      throw new Error(formatAuthError(error));
    }
  },

  forgotPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) throw new Error(formatAuthError(error));
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const authUser = await buildUser(session.user);
      applySession(set, session, authUser);
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      isAuthenticated: false,
      isStaff: false,
      isAluno: false,
      loading: false,
    });
  },

  init: async () => {
    const applyFromSession = async (session: Session | null) => {
      if (session?.user) {
        try {
          const authUser = await buildUser(session.user);
          applySession(set, session, authUser);
        } catch (err) {
          console.error("Falha ao recuperar dados da sessão:", err);
          await supabase.auth.signOut();
          applySession(set, null, null);
        }
      } else {
        applySession(set, null, null);
      }
    };

    const { data: { session } } = await supabase.auth.getSession();
    await applyFromSession(session);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const meta = session.user.user_metadata;
        if (meta?.nome && meta?.role === 'staff') {
          try {
            await ensureStaffRecord(
              session.user.id, 
              meta.nome as string, 
              session.user.email ?? '', 
              undefined, 
              meta.plano as string
            );
          } catch (err) {
            console.error('Falha ao garantir registro staff/academia:', err);
            // registro staff pode ja existir
          }
        }
      }
      await applyFromSession(session);
    });

    return () => subscription.unsubscribe();
  },
}));
