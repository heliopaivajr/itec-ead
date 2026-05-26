import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getResumoFinanceiroAluno,
  registrarPagamentoMensalidade,
  gerarMensalidadesMes,
} from '@/services/financeiro.service';

const ONTEM = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
const AMANHA = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

// Mock de getMensalidadesByAluno (chain: from().select().eq().order())
function mockMensalidades(data: any[]) {
  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data, error: null }),
      }),
    }),
  } as any);
}

beforeEach(() => { vi.clearAllMocks(); });

describe('financeiro.service', () => {
  describe('getResumoFinanceiroAluno', () => {
    it('retorna em_dia=true quando não há mensalidades atrasadas', async () => {
      mockMensalidades([
        { id: 'm1', aluno_id: 'a1', valor: 200, mes_referencia: '2026-04-01', data_vencimento: AMANHA, status: 'pago' },
        { id: 'm2', aluno_id: 'a1', valor: 200, mes_referencia: '2026-05-01', data_vencimento: AMANHA, status: 'pendente' },
      ]);

      const resumo = await getResumoFinanceiroAluno('aluno-1');

      expect(resumo.em_dia).toBe(true);
      expect(resumo.mensalidades_atrasadas).toBe(0);
    });

    it('retorna em_dia=false quando há mensalidades com vencimento passado', async () => {
      mockMensalidades([
        { id: 'm1', aluno_id: 'a1', valor: 200, mes_referencia: '2026-03-01', data_vencimento: ONTEM, status: 'pendente' },
        { id: 'm2', aluno_id: 'a1', valor: 200, mes_referencia: '2026-04-01', data_vencimento: ONTEM, status: 'atrasado' },
      ]);

      const resumo = await getResumoFinanceiroAluno('aluno-1');

      expect(resumo.em_dia).toBe(false);
      expect(resumo.mensalidades_atrasadas).toBe(2);
      expect(resumo.total_pendente).toBe(400);
    });
  });

  describe('registrarPagamentoMensalidade', () => {
    it('atualiza status para pago com data, comprovante e registrador', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn    = vi.fn().mockResolvedValue({ error: null });
      const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      const resultado = await registrarPagamentoMensalidade(
        'mens-1', '2026-05-26', 'https://comprovante.pdf', 'secretaria-1'
      );

      expect(resultado.error).toBeNull();
      const payload = updateFn.mock.calls[0][0];
      expect(payload.status).toBe('pago');
      expect(payload.data_pagamento).toBe('2026-05-26');
      expect(payload.comprovante_url).toBe('https://comprovante.pdf');
      expect(payload.registrado_por).toBe('secretaria-1');
    });

    it('retorna erro quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'update failed' } }),
        }),
      } as any);

      const resultado = await registrarPagamentoMensalidade('m-1', '2026-05-26', '', 'sec-1');

      expect(resultado.error).toBe('update failed');
    });
  });

  describe('gerarMensalidadesMes', () => {
    it('insere mensalidades para todos os alunos com matrícula ativa', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from)
        // Chamada 1: buscar matrículas ativas
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id: 'mat-1', aluno_id: 'aluno-A' },
                { id: 'mat-2', aluno_id: 'aluno-B' },
                { id: 'mat-3', aluno_id: 'aluno-C' },
              ],
              error: null,
            }),
          }),
        } as any)
        // Chamada 2: insert batch mensalidades
        .mockReturnValueOnce({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        } as any);

      const resultado = await gerarMensalidadesMes('2026-06-01', 200, '2026-06-10', 'admin-1');

      expect(resultado.geradas).toBe(3);
      expect(resultado.error).toBeNull();
    });

    it('retorna geradas=0 quando não há matrículas ativas', async () => {
      vi.mocked(supabase.from).mockReset();
      // Mesmo com array vazio, gerarMensalidadesMes chama upsert([], ...)
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any)
        .mockReturnValueOnce({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        } as any);

      const resultado = await gerarMensalidadesMes('2026-06-01', 200, '2026-06-10', 'admin-1');

      expect(resultado.geradas).toBe(0);
      expect(resultado.error).toBeNull();
    });

    it('retorna erro quando busca de matrículas falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
        }),
      } as any);

      const resultado = await gerarMensalidadesMes('2026-06-01', 200, '2026-06-10', 'admin-1');

      expect(resultado.geradas).toBe(0);
      expect(resultado.error).toBe('db error');
    });
  });
});
