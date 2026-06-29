import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';

// Mantém calcularStatus real; stuba só o batch de notas.
vi.mock('@/services/notas.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/notas.service')>();
  return { ...actual, getNotasBatchByAluno: vi.fn().mockResolvedValue(new Map()) };
});
vi.mock('@/services/frequencia.service', () => ({
  getResumoFrequenciaBatch: vi.fn().mockResolvedValue(new Map()),
}));

import { getHistoricoAluno } from '@/services/academico.service';
import { getNotasBatchByAluno } from '@/services/notas.service';
import { getResumoFrequenciaBatch } from '@/services/frequencia.service';

function disc(over: Record<string, unknown> = {}) {
  return {
    disciplina_id: over.disciplina_id ?? 'd1',
    nota: over.nota ?? null,
    status: over.status ?? 'cursando',
    frequencia_percentual: over.frequencia_percentual ?? null,
    disciplinas_v2: {
      id: over.disciplina_id ?? 'd1', nome: (over.nome as string) ?? 'Disciplina X',
      carga_horaria_presencial: 30, creditos: (over.creditos as number) ?? 4, modulo_id: 'm1',
      modulos: { id: 'm1', nome: 'Módulo 1', ordem: 1 },
    },
  };
}

function mockHistorico(rows: unknown[]) {
  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'matriculas') {
      return { select: () => ({ eq: () => ({ eq: () => ({ limit: () => ({ single: () => Promise.resolve({ data: { id: 'mat-1' }, error: null }) }) }) }) }) } as any;
    }
    if (table === 'matriculas_disciplina') {
      return { select: () => ({ eq: () => ({ limit: () => Promise.resolve({ data: rows, error: null }) }) }) } as any;
    }
    return {} as any;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getNotasBatchByAluno).mockResolvedValue(new Map());
  vi.mocked(getResumoFrequenciaBatch).mockResolvedValue(new Map());
});

describe('getHistoricoAluno — G4 consolidado × fallback', () => {
  it('PREFERE os valores consolidados de matriculas_disciplina', async () => {
    mockHistorico([disc({ nota: 8, status: 'aprovado', frequencia_percentual: 90, creditos: 4 })]);

    const h = await getHistoricoAluno('a1', 't1');
    const d = h.modulos[0].disciplinas[0];
    expect(d.consolidado).toBe(true);
    expect(d.notas.media_final).toBe(8);
    expect(d.frequencia.percentual).toBe(90);
    expect(d.status).toBe('aprovado_direto');
    expect(d.status_disciplina).toBe('aprovado');
    expect(h.disciplinas_aprovadas).toBe(1);
    expect(h.creditos_aprovados).toBe(4);
  });

  it('FALLBACK para parciais (notas_aluno + frequencia) quando não há consolidado', async () => {
    mockHistorico([disc({ nota: null, status: 'cursando', frequencia_percentual: null, creditos: 4 })]);
    vi.mocked(getNotasBatchByAluno).mockResolvedValue(new Map([['d1', { n1: 8, n2: 8, recuperacao: null, media: 8 }]]));
    vi.mocked(getResumoFrequenciaBatch).mockResolvedValue(new Map([['d1', { percentual_presenca: 90, total_aulas: 10, presencas: 9 } as any]]));

    const h = await getHistoricoAluno('a1', 't1');
    const d = h.modulos[0].disciplinas[0];
    expect(d.consolidado).toBe(false);
    expect(d.notas.media_final).toBe(8);
    expect(d.frequencia.percentual).toBe(90);
    expect(d.status).toBe('aprovado_direto');
    expect(h.creditos_aprovados).toBe(4);
  });

  it('conta créditos aprovados incluindo convalidado', async () => {
    mockHistorico([
      disc({ disciplina_id: 'd1', nota: 9, status: 'aprovado', frequencia_percentual: 95, creditos: 4 }),
      disc({ disciplina_id: 'd2', nota: null, status: 'convalidado', frequencia_percentual: null, creditos: 6 }),
    ]);

    const h = await getHistoricoAluno('a1', 't1');
    expect(h.disciplinas_aprovadas).toBe(2);
    expect(h.creditos_aprovados).toBe(10);
    const convalidada = h.modulos[0].disciplinas.find(x => x.id === 'd2')!;
    expect(convalidada.status).toBe('convalidado');
    expect(convalidada.status_disciplina).toBe('convalidado');
  });

  it('reprovado_falta consolidado vira reprovado_falta no histórico', async () => {
    mockHistorico([disc({ nota: 9, status: 'reprovado_falta', frequencia_percentual: 50, creditos: 4 })]);
    const h = await getHistoricoAluno('a1', 't1');
    const d = h.modulos[0].disciplinas[0];
    expect(d.status).toBe('reprovado_falta');
    expect(h.disciplinas_reprovadas).toBe(1);
    expect(h.creditos_aprovados).toBe(0);
  });
});
