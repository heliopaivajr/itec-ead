import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  statusFromNota,
  anoDaMatricula,
  lancarDisciplinaRetroativa,
  editarLancamento,
  removerLancamento,
  gerarNumeroMatricula,
} from '@/services/matricula-academica.service';

beforeEach(() => { vi.clearAllMocks(); });

describe('statusFromNota (mapper puro)', () => {
  it('mapeia os status acadêmicos para os de matriculas_disciplina', () => {
    expect(statusFromNota('aprovado')).toBe('aprovado');
    expect(statusFromNota('reprovado_falta')).toBe('reprovado_falta');
    expect(statusFromNota('recuperacao')).toBe('recuperacao');   // estado válido próprio
    expect(statusFromNota('reprovado_nota')).toBe('reprovado');
    expect(statusFromNota('cursando')).toBe('cursando');
  });
});

describe('anoDaMatricula (pura)', () => {
  it('extrai o ano de 4 dígitos de semestre_ingresso', () => {
    expect(anoDaMatricula({ semestre_ingresso: '2024.2' })).toBe(2024);
    expect(anoDaMatricula({ semestre_ingresso: '2026/1' })).toBe(2026);
  });
  it('usa o ano de data_inicio quando não há semestre', () => {
    expect(anoDaMatricula({ data_inicio: '2025-03-10' })).toBe(2025);
  });
  it('fallback 2025 quando ausente', () => {
    expect(anoDaMatricula({})).toBe(2025);
  });
});

describe('lancarDisciplinaRetroativa', () => {
  function mockUpsert(result: { error: any }) {
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.from).mockReturnValue({ upsert: vi.fn().mockResolvedValue(result) } as any);
  }
  function payload() {
    return vi.mocked(supabase.from).mock.results[0].value.upsert.mock.calls[0][0];
  }

  it('deriva status=aprovado (nota>=7 e freq>=75) e faz upsert', async () => {
    mockUpsert({ error: null });
    const r = await lancarDisciplinaRetroativa({ matriculaId: 'm1', disciplinaId: 'd1', nota: 8, faltas: 2, frequencia: 90 });
    expect(r.error).toBeNull();
    expect(payload().status).toBe('aprovado');
    expect(payload().frequencia_percentual).toBe(90);
    expect(payload().faltas).toBe(2);
  });

  it('deriva status=reprovado_falta quando freq<75 (independe da nota)', async () => {
    mockUpsert({ error: null });
    await lancarDisciplinaRetroativa({ matriculaId: 'm1', disciplinaId: 'd1', nota: 9, frequencia: 60 });
    expect(payload().status).toBe('reprovado_falta');
  });

  it('deriva status=recuperacao quando média 5–6.9 e freq>=75', async () => {
    mockUpsert({ error: null });
    await lancarDisciplinaRetroativa({ matriculaId: 'm1', disciplinaId: 'd1', nota: 6, frequencia: 90 });
    expect(payload().status).toBe('recuperacao');
  });

  it('respeita statusOverride (ex.: convalidado)', async () => {
    mockUpsert({ error: null });
    await lancarDisciplinaRetroativa({ matriculaId: 'm1', disciplinaId: 'd1', nota: 3, frequencia: 10, statusOverride: 'convalidado' });
    expect(payload().status).toBe('convalidado');
  });

  it('propaga erro do banco', async () => {
    mockUpsert({ error: { message: 'rls' } });
    const r = await lancarDisciplinaRetroativa({ matriculaId: 'm1', disciplinaId: 'd1', nota: 8, frequencia: 90 });
    expect(r.error).toBe('rls');
  });
});

describe('editarLancamento', () => {
  it('recalcula status quando a nota muda (lê freq atual)', async () => {
    vi.mocked(supabase.from).mockReset();
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from)
      // 1. SELECT do registro atual (nota, frequencia_percentual)
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { nota: 8, frequencia_percentual: 90 }, error: null }) }) }),
      } as any)
      // 2. UPDATE
      .mockReturnValueOnce({ update: vi.fn().mockReturnValue({ eq: updateEq }) } as any);

    const r = await editarLancamento('l1', { nota: 6 });
    expect(r.error).toBeNull();
    const update = vi.mocked(supabase.from).mock.results[1].value.update.mock.calls[0][0];
    expect(update.nota).toBe(6);
    expect(update.status).toBe('recuperacao'); // 6 + freq 90 → recuperacao
  });

  it('usa statusOverride sem recalcular', async () => {
    vi.mocked(supabase.from).mockReset();
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ update: vi.fn().mockReturnValue({ eq: updateEq }) } as any);

    const r = await editarLancamento('l1', { observacao: 'ok', statusOverride: 'aprovado' });
    expect(r.error).toBeNull();
    const update = vi.mocked(supabase.from).mock.results[0].value.update.mock.calls[0][0];
    expect(update.status).toBe('aprovado');
    expect(update.observacao).toBe('ok');
  });
});

describe('removerLancamento (soft delete)', () => {
  it('marca status=trancado + observação (nunca DELETE)', async () => {
    vi.mocked(supabase.from).mockReset();
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });
    vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

    const r = await removerLancamento('l1', 'erro de digitação');
    expect(r.error).toBeNull();
    expect(updateFn.mock.calls[0][0]).toEqual({ status: 'trancado', observacao: 'erro de digitação' });
  });
});

describe('gerarNumeroMatricula (idempotente)', () => {
  it('retorna o número existente sem chamar a RPC', async () => {
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.from).mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { numero_matricula: 'ITEC25T001' }, error: null }) }) }),
    } as any);
    (supabase as any).rpc = vi.fn();

    const r = await gerarNumeroMatricula('m1', 2025);
    expect(r.numero).toBe('ITEC25T001');
    expect((supabase as any).rpc).not.toHaveBeenCalled();
  });

  it('gera via RPC e grava quando não há número', async () => {
    vi.mocked(supabase.from).mockReset();
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from)
      // 1. SELECT numero atual (null)
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { numero_matricula: null }, error: null }) }) }),
      } as any)
      // 2. UPDATE com o número gerado
      .mockReturnValueOnce({ update: vi.fn().mockReturnValue({ eq: updateEq }) } as any);
    (supabase as any).rpc = vi.fn().mockResolvedValue({ data: 'ITEC25T002', error: null });

    const r = await gerarNumeroMatricula('m1', 2025);
    expect(r.error).toBeNull();
    expect(r.numero).toBe('ITEC25T002');
    expect((supabase as any).rpc).toHaveBeenCalledWith('gerar_numero_matricula', { p_ano: 2025 });
  });

  it('deriva o ano da matrícula (semestre_ingresso) quando não há override', async () => {
    vi.mocked(supabase.from).mockReset();
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from)
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { numero_matricula: null, semestre_ingresso: '2024.2', data_inicio: null }, error: null }) }) }),
      } as any)
      .mockReturnValueOnce({ update: vi.fn().mockReturnValue({ eq: updateEq }) } as any);
    (supabase as any).rpc = vi.fn().mockResolvedValue({ data: 'ITEC24T001', error: null });

    const r = await gerarNumeroMatricula('m1'); // sem override → deriva 2024
    expect(r.numero).toBe('ITEC24T001');
    expect((supabase as any).rpc).toHaveBeenCalledWith('gerar_numero_matricula', { p_ano: 2024 });
  });
});
