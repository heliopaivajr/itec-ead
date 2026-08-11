import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getResumoFrequencia,
  lancarFrequencia,
  getAlunosAbaixoLimite,
  getFrequenciaByDisciplina,
  justificarFalta,
  calcularResumosPorAluno,
  getResumoFrequenciaBatch,
  getAlunosEmRiscoByTurma,
  type RegistroFrequencia,
} from '@/services/frequencia.service';

// Monta registros de presença para teste de resumo
function makeRegistros(total: number, presentes: number) {
  return Array.from({ length: total }, (_, i) => ({
    presente:    i < presentes,
    justificada: false,
  }));
}

function mockSelectEq(result: { data: any; error: any }) {
  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  } as any);
}

beforeEach(() => { vi.clearAllMocks(); });

describe('frequencia.service', () => {
  describe('getResumoFrequencia', () => {
    it('calcula percentual e status ok (>= 75%)', async () => {
      // 8 aulas, 6 presenças → 75%
      mockSelectEq({ data: makeRegistros(8, 6), error: null });

      const resumo = await getResumoFrequencia('aluno-1', 'disc-1');

      expect(resumo.total_aulas).toBe(8);
      expect(resumo.presencas).toBe(6);
      expect(resumo.percentual_presenca).toBe(75);
      expect(resumo.status).toBe('ok');
    });

    it('2.13f: pondera FP (meia = 0,5) — 7P + 2FP + 1F em 10 → 80% e faltas 2,0', async () => {
      const data = [
        ...Array.from({ length: 7 }, () => ({ tipo_presenca: 'presente', presente: true, justificada: false })),
        ...Array.from({ length: 2 }, () => ({ tipo_presenca: 'meia', presente: false, justificada: false })),
        { tipo_presenca: 'falta', presente: false, justificada: false },
      ];
      mockSelectEq({ data, error: null });

      const resumo = await getResumoFrequencia('aluno-1', 'disc-1');

      expect(resumo.total_aulas).toBe(10);
      expect(resumo.presencas).toBe(7);              // só presenças cheias
      expect(resumo.percentual_presenca).toBe(80);   // (7·1 + 2·0,5 + 1·0)/10 = 80%
      expect(resumo.faltas).toBe(2);                 // 1 falta + 2·0,5 = 2,0
      expect(resumo.status).toBe('ok');
    });

    it('retorna status alerta (60-74%)', async () => {
      // 10 aulas, 6 presenças → 60%
      mockSelectEq({ data: makeRegistros(10, 6), error: null });

      const resumo = await getResumoFrequencia('aluno-1', 'disc-1');

      expect(resumo.percentual_presenca).toBe(60);
      expect(resumo.status).toBe('alerta');
    });

    it('retorna status reprovado (< 60%)', async () => {
      // 10 aulas, 5 presenças → 50%
      mockSelectEq({ data: makeRegistros(10, 5), error: null });

      const resumo = await getResumoFrequencia('aluno-1', 'disc-1');

      expect(resumo.percentual_presenca).toBe(50);
      expect(resumo.status).toBe('reprovado');
    });

    it('retorna zeros quando não há registros de frequência', async () => {
      mockSelectEq({ data: [], error: null });

      const resumo = await getResumoFrequencia('aluno-1', 'disc-1');

      expect(resumo.total_aulas).toBe(0);
      expect(resumo.presencas).toBe(0);
      // Sem aulas → 100% por padrão (não reprovar aluno sem dados)
      expect(resumo.percentual_presenca).toBe(100);
      expect(resumo.status).toBe('ok');
    });
  });

  describe('lancarFrequencia', () => {
    it('insere registros em batch e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const upsertFn = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: upsertFn } as any);

      const registros = [
        { disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-26', presente: true, justificada: false, documento_url: null, observacao: null },
      ];

      const resultado = await lancarFrequencia(registros);

      expect(resultado.error).toBeNull();
      // 2.13f: o service normaliza — presente=true → tipo_presenca='presente' (grava os dois).
      expect(upsertFn).toHaveBeenCalledWith(
        [{ ...registros[0], tipo_presenca: 'presente', presente: true }],
        { onConflict: 'disciplina_id,aluno_id,data_aula' },
      );
    });

    it('2.13f: grava tipo_presenca quando informado e sincroniza presente (meia → presente=false)', async () => {
      vi.mocked(supabase.from).mockReset();
      const upsertFn = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: upsertFn } as any);

      await lancarFrequencia([{
        disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-26',
        tipo_presenca: 'meia', justificada: false, documento_url: null, observacao: null,
      }]);

      expect(upsertFn).toHaveBeenCalledWith(
        [expect.objectContaining({ tipo_presenca: 'meia', presente: false })],
        { onConflict: 'disciplina_id,aluno_id,data_aula' },
      );
    });

    it('retorna erro quando upsert falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: { message: 'rls blocked' } }),
      } as any);

      const resultado = await lancarFrequencia([{
        disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1',
        data_aula: '2026-05-26', presente: true, justificada: false,
        documento_url: null, observacao: null,
      }]);

      expect(resultado.error).toBe('rls blocked');
    });
  });

  describe('getFrequenciaByDisciplina', () => {
    it('retorna registros da disciplina com limit=120', async () => {
      vi.mocked(supabase.from).mockReset();
      const limitFn = vi.fn().mockResolvedValue({
        data: [
          { id: 'f1', disciplina_id: 'd1', aluno_id: 'a1', presente: true, data_aula: '2026-05-01' },
          { id: 'f2', disciplina_id: 'd1', aluno_id: 'a2', presente: false, data_aula: '2026-05-01' },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({ limit: limitFn }),
          }),
        }),
      } as any);

      const resultado = await getFrequenciaByDisciplina('d1');

      expect(resultado).toHaveLength(2);
      expect(limitFn).toHaveBeenCalledWith(120);
    });

    it('retorna array vazio quando erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
            }),
          }),
        }),
      } as any);

      const resultado = await getFrequenciaByDisciplina('d1');

      expect(resultado).toEqual([]);
    });
  });

  describe('justificarFalta', () => {
    it('atualiza justificada=true com documento_url e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn = vi.fn().mockResolvedValue({ error: null });
      const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      const resultado = await justificarFalta('freq-1', 'https://doc.pdf');

      expect(resultado.error).toBeNull();
      const payload = updateFn.mock.calls[0][0];
      expect(payload.justificada).toBe(true);
      expect(payload.documento_url).toBe('https://doc.pdf');
    });

    it('retorna error quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'rls blocked' } }),
        }),
      } as any);

      const resultado = await justificarFalta('freq-1', 'https://doc.pdf');

      expect(resultado.error).toBe('rls blocked');
    });
  });

  describe('calcularResumosPorAluno', () => {
    it('calcula resumos corretos para múltiplos alunos sem queries', () => {
      const registros: RegistroFrequencia[] = [
        { id: 'f1', disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-01', presente: true, tipo_presenca: 'presente',  justificada: false, documento_url: null, observacao: null, registrado_em: '' },
        { id: 'f2', disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-08', presente: true, tipo_presenca: 'presente',  justificada: false, documento_url: null, observacao: null, registrado_em: '' },
        { id: 'f3', disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-15', presente: false, tipo_presenca: 'falta', justificada: true,  documento_url: null, observacao: null, registrado_em: '' },
        { id: 'f4', disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-22', presente: false, tipo_presenca: 'falta', justificada: false, documento_url: null, observacao: null, registrado_em: '' },
        { id: 'f5', disciplina_id: 'd1', aluno_id: 'a2', professor_id: 'p1', data_aula: '2026-05-01', presente: true, tipo_presenca: 'presente',  justificada: false, documento_url: null, observacao: null, registrado_em: '' },
        { id: 'f6', disciplina_id: 'd1', aluno_id: 'a2', professor_id: 'p1', data_aula: '2026-05-08', presente: true, tipo_presenca: 'presente',  justificada: false, documento_url: null, observacao: null, registrado_em: '' },
      ];

      const resultado = calcularResumosPorAluno(registros);

      // a1: 4 aulas, 2 presenças = 50% → reprovado
      const resumoA1 = resultado.get('a1')!;
      expect(resumoA1.total_aulas).toBe(4);
      expect(resumoA1.presencas).toBe(2);
      expect(resumoA1.faltas_justificadas).toBe(1);
      expect(resumoA1.percentual_presenca).toBe(50);
      expect(resumoA1.status).toBe('reprovado');

      // a2: 2 aulas, 2 presenças = 100% → ok
      const resumoA2 = resultado.get('a2')!;
      expect(resumoA2.total_aulas).toBe(2);
      expect(resumoA2.percentual_presenca).toBe(100);
      expect(resumoA2.status).toBe('ok');
    });

    it('retorna Map vazio para array vazio', () => {
      const resultado = calcularResumosPorAluno([]);
      expect(resultado.size).toBe(0);
    });

    it('retorna percentual=100 e status=ok quando aluno não tem faltas', () => {
      const registros: RegistroFrequencia[] = [
        { id: 'f1', disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-01', presente: true, tipo_presenca: 'presente', justificada: false, documento_url: null, observacao: null, registrado_em: '' },
      ];
      const resultado = calcularResumosPorAluno(registros);
      expect(resultado.get('a1')?.status).toBe('ok');
    });
  });

  describe('getResumoFrequenciaBatch', () => {
    it('retorna Map vazio quando disciplinaIds está vazio', async () => {
      const resultado = await getResumoFrequenciaBatch('aluno-1', []);
      expect(resultado.size).toBe(0);
    });

    it('calcula resumo correto por disciplina para o aluno', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  { disciplina_id: 'd1', presente: true,  justificada: false },
                  { disciplina_id: 'd1', presente: true,  justificada: false },
                  { disciplina_id: 'd1', presente: false, justificada: false },
                  { disciplina_id: 'd1', presente: false, justificada: false },
                  { disciplina_id: 'd2', presente: true,  justificada: false },
                  { disciplina_id: 'd2', presente: true,  justificada: false },
                ],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const resultado = await getResumoFrequenciaBatch('aluno-1', ['d1', 'd2']);

      // d1: 4 aulas, 2 presenças = 50% → reprovado
      expect(resultado.get('d1')?.percentual_presenca).toBe(50);
      expect(resultado.get('d1')?.status).toBe('reprovado');
      // d2: 2 aulas, 2 presenças = 100% → ok
      expect(resultado.get('d2')?.percentual_presenca).toBe(100);
      expect(resultado.get('d2')?.status).toBe('ok');
    });

    it('retorna Map vazio quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
            }),
          }),
        }),
      } as any);

      const resultado = await getResumoFrequenciaBatch('aluno-1', ['d1']);

      expect(resultado.size).toBe(0);
    });

    // ─── ERR-LOGIC-005: esta função ficou fora da ponderação FP da 079/2.13f ──
    // Regressão que estes testes travam: FP contava como falta cheia (70% em vez de 80%).
    function mockBatch(data: unknown[]) {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data, error: null }),
            }),
          }),
        }),
      } as any);
    }

    const linhas = (disc: string, tipo: string, n: number) =>
      Array.from({ length: n }, () => ({
        disciplina_id: disc,
        tipo_presenca: tipo,
        presente: tipo === 'presente',
        justificada: false,
      }));

    it('FP ponderado: 7P + 2FP + 1F em 10 → 80% (não 70%) e faltas 2,0', async () => {
      mockBatch([
        ...linhas('d1', 'presente', 7),
        ...linhas('d1', 'meia', 2),
        ...linhas('d1', 'falta', 1),
      ]);

      const r = await getResumoFrequenciaBatch('aluno-1', ['d1']);

      expect(r.get('d1')?.total_aulas).toBe(10);
      expect(r.get('d1')?.presencas).toBe(7);              // só presenças cheias
      expect(r.get('d1')?.percentual_presenca).toBe(80);   // (7·1 + 2·0,5)/10 → 80
      expect(r.get('d1')?.faltas).toBe(2);                 // 1 falta + 2·0,5
      expect(r.get('d1')?.status).toBe('ok');
    });

    it('só presenças → 100%', async () => {
      mockBatch(linhas('d1', 'presente', 5));
      const r = await getResumoFrequenciaBatch('aluno-1', ['d1']);
      expect(r.get('d1')?.percentual_presenca).toBe(100);
      expect(r.get('d1')?.faltas).toBe(0);
    });

    it('faltas descontam: 6P + 4F em 10 → 60%', async () => {
      mockBatch([...linhas('d1', 'presente', 6), ...linhas('d1', 'falta', 4)]);
      const r = await getResumoFrequenciaBatch('aluno-1', ['d1']);
      expect(r.get('d1')?.percentual_presenca).toBe(60);
      expect(r.get('d1')?.faltas).toBe(4);
    });

    it('só meia-presença → 50% (FP vale metade, não zero)', async () => {
      mockBatch(linhas('d1', 'meia', 4));
      const r = await getResumoFrequenciaBatch('aluno-1', ['d1']);
      expect(r.get('d1')?.percentual_presenca).toBe(50);
      expect(r.get('d1')?.faltas).toBe(2);                 // 4 × 0,5
    });

    it('compat: linha antiga sem tipo_presenca cai no booleano `presente`', async () => {
      mockBatch([
        { disciplina_id: 'd1', presente: true,  justificada: false },
        { disciplina_id: 'd1', presente: false, justificada: false },
      ]);
      const r = await getResumoFrequenciaBatch('aluno-1', ['d1']);
      expect(r.get('d1')?.percentual_presenca).toBe(50);
    });
  });

  describe('getAlunosAbaixoLimite', () => {
    it('retorna apenas alunos abaixo do limite com nome (não UUID)', async () => {
      vi.mocked(supabase.from).mockReset();
      // 3 alunos: A=80%, B=60%, C=50% — apenas B e C abaixo de 75%
      // Supabase retorna join como array — aluno: [{ full_name, email }]
      const makeRow = (aluno_id: string, presente: boolean, nome: string, email: string) => ({
        aluno_id, presente, aluno: [{ full_name: nome, email }],
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                // aluno-A: 4 presenças / 5 aulas = 80%
                makeRow('aluno-A', true,  'Ana Silva',   'ana@itec.com'),
                makeRow('aluno-A', true,  'Ana Silva',   'ana@itec.com'),
                makeRow('aluno-A', true,  'Ana Silva',   'ana@itec.com'),
                makeRow('aluno-A', true,  'Ana Silva',   'ana@itec.com'),
                makeRow('aluno-A', false, 'Ana Silva',   'ana@itec.com'),
                // aluno-B: 3 presenças / 5 aulas = 60%
                makeRow('aluno-B', true,  'Bruno Costa', 'b@itec.com'),
                makeRow('aluno-B', true,  'Bruno Costa', 'b@itec.com'),
                makeRow('aluno-B', true,  'Bruno Costa', 'b@itec.com'),
                makeRow('aluno-B', false, 'Bruno Costa', 'b@itec.com'),
                makeRow('aluno-B', false, 'Bruno Costa', 'b@itec.com'),
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      const resultado = await getAlunosAbaixoLimite('disc-1', 75);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].aluno_id).toBe('aluno-B');
      expect(resultado[0].nome).toBe('Bruno Costa');  // nome real, não UUID
      expect(resultado[0].email).toBe('b@itec.com');
      expect(resultado[0].percentual).toBe(60);
    });
  });
});

// ─── getAlunosEmRiscoByTurma ──────────────────────────────────────────────────

// Helper: monta os 5 from() calls em ordem para getAlunosEmRiscoByTurma:
//   1. matriculas (profiles join) → alunos
//   2. matriculas_disciplina (outer) → discs
//   3. matriculas (inner subquery) → IDs
//   4. matriculas (para alunoByMatricula)
//   5. frequencia → freq data
function mockEmRiscoQueries({
  alunos = [{ aluno_id: 'a1', profiles: { full_name: 'João', avatar_url: null } }] as unknown[],
  discs = [{ matricula_id: 'mat-1', disciplina_id: 'disc-1', disciplinas_v2: { nome: 'NT I' } }] as unknown[],
  matRows = [{ id: 'mat-1', aluno_id: 'a1' }] as unknown[],
  freqData = [] as unknown[],
} = {}) {
  vi.mocked(supabase.from).mockReset();

  // 1. matriculas + profiles
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: alunos, error: null }),
        }),
      }),
    }),
  } as any);

  // 2. matriculas_disciplina (outer): select → in → limit
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: discs, error: null }),
      }),
    }),
  } as any);

  // 3. matriculas (inner subquery): select → eq → in → limit
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [{ id: 'mat-1' }], error: null }),
        }),
      }),
    }),
  } as any);

  // 4. matriculas (alunoByMatricula): select → eq → in → limit
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: matRows, error: null }),
        }),
      }),
    }),
  } as any);

  // 5. frequencia: select → in → in → limit
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: freqData, error: null }),
        }),
      }),
    }),
  } as any);
}

describe('getAlunosEmRiscoByTurma', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('retorna [] quando nenhum aluno matriculado na turma', async () => {
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    } as any);

    const resultado = await getAlunosEmRiscoByTurma('turma-vazia');

    expect(resultado).toEqual([]);
  });

  it('aluno com 1 disciplina abaixo do limite (60% < 75%) → aparece na lista', async () => {
    // 10 aulas, 6 presenças = 60%
    const freqData = Array.from({ length: 10 }, (_, i) => ({
      aluno_id: 'a1', disciplina_id: 'disc-1', presente: i < 6, justificada: false,
    }));
    mockEmRiscoQueries({ freqData });

    const resultado = await getAlunosEmRiscoByTurma('turma-1');

    expect(resultado).toHaveLength(1);
    expect(resultado[0].aluno_id).toBe('a1');
    expect(resultado[0].full_name).toBe('João');
    expect(resultado[0].disciplinas_em_risco).toHaveLength(1);
    expect(resultado[0].disciplinas_em_risco[0].disciplina_nome).toBe('NT I');
    expect(resultado[0].disciplinas_em_risco[0].frequencia_percent).toBe(60);
  });

  it('aluno com todas as disciplinas acima do limite (80%) → NÃO aparece', async () => {
    // 10 aulas, 8 presenças = 80% — acima do limite padrão 75%
    const freqData = Array.from({ length: 10 }, (_, i) => ({
      aluno_id: 'a1', disciplina_id: 'disc-1', presente: i < 8, justificada: false,
    }));
    mockEmRiscoQueries({ freqData });

    const resultado = await getAlunosEmRiscoByTurma('turma-1');

    expect(resultado).toHaveLength(0);
  });

  it('ordenação: aluno com menor percentual aparece primeiro', async () => {
    // a1: 50% na disc-1; a2: 65% na disc-1
    const alunos = [
      { aluno_id: 'a1', profiles: { full_name: 'Ana', avatar_url: null } },
      { aluno_id: 'a2', profiles: { full_name: 'Bruno', avatar_url: null } },
    ];
    const discs = [
      { matricula_id: 'mat-1', disciplina_id: 'disc-1', disciplinas_v2: { nome: 'NT I' } },
      { matricula_id: 'mat-2', disciplina_id: 'disc-1', disciplinas_v2: { nome: 'NT I' } },
    ];
    const matRows = [
      { id: 'mat-1', aluno_id: 'a1' },
      { id: 'mat-2', aluno_id: 'a2' },
    ];
    // a1: 5/10 = 50%; a2: 13/20 = 65%
    const freqData = [
      ...Array.from({ length: 10 }, (_, i) => ({ aluno_id: 'a1', disciplina_id: 'disc-1', presente: i < 5, justificada: false })),
      ...Array.from({ length: 20 }, (_, i) => ({ aluno_id: 'a2', disciplina_id: 'disc-1', presente: i < 13, justificada: false })),
    ];
    mockEmRiscoQueries({ alunos, discs, matRows, freqData });

    const resultado = await getAlunosEmRiscoByTurma('turma-1');

    expect(resultado).toHaveLength(2);
    expect(resultado[0].full_name).toBe('Ana');   // 50% — menor primeiro
    expect(resultado[1].full_name).toBe('Bruno'); // 65%
  });
});
