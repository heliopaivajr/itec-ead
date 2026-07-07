import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getCursoAtivo,
  getModulosByCurso,
  getDisciplinasByModulo,
  getAllDisciplinas,
  getDisciplinaById,
  getPrerequisitos,
  verificarPrerequisitoBatch,
  getHistoricoAluno,
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

    // PERF-01 (auditoria 2026-07-05): a query filtrava .eq('aluno_id') numa coluna
    // que NÃO existe em matriculas_disciplina → 400 silencioso → cursadas sempre
    // vazio → toda disciplina com pré-req aparecia bloqueada. Estes testes validam
    // o SHAPE correto (aluno via join matriculas!inner) e o cenário de liberação.
    it('pré-req cursado com aprovação NÃO bloqueia — e a query filtra aluno via join, não por coluna inexistente', async () => {
      vi.mocked(supabase.from).mockReset();

      const matDiscSelect = vi.fn();
      const matDiscIn = vi.fn();
      const matDiscEq = vi.fn();

      vi.mocked(supabase.from)
        // 1. prerequisitos_v2 → d2 exige d1
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
        // 2. matriculas_disciplina → aluno cursou d1 (aprovado), via join com matriculas
        .mockReturnValueOnce({
          select: matDiscSelect.mockReturnValue({
            in: matDiscIn.mockReturnValue({
              eq: matDiscEq.mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [{ disciplina_id: 'd1', matricula: { aluno_id: 'aluno-1' } }],
                  error: null,
                }),
              }),
            }),
          }),
        } as any)
        // 3. excecoes_prerequisito → nenhuma
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        } as any);

      const todasDiscs = [
        { id: 'd1', codigo: 'B1NTG', nome: 'NT I' } as any,
        { id: 'd2', codigo: 'B1NTA', nome: 'NT II' } as any,
      ];
      const resultado = await verificarPrerequisitoBatch('aluno-1', ['d2'], todasDiscs);

      // Regra: quem cursou o pré-req com aprovação vê a disciplina LIBERADA
      expect(resultado.get('d2')?.aprovado).toBe(true);
      expect(resultado.get('d2')?.faltam).toHaveLength(0);

      // Shape da query (regressão PERF-01): aluno entra pelo JOIN com matriculas —
      // NUNCA por .eq('aluno_id') direto, que é coluna inexistente na tabela.
      expect(matDiscSelect).toHaveBeenCalledWith(expect.stringContaining('matriculas!inner(aluno_id)'));
      expect(matDiscIn).toHaveBeenCalledWith('status', ['aprovado', 'convalidado']);
      expect(matDiscEq).toHaveBeenCalledWith('matricula.aluno_id', 'aluno-1');
      expect(matDiscEq).not.toHaveBeenCalledWith('aluno_id', expect.anything());
    });

    it('status que não aprovam (cursando/reprovado/recuperacao) não liberam o pré-requisito', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from)
        // 1. prerequisitos_v2 → d2 exige d1
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
        // 2. matriculas_disciplina → vazio (o filtro .in(status) já exclui
        //    cursando/reprovado/reprovado_falta/recuperacao/trancado no servidor)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        } as any)
        // 3. excecoes_prerequisito → nenhuma
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        } as any);

      const todasDiscs = [
        { id: 'd1', codigo: 'B1NTG', nome: 'NT I' } as any,
        { id: 'd2', codigo: 'B1NTA', nome: 'NT II' } as any,
      ];
      const resultado = await verificarPrerequisitoBatch('aluno-1', ['d2'], todasDiscs);

      expect(resultado.get('d2')?.aprovado).toBe(false);
      expect(resultado.get('d2')?.faltam[0].codigo).toBe('B1NTG');
    });
  });

  // describe('verificarPrerequisitos') REMOVIDO junto com a função (PERF-01):
  // a single usava pseudo-subquery inválida e não tinha caller em produção.
  // A cobertura de pré-requisitos vive em verificarPrerequisitoBatch acima.
});

// ─── getHistoricoAluno ────────────────────────────────────────────────────────

// Helper: monta os 4 from() calls que getHistoricoAluno faz em ordem:
//   1. matriculas.single()
//   2. matriculas_disciplina.limit()
//   3. notas_aluno (via getNotasBatchByAluno) .limit()
//   4. frequencia (via getResumoFrequenciaBatch) .limit()
function mockHistoricoQueries({
  notasData = [] as unknown[],
  freqData  = [] as unknown[],
  disciplinas = [{
    disciplina_id: 'disc-1',
    disciplinas_v2: {
      id: 'disc-1', nome: 'NT I', carga_horaria_presencial: 40, modulo_id: 'mod-1',
      modulos: { id: 'mod-1', nome: 'Módulo 1', ordem: 1 },
    },
  }] as unknown[],
  semMatricula = false,
} = {}) {
  vi.mocked(supabase.from).mockReset();

  // 1. matriculas → single
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(
              semMatricula
                ? { data: null, error: { code: 'PGRST116' } }
                : { data: { id: 'mat-1' }, error: null }
            ),
          }),
        }),
      }),
    }),
  } as any);

  if (semMatricula) return;

  // 2. matriculas_disciplina → limit
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: disciplinas, error: null }),
      }),
    }),
  } as any);

  // 3. notas_aluno (getNotasBatchByAluno): select → eq → in → limit
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: notasData, error: null }),
        }),
      }),
    }),
  } as any);

  // 4. frequencia (getResumoFrequenciaBatch): select → eq → in → limit
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: freqData, error: null }),
        }),
      }),
    }),
  } as any);
}

// Nota row para getNotasBatchByAluno (Supabase retorna join como array)
const notaN1 = (nota: number) => ({ disciplina_id: 'disc-1', nota, avaliacao: [{ tipo: 'N1' }] });
const notaN2 = (nota: number) => ({ disciplina_id: 'disc-1', nota, avaliacao: [{ tipo: 'N2' }] });
const notaRec = (nota: number) => ({ disciplina_id: 'disc-1', nota, avaliacao: [{ tipo: 'recuperacao' }] });

// Freq rows para getResumoFrequenciaBatch
function freqRows(total: number, presentes: number): unknown[] {
  return Array.from({ length: total }, (_, i) => ({
    disciplina_id: 'disc-1',
    presente: i < presentes,
    justificada: false,
  }));
}

describe('getHistoricoAluno', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('retorna histórico vazio quando aluno não tem matrícula na turma', async () => {
    mockHistoricoQueries({ semMatricula: true });

    const hist = await getHistoricoAluno('aluno-1', 'turma-1');

    expect(hist.modulos).toHaveLength(0);
    expect(hist.media_geral).toBeNull();
    expect(hist.disciplinas_aprovadas).toBe(0);
  });

  it('aluno com N1=8, N2=9 (media=8.5) e freq 80% → aprovado_direto', async () => {
    // 10 aulas, 8 presenças = 80%
    mockHistoricoQueries({
      notasData: [notaN1(8), notaN2(9)],
      freqData: freqRows(10, 8),
    });

    const hist = await getHistoricoAluno('aluno-1', 'turma-1');
    const disc = hist.modulos[0].disciplinas[0];

    expect(disc.status).toBe('aprovado_direto');
    expect(disc.notas.n1).toBe(8);
    expect(disc.notas.n2).toBe(9);
    expect(disc.notas.media_final).toBe(8.5);
    expect(disc.frequencia.percentual).toBe(80);
    expect(hist.disciplinas_aprovadas).toBe(1);
    expect(hist.disciplinas_reprovadas).toBe(0);
  });

  it('aluno sem notas lançadas → status pendente', async () => {
    // Sem notas, sem frequência registrada
    mockHistoricoQueries({ notasData: [], freqData: [] });

    const hist = await getHistoricoAluno('aluno-1', 'turma-1');
    const disc = hist.modulos[0].disciplinas[0];

    expect(disc.status).toBe('pendente');
    expect(disc.notas.n1).toBeNull();
    expect(disc.notas.n2).toBeNull();
    expect(disc.notas.media_final).toBeNull();
  });

  it('aluno com freq 60% (< 75%) e média 8.0 → reprovado_falta', async () => {
    // 10 aulas, 6 presenças = 60% — falta tem prioridade sobre nota
    mockHistoricoQueries({
      notasData: [notaN1(8), notaN2(8)],
      freqData: freqRows(10, 6),
    });

    const hist = await getHistoricoAluno('aluno-1', 'turma-1');
    expect(hist.modulos[0].disciplinas[0].status).toBe('reprovado_falta');
    expect(hist.disciplinas_reprovadas).toBe(1);
  });

  it('aluno com N1=3, N2=4 (media=3.5) e freq 80% → reprovado_nota', async () => {
    mockHistoricoQueries({
      notasData: [notaN1(3), notaN2(4)],
      freqData: freqRows(10, 8),
    });

    const hist = await getHistoricoAluno('aluno-1', 'turma-1');
    expect(hist.modulos[0].disciplinas[0].status).toBe('reprovado_nota');
    expect(hist.disciplinas_reprovadas).toBe(1);
  });

  it('aluno com N1=5, N2=6 (media=5.5) e freq 80% → recuperacao', async () => {
    mockHistoricoQueries({
      notasData: [notaN1(5), notaN2(6)],
      freqData: freqRows(10, 8),
    });

    const hist = await getHistoricoAluno('aluno-1', 'turma-1');
    expect(hist.modulos[0].disciplinas[0].status).toBe('recuperacao');
  });

  it('media_geral calculada corretamente para múltiplas disciplinas', async () => {
    // 2 disciplinas em módulos diferentes: media 8.0 e 6.0 → geral = 7.0
    mockHistoricoQueries({
      notasData: [
        { disciplina_id: 'disc-1', nota: 8, avaliacao: [{ tipo: 'N1' }] },
        { disciplina_id: 'disc-1', nota: 8, avaliacao: [{ tipo: 'N2' }] },
        { disciplina_id: 'disc-2', nota: 6, avaliacao: [{ tipo: 'N1' }] },
        { disciplina_id: 'disc-2', nota: 6, avaliacao: [{ tipo: 'N2' }] },
      ],
      freqData: [
        ...Array.from({ length: 10 }, () => ({ disciplina_id: 'disc-1', presente: true, justificada: false })),
        ...Array.from({ length: 10 }, () => ({ disciplina_id: 'disc-2', presente: true, justificada: false })),
      ],
      disciplinas: [
        {
          disciplina_id: 'disc-1',
          disciplinas_v2: { id: 'disc-1', nome: 'NT I',  carga_horaria_presencial: 40, modulo_id: 'mod-1', modulos: { id: 'mod-1', nome: 'Módulo 1', ordem: 1 } },
        },
        {
          disciplina_id: 'disc-2',
          disciplinas_v2: { id: 'disc-2', nome: 'AT I',  carga_horaria_presencial: 40, modulo_id: 'mod-1', modulos: { id: 'mod-1', nome: 'Módulo 1', ordem: 1 } },
        },
      ],
    });

    const hist = await getHistoricoAluno('aluno-1', 'turma-1');

    expect(hist.media_geral).toBe(7.0);
    expect(hist.total_carga_horaria).toBe(80);
  });

  it('agrupamento por módulo respeita a ordem (ordem 2 antes de ordem 1 → ordenado corretamente)', async () => {
    // Disciplinas em 2 módulos — servidor retorna na ordem errada (mod-2 primeiro)
    // O histórico deve ordenar por modulo.ordem
    mockHistoricoQueries({
      notasData: [],
      freqData: [],
      disciplinas: [
        {
          disciplina_id: 'disc-b',
          disciplinas_v2: { id: 'disc-b', nome: 'Disc B', carga_horaria_presencial: 40, modulo_id: 'mod-2', modulos: { id: 'mod-2', nome: 'Módulo 2', ordem: 2 } },
        },
        {
          disciplina_id: 'disc-a',
          disciplinas_v2: { id: 'disc-a', nome: 'Disc A', carga_horaria_presencial: 40, modulo_id: 'mod-1', modulos: { id: 'mod-1', nome: 'Módulo 1', ordem: 1 } },
        },
      ],
    });

    const hist = await getHistoricoAluno('aluno-1', 'turma-1');

    expect(hist.modulos).toHaveLength(2);
    expect(hist.modulos[0].nome).toBe('Módulo 1');
    expect(hist.modulos[0].ordem).toBe(1);
    expect(hist.modulos[1].nome).toBe('Módulo 2');
    expect(hist.modulos[1].ordem).toBe(2);
  });

  it('nota de recuperação incluída corretamente no retorno', async () => {
    mockHistoricoQueries({
      notasData: [notaN1(5), notaN2(5), notaRec(7.5)],
      freqData: freqRows(10, 8),
    });

    const hist = await getHistoricoAluno('aluno-1', 'turma-1');
    const disc = hist.modulos[0].disciplinas[0];

    expect(disc.notas.recuperacao).toBe(7.5);
    // status baseado em N1+N2 (5+5=5.0 → recuperacao), não na nota de rec
    expect(disc.status).toBe('recuperacao');
  });
});
