import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getMatriculas,
  createMatricula,
  aprovarMatricula,
  mudarStatusMatricula,
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

// ─── aprovarMatricula / mudarStatusMatricula (R3.2 Leva 2a) ─────────────────────

// Mock por tabela (branching). Cobre o fluxo:
//   user_roles.select().eq().single()  → role do requester
//   matriculas.select().eq().single()  → { status, aluno_id }
//   matriculas.update().eq()           → resultado
//   profiles.update().eq()             → efeito de acesso (role)
//   user_roles.upsert()                → cache de role
function mockStatusFlow({
  requesterRole = 'administracao',
  statusAtual = 'pendente',
  alunoId = 'a1',
  updateError = null as string | null,
} = {}) {
  const updateMatricula = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: updateError ? { message: updateError } : null }),
  });
  const updateProfiles = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const upsertRoles = vi.fn().mockResolvedValue({ error: null });

  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'user_roles') {
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: requesterRole }, error: null }) }) }),
        upsert: upsertRoles,
      } as any;
    }
    if (table === 'matriculas') {
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { status: statusAtual, aluno_id: alunoId }, error: null }) }) }),
        update: updateMatricula,
      } as any;
    }
    if (table === 'profiles') return { update: updateProfiles } as any;
    return {} as any;
  });

  return { updateMatricula, updateProfiles, upsertRoles };
}

describe('aprovarMatricula', () => {
  it('administracao aprova pendente → ativa + validado_* + libera acesso (role aluno)', async () => {
    const { updateMatricula, updateProfiles, upsertRoles } = mockStatusFlow({ statusAtual: 'pendente' });

    const r = await aprovarMatricula('mat-1', 'req-1');

    expect(r.error).toBeNull();
    const payload = updateMatricula.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.status).toBe('ativa');
    expect(payload.validado_por).toBe('req-1');
    expect(typeof payload.validado_em).toBe('string');
    // libera acesso
    expect(updateProfiles).toHaveBeenCalledWith({ role: 'aluno' });
    expect(upsertRoles).toHaveBeenCalledWith({ user_id: 'a1', role: 'aluno' });
  });

  it('aprova a partir de aguardando_aprovacao → ativa', async () => {
    const { updateMatricula, updateProfiles } = mockStatusFlow({ statusAtual: 'aguardando_aprovacao' });

    const r = await aprovarMatricula('mat-1', 'req-1');

    expect(r.error).toBeNull();
    expect((updateMatricula.mock.calls[0][0] as Record<string, unknown>).status).toBe('ativa');
    expect(updateProfiles).toHaveBeenCalledWith({ role: 'aluno' });
  });

  it('já ativa → idempotente (error null, sem novo update)', async () => {
    const { updateMatricula } = mockStatusFlow({ statusAtual: 'ativa' });

    const r = await aprovarMatricula('mat-1', 'req-1');

    expect(r.error).toBeNull();
    expect(updateMatricula).not.toHaveBeenCalled();
  });

  it('status não-aprovável (trancada) → erro', async () => {
    const { updateMatricula } = mockStatusFlow({ statusAtual: 'trancada' });

    const r = await aprovarMatricula('mat-1', 'req-1');

    expect(r.error).toBeTruthy();
    expect(updateMatricula).not.toHaveBeenCalled();
  });

  it('professor NÃO pode aprovar → erro de permissão', async () => {
    const { updateMatricula } = mockStatusFlow({ requesterRole: 'professor' });

    const r = await aprovarMatricula('mat-1', 'req-prof');

    expect(r.error).toContain('Permissão');
    expect(updateMatricula).not.toHaveBeenCalled();
  });
});

describe('mudarStatusMatricula', () => {
  it('novoStatus ativa → aplica validado_* e libera acesso (role aluno)', async () => {
    const { updateMatricula, updateProfiles, upsertRoles } = mockStatusFlow({ statusAtual: 'pendente' });

    const r = await mudarStatusMatricula('mat-1', 'ativa', 'ok', 'req-1');

    expect(r.error).toBeNull();
    const payload = updateMatricula.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.status).toBe('ativa');
    expect(payload.validado_por).toBe('req-1');
    expect(payload.observacoes).toBe('ok');
    expect(updateProfiles).toHaveBeenCalledWith({ role: 'aluno' });
    expect(upsertRoles).toHaveBeenCalledWith({ user_id: 'a1', role: 'aluno' });
  });

  it('saindo de ativa → revoga acesso (role pendente), sem validado_*', async () => {
    const { updateMatricula, updateProfiles, upsertRoles } = mockStatusFlow({ statusAtual: 'ativa' });

    const r = await mudarStatusMatricula('mat-1', 'trancada', undefined, 'req-1');

    expect(r.error).toBeNull();
    const payload = updateMatricula.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.status).toBe('trancada');
    expect(payload.validado_por).toBeUndefined();
    expect(updateProfiles).toHaveBeenCalledWith({ role: 'pendente' });
    expect(upsertRoles).toHaveBeenCalledWith({ user_id: 'a1', role: 'pendente' });
  });

  it('ativa → concluida NÃO revoga acesso (egresso mantém — exceção 2c)', async () => {
    const { updateMatricula, updateProfiles, upsertRoles } = mockStatusFlow({ statusAtual: 'ativa' });

    const r = await mudarStatusMatricula('mat-1', 'concluida', undefined, 'req-1');

    expect(r.error).toBeNull();
    expect((updateMatricula.mock.calls[0][0] as Record<string, unknown>).status).toBe('concluida');
    // egresso mantém acesso → nenhuma escrita de role
    expect(updateProfiles).not.toHaveBeenCalled();
    expect(upsertRoles).not.toHaveBeenCalled();
  });

  it('transição neutra (pendente → aguardando_pagamento) não mexe em acesso', async () => {
    const { updateProfiles, upsertRoles } = mockStatusFlow({ statusAtual: 'pendente' });

    const r = await mudarStatusMatricula('mat-1', 'aguardando_pagamento', undefined, 'req-1');

    expect(r.error).toBeNull();
    expect(updateProfiles).not.toHaveBeenCalled();
    expect(upsertRoles).not.toHaveBeenCalled();
  });

  it('não-staff → erro de permissão, sem update', async () => {
    const { updateMatricula } = mockStatusFlow({ requesterRole: 'aluno' });

    const r = await mudarStatusMatricula('mat-1', 'ativa', undefined, 'req-aluno');

    expect(r.error).toContain('Permissão');
    expect(updateMatricula).not.toHaveBeenCalled();
  });
});
