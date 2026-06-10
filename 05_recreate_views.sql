-- ==============================================================================
-- 05_RECREATE_VIEWS.SQL
-- Restaura as Views Críticas da Dashboard após a migração estrutural
-- ==============================================================================

-- 1. VIEW: Dashboard Stats (Estatísticas Gerais)
CREATE OR REPLACE VIEW public.vw_dashboard AS
SELECT
  (SELECT COUNT(*) FROM public.alunos) AS total_alunos,
  (SELECT COUNT(*) FROM public.alunos WHERE status = 'ativo') AS alunos_ativos,
  (SELECT COUNT(*) FROM public.alunos WHERE status = 'inativo' OR status = 'suspenso') AS alunos_suspensos,
  (SELECT COUNT(*) FROM public.alunos WHERE acesso_liberado = false) AS acesso_bloqueado,
  (SELECT COUNT(*) FROM public.checkins WHERE DATE(created_at) = CURRENT_DATE) AS checkins_hoje;

-- 2. VIEW: Checkins de Hoje (Log de Acesso em Tempo Real)
CREATE OR REPLACE VIEW public.vw_checkins_hoje AS
SELECT 
  c.id,
  c.created_at,
  a.nome,
  a.foto_url,
  c.tipo_biometria AS tipo,
  c.acesso,
  c.motivo_negado,
  c.confianca
FROM public.checkins c
JOIN public.alunos a ON a.id = c.aluno_id
WHERE DATE(c.created_at) = CURRENT_DATE
ORDER BY c.created_at DESC;

-- 3. VIEW: Inadimplentes (Faturas Vencidas Cruzadas com Aluno e Plano Ativo)
CREATE OR REPLACE VIEW public.vw_inadimplentes AS
SELECT 
  a.id,
  a.nome,
  a.email,
  a.telefone,
  COALESCE(
    (SELECT p.nome 
     FROM public.aluno_planos ap 
     JOIN public.planos p ON p.id = ap.plano_id 
     WHERE ap.aluno_id = a.id
     ORDER BY ap.data_inicio DESC
     LIMIT 1), 
    'Sem Plano'
  ) AS plano,
  f.data_vencimento::text AS data_vencimento,
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - f.data_vencimento))::text AS dias_atraso,
  a.stripe_customer_id
FROM public.alunos a
JOIN public.faturas f ON f.aluno_id = a.id
WHERE f.status = 'atrasado' 
  OR (f.status = 'pendente' AND f.data_vencimento < CURRENT_DATE);

-- CONCEDE PERMISSÕES ÀS VIEWS
GRANT SELECT ON public.vw_dashboard TO authenticated;
GRANT SELECT ON public.vw_checkins_hoje TO authenticated;
GRANT SELECT ON public.vw_inadimplentes TO authenticated;
GRANT SELECT ON public.vw_dashboard TO anon;
GRANT SELECT ON public.vw_checkins_hoje TO anon;
GRANT SELECT ON public.vw_inadimplentes TO anon;
