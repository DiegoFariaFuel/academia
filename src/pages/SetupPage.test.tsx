import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetupPage from './SetupPage';

vi.mock('../lib/health', () => ({
  runHealthChecks: vi.fn(),
  getEdgeFunctionUrls: vi.fn(() => ({
    stripeWebhook: 'https://test.supabase.co/functions/v1/stripe-webhook',
    registrarCheckin: 'https://test.supabase.co/functions/v1/registrar-checkin',
  })),
}));

vi.mock('../lib/env', () => ({
  env: { supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'key', isDev: true },
}));

import { runHealthChecks } from '../lib/health';

describe('SetupPage', () => {
  beforeEach(() => {
    vi.mocked(runHealthChecks).mockResolvedValue([
      { id: 'auth', label: 'Autenticação', ok: true, detail: 'OK' },
      { id: 'staff', label: 'Staff', ok: true, detail: 'OK' },
    ]);
  });

  it('exibe status e URLs das edge functions', async () => {
    render(<SetupPage />);
    await waitFor(() => {
      expect(screen.getByText('Status de produção')).toBeInTheDocument();
    });
    expect(screen.getByText(/stripe-webhook/)).toBeInTheDocument();
    expect(screen.getByText(/registrar-checkin/)).toBeInTheDocument();
  });

  it('botão verificar chama runHealthChecks novamente', async () => {
    const user = userEvent.setup();
    render(<SetupPage />);
    await waitFor(() => expect(runHealthChecks).toHaveBeenCalled());
    const callsBefore = vi.mocked(runHealthChecks).mock.calls.length;
    await user.click(screen.getByRole('button', { name: /verificar novamente/i }));
    await waitFor(() =>
      expect(vi.mocked(runHealthChecks).mock.calls.length).toBeGreaterThan(callsBefore),
    );
  });
});
