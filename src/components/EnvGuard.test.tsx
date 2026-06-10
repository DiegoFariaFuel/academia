import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EnvGuard from './EnvGuard';

describe('EnvGuard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ-test-key');
  });

  it('renderiza children com env válido', () => {
    render(
      <EnvGuard>
        <span>Painel OK</span>
      </EnvGuard>,
    );
    expect(screen.getByText('Painel OK')).toBeInTheDocument();
  });

  it('mostra erro quando env ausente', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    render(
      <EnvGuard>
        <span>Hidden</span>
      </EnvGuard>,
    );
    expect(screen.getByText('Configuração necessária')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('rejeita placeholder', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://placeholder.supabase.co');
    render(<EnvGuard><span>X</span></EnvGuard>);
    expect(screen.getByText(/exemplo|placeholder/i)).toBeInTheDocument();
  });

  it('rejeita Supabase local sem serviço', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
    render(<EnvGuard><span>X</span></EnvGuard>);
    expect(screen.getByText(/127\.0\.0\.1:54321|local/i)).toBeInTheDocument();
  });
});
