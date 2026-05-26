import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getAvisos, createAviso } from '@/services/avisos.service';

// chain: from().select().order().order() → resolves
function mockSelectOrders(result: { data: any; error: any }) {
  const finalOrder = vi.fn().mockResolvedValue(result);
  const firstOrder = vi.fn().mockReturnValue({ order: finalOrder });
  const selectFn   = vi.fn().mockReturnValue({ order: firstOrder });
  vi.mocked(supabase.from).mockReturnValue({ select: selectFn } as any);
}

// chain: from().insert() → resolves
function mockInsert(result: { error: any }) {
  vi.mocked(supabase.from).mockReturnValue({
    insert: vi.fn().mockResolvedValue(result),
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('avisos.service', () => {
  describe('getAvisos', () => {
    it('retorna lista de avisos com dados do autor', async () => {
      const avisosMock = [
        { id: '1', titulo: 'Aviso teste', autor: { full_name: 'Pastor João', role: 'admin' } },
      ];
      mockSelectOrders({ data: avisosMock, error: null });

      const result = await getAvisos();

      expect(result.error).toBeNull();
      expect(result.noTable).toBeFalsy();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].titulo).toBe('Aviso teste');
      expect(result.data[0].autor?.full_name).toBe('Pastor João');
    });

    it('retorna array vazio e propaga erro quando Supabase falha', async () => {
      mockSelectOrders({ data: null, error: { message: 'connection error', code: '500' } });

      const result = await getAvisos();

      expect(result.data).toEqual([]);
      expect(result.error).toBe('connection error');
      expect(result.noTable).toBe(false);
    });

    it('propaga noTable=true quando tabela não existe (código 42P01)', async () => {
      mockSelectOrders({
        data: null,
        error: { message: 'relation "avisos" does not exist', code: '42P01' },
      });

      const result = await getAvisos();

      expect(result.data).toEqual([]);
      expect(result.noTable).toBe(true);
    });
  });

  describe('createAviso', () => {
    it('cria aviso e retorna error=null', async () => {
      mockInsert({ error: null });

      const result = await createAviso({
        titulo:       'Novo aviso',
        autor_id:     'user-123',
        role_destino: 'todos',
      });

      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('avisos');
    });

    it('retorna mensagem de erro quando insert falha', async () => {
      mockInsert({ error: { message: 'insert failed — RLS blocked' } });

      const result = await createAviso({
        titulo:       'Novo aviso',
        autor_id:     'user-123',
        role_destino: 'alunos',
      });

      expect(result.error).toBe('insert failed — RLS blocked');
    });
  });
});
