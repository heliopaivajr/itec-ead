import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getEquipe,
  createMembro,
  updateMembro,
  desativarMembro,
} from '@/services/equipe.service';

beforeEach(() => { vi.clearAllMocks(); });

describe('equipe.service', () => {
  describe('getEquipe', () => {
    it('retorna lista de membros ativos', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                { id: 'm1', nome: 'Hélio Paiva', cargo: 'Diretor', ativo: true },
                { id: 'm2', nome: 'Camila',      cargo: 'Secretária', ativo: true },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      const resultado = await getEquipe();

      expect(resultado).toHaveLength(2);
      expect(resultado[0].nome).toBe('Hélio Paiva');
    });

    it('retorna array vazio quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
          }),
        }),
      } as any);

      const resultado = await getEquipe();

      expect(resultado).toEqual([]);
    });
  });

  describe('createMembro', () => {
    it('insere membro e retorna data com error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'new-1', nome: 'João Pastor', cargo: 'Capelão', ativo: true },
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle }),
        }),
      } as any);

      const payload = {
        user_id: null, nome: 'João Pastor', cargo: 'Capelão',
        role_sistema: 'capelania', email: null, telefone: null, ativo: true,
      };
      const resultado = await createMembro(payload);

      expect(resultado.error).toBeNull();
      expect(resultado.data?.nome).toBe('João Pastor');
    });

    it('retorna error quando insert falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'rls blocked' } }),
          }),
        }),
      } as any);

      const resultado = await createMembro({
        user_id: null, nome: 'X', cargo: 'Y',
        role_sistema: 'professor', email: null, telefone: null, ativo: true,
      });

      expect(resultado.data).toBeNull();
      expect(resultado.error).toBe('rls blocked');
    });
  });

  describe('updateMembro', () => {
    it('atualiza campos e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const resultado = await updateMembro('m1', { cargo: 'Vice-Diretor' });

      expect(resultado.error).toBeNull();
    });

    it('retorna error quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'not found' } }),
        }),
      } as any);

      const resultado = await updateMembro('inexistente', { cargo: 'X' });

      expect(resultado.error).toBe('not found');
    });
  });

  describe('desativarMembro', () => {
    it('define ativo=false e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn   = vi.fn().mockResolvedValue({ error: null });
      const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      const resultado = await desativarMembro('m1');

      expect(resultado.error).toBeNull();
      expect(updateFn.mock.calls[0][0]).toEqual({ ativo: false });
    });

    it('retorna error quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'rls blocked' } }),
        }),
      } as any);

      const resultado = await desativarMembro('m1');

      expect(resultado.error).toBe('rls blocked');
    });
  });
});
