import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getFichaAluno } from '@/services/ficha-aluno.service';

beforeEach(() => { vi.clearAllMocks(); });

describe('ficha-aluno.service', () => {
  describe('getFichaAluno', () => {
    it('retorna ficha completa com todas as seções', async () => {
      vi.mocked(supabase.from).mockReset();

      const mockPerfil     = { id: 'a1', full_name: 'Pedro Lima', email: 'pedro@itec.com', role: 'aluno', telefone: null, bio: null, avatar_url: null, created_at: '2026-01-01' };
      const mockMatriculas = [{ id: 'mat-1', status: 'ativa', created_at: '2026-01-01', turma: { codigo: 'TEO-2026-1', nome: '2ª Turma' } }];
      const mockDocumentos = [{ id: 'doc-1', tipo: 'RG', url: 'https://doc.pdf', status: 'validado', observacao: null, enviado_em: '2026-01-02' }];
      const mockMensalidades = [{ id: 'men-1', mes_referencia: '2026-05-01', valor: 200, status: 'pago', data_vencimento: '2026-05-10', data_pagamento: '2026-05-08' }];

      // Promise.all faz 4 chamadas simultâneas — cada mockReturnValueOnce captura uma
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockMatriculas, error: null }),
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockDocumentos, error: null }),
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockMensalidades, error: null }),
              }),
            }),
          }),
        } as any);

      const ficha = await getFichaAluno('a1');

      expect(ficha.perfil?.full_name).toBe('Pedro Lima');
      expect(ficha.matriculas).toHaveLength(1);
      expect(ficha.documentos).toHaveLength(1);
      expect(ficha.mensalidades).toHaveLength(1);
    });

    it('retorna perfil=null e arrays vazios quando aluno não encontrado', async () => {
      vi.mocked(supabase.from).mockReset();

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          }),
        } as any);

      const ficha = await getFichaAluno('inexistente');

      expect(ficha.perfil).toBeNull();
      expect(ficha.matriculas).toEqual([]);
      expect(ficha.documentos).toEqual([]);
      expect(ficha.mensalidades).toEqual([]);
    });
  });
});
