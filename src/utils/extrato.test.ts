import { describe, it, expect } from 'vitest';
import { resumoExtrato } from './extrato';
import type { MensalidadeVw } from '@/services/financeiro.service';

// Trava a régua do resumo financeiro (SPEC-16 P3). A função saiu de dentro de
// RelatoriosPorAluno para ser usada também pela Ficha do Aluno — estes testes
// garantem que o refactor não mudou o comportamento daquela tela.

const HOJE = '2026-08-12';

// Só os campos que a função lê; o resto de MensalidadeVw não participa do cálculo.
const m = (p: Partial<MensalidadeVw>): MensalidadeVw => ({
  status_efetivo: 'pendente',
  valor: 0,
  valor_pago: null,
  data_vencimento: HOJE,
  ...p,
} as MensalidadeVw);

describe('resumoExtrato', () => {
  it('lista vazia → tudo zero', () => {
    expect(resumoExtrato([], HOJE)).toEqual({ total_pago: 0, total_devido: 0, maior_atraso_dias: 0 });
  });

  it('total_pago usa valor_pago quando existe', () => {
    const r = resumoExtrato([m({ status_efetivo: 'pago', valor: 300, valor_pago: 280 })], HOJE);
    expect(r.total_pago).toBe(280);
    expect(r.total_devido).toBe(0);
  });

  it('total_pago cai no valor quando valor_pago é null', () => {
    const r = resumoExtrato([m({ status_efetivo: 'pago', valor: 300, valor_pago: null })], HOJE);
    expect(r.total_pago).toBe(300);
  });

  it('total_devido soma pendente + atrasado (não soma pago nem cancelado)', () => {
    const r = resumoExtrato([
      m({ status_efetivo: 'pendente',  valor: 100 }),
      m({ status_efetivo: 'atrasado',  valor: 150, data_vencimento: '2026-08-02' }),
      m({ status_efetivo: 'pago',      valor: 200, valor_pago: 200 }),
      m({ status_efetivo: 'cancelado', valor: 999 }),
    ], HOJE);
    expect(r.total_devido).toBe(250);   // 100 + 150
    expect(r.total_pago).toBe(200);
  });

  it('maior_atraso_dias = o atraso mais antigo entre as atrasadas', () => {
    const r = resumoExtrato([
      m({ status_efetivo: 'atrasado', valor: 100, data_vencimento: '2026-08-02' }), // 10 dias
      m({ status_efetivo: 'atrasado', valor: 100, data_vencimento: '2026-07-13' }), // 30 dias
      m({ status_efetivo: 'atrasado', valor: 100, data_vencimento: '2026-08-10' }), //  2 dias
    ], HOJE);
    expect(r.maior_atraso_dias).toBe(30);
  });

  it('pendente NÃO conta atraso (só atrasado conta)', () => {
    const r = resumoExtrato([
      m({ status_efetivo: 'pendente', valor: 100, data_vencimento: '2026-01-01' }),
    ], HOJE);
    expect(r.maior_atraso_dias).toBe(0);
    expect(r.total_devido).toBe(100);
  });

  it('arredonda para 2 casas (centavos não vazam)', () => {
    const r = resumoExtrato([
      m({ status_efetivo: 'pago',     valor: 0, valor_pago: 33.333 }),
      m({ status_efetivo: 'pendente', valor: 66.666 }),
    ], HOJE);
    expect(r.total_pago).toBe(33.33);
    expect(r.total_devido).toBe(66.67);
  });
});
