-- ==============================================================================
-- 07_PERSONAL_TRAINERS.SQL
-- Adiciona suporte para Personal Trainers Externos (B2B2C)
-- ==============================================================================

-- 1. Adiciona a flag indicando se o aluno é um Personal Trainer
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false;

-- 2. Adiciona o vínculo de um aluno com o seu Personal Trainer
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS personal_id uuid REFERENCES public.alunos(id) ON DELETE SET NULL;

-- 3. Atualiza as Views Críticas para trazer a informação do Personal
CREATE OR REPLACE VIEW public.vw_checkins_hoje AS
SELECT 
  c.id,
  c.created_at,
  a.nome,
  a.foto_url,
  c.tipo_biometria AS tipo,
  c.acesso,
  c.motivo_negado,
  c.confianca,
  a.is_personal,
  (SELECT p.nome FROM public.alunos p WHERE p.id = a.personal_id) AS personal_nome
FROM public.checkins c
JOIN public.alunos a ON a.id = c.aluno_id
WHERE DATE(c.created_at) = CURRENT_DATE
ORDER BY c.created_at DESC;

-- Garante as permissões
GRANT SELECT ON public.vw_checkins_hoje TO anon, authenticated;
