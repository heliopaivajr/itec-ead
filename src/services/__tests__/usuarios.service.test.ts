import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRolesPermitidas, getAlunos, solicitarExclusao, recusarExclusao, executarExclusao } from '../usuarios.service';
import { supabase } from '@/lib/supabase';

// ─── getRolesPermitidas ───────────────────────────────────────────────────────

describe('getRolesPermitidas', () => {

  describe('superadmin', () => {
    it('pode atribuir qualquer role, incluindo superadmin', () => {
      const roles = getRolesPermitidas('superadmin', 'pendente');
      expect(roles).toContain('superadmin');
      expect(roles).toContain('admin');
      expect(roles).toContain('aluno');
    });

    it('pode alterar um admin', () => {
      const roles = getRolesPermitidas('superadmin', 'admin');
      expect(roles).toContain('admin');
      expect(roles).toContain('superadmin');
    });
  });

  describe('admin', () => {
    it('pode promover professor para administracao', () => {
      const roles = getRolesPermitidas('admin', 'professor');
      expect(roles).toContain('administracao');
    });

    it('não pode alterar superadmin (retorna vazio)', () => {
      expect(getRolesPermitidas('admin', 'superadmin')).toEqual([]);
    });

    it('não inclui superadmin nas opções ao alterar admin', () => {
      const roles = getRolesPermitidas('admin', 'admin');
      expect(roles).not.toContain('superadmin');
    });
  });

  describe('administracao', () => {
    it('converte pendente → aluno ou professor', () => {
      expect(getRolesPermitidas('administracao', 'pendente')).toEqual(['aluno', 'professor']);
    });

    it('converte aluno → inativo, suspenso ou trancado', () => {
      expect(getRolesPermitidas('administracao', 'aluno')).toEqual(['inativo', 'suspenso', 'trancado']);
    });

    it('não pode alterar admin (retorna vazio)', () => {
      expect(getRolesPermitidas('administracao', 'admin')).toEqual([]);
    });

    it('não pode alterar superadmin (retorna vazio)', () => {
      expect(getRolesPermitidas('administracao', 'superadmin')).toEqual([]);
    });
  });

  describe('roles sem permissão de alterar', () => {
    it('professor não pode alterar ninguém (retorna vazio)', () => {
      expect(getRolesPermitidas('professor', 'aluno')).toEqual([]);
    });

    it('aluno não pode alterar ninguém (retorna vazio)', () => {
      expect(getRolesPermitidas('aluno', 'aluno')).toEqual([]);
    });
  });

});

// ─── getAlunos ────────────────────────────────────────────────────────────────

describe('getAlunos', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('filtra apenas roles aluno e pendente via .in()', async () => {
    const inSpy = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      }),
    });
    const selectSpy = vi.fn().mockReturnValue({ in: inSpy });
    vi.mocked(supabase.from).mockReturnValueOnce({ select: selectSpy } as never);

    await getAlunos(1, 20, '');

    expect(inSpy).toHaveBeenCalledWith('role', ['aluno', 'pendente']);
  });

  it('retorna total correto vindo do banco (não filtra em memória)', async () => {
    const mockData = [
      { id: '1', full_name: 'Aluno 1', role: 'aluno', created_at: '2026-01-01', matriculas: [] },
    ];
    const builder = {
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockData, count: 42, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue(builder),
    } as never);

    const result = await getAlunos(1, 20, '');
    expect(result.total).toBe(42);
    expect(result.data).toHaveLength(1);
  });

  it('aplica filtro de search com .or() quando search não é vazio', async () => {
    const orSpy = vi.fn().mockReturnThis();
    // range deve retornar o builder (não Promise) para que .or() possa ser encadeado depois
    const builder: Record<string, unknown> = {
      in:    vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      or:    orSpy,
      // thenable — resolve na hora do await
      then: (resolve: (v: unknown) => void) =>
        resolve({ data: [], count: 0, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue(builder),
    } as never);

    await getAlunos(1, 20, 'joao');

    expect(orSpy).toHaveBeenCalledWith(
      expect.stringContaining('full_name.ilike.%joao%')
    );
  });

  it('retorna { data: [], total: 0 } quando banco retorna erro', async () => {
    const builder = {
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: null, count: null, error: { message: 'DB error' } }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue(builder),
    } as never);

    const result = await getAlunos(1, 20, '');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ─── Fila de exclusão ─────────────────────────────────────────────────────────

describe('solicitarExclusao', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('administracao pode solicitar → chama update com campos preenchidos', async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    vi.mocked(supabase.from)
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { role: 'administracao' }, error: null }) }) }) } as never)
      .mockReturnValueOnce({ update: updateSpy } as never);

    const result = await solicitarExclusao('userId', 'Motivo', 'requesterId');
    expect(result.error).toBeNull();
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ exclusao_motivo: 'Motivo' })
    );
  });

  it('professor NÃO pode solicitar → retorna erro de permissão', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { role: 'professor' }, error: null }) }) }) } as never);

    const result = await solicitarExclusao('userId', 'Motivo', 'profId');
    expect(result.error).toMatch(/permissão/i);
  });

  it('aluno NÃO pode solicitar → retorna erro de permissão', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { role: 'aluno' }, error: null }) }) }) } as never);

    const result = await solicitarExclusao('userId', 'Motivo', 'alunoId');
    expect(result.error).toMatch(/permissão/i);
  });
});

describe('recusarExclusao', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('superadmin pode recusar → limpa campos de exclusão', async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    vi.mocked(supabase.from)
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { role: 'superadmin' }, error: null }) }) }) } as never)
      .mockReturnValueOnce({ update: updateSpy } as never);

    const result = await recusarExclusao('userId', 'superadminId');
    expect(result.error).toBeNull();
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ exclusao_solicitada_em: null, exclusao_motivo: null })
    );
  });

  it('admin pode recusar → limpa campos', async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    vi.mocked(supabase.from)
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }) }) }) } as never)
      .mockReturnValueOnce({ update: updateSpy } as never);

    const result = await recusarExclusao('userId', 'adminId');
    expect(result.error).toBeNull();
  });

  it('administracao NÃO pode recusar → retorna erro', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { role: 'administracao' }, error: null }) }) }) } as never);

    const result = await recusarExclusao('userId', 'secretariaId');
    expect(result.error).toMatch(/permissão/i);
  });
});

describe('executarExclusao', () => {
  it('retorna erro explicativo sobre Edge Function', async () => {
    const result = await executarExclusao('userId', 'requesterId');
    expect(result.error).toMatch(/Edge Function/i);
  });

  it('não faz nenhuma chamada ao supabase (retorna cedo)', async () => {
    const fromSpy = vi.mocked(supabase.from);
    fromSpy.mockClear();
    await executarExclusao('userId', 'requesterId');
    // supabase.from não deve ser chamado — o service retorna antes de qualquer I/O
    expect(fromSpy).not.toHaveBeenCalled();
  });
});
