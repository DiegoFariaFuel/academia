import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('não renderiza quando fechado', () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Teste">
        conteúdo
      </Modal>,
    );
    expect(screen.queryByText('Teste')).not.toBeInTheDocument();
  });

  it('renderiza título e conteúdo quando aberto', () => {
    render(
      <Modal open onClose={vi.fn()} title="Novo aluno">
        <p>Formulário</p>
      </Modal>,
    );
    expect(screen.getByText('Novo aluno')).toBeInTheDocument();
    expect(screen.getByText('Formulário')).toBeInTheDocument();
  });

  it('chama onClose ao clicar no X', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open onClose={onClose} title="Fechar">
        body
      </Modal>,
    );
    await user.click(screen.getByLabelText('Fechar'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
