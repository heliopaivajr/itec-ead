import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { createLead, getLeadsCount } from '@/services/leads.service';
import type { LeadPayload } from '@/services/leads.service';

const payload: LeadPayload = {
  nome:            'João Silva',
  email:           'joao@teste.com',
  telefone:        '81999999999',
  curso_interesse: 'teologia-livre',
};

// Monta o mock encadeado de supabase.from('leads_cursos').insert(...)
function mockInsert(result: { error: { message: string } | null; count?: number }) {
  const insertFn = vi.fn().mockResolvedValue(result);
  vi.mocked(supabase.from).mockReturnValue({ insert: insertFn } as any);
  return insertFn;
}

// Monta o mock encadeado de supabase.from('leads_cursos').select(..., head:true)
function mockSelectCount(count: number | null, error: any = null) {
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockResolvedValue({ count, error }),
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('leads.service', () => {
  describe('createLead', () => {
    it('insere lead com todos os campos obrigatórios e retorna success=true', async () => {
      mockInsert({ error: null });

      const result = await createLead(payload);

      expect(result).toEqual({ success: true, error: null, savedLocally: false });
      expect(supabase.from).toHaveBeenCalledWith('leads_cursos');
    });

    it('injeta interesse=candidato e lgpd_aceite=true automaticamente no payload', async () => {
      const insertFn = mockInsert({ error: null });

      await createLead(payload);

      const chamadaPayload = insertFn.mock.calls[0][0];
      expect(chamadaPayload.interesse).toBe('candidato');
      expect(chamadaPayload.lgpd_aceite).toBe(true);
      // Garante que o chamador não consegue sobrescrever lgpd_aceite
      expect(chamadaPayload.nome).toBe('João Silva');
      expect(chamadaPayload.email).toBe('joao@teste.com');
    });

    it('salva no localStorage quando Supabase retorna erro', async () => {
      mockInsert({ error: { message: 'connection failed' } });

      const result = await createLead(payload);

      expect(result.success).toBe(false);
      expect(result.savedLocally).toBe(true);
      expect(result.error).toBe('connection failed');

      const pendentes = JSON.parse(localStorage.getItem('leads_pendentes') ?? '[]');
      expect(pendentes).toHaveLength(1);
      expect(pendentes[0].nome).toBe('João Silva');
      expect(pendentes[0].lgpd_aceite).toBe(true);
    });

    it('retorna savedLocally=false quando localStorage também falha', async () => {
      mockInsert({ error: { message: 'db error' } });

      // Força localStorage.setItem a lançar erro
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage full');
      });

      const result = await createLead(payload);

      expect(result.success).toBe(false);
      expect(result.savedLocally).toBe(false);
      expect(result.error).toBe('db error');
    });
  });

  describe('getLeadsCount', () => {
    it('retorna contagem correta quando Supabase responde', async () => {
      mockSelectCount(42);

      const count = await getLeadsCount();

      expect(count).toBe(42);
    });

    it('retorna 0 quando count é null (erro ou tabela vazia)', async () => {
      mockSelectCount(null, { message: 'error' });

      const count = await getLeadsCount();

      expect(count).toBe(0);
    });
  });
});
