-- Production grant scripts for Supabase
GRANT SELECT ON public.alunos TO authenticated;
GRANT SELECT ON public.checkins TO authenticated;
GRANT SELECT ON public.biometrias TO authenticated;
GRANT SELECT ON public.pagamentos TO authenticated;
GRANT SELECT ON public.mensagens TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
