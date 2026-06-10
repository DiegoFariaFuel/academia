import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');

function readSql(path: string) {
  const full = resolve(root, path);
  expect(existsSync(full), `${path} deve existir`).toBe(true);
  return readFileSync(full, 'utf-8');
}

describe('Schema SQL', () => {
  const schema = readSql('supabase/schema.sql');

  const tables = ['alunos', 'checkins', 'biometrias', 'pagamentos', 'mensagens', 'stripe_events'];

  tables.forEach((table) => {
    it(`contém tabela ${table}`, () => {
      expect(schema).toMatch(new RegExp(`CREATE TABLE (public\\.)?${table}`, 'i'));
    });
  });

  it('contém enums principais', () => {
    expect(schema).toContain('status_aluno');
    expect(schema).toContain('tipo_biometria');
    expect(schema).toContain('status_pagamento');
  });

  it('contém views do dashboard', () => {
    expect(schema).toContain('vw_dashboard');
    expect(schema).toContain('vw_inadimplentes');
    expect(schema).toContain('vw_checkins_hoje');
  });

  it('contém RPCs de produção', () => {
    expect(schema).toContain('registrar_checkin');
    expect(schema).toContain('processar_webhook_stripe');
  });
});

describe('Webhook plataforma e reembolsos', () => {
  it('migração 007 estende eventos e RPC', () => {
    const sql = readSql('supabase/migrations/007_platform_stripe_refunds.sql');
    expect(sql).toContain('charge.refunded');
    expect(sql).toContain('assinaturas');
    expect(sql).toContain('reembolsado');
  });

  it('migração 008 compatibiliza schema do usuário com o app', () => {
    const sql = readSql('supabase/migrations/008_solviz_app_compat.sql');
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS (public\.)?assinaturas/i);
    expect(sql).toContain('processar_webhook_stripe(p_event_id TEXT)');
  });
});

describe('Migrações de produção', () => {
  it('production-setup cria staff e is_staff', () => {
    const sql = readSql('supabase/production-setup.sql');
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS (public\.)?staff/i);
    expect(sql).toContain('is_staff');
  });

  it('002_staff_rls redefine políticas', () => {
    const sql = readSql('supabase/migrations/002_staff_rls.sql');
    expect(sql).toContain('DROP POLICY IF EXISTS');
    expect(sql).toContain('public.is_staff()');
  });
});
