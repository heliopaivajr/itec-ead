import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { InlineStatusSelect } from '../InlineStatusSelect';
import type { StatusOption } from '../InlineStatusSelect';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const OPTIONS: StatusOption[] = [
  { value: 'ativo',   label: 'Ativo',   color: 'bg-green-100 text-green-800' },
  { value: 'inativo', label: 'Inativo', color: 'bg-gray-100 text-gray-600'  },
];

describe('InlineStatusSelect', () => {
  let onSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSave = vi.fn().mockResolvedValue(undefined);
  });

  it('renderiza badge com valor inicial', () => {
    render(<InlineStatusSelect value="ativo" options={OPTIONS} onSave={onSave} />);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('clique no badge → entra em modo editing (select visível)', async () => {
    render(<InlineStatusSelect value="ativo" options={OPTIONS} onSave={onSave} />);
    fireEvent.click(screen.getByText('Ativo'));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('selecionar valor diferente → chama onSave com novo valor', async () => {
    render(<InlineStatusSelect value="ativo" options={OPTIONS} onSave={onSave} />);
    fireEvent.click(screen.getByText('Ativo'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inativo' } });
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('inativo'));
  });

  it('selecionar mesmo valor → NÃO chama onSave', async () => {
    render(<InlineStatusSelect value="ativo" options={OPTIONS} onSave={onSave} />);
    fireEvent.click(screen.getByText('Ativo'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ativo' } });
    await waitFor(() => expect(onSave).not.toHaveBeenCalled());
  });

  it('disabled=true → badge estático sem botão clicável', () => {
    render(<InlineStatusSelect value="ativo" options={OPTIONS} onSave={onSave} disabled />);
    const badge = screen.getByText('Ativo');
    expect(badge.tagName).toBe('SPAN');
    fireEvent.click(badge);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('onSave rejeita → reverte para valor anterior', async () => {
    onSave = vi.fn().mockRejectedValue(new Error('falha'));
    render(<InlineStatusSelect value="ativo" options={OPTIONS} onSave={onSave} />);
    fireEvent.click(screen.getByText('Ativo'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inativo' } });
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument());
  });
});
