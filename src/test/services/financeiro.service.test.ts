import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getResumoFinanceiroAluno,
  registrarPagamentoMensalidade,
  gerarMensalidadesMes,
} from '@/services/financeiro.service';

const ONTEM = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
const AMANHA = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

// Mock de getMensalidadesByAluno (chain: from().select().eq().order().limit())
function mockMensalidades(data: any[]) {
  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data, error: null }),
        }),
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

  describe('gerarMensalidadesMes (RPC — 070)', () => {
    it('retorna o resultado da geração (geradas/ja_existiam/sem_preco) da RPC', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [{ geradas: 3, ja_existiam: 1, sem_preco: 0 }], error: null,
      } as any);

      const { resultado, error } = await gerarMensalidadesMes(2026, 8, 10, 'admin-1');

      expect(error).toBeNull();
      expect(resultado).toEqual({ geradas: 3, ja_existiam: 1, sem_preco: 0 });
      expect(supabase.rpc).toHaveBeenCalledWith('gerar_mensalidades_mes', {
        p_ano: 2026, p_mes: 8, p_dia_vencimento: 10, p_registrado_por: 'admin-1', p_matricula_ids: null,
      });
    });

    it('geração SELETIVA: passa p_matricula_ids quando há seleção (071)', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [{ geradas: 2, ja_existiam: 0, sem_preco: 0 }], error: null,
      } as any);

      await gerarMensalidadesMes(2026, 8, 10, 'admin-1', ['mat-1', 'mat-2']);

      expect(supabase.rpc).toHaveBeenCalledWith('gerar_mensalidades_mes', {
        p_ano: 2026, p_mes: 8, p_dia_vencimento: 10, p_registrado_por: 'admin-1',
        p_matricula_ids: ['mat-1', 'mat-2'],
      });
    });

    it('lista vazia = lote (p_matricula_ids null)', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [{ geradas: 0, ja_existiam: 0, sem_preco: 0 }], error: null } as any);
      await gerarMensalidadesMes(2026, 8, 10, 'admin-1', []);
      expect(supabase.rpc).toHaveBeenCalledWith('gerar_mensalidades_mes', expect.objectContaining({ p_matricula_ids: null }));
    });

    it('idempotência: 2ª execução do mesmo mês retorna geradas=0 (não sobrescreve)', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [{ geradas: 0, ja_existiam: 3, sem_preco: 0 }], error: null,
      } as any);

      const { resultado } = await gerarMensalidadesMes(2026, 8, 10, 'admin-1');

      expect(resultado?.geradas).toBe(0);
      expect(resultado?.ja_existiam).toBe(3);
    });

    it('retorna erro quando a RPC falha', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: { message: 'db error' } } as any);

      const { resultado, error } = await gerarMensalidadesMes(2026, 8, 10, 'admin-1');

      expect(resultado).toBeNull();
      expect(error).toBe('db error');
    });
  });
});
