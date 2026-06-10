-- ==============================================================================
-- 06_GRANT_PERMISSIONS.SQL
-- Restaura as permissões de acesso do PostgREST para as roles anon e authenticated
-- (Isto corrige o erro "permission denied for table")
-- ==============================================================================

GRANT ALL ON public.planos TO anon, authenticated;
GRANT ALL ON public.aluno_planos TO anon, authenticated;
GRANT ALL ON public.faturas TO anon, authenticated;
GRANT ALL ON public.modalidades TO anon, authenticated;
GRANT ALL ON public.turmas TO anon, authenticated;
GRANT ALL ON public.anamneses TO anon, authenticated;
GRANT ALL ON public.avaliacoes_fisicas TO anon, authenticated;
GRANT ALL ON public.evolucao_fisica TO anon, authenticated;
GRANT ALL ON public.caixa_diario TO anon, authenticated;
GRANT ALL ON public.contratos TO anon, authenticated;
GRANT ALL ON public.comissoes TO anon, authenticated;
GRANT ALL ON public.despesas TO anon, authenticated;
GRANT ALL ON public.produtos TO anon, authenticated;
GRANT ALL ON public.vendas TO anon, authenticated;
GRANT ALL ON public.exercicios TO anon, authenticated;
GRANT ALL ON public.treinos TO anon, authenticated;
GRANT ALL ON public.treino_exercicios TO anon, authenticated;
GRANT ALL ON public.aluno_treinos TO anon, authenticated;
GRANT ALL ON public.tickets TO anon, authenticated;
GRANT ALL ON public.aluno_segmentacao TO anon, authenticated;
GRANT ALL ON public.regras_acesso TO anon, authenticated;

-- Garantir que as sequências também possam ser acessadas se houver IDs do tipo serial
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
