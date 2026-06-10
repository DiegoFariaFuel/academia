import { describe, expect, it } from 'vitest';
import { parseStudentsCsv, toInsertPayload } from './importStudents';

describe('parseStudentsCsv', () => {
  it('parseia CSV com cabeçalho', () => {
    const csv = `nome,email,telefone,cpf,plano,status
João,joao@test.com,11999,123,mensal,ativo
Maria,maria@test.com,,,trimestral,suspenso`;

    const { rows, errors } = parseStudentsCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0].email).toBe('joao@test.com');
    expect(rows[1].status).toBe('suspenso');
  });

  it('parseia CSV sem cabeçalho', () => {
    const csv = 'Ana,ana@test.com';
    const { rows } = parseStudentsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].plano).toBe('mensal');
  });

  it('ignora linhas inválidas', () => {
    const csv = `nome,email
invalido
Pedro,pedro@test.com`;

    const { rows, errors } = parseStudentsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('retorna vazio para arquivo vazio', () => {
    const { rows, errors } = parseStudentsCsv('  ');
    expect(rows).toHaveLength(0);
    expect(errors).toContain('empty');
  });
});

describe('toInsertPayload', () => {
  it('inclui data_vencimento', () => {
    const payload = toInsertPayload([
      {
        nome: 'A',
        email: 'a@t.com',
        telefone: null,
        cpf: null,
        plano: 'mensal',
        status: 'ativo',
      },
    ]);
    expect(payload[0].data_vencimento).toBeTruthy();
  });
});
