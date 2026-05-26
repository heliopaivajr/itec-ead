import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getProfessores,
  getProfessorByUserId,
  preencherContrato,
} from '@/services/professor.service';

beforeEach(() => { vi.clearAllMocks(); });

describe('professor.service', () => {
  describe('getProfessores', () => {
    it('retorna página 1 com total correto', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [
                  { id: 'p1', nome_completo: 'Prof. João', ativo: true },
                  { id: 'p2', nome_completo: 'Prof. Maria', ativo: true },
                ],
                count: 15,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const resultado = await getProfessores(1, 20);

      expect(resultado.data).toHaveLength(2);
      expect(resultado.total).toBe(15);
    });

    it('retorna { data: [], total: 0 } quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({ data: null, count: null, error: { message: 'error' } }),
            }),
          }),
        }),
      } as any);

      const resultado = await getProfessores();

      expect(resultado.data).toEqual([]);
      expect(resultado.total).toBe(0);
    });
  });

  describe('getProfessorByUserId', () => {
    it('retorna professor quando user_id existe', async () => {
      vi.mocked(supabase.from).mockReset();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'prof-1', nome_completo: 'Prof. João', user_id: 'user-123' },
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }),
      } as any);

      const prof = await getProfessorByUserId('user-123');

      expect(prof).not.toBeNull();
      expect(prof?.user_id).toBe('user-123');
    });

    it('retorna null quando professor não encontrado', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as any);

      const prof = await getProfessorByUserId('user-inexistente');

      expect(prof).toBeNull();
    });
  });

  describe('preencherContrato', () => {
    it('salva dados e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const mockUpdateFn = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: mockUpdateFn }),
      } as any);

      const dados = { nome_completo: 'Prof. João', cpf: '123.456.789-00' };
      const resultado = await preencherContrato('contrato-1', dados);

      expect(resultado.error).toBeNull();
      // Verifica que os dados e o status foram enviados
      const chamada = vi.mocked(supabase.from).mock.results[0].value.update.mock.calls[0][0];
      expect(chamada.dados_preenchidos).toEqual(dados);
      expect(chamada.status).toBe('preenchido');
      expect(chamada.preenchido_em).toBeDefined();
    });

    it('retorna erro quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'update failed' } }),
        }),
      } as any);

      const resultado = await preencherContrato('contrato-1', {});

      expect(resultado.error).toBe('update failed');
    });
  });
});
