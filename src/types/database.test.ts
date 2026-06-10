import { describe, it, expect } from 'vitest';
import type { Aluno, StatusAluno, StatusPagamento } from './database';

describe('tipos do banco', () => {
  it('Aluno aceita status válidos', () => {
    const statuses: StatusAluno[] = ['ativo', 'inativo', 'suspenso', 'cancelado'];
    const aluno: Aluno = {
      id: '1',
      nome: 'Test',
      email: 't@test.com',
      telefone: null,
      cpf: null,
      data_nascimento: null,
      foto_url: null,
      status: statuses[0],
      plano: 'mensal',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      stripe_price_id: null,
      acesso_liberado: true,
      data_matricula: new Date().toISOString(),
      data_vencimento: null,
      ultimo_checkin: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(aluno.status).toBe('ativo');
  });

  it('StatusPagamento inclui chargeback', () => {
    const s: StatusPagamento = 'chargeback';
    expect(s).toBe('chargeback');
  });
});
