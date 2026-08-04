// Datas — util único do projeto (SPEC-16 P0 · corrige o BUG 15.1 "-1 dia").
//
// ─── O PROBLEMA ──────────────────────────────────────────────────────────────
// Colunas `DATE` do Postgres (data_nascimento, data_vencimento, data_pagamento…)
// chegam como string PURA 'YYYY-MM-DD'. Por ECMA-262, `new Date('1990-03-15')`
// é interpretada como MEIA-NOITE UTC → em UTC-3 vira 14/03/1990 21:00 local →
// `toLocaleDateString('pt-BR')` exibia **14/03/1990**: um dia a menos.
//
// ─── A REGRA ─────────────────────────────────────────────────────────────────
// • date-only ('YYYY-MM-DD') → ancora ao MEIO-DIA local (`T12:00`): imune a
//   qualquer fuso de ±12h, então o dia exibido é sempre o dia digitado.
// • timestamptz (com hora/Z) → `new Date(iso)` NORMAL. Esses já estavam certos;
//   concatenar 'T12:00' neles geraria string inválida e quebraria o que funciona.

/** Casa exatamente uma data pura 'YYYY-MM-DD' (coluna DATE do Postgres). */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** true quando a string é uma data pura (sem hora) — coluna `DATE`. */
export function isDateOnly(iso: string): boolean {
  return DATE_ONLY.test(iso.trim());
}

/**
 * Converte uma string do banco em Date "segura para exibição":
 * date-only ancora ao meio-dia local; timestamptz passa direto.
 * Retorna `null` para vazio/nulo ou data inválida (nunca lança).
 */
export function parseDataLocal(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const valor = iso.trim();
  if (valor === '') return null;

  const d = isDateOnly(valor) ? new Date(`${valor}T12:00`) : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formata para pt-BR (dd/mm/aaaa) aplicando a regra date-only vs timestamptz.
 * Vazio/nulo/inválido → `fallback` (padrão '—').
 *
 * Use SEMPRE esta função para colunas `DATE`; para timestamptz ela também
 * funciona (mesmo resultado de antes), então serve como formatador único.
 */
export function formatDatePtBR(
  iso: string | null | undefined,
  fallback = '—'
): string {
  const d = parseDataLocal(iso);
  return d ? d.toLocaleDateString('pt-BR') : fallback;
}

/**
 * Formata mês/ano por extenso (ex.: 'agosto de 2026') — usado por referências
 * de mensalidade ('YYYY-MM-DD' ou 'YYYY-MM').
 */
export function formatMesAnoPtBR(
  iso: string | null | undefined,
  fallback = '—'
): string {
  if (!iso) return fallback;
  // 'YYYY-MM' não casa DATE_ONLY — normaliza para o dia 01 antes de parsear.
  const valor = /^\d{4}-\d{2}$/.test(iso.trim()) ? `${iso.trim()}-01` : iso;
  const d = parseDataLocal(valor);
  return d ? d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : fallback;
}
