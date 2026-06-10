-- ================================================================
-- 0. REMOÇÃO DE VIEWS DEPENDENTES (Para evitar erro 0A000)
-- ================================================================
DROP VIEW IF EXISTS public.vw_dashboard;
DROP VIEW IF EXISTS public.vw_inadimplentes;
DROP VIEW IF EXISTS public.vw_checkins_hoje;

-- ================================================================
-- 1. TIPOS ENUM (substituindo USER-DEFINED)
-- ================================================================

DO $$ BEGIN
  CREATE TYPE status_aluno AS ENUM ('ativo', 'inativo', 'cancelado', 'trial', 'bloqueado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TYPE status_aluno ADD VALUE IF NOT EXISTS 'cancelado';
ALTER TYPE status_aluno ADD VALUE IF NOT EXISTS 'trial';
ALTER TYPE status_aluno ADD VALUE IF NOT EXISTS 'bloqueado';

DO $$ BEGIN
  CREATE TYPE status_pagamento AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado', 'estornado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TYPE status_pagamento ADD VALUE IF NOT EXISTS 'atrasado';
ALTER TYPE status_pagamento ADD VALUE IF NOT EXISTS 'cancelado';
ALTER TYPE status_pagamento ADD VALUE IF NOT EXISTS 'estornado';

DO $$ BEGIN
  CREATE TYPE tipo_biometria AS ENUM ('digital', 'facial', 'voz', 'palma', 'iris');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TYPE tipo_biometria ADD VALUE IF NOT EXISTS 'voz';
ALTER TYPE tipo_biometria ADD VALUE IF NOT EXISTS 'palma';
ALTER TYPE tipo_biometria ADD VALUE IF NOT EXISTS 'iris';

DO $$ BEGIN
  CREATE TYPE tipo_acesso AS ENUM ('catraca', 'aula', 'area_vip');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE canal_notificacao AS ENUM ('email', 'sms', 'push', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE status_turma AS ENUM ('aberta', 'lotada', 'cancelada', 'concluida');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dia_semana AS ENUM ('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE nivel_exercicio AS ENUM ('iniciante', 'intermediario', 'avancado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================================
-- 2. ALTERAÇÕES NAS TABELAS EXISTENTES
-- ================================================================

-- 2.1 alunos
ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS plano_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ALTER COLUMN status DROP DEFAULT,  -- remove default antes de alterar tipo
  ALTER COLUMN status TYPE status_aluno USING status::text::status_aluno,
  ALTER COLUMN status SET DEFAULT 'ativo'::status_aluno;

-- (Opcional) Podemos deletar a tabela pacotes_servico caso ainda não tenha uso:
-- DROP TABLE IF EXISTS public.pacotes_servico CASCADE;

-- 2.2 biometrias
ALTER TABLE public.biometrias
  ALTER COLUMN tipo TYPE tipo_biometria USING tipo::text::tipo_biometria;

-- 2.3 checkins
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='checkins' AND column_name='tipo') AND
     NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='checkins' AND column_name='tipo_biometria') THEN
      ALTER TABLE public.checkins RENAME COLUMN tipo TO tipo_biometria;
  END IF;
END $$;

ALTER TABLE public.checkins
  ALTER COLUMN tipo_biometria TYPE tipo_biometria USING tipo_biometria::text::tipo_biometria;

-- 2.4 pagamentos
ALTER TABLE public.pagamentos
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE status_pagamento USING status::text::status_pagamento,
  ALTER COLUMN status SET DEFAULT 'pendente'::status_pagamento;

-- 2.5 mensagens
ALTER TABLE public.mensagens
  ADD COLUMN IF NOT EXISTS modelo_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2.6 staff
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2.7 academias
ALTER TABLE public.academias
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cor_primaria char(7) DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS cor_secundaria char(7) DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS fuso_horario text DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS idioma text DEFAULT 'pt-BR';

-- ================================================================
-- 3. NOVAS TABELAS
-- ================================================================

-- ------------------------------
-- 3.1 Planos de assinatura (membership)
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text DEFAULT '',
  preco numeric NOT NULL,
  recorrencia interval NOT NULL DEFAULT '1 month'::interval,
  duracao_dias integer,  -- NULL = até cancelar
  max_aulas_semana smallint,  -- NULL = ilimitado
  beneficios text[] DEFAULT '{}',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.alunos
  ADD CONSTRAINT fk_alunos_plano FOREIGN KEY (plano_id) REFERENCES public.planos(id) DEFERRABLE INITIALLY DEFERRED;

-- ------------------------------
-- 3.2 Histórico de planos do aluno
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.aluno_planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  plano_id uuid NOT NULL REFERENCES public.planos(id),
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  status status_pagamento DEFAULT 'pendente',
  created_at timestamptz DEFAULT now()
);

-- ------------------------------
-- 3.3 Modalidades / Aulas
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.modalidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  duracao_minutos smallint NOT NULL,
  capacidade_maxima smallint NOT NULL DEFAULT 20,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ------------------------------
-- 3.4 Turmas (ocorrência de uma modalidade)
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.turmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
  modalidade_id uuid NOT NULL REFERENCES public.modalidades(id),
  instrutor_id uuid REFERENCES public.staff(id),
  dia_semana dia_semana NOT NULL,
  horario time NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  status status_turma DEFAULT 'aberta',
  created_at timestamptz DEFAULT now()
);

-- ------------------------------
-- 3.5 Agendamentos do aluno nas turmas
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id),
  turma_id uuid NOT NULL REFERENCES public.turmas(id),
  data_aula date NOT NULL,
  compareceu boolean DEFAULT false,
  cancelado boolean DEFAULT false,
  data_cancelamento timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (aluno_id, turma_id, data_aula)
);

-- ------------------------------
-- 3.6 Presenças em aulas (check-in específico)
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.presencas_aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  aluno_id uuid NOT NULL REFERENCES public.alunos(id),
  turma_id uuid NOT NULL REFERENCES public.turmas(id),
  data_hora timestamptz NOT NULL DEFAULT now(),
  confirmado_por uuid REFERENCES public.staff(id)
);

-- ------------------------------
-- 3.7 Avaliações físicas
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.avaliacoes_fisicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  peso numeric(5,2),
  altura numeric(3,2),
  percentual_gordura numeric(4,1),
  medidas jsonb DEFAULT '{}',
  observacoes text,
  fotos text[] DEFAULT '{}',
  criado_por uuid REFERENCES public.staff(id),
  created_at timestamptz DEFAULT now()
);

-- ------------------------------
-- 3.8 Objetivos do aluno
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.objetivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  tipo text CHECK (tipo IN ('ganho_massa', 'emagrecimento', 'condicionamento', 'flexibilidade', 'outro')),
  data_inicio date DEFAULT CURRENT_DATE,
  data_alvo date,
  atingido boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ------------------------------
-- 3.9 Treinos
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.treinos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  nivel nivel_exercicio DEFAULT 'iniciante',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- ------------------------------
-- 3.10 Exercícios
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.exercicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  grupo_muscular text,
  equipamento text,
  instrucoes text,
  video_url text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ------------------------------
-- 3.11 Associação treino x exercícios (séries, repetições)
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.treino_exercicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id uuid NOT NULL REFERENCES public.treinos(id) ON DELETE CASCADE,
  exercicio_id uuid NOT NULL REFERENCES public.exercicios(id),
  ordem smallint NOT NULL,
  series smallint NOT NULL DEFAULT 3,
  repeticoes smallint NOT NULL DEFAULT 10,
  carga_sugerida numeric(5,2),
  intervalo_segundos smallint DEFAULT 60,
  observacoes text,
  UNIQUE (treino_id, ordem)
);

-- ------------------------------
-- 3.12 Treino ativo do aluno
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.aluno_treinos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  treino_id uuid NOT NULL REFERENCES public.treinos(id),
  data_inicio date DEFAULT CURRENT_DATE,
  data_fim date,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ------------------------------
-- 3.13 Catracas e dispositivos de acesso
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.catracas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
  codigo text UNIQUE NOT NULL,
  localizacao text,
  ip inet,
  modelo text,
  ativo boolean DEFAULT true,
  ultimo_contato timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ------------------------------
-- 3.14 Regras de acesso por plano ou aluno
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.regras_acesso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
  plano_id uuid REFERENCES public.planos(id),
  aluno_id uuid REFERENCES public.alunos(id),
  dia_semana dia_semana,
  hora_inicio time,
  hora_fim time,
  permite_entrada boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CHECK (plano_id IS NOT NULL OR aluno_id IS NOT NULL)
);

-- ------------------------------
-- 3.15 Log bruto da catraca (antes do check-in)
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.logs_catraca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catraca_id uuid REFERENCES public.catracas(id) ON DELETE SET NULL,
  aluno_id uuid REFERENCES public.alunos(id),
  biometria_template_hash text,
  confianca numeric,
  acesso_permitido boolean,
  motivo_negado text,
  created_at timestamptz DEFAULT now()
);

-- ------------------------------
-- 3.16 Preferências de notificação do aluno
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.preferencias_notificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  canal canal_notificacao NOT NULL,
  tipo_evento text NOT NULL,  -- ex: 'vencimento', 'aula_agendada', 'promocao'
  ativo boolean DEFAULT true,
  UNIQUE (aluno_id, canal, tipo_evento)
);

-- ------------------------------
-- 3.17 Modelos de mensagem
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.modelos_mensagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  corpo text NOT NULL,
  canal canal_notificacao DEFAULT 'email',
  tipo_evento text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ------------------------------
-- 3.18 Faturas (geração recorrente)
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.faturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id),
  plano_id uuid REFERENCES public.planos(id),
  valor numeric NOT NULL,
  data_vencimento date NOT NULL,
  status status_pagamento DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ------------------------------
-- 3.19 Métricas diárias (materializada ou view)
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.metricas_diarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id uuid REFERENCES public.academias(id),
  data date NOT NULL DEFAULT CURRENT_DATE,
  total_checkins integer DEFAULT 0,
  novas_matriculas integer DEFAULT 0,
  cancelamentos integer DEFAULT 0,
  receita_total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (academia_id, data)
);

-- ------------------------------
-- 3.20 Retenção / Churn
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.retencao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id uuid REFERENCES public.academias(id),
  mes_ano date NOT NULL,  -- primeiro dia do mês
  total_ativos_inicio integer,
  novos integer,
  cancelados integer,
  taxa_churn numeric(5,2),
  created_at timestamptz DEFAULT now()
);

-- ================================================================
-- 4. PERFIS DE ACESSO E PERMISSÕES (RBAC)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  descricao text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,  -- ex: 'alunos.read', 'alunos.write'
  descricao text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_roles (
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id),
  PRIMARY KEY (staff_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.role_permissoes (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permissao_id uuid NOT NULL REFERENCES public.permissoes(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permissao_id)
);

-- ================================================================
-- 5. ÍNDICES (performance)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_alunos_status ON public.alunos(status);
CREATE INDEX IF NOT EXISTS idx_alunos_plano_id ON public.alunos(plano_id);
CREATE INDEX IF NOT EXISTS idx_alunos_deleted_at ON public.alunos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_checkins_created_at ON public.checkins(created_at);
CREATE INDEX IF NOT EXISTS idx_checkins_aluno_id_data ON public.checkins(aluno_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagamentos_vencimento ON public.pagamentos(vencimento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_faturas_vencimento ON public.faturas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_aula ON public.agendamentos(data_aula);
CREATE INDEX IF NOT EXISTS idx_presencas_aulas_data ON public.presencas_aulas(data_hora);
CREATE INDEX IF NOT EXISTS idx_logs_catraca_created_at ON public.logs_catraca(created_at);
CREATE INDEX IF NOT EXISTS idx_aluno_treinos_ativo ON public.aluno_treinos(ativo);

-- ================================================================
-- 6. INSERÇÕES PADRÃO (Roles e Permissões básicas)
-- ================================================================
INSERT INTO public.roles (nome, descricao) VALUES
  ('admin', 'Controle total da academia'),
  ('instrutor', 'Gerencia aulas e treinos'),
  ('recepcionista', 'Atendimento e check‑ins'),
  ('aluno', 'Acesso básico do aplicativo')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.permissoes (nome, descricao) VALUES
  ('alunos.read', 'Visualizar dados de alunos'),
  ('alunos.write', 'Criar/editar alunos'),
  ('alunos.delete', 'Remover alunos'),
  ('planos.read', 'Ver planos'),
  ('planos.write', 'Gerenciar planos'),
  ('aulas.read', 'Ver grade de aulas'),
  ('aulas.write', 'Criar/editar aulas'),
  ('checkins.read', 'Ver histórico de check‑ins'),
  ('checkins.write', 'Registrar check‑ins'),
  ('financeiro.read', 'Ver pagamentos e faturas'),
  ('financeiro.write', 'Alterar status de pagamentos'),
  ('relatorios.read', 'Acessar dashboards'),
  ('configuracoes.read', 'Ver configurações da academia'),
  ('configuracoes.write', 'Alterar configurações')
ON CONFLICT (nome) DO NOTHING;

-- Associação inicial (admin tem todas as permissões)
INSERT INTO public.role_permissoes (role_id, permissao_id)
SELECT r.id, p.id
FROM public.roles r, public.permissoes p
WHERE r.nome = 'admin'
ON CONFLICT DO NOTHING;

-- ================================================================
-- 8. RECRIAR VIEWS
-- ================================================================
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
  COALESCE(p.nome, 'Sem Plano') AS plano,
  f.data_vencimento::text,
  (CURRENT_DATE - f.data_vencimento)::text AS dias_atraso,
  a.stripe_customer_id
FROM public.alunos a
JOIN public.faturas f ON f.aluno_id = a.id
LEFT JOIN public.planos p ON a.plano_id = p.id
WHERE f.status = 'atrasado' OR (f.status = 'pendente' AND f.data_vencimento < CURRENT_DATE);

CREATE OR REPLACE VIEW public.vw_checkins_hoje AS
SELECT 
  c.id,
  c.created_at::text,
  a.nome,
  a.foto_url,
  c.tipo_biometria AS tipo,
  c.acesso,
  c.motivo_negado,
  c.confianca
FROM public.checkins c
JOIN public.alunos a ON a.id = c.aluno_id
WHERE date(c.created_at) = CURRENT_DATE;
