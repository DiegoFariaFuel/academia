import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('lista todos os itens do menu', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /alunos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pagamentos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /acessos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /biometrias/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /mensagens/i })).toBeInTheDocument();
  });

  it('oculta labels quando recolhida', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={false} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
  });
});
