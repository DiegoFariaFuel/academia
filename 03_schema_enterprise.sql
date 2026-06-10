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
