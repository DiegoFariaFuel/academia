-- Combined project schema SQL for Supabase
-- Sources: 01_pacotes_servico.sql, 02_schema_completo_v2.sql, 03_schema_enterprise.sql,
--          04_schema_refinements.sql, 05_recreate_views.sql, 06_grant_permissions.sql,
--          07_personal_trainers.sql
-- Note: this file combines the existing project SQL scripts. Some base tables may
--       require definitions not present in these migration-style files.

CREATE TABLE pacotes_servico (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID REFERENCES academias(id),
  nome         TEXT NOT NULL,                    
  descricao    TEXT DEFAULT '',                   
  preco        NUMERIC(10,2) NOT NULL DEFAULT 0, 
  duracao_dias INTEGER NOT NULL DEFAULT 30,       
  servicos     TEXT[] DEFAULT '{}',               
  ativo        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pacotes_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY pacotes_staff ON pacotes_servico
  FOR ALL USING (academia_id IN (
    SELECT academia_id FROM staff WHERE id = auth.uid() AND ativo
  ));

ALTER TABLE alunos ADD COLUMN pacote_id UUID REFERENCES pacotes_servico(id);
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
-- ================================================================
-- FASE 3: ATUALIZAÇÃO ENTERPRISE (V3)
-- Execute este arquivo no SQL Editor do Supabase.
-- ================================================================

-- ================================================================
-- 1. ALTERAÇÕES EM TABELAS EXISTENTES
-- ================================================================

-- 1.1 Tabela staff
ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS cargo text;

-- 1.2 Tabela aluno_treinos
ALTER TABLE public.aluno_treinos
ADD COLUMN IF NOT EXISTS prescrito_por uuid REFERENCES public.staff(id);


-- ================================================================
-- 2. NOVAS TABELAS (TREINOS E EVOLUÇÃO FISICA)
-- ================================================================

-- 2.1 Anamneses
CREATE TABLE IF NOT EXISTS public.anamneses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    respostas jsonb DEFAULT '{}'::jsonb,
    observacoes text,
    criado_em timestamptz DEFAULT now()
);

-- 2.2 Evolução Física (Histórico de medidas das avaliações)
CREATE TABLE IF NOT EXISTS public.evolucao_fisica (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    avaliacao_id uuid REFERENCES public.avaliacoes_fisicas(id) ON DELETE SET NULL,
    peso numeric,
    gordura numeric,
    massa_muscular numeric,
    created_at timestamptz DEFAULT now()
);

-- 2.3 Execução de Treinos (Treino que o aluno realizou no dia)
CREATE TABLE IF NOT EXISTS public.treino_execucoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    treino_id uuid NOT NULL REFERENCES public.treinos(id) ON DELETE CASCADE,
    inicio timestamptz DEFAULT now(),
    fim timestamptz,
    calorias numeric
);

-- 2.4 Registro detalhado de Séries e Cargas (para o app)
CREATE TABLE IF NOT EXISTS public.exercicio_execucao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    treino_execucao_id uuid NOT NULL REFERENCES public.treino_execucoes(id) ON DELETE CASCADE,
    exercicio_id uuid NOT NULL REFERENCES public.exercicios(id) ON DELETE CASCADE,
    serie smallint NOT NULL,
    repeticoes smallint NOT NULL,
    carga numeric
);


-- ================================================================
-- 3. GESTÃO DE EQUIPE (HR)
-- ================================================================

-- 3.1 Personal Trainers
CREATE TABLE IF NOT EXISTS public.personal_trainers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL UNIQUE REFERENCES public.staff(id) ON DELETE CASCADE,
    cref text,
    especialidades text[] DEFAULT '{}'
);

-- 3.2 Comissões
CREATE TABLE IF NOT EXISTS public.comissoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    valor numeric NOT NULL,
    referencia text,
    data timestamptz DEFAULT now()
);


-- ================================================================
-- 4. FINANCEIRO ERP (Caixa e Despesas)
-- ================================================================

-- 4.1 Caixa Diário
CREATE TABLE IF NOT EXISTS public.caixa_diario (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
    data date NOT NULL DEFAULT CURRENT_DATE,
    abertura numeric DEFAULT 0,
    fechamento numeric,
    UNIQUE(academia_id, data)
);

-- 4.2 Despesas (Contas a pagar)
CREATE TABLE IF NOT EXISTS public.despesas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
    categoria text NOT NULL,
    valor numeric NOT NULL,
    vencimento date NOT NULL,
    pago boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);


-- ================================================================
-- 5. ESTOQUE E VENDAS DE BALCÃO (PDV)
-- ================================================================

-- 5.1 Produtos
CREATE TABLE IF NOT EXISTS public.produtos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
    nome text NOT NULL,
    preco numeric NOT NULL,
    estoque integer DEFAULT 0,
    ativo boolean DEFAULT true
);

-- 5.2 Vendas do PDV
CREATE TABLE IF NOT EXISTS public.vendas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
    aluno_id uuid REFERENCES public.alunos(id) ON DELETE SET NULL,
    valor_total numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 5.3 Movimentações do Estoque (Auditoria de entrada/saída)
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    tipo text CHECK (tipo IN ('entrada', 'saida', 'venda', 'ajuste')),
    quantidade integer NOT NULL,
    venda_id uuid REFERENCES public.vendas(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);


-- ================================================================
-- 6. JURÍDICO, LGPD E AUDITORIA
-- ================================================================

-- 6.1 Contratos
CREATE TABLE IF NOT EXISTS public.contratos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    url_documento text,
    assinado_em timestamptz,
    validade date
);

-- 6.2 Consentimentos (LGPD)
CREATE TABLE IF NOT EXISTS public.consentimentos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    termo text NOT NULL,
    aceito_em timestamptz DEFAULT now(),
    ip inet
);

-- 6.3 Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id uuid, -- pode ser staff ou auth.uid()
    tabela text NOT NULL,
    operacao text CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id uuid,
    dados_anteriores jsonb,
    dados_novos jsonb,
    created_at timestamptz DEFAULT now()
);


-- ================================================================
-- 7. OPERAÇÕES, SUPORTE E DASHBOARD
-- ================================================================

-- 7.1 Lista de Espera de Turmas
CREATE TABLE IF NOT EXISTS public.lista_espera_turmas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(aluno_id, turma_id)
);

-- 7.2 Sistema de Tickets (Suporte)
CREATE TABLE IF NOT EXISTS public.tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
    aluno_id uuid REFERENCES public.alunos(id) ON DELETE SET NULL,
    assunto text NOT NULL,
    status text DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'resolvido', 'fechado')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 7.3 Dispositivos para Push Notifications (Mobile App)
CREATE TABLE IF NOT EXISTS public.dispositivos_push (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    plataforma text CHECK (plataforma IN ('ios', 'android', 'web')),
    created_at timestamptz DEFAULT now(),
    ultimo_acesso timestamptz DEFAULT now()
);

-- 7.4 KPIs Mensais Executivos (SaaS)
CREATE TABLE IF NOT EXISTS public.kpis_mensais (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE,
    mes date NOT NULL,
    mrr numeric DEFAULT 0,
    churn numeric DEFAULT 0,
    inadimplencia numeric DEFAULT 0,
    ticket_medio numeric DEFAULT 0,
    UNIQUE(academia_id, mes)
);
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
-- === Inser��es adicionais para o Supabase schema ===
-- Defini��es de RPC e objetos que estavam em migra��es separadas

CREATE TABLE IF NOT EXISTS public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE OR REPLACE FUNCTION processar_webhook_stripe(p_event_id TEXT) RETURNS void AS $$
BEGIN
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION registrar_checkin(p_aluno_id uuid, p_tipo text, p_confianca numeric) RETURNS void AS $$
BEGIN
  RETURN;
END;
$$ LANGUAGE plpgsql;
