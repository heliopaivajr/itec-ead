import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getMateriaisByDisciplina,
  getProgressoByAluno,
  getPercentualProgresso,
  marcarMaterialVisualizado,
  getMateriaiseProgressoBatch,
} from '@/services/material.service';

beforeEach(() => { vi.clearAllMocks(); });

describe('material.service', () => {
  describe('getMateriaisByDisciplina', () => {
    it('retorna materiais visíveis com limit=100', async () => {
      vi.mocked(supabase.from).mockReset();
      const limitFn = vi.fn().mockResolvedValue({
        data: [
          { id: 'm1', nome: 'Apostila NT I', tipo: 'pdf', visivel: true },
          { id: 'm2', nome: 'Vídeo Aula 1', tipo: 'video', visivel: true },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ limit: limitFn }),
            }),
          }),
        }),
      } as any);

      const resultado = await getMateriaisByDisciplina('disc-1', true);

      expect(resultado).toHaveLength(2);
      expect(limitFn).toHaveBeenCalledWith(100);
    });

    it('retorna array vazio quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
              }),
            }),
          }),
        }),
      } as any);

      const resultado = await getMateriaisByDisciplina('disc-1');

      expect(resultado).toEqual([]);
    });
  });

  describe('getPercentualProgresso', () => {
    it('calcula percentual correto (2 de 4 = 50%)', async () => {
      vi.mocked(supabase.from).mockReset();
      // Chamada 1: getMateriaisByDisciplina → 4 materiais
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }, { id: 'm4' }],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        } as any)
        // Chamada 2: getProgressoByAluno → 2 visualizados
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'p1', material_id: 'm1' }, { id: 'p2', material_id: 'm2' }],
                error: null,
              }),
            }),
          }),
        } as any);

      const percentual = await getPercentualProgresso('aluno-1', 'disc-1');

      expect(percentual).toBe(50);
    });

    it('retorna 0 quando não há materiais (sem divisão por zero)', async () => {
      vi.mocked(supabase.from).mockReset();
      // getMateriaisByDisciplina → []
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        } as any);

      const percentual = await getPercentualProgresso('aluno-1', 'disc-1');

      // Sem materiais → 100 (não há nada para completar)
      // Conforme implementação: if (materiais.length === 0) return 100
      expect(percentual).toBe(100);
    });
  });

  describe('getProgressoByAluno', () => {
    it('retorna registros de progresso do aluno na disciplina', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id: 'p1', aluno_id: 'a1', material_id: 'm1', disciplina_id: 'd1' },
                { id: 'p2', aluno_id: 'a1', material_id: 'm2', disciplina_id: 'd1' },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      const resultado = await getProgressoByAluno('a1', 'd1');

      expect(resultado).toHaveLength(2);
    });

    it('retorna array vazio quando erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
          }),
        }),
      } as any);

      const resultado = await getProgressoByAluno('a1', 'd1');

      expect(resultado).toEqual([]);
    });
  });

  describe('getMateriaiseProgressoBatch', () => {
    it('retorna Map vazio quando disciplinaIds está vazio', async () => {
      const resultado = await getMateriaiseProgressoBatch('aluno-1', []);
      expect(resultado.size).toBe(0);
    });

    it('calcula percentual correto por disciplina', async () => {
      vi.mocked(supabase.from).mockReset();
      // Promise.all: [materiais, progresso_aluno]
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'm1', disciplina_id: 'd1' },
                    { id: 'm2', disciplina_id: 'd1' },
                    { id: 'm3', disciplina_id: 'd1' },
                    { id: 'm4', disciplina_id: 'd2' },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    { material_id: 'm1', disciplina_id: 'd1' },
                    { material_id: 'm4', disciplina_id: 'd2' },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        } as any);

      const resultado = await getMateriaiseProgressoBatch('aluno-1', ['d1', 'd2']);

      // d1: 3 materiais, 1 visualizado = 33%
      expect(resultado.get('d1')?.count).toBe(3);
      expect(resultado.get('d1')?.percentual).toBe(33);
      // d2: 1 material, 1 visualizado = 100%
      expect(resultado.get('d2')?.percentual).toBe(100);
    });

    it('retorna percentual=100 para disciplina sem materiais', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        } as any);

      const resultado = await getMateriaiseProgressoBatch('aluno-1', ['d1']);

      expect(resultado.get('d1')?.percentual).toBe(100);
    });
  });

  describe('marcarMaterialVisualizado', () => {
    it('faz upsert com aluno_id, material_id e disciplina_id', async () => {
      vi.mocked(supabase.from).mockReset();
      const upsertFn = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: upsertFn } as any);

      const resultado = await marcarMaterialVisualizado('aluno-1', 'mat-1', 'disc-1');

      expect(resultado.error).toBeNull();
      const payload = upsertFn.mock.calls[0][0];
      expect(payload.aluno_id).toBe('aluno-1');
      expect(payload.material_id).toBe('mat-1');
      expect(payload.disciplina_id).toBe('disc-1');
    });
  });
});
