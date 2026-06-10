import type React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

function Boom(): React.ReactNode {
  throw new Error('Falha proposital');
}

describe('ErrorBoundary', () => {
  it('renderiza children sem erro', () => {
    render(
      <ErrorBoundary>
        <span>Tudo certo</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Tudo certo')).toBeInTheDocument();
  });

  it('exibe fallback quando filho lança erro', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Falha proposital')).toBeInTheDocument();
    vi.mocked(console.error).mockRestore();
  });

  it('botão recarregar chama location.reload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload },
      writable: true,
    });
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    await user.click(screen.getByRole('button', { name: /recarregar/i }));
    expect(reload).toHaveBeenCalled();
    vi.mocked(console.error).mockRestore();
  });
});
