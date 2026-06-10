import { supabase } from './supabase';

export interface HealthCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

export async function runHealthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];

  const { data: session } = await supabase.auth.getSession();
  checks.push({
    id: 'auth',
    label: 'Autenticação',
    ok: !!session.session,
    detail: session.session ? 'Sessão ativa' : 'Não logado',
  });

  const { data: staff, error: staffErr } = await supabase
    .from('staff')
    .select('id, ativo')
    .eq('id', session.session?.user.id ?? '')
    .maybeSingle();

  checks.push({
    id: 'staff',
    label: 'Perfil staff',
    ok: !staffErr && !!staff?.ativo,
    detail: staffErr?.message ?? (staff?.ativo ? 'Staff ativo' : 'Não está na tabela staff'),
  });

  const { data: dash, error: dashErr } = await supabase.from('vw_dashboard').select('*').single();
  checks.push({
    id: 'dashboard',
    label: 'View vw_dashboard',
    ok: !dashErr && dash != null,
    detail: dashErr?.message ?? `${dash?.total_alunos ?? 0} alunos no sistema`,
  });

  const { data: alunos, error: alunosErr } = await supabase.from('alunos').select('id').limit(1);
  checks.push({
    id: 'alunos',
    label: 'Tabela alunos (RLS)',
    ok: !alunosErr,
    detail: alunosErr?.message ?? `Acesso OK (${alunos?.length ?? 0} registro teste)`,
  });

  const { data: rpcData, error: rpcErr } = await supabase.rpc('registrar_checkin', {
    p_aluno_id: '00000000-0000-0000-0000-000000000000',
    p_tipo: 'facial',
    p_confianca: 0,
  });
  checks.push({
    id: 'rpc',
    label: 'RPC registrar_checkin',
    ok: !rpcErr,
    detail: rpcErr?.message ?? (rpcData ? 'Função acessível' : 'Sem resposta'),
  });

  return checks;
}

export function getEdgeFunctionUrls(projectUrl: string) {
  const base = projectUrl.replace(/\/$/, '');
  return {
    stripeWebhook: `${base}/functions/v1/stripe-webhook`,
    registrarCheckin: `${base}/functions/v1/registrar-checkin`,
  };
}
