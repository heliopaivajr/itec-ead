import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getMatriculas,
  createMatricula,
  aprovarMatricula,
} from '@/services/matriculas.service';

beforeEach(() => { vi.clearAllMocks(); });

// ─── getMatriculas ────────────────────────────────────────────────────────────

describe('getMatriculas', () => {
  it('retorna lista paginada com total correto', async () => {
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [
              { id: 'm1', aluno_id: 'a1', status: 'pendente' },
              { id: 'm2', aluno_id: 'a2', status: 'ativa' },
            ],
            count: 25,
            error: null,
          }),
        }),
      }),
    } as any);

    const resultado = await getMatriculas();

    expect(resultado.data).toHaveLength(2);
    expect(resultado.total).toBe(25);
  });

  it('retorna { data: [], total: 0 } quando Supabase retorna erro', async () => {
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: null, count: null, error: { message: 'rls' } }),
        }),
      }),
    } as any);

    const resultado = await getMatriculas();

    expect(resultado.data).toEqual([]);
    expect(resultado.total).toBe(0);
  });
});

// ─── createMatricula ──────────────────────────────────────────────────────────

describe('createMatricula', () => {
  it('insere matrícula e retorna id gerado', async () => {
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'mat-novo' }, error: null }),
        }),
      }),
    } as any);

    const resultado = await createMatricula({ aluno_id: 'a1', status: 'pendente' });

    expect(resultado.error).toBeNull();
    expect(resultado.data?.id).toBe('mat-novo');
  });

  it('retorna error quando insert falha', async () => {
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'unique violation' } }),
        }),
      }),
    } as any);

    const resultado = await createMatricula({ aluno_id: 'a1', status: 'pendente' });

    expect(resultado.data).toBeNull();
    expect(resultado.error).toBe('unique violation');
  });
});

// ─── aprovarMatricula ─────────────────────────────────────────────────────────

// Helper: monta os 3 from() calls de aprovarMatricula em ordem:
//   1. user_roles.single() → role do requester
//   2. matriculas.single() → status atual
//   3. matriculas.update().eq() → resultado do update
function mockAprovarQueries({
  role = 'administracao',
  statusAtual = 'pendente',
  updateError = null as string | null,
} = {}) {
  vi.mocked(supabase.from).mockReset();

  // 1. user_roles → role
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
      }),
    }),
  } as any);

  // 2. matriculas → status atual
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { status: statusAtual }, error: null }),
      }),
    }),
  } as any);

  if (statusAtual !== 'pendente') return; // update não é chamado

  // 3. matriculas.update().eq()
  const updateFn = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: updateError ? { message: updateError } : null }),
  });
  vi.mocked(supabase.from).mockReturnValueOnce({
    update: updateFn,
  } as any);

  return updateFn;
}

describe('aprovarMatricula', () => {
  it('administracao pode aprovar matrícula pendente → status ativa', async () => {
    const updateFn = mockAprovarQueries({ role: 'administracao', statusAtual: 'pendente' });

    const resultado = await aprovarMatricula('mat-1', 'req-1');

    expect(resultado.error).toBeNull();
    expect(updateFn).toHaveBeenCalledOnce();
    const payload = updateFn.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.status).toBe('ativa');
    expect(payload.validado_por).toBe('req-1');
    expect(payload.validado_em).toBeDefined();
  });

  it('admin pode aprovar matrícula pendente', async () => {
    mockAprovarQueries({ role: 'admin', statusAtual: 'pendente' });

    const resultado = await aprovarMatricula('mat-1', 'req-admin');

    expect(resultado.error).toBeNull();
  });

  it('superadmin pode aprovar matrícula pendente', async () => {
    mockAprovarQueries({ role: 'superadmin', statusAtual: 'pendente' });

    const resultado = await aprovarMatricula('mat-1', 'req-super');

    expect(resultado.error).toBeNull();
  });

  it('professor NÃO pode aprovar → retorna erro de permissão', async () => {
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: 'professor' }, error: null }),
        }),
      }),
    } as any);

    const resultado = await aprovarMatricula('mat-1', 'req-prof');

    expect(resultado.error).toContain('Permissão');
    // update NÃO deve ter sido chamado — nenhum from() para update
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(1);
  });

  it('aluno NÃO pode aprovar → retorna erro de permissão', async () => {
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: 'aluno' }, error: null }),
        }),
      }),
    } as any);

    const resultado = await aprovarMatricula('mat-1', 'req-aluno');

    expect(resultado.error).toContain('Permissão');
  });

  it('matrícula já ativa → retorna erro de transição inválida', async () => {
    mockAprovarQueries({ role: 'administracao', statusAtual: 'ativa' });

    const resultado = await aprovarMatricula('mat-1', 'req-1');

    expect(resultado.error).toContain('pendente');
    // update NÃO deve ter sido chamado — apenas 2 from() calls (roles + status)
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(2);
  });

  it('validado_por e validado_em são preenchidos corretamente após aprovação', async () => {
    const before = new Date().toISOString();
    const updateFn = mockAprovarQueries({ role: 'administracao', statusAtual: 'pendente' });

    await aprovarMatricula('mat-1', 'secretaria-id');

    const payload = updateFn!.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.validado_por).toBe('secretaria-id');
    expect(typeof payload.validado_em).toBe('string');
    // validado_em deve ser uma data recente (após o início do teste)
    expect(new Date(payload.validado_em as string).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
  });
});
