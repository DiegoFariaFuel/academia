export type StatusAluno = 'ativo' | 'inativo' | 'suspenso' | 'cancelado' | 'trial' | 'bloqueado';
export type TipoBiometria = 'digital' | 'facial' | 'voz' | 'palma' | 'iris';
export type StatusPagamento = 'pendente' | 'pago' | 'atrasado' | 'cancelado' | 'estornado';
export type CanalMensagem = 'email' | 'sms' | 'push' | 'whatsapp';
export type StatusMensagem = 'enviada' | 'entregue' | 'lida' | 'falhou';
export type TipoAcesso = 'catraca' | 'aula' | 'area_vip';
export type StatusTurma = 'aberta' | 'lotada' | 'cancelada' | 'concluida';
export type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
export type NivelExercicio = 'iniciante' | 'intermediario' | 'avancado';
export type TipoStripeEvent =
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'customer.subscription.deleted'
  | 'customer.subscription.updated'
  | 'invoice.upcoming'
  | 'charge.dispute.created'
  | 'charge.refunded'
  | 'checkout.session.completed';

export interface Aluno {
  id: string;
  academia_id: string | null;
  auth_user_id: string | null;
  plano_id?: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  cpf?: string | null;
  data_nascimento?: string | null;
  foto_url?: string | null;
  status: StatusAluno;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  acesso_liberado: boolean;
  data_matricula: string;
  data_vencimento: string | null;
  ultimo_checkin: string | null;
  created_at: string;
  updated_at: string;
  is_personal: boolean;
  personal_id: string | null;
}

export interface Checkin {
  id: string;
  aluno_id: string;
  tipo: TipoBiometria;
  confianca: number | null;
  dispositivo: string | null;
  acesso: boolean;
  motivo_negado: string | null;
  ip: string | null;
  created_at: string;
  aluno?: Pick<Aluno, 'nome' | 'foto_url'> | null;
}

export interface Pagamento {
  id: string;
  aluno_id: string;
  stripe_invoice_id: string | null;
  stripe_payment_intent: string | null;
  stripe_charge_id: string | null;
  valor: number;
  moeda: string;
  status: StatusPagamento;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  data_pagamento: string | null;
  vencimento: string | null;
  tentativas: number;
  created_at: string;
  updated_at: string;
  aluno?: Pick<Aluno, 'nome' | 'email'> | null;
}

export interface Mensagem {
  id: string;
  aluno_id: string;
  canal: CanalMensagem;
  assunto: string | null;
  corpo: string;
  status: StatusMensagem;
  provider_id: string | null;
  erro: string | null;
  agendado_para: string | null;
  enviado_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  academia_id?: string | null;
  nome: string;
  email: string;
  ativo: boolean;
  created_at: string;
}

export interface Assinatura {
  id: string;
  staff_id: string;
  plano: string;
  status: string;
  trial_ate: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_alunos: number;
  alunos_ativos: number;
  alunos_suspensos: number;
  acesso_bloqueado: number;
  checkins_hoje: number;
}

export interface CheckinHoje {
  id: string;
  created_at: string;
  nome: string;
  foto_url: string | null;
  tipo: TipoBiometria;
  acesso: boolean;
  motivo_negado: string | null;
  confianca: number | null;
}

export interface Inadimplente {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  plano: string;
  data_vencimento: string;
  dias_atraso: string;
  stripe_customer_id: string | null;
}

export interface Plano {
  id: string;
  academia_id: string | null;
  nome: string;
  descricao: string | null;
  preco: number;
  recorrencia: string;
  duracao_dias: number | null;
  max_aulas_semana: number | null;
  beneficios: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Fatura {
  id: string;
  aluno_id: string;
  plano_id: string | null;
  valor: number;
  data_vencimento: string;
  status: StatusPagamento;
  created_at: string;
  updated_at: string;
}

export interface Anamnese {
  id: string;
  aluno_id: string;
  respostas: Record<string, any>;
  observacoes: string | null;
  criado_em: string;
}

export interface AvaliacaoFisica {
  id: string;
  aluno_id: string;
  data_avaliacao: string;
  peso: number | null;
  altura: number | null;
  percentual_gordura: number | null;
  medidas: Record<string, any>;
  observacoes: string | null;
  fotos: string[];
  criado_por: string | null;
  created_at: string;
}

export interface EvolucaoFisica {
  id: string;
  aluno_id: string;
  avaliacao_id: string | null;
  peso: number | null;
  gordura: number | null;
  massa_muscular: number | null;
  created_at: string;
}

export interface CaixaDiario {
  id: string;
  academia_id: string | null;
  data: string;
  abertura: number;
  fechamento: number | null;
}

export interface Despesa {
  id: string;
  academia_id: string | null;
  categoria: string;
  valor: number;
  vencimento: string;
  pago: boolean;
  created_at: string;
}

export interface Produto {
  id: string;
  academia_id: string | null;
  nome: string;
  preco: number;
  estoque: number;
  ativo: boolean;
}

export interface Venda {
  id: string;
  academia_id: string | null;
  aluno_id: string | null;
  valor_total: number;
  created_at: string;
}

export interface Exercicio {
  id: string;
  academia_id: string | null;
  nome: string;
  grupo_muscular: string;
  video_url: string | null;
  instrucoes: string | null;
  created_at: string;
}

export interface Treino {
  id: string;
  academia_id: string | null;
  nome: string;
  descricao: string | null;
  nivel: NivelExercicio;
  created_at: string;
}

export interface TreinoExercicio {
  id: string;
  treino_id: string;
  exercicio_id: string;
  series: number;
  repeticoes: string;
  descanso_segundos: number | null;
  ordem: number;
}

export interface AlunoTreino {
  id: string;
  aluno_id: string;
  treino_id: string;
  prescrito_por: string | null;
  data_inicio: string;
  data_fim: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Modalidade {
  id: string;
  academia_id: string | null;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  capacidade_maxima: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Turma {
  id: string;
  academia_id: string | null;
  modalidade_id: string;
  instrutor_id: string | null;
  dia_semana: DiaSemana;
  horario: string;
  data_inicio: string;
  data_fim: string | null;
  status: StatusTurma;
  created_at: string;
}

export interface Contrato {
  id: string;
  academia_id: string | null;
  aluno_id: string;
  tipo: string;
  documento_url: string | null;
  status: string;
  data_inicio: string | null;
  data_fim: string | null;
  assinado_em: string | null;
  ip_assinatura: string | null;
  created_at: string;
}

export interface Comissao {
  id: string;
  academia_id: string | null;
  staff_id: string;
  valor: number;
  tipo: string;
  origem_id: string | null;
  status: string;
  data_pagamento: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  academia_id: string | null;
  aluno_id: string;
  assunto: string;
  descricao: string;
  status: string; // 'aberto', 'andamento', 'resolvido'
  prioridade: string;
  resolvido_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlunoSegmentacao {
  id: string;
  academia_id: string | null;
  aluno_id: string;
  is_ativo: boolean;
  is_inadimplente: boolean;
  is_risco_churn: boolean;
  is_vip: boolean;
  ltv_estimado: number;
  ultima_interacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      alunos: { Row: Aluno; Insert: Partial<Aluno>; Update: Partial<Aluno> };
      planos: { Row: Plano; Insert: Partial<Plano>; Update: Partial<Plano> };
      faturas: { Row: Fatura; Insert: Partial<Fatura>; Update: Partial<Fatura> };
      modalidades: { Row: Modalidade; Insert: Partial<Modalidade>; Update: Partial<Modalidade> };
      turmas: { Row: Turma; Insert: Partial<Turma>; Update: Partial<Turma> };
      anamneses: { Row: Anamnese; Insert: Partial<Anamnese>; Update: Partial<Anamnese> };
      avaliacoes_fisicas: { Row: AvaliacaoFisica; Insert: Partial<AvaliacaoFisica>; Update: Partial<AvaliacaoFisica> };
      evolucao_fisica: { Row: EvolucaoFisica; Insert: Partial<EvolucaoFisica>; Update: Partial<EvolucaoFisica> };
      caixa_diario: { Row: CaixaDiario; Insert: Partial<CaixaDiario>; Update: Partial<CaixaDiario> };
      contratos: { Row: Contrato; Insert: Partial<Contrato>; Update: Partial<Contrato> };
      comissoes: { Row: Comissao; Insert: Partial<Comissao>; Update: Partial<Comissao> };
      despesas: { Row: Despesa; Insert: Partial<Despesa>; Update: Partial<Despesa> };
      produtos: { Row: Produto; Insert: Partial<Produto>; Update: Partial<Produto> };
      vendas: { Row: Venda; Insert: Partial<Venda>; Update: Partial<Venda> };
      exercicios: { Row: Exercicio; Insert: Partial<Exercicio>; Update: Partial<Exercicio> };
      treinos: { Row: Treino; Insert: Partial<Treino>; Update: Partial<Treino> };
      treino_exercicios: { Row: TreinoExercicio; Insert: Partial<TreinoExercicio>; Update: Partial<TreinoExercicio> };
      aluno_treinos: { Row: AlunoTreino; Insert: Partial<AlunoTreino>; Update: Partial<AlunoTreino> };
      checkins: { Row: Checkin; Insert: Partial<Checkin>; Update: Partial<Checkin> };
      tickets: { Row: Ticket; Insert: Partial<Ticket>; Update: Partial<Ticket> };
      aluno_segmentacao: { Row: AlunoSegmentacao; Insert: Partial<AlunoSegmentacao>; Update: Partial<AlunoSegmentacao> };
      regras_acesso: { Row: any; Insert: any; Update: any };
      pagamentos: { Row: Pagamento; Insert: Partial<Pagamento>; Update: Partial<Pagamento> };
      mensagens: { Row: Mensagem; Insert: Partial<Mensagem>; Update: Partial<Mensagem> };
      staff: { Row: Staff; Insert: Partial<Staff>; Update: Partial<Staff> };
      biometrias: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      stripe_events: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
    Views: {
      vw_dashboard: { Row: DashboardStats };
      vw_checkins_hoje: { Row: CheckinHoje };
      vw_inadimplentes: { Row: Inadimplente };
    };
  };
}
