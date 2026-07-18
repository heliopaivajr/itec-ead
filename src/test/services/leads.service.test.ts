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

      expect(result).toEqual({ success: true, error: null });
      expect(supabase.from).toHaveBeenCalledWith('leads_cursos');
    });

    it('injeta interesse=candidato e lgpd_aceite=true; NÃO envia criado_em (default no banco)', async () => {
      const insertFn = mockInsert({ error: null });

      await createLead(payload);

      const chamadaPayload = insertFn.mock.calls[0][0];
      expect(chamadaPayload.interesse).toBe('candidato');
      expect(chamadaPayload.lgpd_aceite).toBe(true);
      // 12.0: id/criado_em ficam por conta dos DEFAULTs do banco
      expect(chamadaPayload).not.toHaveProperty('criado_em');
      // Garante que o chamador não consegue sobrescrever lgpd_aceite
      expect(chamadaPayload.nome).toBe('João Silva');
      expect(chamadaPayload.email).toBe('joao@teste.com');
    });

    it('retorna success=false + error e LOGA o erro real quando o Supabase falha (12.0/LICAO-027)', async () => {
      mockInsert({ error: { message: 'connection failed' } });
      const spyErro = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await createLead(payload);

      expect(result).toEqual({ success: false, error: 'connection failed' });
      expect(spyErro).toHaveBeenCalled();
      // Sem fallback localStorage (removido no 12.0 — gravava no navegador do visitante)
      expect(localStorage.getItem('leads_pendentes')).toBeNull();
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
