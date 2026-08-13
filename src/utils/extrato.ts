import type { MensalidadeVw } from '@/services/financeiro.service';

// Resumo financeiro do extrato do aluno (SPEC-16 P3).
// Extraído de RelatoriosPorAluno para ser compartilhado com a Ficha do Aluno —
// a mesma conta em dois lugares vira duas réguas divergentes com o tempo.
//
// Cálculo em MEMÓRIA sobre `vw_mensalidades` (nenhuma query): a fonte já traz o
// `status_efetivo` resolvido pela view; aqui só agregamos.

export interface ResumoExtrato {
  total_pago: number;
  total_devido: number;
  maior_atraso_dias: number;
}

const MS_POR_DIA = 86_400_000;

/**
 * Agrega o extrato: total pago, total em aberto e o maior atraso em dias.
 *
 * @param hoje data de referência 'YYYY-MM-DD' (default: hoje). Parametrizado para o
 *             teste ser determinístico — em produção sempre usa o dia corrente.
 */
export function resumoExtrato(
  ms: MensalidadeVw[],
  hoje: string = new Date().toISOString().split('T')[0],
): ResumoExtrato {
  let total_pago = 0, total_devido = 0, maior = 0;

  for (const m of ms) {
    if (m.status_efetivo === 'pago') total_pago += (m.valor_pago ?? m.valor);

    if (m.status_efetivo === 'pendente' || m.status_efetivo === 'atrasado') {
      total_devido += m.valor;
      if (m.status_efetivo === 'atrasado') {
        // 'T12:00' nos dois lados: ancora ao meio-dia local e neutraliza o fuso
        // (mesma razão do utils/date — ver BUG 15.1).
        const dias = Math.round(
          (new Date(hoje + 'T12:00').getTime() - new Date(m.data_vencimento + 'T12:00').getTime()) / MS_POR_DIA,
        );
        maior = Math.max(maior, dias);
      }
    }
  }

  return {
    total_pago:        Math.round(total_pago * 100) / 100,
    total_devido:      Math.round(total_devido * 100) / 100,
    maior_atraso_dias: maior,
  };
}
