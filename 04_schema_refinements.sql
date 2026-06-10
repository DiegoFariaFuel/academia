-- ==============================================================================
-- 04_SCHEMA_REFINEMENTS.SQL
-- Refinamentos arquiteturais para SaaS Enterprise
-- Aplica normalização avançada, constraints UNIQUE, triggers e índices
-- ==============================================================================

-- 0. DROPS NECESSÁRIOS PARA COLUNAS DEPENDENTES
DROP VIEW IF EXISTS public.vw_inadimplentes;
DROP VIEW IF EXISTS public.vw_dashboard;
DROP VIEW IF EXISTS public.vw_checkins_hoje;

-- 1. ELIMINAÇÃO DE REDUNDÂNCIAS
-- Remover colunas obsoletas da tabela alunos
ALTER TABLE public.alunos
  DROP COLUMN IF EXISTS plano,
  DROP COLUMN IF EXISTS plano_id,
  DROP COLUMN IF EXISTS pacote_id;

-- 2. NORMALIZAÇÃO FINANCEIRA (FATURAS -> PAGAMENTOS)
-- Garantir que pagamentos referenciem faturas
ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS fatura_id uuid REFERENCES public.faturas(id) ON DELETE CASCADE;

-- 3 e 4. INTEGRIDADE COM UNIQUE CONSTRAINTS E CHECKS
-- Agendamentos: impedir mesma aula reservada 2x pelo mesmo aluno
ALTER TABLE public.agendamentos
  DROP CONSTRAINT IF EXISTS uq_agendamento_aluno_turma_data,
  ADD CONSTRAINT uq_agendamento_aluno_turma_data UNIQUE (aluno_id, turma_id, data_aula);

-- Aluno Treinos: um aluno não pode ter o mesmo treino ativo 2x
-- (Como não é possível fazer UNIQUE filtrado direto com ALTER TABLE padrão no PostgreSQL de forma simples sem CREATE UNIQUE INDEX, fazemos via índice)
DROP INDEX IF EXISTS idx_uq_aluno_treino_ativo;
CREATE UNIQUE INDEX idx_uq_aluno_treino_ativo ON public.aluno_treinos(aluno_id, treino_id) WHERE ativo = true;

-- Presenças: impedir duas presenças na mesma aula/agendamento
ALTER TABLE public.presencas_aulas
  ADD COLUMN IF NOT EXISTS agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS uq_presenca_agendamento,
  ADD CONSTRAINT uq_presenca_agendamento UNIQUE (agendamento_id);

-- 5 e 6. TIPAGEM SEGURA E VALIDAÇÕES (CPF e BIOMETRIA)
-- Converter template de biometria para bytea
ALTER TABLE public.biometrias
  ALTER COLUMN template TYPE bytea USING template::bytea;

-- CPF: Varchar 11, Unique e validação regex (só números)
-- Limpar CPFs existentes: remover tudo que não for número
UPDATE public.alunos SET cpf = regexp_replace(cpf, '\D', '', 'g');
-- Anular CPFs inválidos que não tenham exatamente 11 dígitos para não quebrar a constraint
UPDATE public.alunos SET cpf = NULL WHERE length(cpf) != 11;

ALTER TABLE public.alunos
  ALTER COLUMN cpf TYPE varchar(11),
  DROP CONSTRAINT IF EXISTS alunos_cpf_key,
  ADD CONSTRAINT alunos_cpf_key UNIQUE (cpf),
  DROP CONSTRAINT IF EXISTS chk_cpf_format,
  ADD CONSTRAINT chk_cpf_format CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$');

-- 7. ÍNDICES ESTRATÉGICOS DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_alunos_auth_user_id ON public.alunos(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_alunos_academia_id ON public.alunos(academia_id);
CREATE INDEX IF NOT EXISTS idx_checkins_aluno_id ON public.checkins(aluno_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_aluno_id ON public.pagamentos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status_fatura ON public.pagamentos(status, fatura_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_aluno_id ON public.mensagens(aluno_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_aluno_id ON public.agendamentos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_turma_id ON public.agendamentos(turma_id);
CREATE INDEX IF NOT EXISTS idx_treino_execucoes_aluno_id ON public.treino_execucoes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_logs_catraca_aluno_id ON public.logs_catraca(aluno_id);

-- 8. PADRONIZAÇÃO DE SOFT DELETE
ALTER TABLE public.modalidades ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.pacotes_servico ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 9. CONTROLE DE CAPACIDADE DE TURMAS (TRIGGER)
CREATE OR REPLACE FUNCTION check_turma_capacidade()
RETURNS TRIGGER AS $$
DECLARE
  v_capacidade_maxima integer;
  v_total_agendados integer;
BEGIN
  -- Buscar capacidade na modalidade vinculada à turma
  SELECT m.capacidade_maxima INTO v_capacidade_maxima
  FROM public.turmas t
  JOIN public.modalidades m ON t.modalidade_id = m.id
  WHERE t.id = NEW.turma_id;

  -- Contar agendamentos existentes para a mesma turma e data
  SELECT count(*) INTO v_total_agendados
  FROM public.agendamentos
  WHERE turma_id = NEW.turma_id
    AND data_aula = NEW.data_aula
    AND status IN ('confirmado', 'presente');

  IF v_total_agendados >= v_capacidade_maxima THEN
    RAISE EXCEPTION 'A turma atingiu a capacidade máxima de % alunos.', v_capacidade_maxima;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_turma_capacidade ON public.agendamentos;
CREATE TRIGGER trigger_check_turma_capacidade
  BEFORE INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION check_turma_capacidade();

-- 10. AUTOMAÇÃO DE TIMESTAMPS (UPDATED_AT)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas cruciais
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE' 
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tables.table_name AND column_name='updated_at')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS handle_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
  END LOOP;
END $$;

-- 11. TABELA DE ANALYTICS (ALUNO SEGMENTACAO)
CREATE TABLE IF NOT EXISTS public.aluno_segmentacao (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE UNIQUE,
  academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
  is_ativo boolean NOT NULL DEFAULT false,
  is_inadimplente boolean NOT NULL DEFAULT false,
  is_risco_churn boolean NOT NULL DEFAULT false,
  is_vip boolean NOT NULL DEFAULT false,
  ltv_estimado numeric(10,2) DEFAULT 0,
  ultima_interacao timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT aluno_segmentacao_pkey PRIMARY KEY (id)
);

CREATE TRIGGER handle_updated_at_aluno_segmentacao
  BEFORE UPDATE ON public.aluno_segmentacao
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_segmentacao_academia ON public.aluno_segmentacao(academia_id);

-- 12. RECRIAÇÃO DAS VIEWS
CREATE OR REPLACE VIEW public.vw_dashboard AS
SELECT
  (SELECT count(*) FROM public.alunos WHERE status NOT IN ('cancelado', 'inativo')) AS total_alunos,
  (SELECT count(*) FROM public.alunos WHERE status = 'ativo') AS alunos_ativos,
  (SELECT count(*) FROM public.alunos WHERE status = 'bloqueado') AS alunos_suspensos,
  (SELECT count(*) FROM public.alunos WHERE acesso_liberado = false) AS acesso_bloqueado,
  (SELECT count(*) FROM public.checkins WHERE date(created_at) = CURRENT_DATE) AS checkins_hoje;

CREATE OR REPLACE VIEW public.vw_inadimplentes AS
SELECT 
  a.id,
  a.nome,
  a.email,
  a.telefone,
  COALESCE((SELECT p.nome FROM public.aluno_planos ap JOIN public.planos p ON p.id = ap.plano_id WHERE ap.aluno_id = a.id AND ap.status != 'cancelado' ORDER BY ap.created_at DESC LIMIT 1), 'Sem Plano') AS plano,
  f.data_vencimento::text,
  (CURRENT_DATE - f.data_vencimento)::text AS dias_atraso,
  a.stripe_customer_id
FROM public.alunos a
JOIN public.faturas f ON f.aluno_id = a.id
WHERE f.status = 'atrasado' OR (f.status = 'pendente' AND f.data_vencimento < CURRENT_DATE);
