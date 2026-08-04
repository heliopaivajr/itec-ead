import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { calcularStatus, getConsolidadoTurma, getAvaliacoesBatch } from '@/services/notas.service';
import { getAlunosOperacional } from '@/services/professor.service';
import { getResumoFrequenciaPorTurma } from '@/services/frequencia.service';

// getConsolidadoTurma semeia pela RPC do roster (058) + sobrepõe notas/frequência.
// Mockamos as duas dependências de service e a query de notas_aluno.
vi.mock('@/services/professor.service', () => ({ getAlunosOperacional: vi.fn() }));
vi.mock('@/services/frequencia.service', () => ({ getResumoFrequenciaPorTurma: vi.fn() }));

// notas_aluno: from().select().eq().eq().limit() → { data, error }
function mockNotasQuery(data: unknown[], error: unknown = null) {
  vi.mocked(supabase.from).mockReturnValue({
    select: () => ({ eq: () => ({ eq: () => ({ limit: () => Promise.resolve({ data, error }) }) }) }),
  } as any);
}

describe('calcularStatus — regras de negócio aprovadas (Hélio, 2026-05-28)', () => {
  // Casos-limite de APROVAÇÃO
  it('média 7.0 + frequência 75 → aprovado', () => {
    expect(calcularStatus(7.0, 75)).toBe('aprovado');
  });

  it('média 10 + frequência 100 → aprovado', () => {
    expect(calcularStatus(10, 100)).toBe('aprovado');
  });

  it('média 7.0 + frequência 76 → aprovado', () => {
    expect(calcularStatus(7.0, 76)).toBe('aprovado');
  });

  // Casos-limite de RECUPERAÇÃO
  it('média 6.9 + frequência 75 → recuperacao', () => {
    expect(calcularStatus(6.9, 75)).toBe('recuperacao');
  });

  it('média 5.0 + frequência 75 → recuperacao', () => {
    expect(calcularStatus(5.0, 75)).toBe('recuperacao');
  });

  it('média 5.0 + frequência 100 → recuperacao', () => {
    expect(calcularStatus(5.0, 100)).toBe('recuperacao');
  });

  // Casos-limite de REPROVADO POR NOTA
  it('média 4.9 + frequência 100 → reprovado_nota', () => {
    expect(calcularStatus(4.9, 100)).toBe('reprovado_nota');
  });

  it('média 0 + frequência 100 → reprovado_nota', () => {
    expect(calcularStatus(0, 100)).toBe('reprovado_nota');
  });

  // Casos-limite de REPROVADO POR FALTA
  it('frequência 74.9 + nota 10 → reprovado_falta (falta independe da nota)', () => {
    expect(calcularStatus(10, 74.9)).toBe('reprovado_falta');
  });

  it('frequência 74 + nota 10 → reprovado_falta', () => {
    expect(calcularStatus(10, 74)).toBe('reprovado_falta');
  });

  it('frequência 0 + nota 10 → reprovado_falta', () => {
    expect(calcularStatus(10, 0)).toBe('reprovado_falta');
  });

  it('frequência 74.9 + nota 7.0 → reprovado_falta (falta tem prioridade sobre aprovação)', () => {
    expect(calcularStatus(7.0, 74.9)).toBe('reprovado_falta');
  });

  it('frequência 74.9 + nota 5.0 → reprovado_falta (não recuperação)', () => {
    expect(calcularStatus(5.0, 74.9)).toBe('reprovado_falta');
  });

  // Caso SEM NOTAS
  it('média null → cursando (notas ainda não lançadas)', () => {
    expect(calcularStatus(null, 100)).toBe('cursando');
  });

  it('média null + frequência 0 → cursando (frequência só importa com nota)', () => {
    expect(calcularStatus(null, 0)).toBe('cursando');
  });
});

describe('getConsolidadoTurma — semeado pelo roster turma-aware (058)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('turma nova SEM nota → lista os matriculados (não vazia) + passa turmaId ao roster', async () => {
    vi.mocked(getAlunosOperacional).mockResolvedValue([
      { aluno_id: 'a1', full_name: 'João Silva', avatar_url: null, matricula_id: 'm1',
        nota: null, faltas: null, frequencia_percentual: null, status_disciplina: 'cursando' },
    ] as any);
    vi.mocked(getResumoFrequenciaPorTurma).mockResolvedValue(new Map());
    mockNotasQuery([]); // nenhuma nota lançada

    const r = await getConsolidadoTurma('t1', 'd1');

    expect(r).toHaveLength(1);               // ANTES do fix: vazia
    expect(r[0].nome).toBe('João Silva');    // nome vem do roster (sem embed profiles)
    expect(r[0].n1).toBeNull();
    expect(r[0].media).toBeNull();
    expect(r[0].frequencia).toBe(100);       // sem chamada e sem consolidado → 100
    expect(r[0].status).toBe('cursando');
    // escopo TURMA: a RPC recebe disciplina E turma
    expect(getAlunosOperacional).toHaveBeenCalledWith('d1', 't1');
  });

  it('aluno COM nota → n1/n2/média aparecem (merge por aluno_id) + freq ao vivo', async () => {
    vi.mocked(getAlunosOperacional).mockResolvedValue([
      { aluno_id: 'a1', full_name: 'João', avatar_url: null, matricula_id: 'm1',
        nota: null, faltas: null, frequencia_percentual: 80, status_disciplina: 'cursando' },
    ] as any);
    vi.mocked(getResumoFrequenciaPorTurma).mockResolvedValue(
      new Map([['a1', { percentual_presenca: 90 } as any]]),
    );
    mockNotasQuery([
      { aluno_id: 'a1', nota: 8, avaliacao: { tipo: 'N1' } },
      { aluno_id: 'a1', nota: 6, avaliacao: { tipo: 'N2' } },
    ]);

    const r = await getConsolidadoTurma('t1', 'd1');

    expect(r[0].n1).toBe(8);
    expect(r[0].n2).toBe(6);
    expect(r[0].media).toBe(7);              // (8+6)/2
    expect(r[0].frequencia).toBe(90);        // freq ao vivo sobrepõe o consolidado (80)
    expect(r[0].status).toBe('aprovado');    // média 7 + freq 90
  });

  it('sem chamada mas COM consolidado da matrícula → usa frequencia_percentual do roster', async () => {
    vi.mocked(getAlunosOperacional).mockResolvedValue([
      { aluno_id: 'a1', full_name: 'Maria', avatar_url: null, matricula_id: 'm1',
        nota: null, faltas: null, frequencia_percentual: 60, status_disciplina: 'cursando' },
    ] as any);
    vi.mocked(getResumoFrequenciaPorTurma).mockResolvedValue(new Map()); // sem registros ao vivo
    mockNotasQuery([]);

    const r = await getConsolidadoTurma('t1', 'd1');
    expect(r[0].frequencia).toBe(60);        // cai no consolidado (retroativo)
  });

  it('roster vazio (turma sem matrícula) → []', async () => {
    vi.mocked(getAlunosOperacional).mockResolvedValue([]);
    const r = await getConsolidadoTurma('t1', 'd1');
    expect(r).toEqual([]);
  });
});

// ─── getAvaliacoesBatch (SPEC-16 P2a) ────────────────────────────────────────
// avaliacoes: from().select().eq().in().in().order().limit() → { data, error }
function mockAvaliacoesQuery(data: unknown[], error: unknown = null) {
  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.from).mockReturnValue({
    select: () => ({
      eq: () => ({
        in: () => ({
          in: () => ({
            order: () => ({ limit: () => Promise.resolve({ data, error }) }),
          }),
        }),
      }),
    }),
  } as any);
}

describe('getAvaliacoesBatch — ids de avaliação para lançar nota no bruto', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('lista vazia de disciplinas → Map vazio, sem query', async () => {
    vi.mocked(supabase.from).mockReset();
    const r = await getAvaliacoesBatch('t1', []);
    expect(r.size).toBe(0);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('agrupa por disciplina e indexa por tipo', async () => {
    mockAvaliacoesQuery([
      { id: 'a1', disciplina_id: 'd1', tipo: 'N1' },
      { id: 'a2', disciplina_id: 'd1', tipo: 'N2' },
      { id: 'a3', disciplina_id: 'd2', tipo: 'N1' },
    ]);

    const r = await getAvaliacoesBatch('t1', ['d1', 'd2']);

    expect(r.get('d1')).toEqual({ N1: 'a1', N2: 'a2' });
    expect(r.get('d2')).toEqual({ N1: 'a3' });
  });

  it('disciplina sem avaliação não entra no Map (RN4 → criar no ato)', async () => {
    mockAvaliacoesQuery([{ id: 'a1', disciplina_id: 'd1', tipo: 'N1' }]);
    const r = await getAvaliacoesBatch('t1', ['d1', 'd2']);
    expect(r.get('d2')).toBeUndefined();
    expect(r.get('d1')?.N2).toBeUndefined();
  });

  it('duplicata do mesmo tipo → mantém a PRIMEIRA (mais antiga, sem UNIQUE no banco)', async () => {
    mockAvaliacoesQuery([
      { id: 'antiga', disciplina_id: 'd1', tipo: 'N1' },
      { id: 'nova',   disciplina_id: 'd1', tipo: 'N1' },
    ]);
    const r = await getAvaliacoesBatch('t1', ['d1']);
    expect(r.get('d1')?.N1).toBe('antiga');
  });

  it('erro na query → Map vazio (não lança)', async () => {
    mockAvaliacoesQuery(null as unknown as unknown[], { message: 'rls blocked' });
    const r = await getAvaliacoesBatch('t1', ['d1']);
    expect(r.size).toBe(0);
  });
});
