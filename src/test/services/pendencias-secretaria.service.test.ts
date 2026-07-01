import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getPendenciasSecretaria } from '@/services/dashboard.service';

// getPendenciasSecretaria dispara em paralelo (LICAO-026, queries separadas):
//   matriculas (funil, via .in().limit()) · documentos_aluno (.eq().limit())
//   taxa_matricula (.eq().limit()) · matriculas (ativas, via .eq().limit())
//   matriculas_disciplina (.select().limit()) · profiles (.select().in())
function mockTabelas(opts: {
  funil?: unknown[];
  docs?: unknown[];
  taxas?: unknown[];
  ativas?: unknown[];
  lancamentos?: unknown[];
  profiles?: unknown[];
}) {
  const { funil = [], docs = [], taxas = [], ativas = [], lancamentos = [], profiles = [] } = opts;
  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'matriculas') {
      return {
        select: () => ({
          in: () => ({ limit: () => Promise.resolve({ data: funil, error: null }) }),   // funil pendente
          eq: () => ({ limit: () => Promise.resolve({ data: ativas, error: null }) }),   // status='ativa'
        }),
      } as any;
    }
    if (table === 'documentos_aluno') {
      return { select: () => ({ eq: () => ({ limit: () => Promise.resolve({ data: docs, error: null }) }) }) } as any;
    }
    if (table === 'taxa_matricula') {
      return { select: () => ({ eq: () => ({ limit: () => Promise.resolve({ data: taxas, error: null }) }) }) } as any;
    }
    if (table === 'matriculas_disciplina') {
      return { select: () => ({ limit: () => Promise.resolve({ data: lancamentos, error: null }) }) } as any;
    }
    if (table === 'profiles') {
      return { select: () => ({ in: () => Promise.resolve({ data: profiles, error: null }) }) } as any;
    }
    return {} as any;
  });
}

beforeEach(() => { vi.clearAllMocks(); });

describe('getPendenciasSecretaria', () => {
  it('compõe as 4 filas com contagem, itens e nomes (com pendências)', async () => {
    mockTabelas({
      funil: [
        { id: 'm1', aluno_id: 'a1', status: 'pendente' },
        { id: 'm2', aluno_id: 'a2', status: 'aguardando_documentos' },
      ],
      docs:  [{ aluno_id: 'a3', tipo: 'RG' }],
      taxas: [{ aluno_id: 'a4' }],
      // 2 matrículas ativas: m3 sem turma; m4 com turma mas sem lançamento
      ativas: [
        { id: 'm3', aluno_id: 'a5', turma_id: null },
        { id: 'm4', aluno_id: 'a6', turma_id: 't1' },
      ],
      lancamentos: [], // nenhuma disciplina lançada → m4 é sem_lancamento
      profiles: [
        { id: 'a1', full_name: 'Ana' },   { id: 'a2', full_name: 'Bia' },
        { id: 'a3', full_name: 'Caio' },  { id: 'a4', full_name: 'Davi' },
        { id: 'a5', full_name: 'Eva' },   { id: 'a6', full_name: 'Foca' },
      ],
    });

    const p = await getPendenciasSecretaria();

    expect(p.matriculasPendentes.count).toBe(2);
    expect(p.matriculasPendentes.itens[0]).toEqual({ aluno_id: 'a1', nome: 'Ana', detalhe: 'pendente' });

    expect(p.documentosPendentes.count).toBe(1);
    expect(p.documentosPendentes.itens[0]).toEqual({ aluno_id: 'a3', nome: 'Caio', detalhe: 'RG' });

    expect(p.taxasPendentes.count).toBe(1);
    expect(p.taxasPendentes.itens[0].nome).toBe('Davi');

    // F1 — m3 sem turma, m4 sem lançamento
    expect(p.alunosSemVinculo.count).toBe(2);
    const motivos = p.alunosSemVinculo.itens.map(i => i.detalhe);
    expect(motivos).toContain('Sem turma');
    expect(motivos).toContain('Sem lançamento');
  });

  it('matrícula ativa COM turma E com lançamento não conta como sem vínculo', async () => {
    mockTabelas({
      ativas: [{ id: 'm4', aluno_id: 'a6', turma_id: 't1' }],
      lancamentos: [{ matricula_id: 'm4' }],
      profiles: [{ id: 'a6', full_name: 'Foca' }],
    });

    const p = await getPendenciasSecretaria();
    expect(p.alunosSemVinculo.count).toBe(0);
  });

  it('sem pendências → contagens zeradas e estado vazio', async () => {
    mockTabelas({});
    const p = await getPendenciasSecretaria();
    expect(p.matriculasPendentes.count).toBe(0);
    expect(p.documentosPendentes.count).toBe(0);
    expect(p.taxasPendentes.count).toBe(0);
    expect(p.alunosSemVinculo.count).toBe(0);
    expect(p.matriculasPendentes.itens).toEqual([]);
  });
});
