import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getCursoAtivo,
  getModulosByCurso,
  getDisciplinasByModulo,
  getAllDisciplinas,
  getDisciplinaById,
  getPrerequisitos,
  verificarPrerequisitos,
  verificarPrerequisitoBatch,
} from '@/services/academico.service';

// chain: from().select().eq().order().limit().single() → resolves
function mockSingleQuery(result: { data: any; error: any }) {
  vi.mocked(supabase.from).mockReset();
  const mockSingle  = vi.fn().mockResolvedValue(result);
  const mockLimit   = vi.fn().mockReturnValue({ single: mockSingle });
  const mockOrder   = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockEq      = vi.fn().mockReturnValue({ order: mockOrder });
  const mockSelect  = vi.fn().mockReturnValue({ eq: mockEq });
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
}

// chain: from().select().eq().order().limit() → resolves (list)
function mockListQuery(result: { data: any; error: any }) {
  vi.mocked(supabase.from).mockReset();
  const mockLimit  = vi.fn().mockResolvedValue(result);
  const mockOrder  = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockEq     = vi.fn().mockReturnValue({ order: mockOrder });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
  return mockLimit;
}

beforeEach(() => { vi.clearAllMocks(); });

describe('academico.service', () => {
  describe('getCursoAtivo', () => {
    it('retorna curso quando ativo=true existe', async () => {
      mockSingleQuery({ data: { id: 'c1', codigo: 'GRAD-TEO', ativo: true }, error: null });

      const curso = await getCursoAtivo();

      expect(curso).not.toBeNull();
      expect(curso?.codigo).toBe('GRAD-TEO');
    });

    it('retorna null quando não há curso ativo', async () => {
      mockSingleQuery({ data: null, error: { code: 'PGRST116' } });

      const curso = await getCursoAtivo();

      expect(curso).toBeNull();
    });
  });

  describe('getModulosByCurso', () => {
    it('retorna módulos do curso em ordem', async () => {
      mockListQuery({
        data: [
          { id: 'm1', curso_id: 'c1', nome: 'Módulo 1', ordem: 1 },
          { id: 'm2', curso_id: 'c1', nome: 'Módulo 2', ordem: 2 },
        ],
        error: null,
      });

      const resultado = await getModulosByCurso('c1');

      expect(resultado).toHaveLength(2);
      expect(resultado[0].nome).toBe('Módulo 1');
    });

    it('retorna array vazio quando erro', async () => {
      mockListQuery({ data: null, error: { message: 'error' } });

      const resultado = await getModulosByCurso('c1');

      expect(resultado).toEqual([]);
    });
  });

  describe('getDisciplinasByModulo', () => {
    it('retorna disciplinas do módulo e verifica que limit foi chamado', async () => {
      const mockLimit = mockListQuery({
        data: [{ id: 'd1', codigo: 'B1NTG', nome: 'NT I' }],
        error: null,
      });

      const resultado = await getDisciplinasByModulo('modulo-123');

      expect(resultado).toHaveLength(1);
      expect(resultado[0].codigo).toBe('B1NTG');
      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('retorna array vazio quando Supabase retorna erro', async () => {
      mockListQuery({ data: null, error: { message: 'connection error' } });

      const resultado = await getDisciplinasByModulo('modulo-123');

      expect(resultado).toEqual([]);
    });
  });

  describe('getAllDisciplinas', () => {
    it('retorna todas as disciplinas', async () => {
      vi.mocked(supabase.from).mockReset();
      const limitFn = vi.fn().mockResolvedValue({
        data: [
          { id: 'd1', codigo: 'B1NTG', nome: 'NT I' },
          { id: 'd2', codigo: 'B1ATG', nome: 'AT I' },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({ limit: limitFn }),
        }),
      } as any);

      const resultado = await getAllDisciplinas();

      expect(resultado).toHaveLength(2);
      expect(limitFn).toHaveBeenCalledWith(200);
    });

    it('retorna array vazio quando erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
          }),
        }),
      } as any);

      const resultado = await getAllDisciplinas();

      expect(resultado).toEqual([]);
    });
  });

  describe('getDisciplinaById', () => {
    it('retorna disciplina quando id existe', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'd1', codigo: 'B1NTG', nome: 'NT I' },
              error: null,
            }),
          }),
        }),
      } as any);

      const disc = await getDisciplinaById('d1');

      expect(disc?.codigo).toBe('B1NTG');
    });

    it('retorna null quando não encontrada', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as any);

      const disc = await getDisciplinaById('inexistente');

      expect(disc).toBeNull();
    });
  });

  describe('getPrerequisitos', () => {
    it('retorna pré-requisitos da disciplina', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 'p1', disciplina_id: 'd1', prerequisito_id: 'd0', tipo: 'prerequisito' }],
              error: null,
            }),
          }),
        }),
      } as any);

      const resultado = await getPrerequisitos('d1');

      expect(resultado).toHaveLength(1);
      expect(resultado[0].tipo).toBe('prerequisito');
    });

    it('retorna array vazio quando sem pré-requisitos', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      const resultado = await getPrerequisitos('d-sem-prereq');

      expect(resultado).toEqual([]);
    });
  });

  describe('verificarPrerequisitoBatch', () => {
    it('retorna Map vazio quando disciplinaIds está vazio', async () => {
      const resultado = await verificarPrerequisitoBatch('aluno-1', [], []);

      expect(resultado.size).toBe(0);
    });

    it('retorna aprovado=true para disciplinas sem pré-requisitos', async () => {
      vi.mocked(supabase.from).mockReset();
      // Promise.all: [prerequisitos_v2, matriculas_disciplina]
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        } as any);

      const todasDiscs = [{ id: 'd1', codigo: 'B1NTG', nome: 'NT I' } as any];
      const resultado = await verificarPrerequisitoBatch('aluno-1', ['d1'], todasDiscs);

      expect(resultado.get('d1')?.aprovado).toBe(true);
    });

    it('retorna aprovado=false quando pré-requisito não cumprido', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ disciplina_id: 'd2', prerequisito_id: 'd1', tipo: 'prerequisito' }],
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        } as any);

      const todasDiscs = [
        { id: 'd1', codigo: 'B1NTG', nome: 'NT I' } as any,
        { id: 'd2', codigo: 'B1ATG', nome: 'AT I' } as any,
      ];
      const resultado = await verificarPrerequisitoBatch('aluno-1', ['d2'], todasDiscs);

      expect(resultado.get('d2')?.aprovado).toBe(false);
      expect(resultado.get('d2')?.faltam).toHaveLength(1);
      expect(resultado.get('d2')?.faltam[0].codigo).toBe('B1NTG');
    });
  });

  describe('verificarPrerequisitos', () => {
    it('retorna aprovado=true quando não há pré-requisitos', async () => {
      // getPrerequisitos → vazio
      vi.mocked(supabase.from).mockReset();
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ limit: mockLimit }) }),
      } as any);

      const resultado = await verificarPrerequisitos('aluno-1', 'disc-1');

      expect(resultado.aprovado).toBe(true);
      expect(resultado.faltam).toHaveLength(0);
    });

    it('retorna aprovado=true quando todos os pré-requisitos foram cumpridos', async () => {
      vi.mocked(supabase.from).mockReset();
      // Chamada 1: getPrerequisitos → [{ prerequisito_id: 'disc-A', tipo: 'prerequisito' }]
      // Chamada 2: cursadas → [{ disciplina_id: 'disc-A' }]
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 'p1', disciplina_id: 'disc-1', prerequisito_id: 'disc-A', tipo: 'prerequisito' }],
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ disciplina_id: 'disc-A', status: 'aprovado' }],
                error: null,
              }),
            }),
          }),
        } as any);

      const resultado = await verificarPrerequisitos('aluno-1', 'disc-1');

      expect(resultado.aprovado).toBe(true);
      expect(resultado.faltam).toHaveLength(0);
    });

    it('retorna aprovado=false com lista de disciplinas faltantes', async () => {
      vi.mocked(supabase.from).mockReset();
      // verificarPrerequisitos faz 4 chamadas from():
      // 1. prerequisitos_v2 → [A, B]
      // 2. matriculas_disciplina (outer) → faz subquery .eq(matricula_id, subquery)
      // 3. matriculas (subquery inner) → retorna ids de matrículas do aluno
      // 4. disciplinas_v2 → faltantes = [disc-B]
      vi.mocked(supabase.from)
        // 1. getPrerequisitos
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  { id: 'p1', disciplina_id: 'disc-1', prerequisito_id: 'disc-A', tipo: 'prerequisito' },
                  { id: 'p2', disciplina_id: 'disc-1', prerequisito_id: 'disc-B', tipo: 'prerequisito' },
                ],
                error: null,
              }),
            }),
          }),
        } as any)
        // 2. matriculas_disciplina (outer — usa subquery inline)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ disciplina_id: 'disc-A', status: 'aprovado' }],
                error: null,
              }),
            }),
          }),
        } as any)
        // 3. matriculas (subquery inner — from().select().eq())
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({}), // objeto vazio — só é passado como argumento ao outer .eq()
          }),
        } as any)
        // 4. disciplinas_v2 → faltantes
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: 'disc-B', codigo: 'B1NTG', nome: 'NT I' }],
              error: null,
            }),
          }),
        } as any);

      const resultado = await verificarPrerequisitos('aluno-1', 'disc-1');

      expect(resultado.aprovado).toBe(false);
      expect(resultado.faltam).toHaveLength(1);
      expect(resultado.faltam[0].codigo).toBe('B1NTG');
    });
  });
});
