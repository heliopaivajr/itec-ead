import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils';
import ReservarVaga from '@/pages/ReservarVaga';
import type { LeadResult } from '@/services/leads.service';

// Mock do service — testes não tocam no Supabase nem no localStorage
vi.mock('@/services/leads.service', () => ({
  createLead: vi.fn(),
}));

// Mock dos componentes de layout
vi.mock('@/components/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

import { createLead } from '@/services/leads.service';

function mockCreateLead(result: LeadResult) {
  vi.mocked(createLead).mockResolvedValue(result);
}

// Preenche todos os campos obrigatórios do formulário
async function preencherFormulario(user: ReturnType<typeof userEvent.setup>, opts: {
  nome?: string;
  email?: string;
  telefone?: string;
  curso?: string;
  lgpd?: boolean;
} = {}) {
  const {
    nome     = 'João Silva',
    email    = 'joao@teste.com',
    telefone = '81999999999',
    curso    = 'teologia-livre',
    lgpd     = false,
  } = opts;

  if (nome)     await user.type(screen.getByPlaceholderText('Seu nome completo'), nome);
  if (email)    await user.type(screen.getByPlaceholderText('seu@email.com'), email);
  if (telefone) await user.type(screen.getByPlaceholderText('(81) 99999-9999'), telefone);
  if (curso) {
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], curso);
  }
  if (lgpd) {
    await user.click(screen.getByRole('checkbox'));
  }
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Formulário /reservar-vaga', () => {
  it('não submete com campos obrigatórios vazios — botão desabilitado sem LGPD', async () => {
    mockCreateLead({ success: true, error: null, savedLocally: false });
    render(<ReservarVaga />);

    const btn = screen.getByRole('button', { name: /reservar minha vaga/i });
    expect(btn).toBeDisabled();

    await userEvent.setup().click(btn);

    expect(createLead).not.toHaveBeenCalled();
  });

  it('não submete sem aceitar o checkbox LGPD — botão permanece desabilitado', async () => {
    mockCreateLead({ success: true, error: null, savedLocally: false });
    const user = userEvent.setup();
    render(<ReservarVaga />);

    await preencherFormulario(user, { lgpd: false });

    const btn = screen.getByRole('button', { name: /reservar minha vaga/i });
    expect(btn).toBeDisabled();
    expect(createLead).not.toHaveBeenCalled();
  });

  it('valida formato de e-mail inválido — input não aceita valor fora do tipo email', async () => {
    mockCreateLead({ success: true, error: null, savedLocally: false });
    const user = userEvent.setup();
    render(<ReservarVaga />);

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    await user.type(emailInput, 'email-invalido-sem-arroba');

    expect((emailInput as HTMLInputElement).validity.valid).toBe(false);
    expect(createLead).not.toHaveBeenCalled();
  });

  it('submete com dados válidos e chama createLead com os campos corretos', async () => {
    mockCreateLead({ success: true, error: null, savedLocally: false });
    const user = userEvent.setup();
    render(<ReservarVaga />);

    await preencherFormulario(user, { lgpd: true });

    const btn = screen.getByRole('button', { name: /reservar minha vaga/i });
    expect(btn).not.toBeDisabled();
    await user.click(btn);

    await waitFor(() => {
      expect(createLead).toHaveBeenCalledWith(
        expect.objectContaining({
          nome:            'João Silva',
          email:           'joao@teste.com',
          telefone:        '81999999999',
          curso_interesse: 'teologia-livre',
        })
      );
    });
  });

  it('exibe mensagem de sucesso após envio bem-sucedido', async () => {
    mockCreateLead({ success: true, error: null, savedLocally: false });
    const user = userEvent.setup();
    render(<ReservarVaga />);

    await preencherFormulario(user, { lgpd: true });
    await user.click(screen.getByRole('button', { name: /reservar minha vaga/i }));

    await waitFor(() => {
      expect(screen.getByText(/solicitação enviada com sucesso/i)).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro quando createLead retorna falha', async () => {
    mockCreateLead({ success: false, error: 'insert error', savedLocally: false });
    const user = userEvent.setup();
    render(<ReservarVaga />);

    await preencherFormulario(user, { lgpd: true });
    await user.click(screen.getByRole('button', { name: /reservar minha vaga/i }));

    await waitFor(() => {
      expect(screen.getByText(/erro ao enviar/i)).toBeInTheDocument();
    });
  });
});
