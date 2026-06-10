import { describe, it, expect, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const script = resolve(__dirname, 'verify-env.mjs');

function runVerify(env: Record<string, string>) {
  const envVars = { ...process.env, ...env };
  const cwd = mkdtempSync(resolve(tmpdir(), 'verify-env-test-'));

  try {
    execSync(`node "${script}"`, { env: envVars, cwd, stdio: 'pipe' });
    return { ok: true as const };
  } catch (e) {
    const err = e as { stderr?: Buffer; status?: number };
    return { ok: false as const, stderr: err.stderr?.toString() ?? '' };
  }
}

describe('verify-env.mjs', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('passa com variáveis válidas', () => {
    const result = runVerify({
      VITE_SUPABASE_URL: 'https://proj.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiJ9.valid',
    });
    expect(result.ok).toBe(true);
  });

  it('falha sem VITE_SUPABASE_URL', () => {
    const result = runVerify({
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: 'key',
    });
    expect(result.ok).toBe(false);
    expect(result.stderr).toMatch(/VITE_SUPABASE_URL/);
  });

  it('falha com placeholder', () => {
    const result = runVerify({
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'real-key',
    });
    expect(result.ok).toBe(false);
    expect(result.stderr).toMatch(/placeholder/i);
  });
});
