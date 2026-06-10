import { describe, it, expect, afterEach, vi } from 'vitest';
import { formatAuthError } from './authErrors';

describe('formatAuthError', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ-test-key');
  });

  it('traduz limite de e-mail (429)', () => {
    const msg = formatAuthError({
      message: 'email rate limit exceeded',
      status: 429,
    });
    expect(msg).toMatch(/limite|Limite|rate/i);
  });
});
