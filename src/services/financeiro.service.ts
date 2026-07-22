import { supabase } from '@/lib/supabase';

export interface TaxaMatricula {
  id: string;
  aluno_id: string;
  matricula_id: string | null;
  valor: number;
  status: 'pendente' | 'pago' | 'isento';
  data_vencimento: string | null;
  data_pagamento: string | null;
  comprovante_url: string | null;
  registrado_por: string | null;
  observacoes: string | null;
  criado_em: string;
}

export interface Mensalidade {
  id: string;
  aluno_id: string;
  matricula_id: string | null;
  valor: number;
  mes_referencia: string;
  data_vencimento: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'isento' | 'cancelado';
  data_pagamento: string | null;
  valor_com_atraso?: number | null;   // 070 — snapshot da multa (após dia 10)
  comprovante_url: string | null;
  registrado_por: string | null;
  observacoes: string | null;
  criado_em: string;
}

export interface ResumoFinanceiro {
  em_dia: boolean;
  total_pendente: number;
  mensalidades_atrasadas: number;
  proxima_mensalidade: Mensalidade | null;
}

export interface Inadimplente {
  aluno_id: string;
  nome: string;
  email: string;
  mensalidades_atrasadas: number;
  valor_total: number;
}

export interface ServiceResult {
  error: string | null;
}

// ─── Etapa 2b: valor efetivo por matrícula (069) ─────────────────────────────
// Régua no BANCO (resolver_valor_efetivo — LICAO-042): override ?? tabela_precos.
export interface ValoresEfetivos {
  matricula_id: string;
  ano: number;
  tipo_cobranca: 'disciplinas' | 'familia';
  qtd_disciplinas: number;
  valor_matricula_ate: number | null;
  valor_matricula_apos: number | null;
  valor_mensalidade_ate: number | null;
  valor_mensalidade_apos: number | null;
  origem_matricula: 'override' | 'tabela' | 'sem_tabela';
  origem_mensalidade: 'override' | 'tabela' | 'sem_tabela';
}

export async function getValoresEfetivos(matriculaId: string, ano?: number): Promise<ValoresEfetivos | null> {
  const { data, error } = await supabase.rpc('resolver_valor_efetivo', {
    p_matricula_id: matriculaId,
    ...(ano ? { p_ano: ano } : {}),
  });
  if (error) {
    console.error('[getValoresEfetivos]', error.message);
    return null;
  }
  const rows = (data as ValoresEfetivos[]) ?? [];
  return rows[0] ?? null;
}

export async function setValoresMatricula(params: {
  matriculaId: string;
  tipoCobranca: 'disciplinas' | 'familia';
  valorMatricula: number | null;      // null = limpa override (volta à tabela)
  valorMensalidade: number | null;    // null = limpa override
  observacao: string | null;          // justificativa → observacao_financeira
}): Promise<ServiceResult> {
  const { error } = await supabase.rpc('set_valores_matricula', {
    p_matricula_id:     params.matriculaId,
    p_tipo_cobranca:    params.tipoCobranca,
    p_valor_matricula:  params.valorMatricula,
    p_valor_mensalidade: params.valorMensalidade,
    p_observacao:       params.observacao,
  });
  if (error) {
    console.error('[setValoresMatricula]', error.message);
    return { error: error.message };
  }
  return { error: null };
}

// 2c.2: edição inline do valor da mensalidade (só o override — 072).
// Foca em valor_mensalidade_override, sem tocar tipo_cobranca/obs/taxa (evita
// perda de dado que set_valores_matricula causaria a partir da linha do preview).
export async function setValorMensalidadeOverride(
  matriculaId: string,
  valor: number | null,          // null = limpa override (volta à tabela)
): Promise<ServiceResult> {
  const { error } = await supabase.rpc('set_valor_mensalidade_override', {
    p_matricula_id: matriculaId,
    p_valor: valor,
  });
  if (error) {
    console.error('[setValorMensalidadeOverride]', error.message);
    return { error: error.message };
  }
  return { error: null };
}

export interface KpisFinanceiro {
  a_receber: number;        // soma de pendentes+atrasadas (todas)
  recebido_mes: number;     // soma de pagas com data_pagamento no mês corrente
  inadimplentes: number;    // alunos distintos com mensalidade vencida não paga
  valor_atrasado: number;   // soma das vencidas não pagas
}

// KPIs do painel do financeiro (FinanceiroView) — 1 query, agregação em JS.
// RLS: financeiro/staff leem todas as mensalidades (037); aluno veria só as suas.
export async function getKpisFinanceiro(): Promise<KpisFinanceiro> {
  const vazio: KpisFinanceiro = { a_receber: 0, recebido_mes: 0, inadimplentes: 0, valor_atrasado: 0 };

  const { data, error } = await supabase
    .from('mensalidades')
    .select('aluno_id, valor, status, data_vencimento, data_pagamento')
    .limit(3000); // ~250 alunos × 12 meses

  if (error || !data) {
    if (error) console.error('[getKpisFinanceiro]', error.message);
    return vazio;
  }

  const hoje    = new Date().toISOString().split('T')[0];
  const mesAtual = hoje.slice(0, 7); // YYYY-MM

  let aReceber = 0, recebidoMes = 0, valorAtrasado = 0;
  const alunosAtrasados = new Set<string>();

  for (const m of data as Pick<Mensalidade, 'aluno_id' | 'valor' | 'status' | 'data_vencimento' | 'data_pagamento'>[]) {
    const aberta = m.status === 'pendente' || m.status === 'atrasado';
    if (aberta) aReceber += m.valor;
    if (aberta && m.data_vencimento < hoje) {
      valorAtrasado += m.valor;
      alunosAtrasados.add(m.aluno_id);
    }
    if (m.status === 'pago' && m.data_pagamento?.startsWith(mesAtual)) recebidoMes += m.valor;
  }

  return {
    a_receber:      Math.round(aReceber * 100) / 100,
    recebido_mes:   Math.round(recebidoMes * 100) / 100,
    inadimplentes:  alunosAtrasados.size,
    valor_atrasado: Math.round(valorAtrasado * 100) / 100,
  };
}

export async function getTaxaMatricula(alunoId: string): Promise<TaxaMatricula | null> {
  const { data, error } = await supabase
    .from('taxa_matricula')
    .select('*')
    .eq('aluno_id', alunoId)
    .single();

  if (error || !data) return null;
  return data as TaxaMatricula;
}

export async function registrarPagamentoTaxa(
  alunoId: string,
  comprovanteUrl: string,
  registradoPor: string
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('taxa_matricula')
    .update({
      status:          'pago',
      data_pagamento:   new Date().toISOString().split('T')[0],
      comprovante_url:  comprovanteUrl,
      registrado_por:   registradoPor,
    })
    .eq('aluno_id', alunoId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function getMensalidadesByAluno(alunoId: string): Promise<Mensalidade[]> {
  const { data, error } = await supabase
    .from('mensalidades')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('mes_referencia', { ascending: false })
    .limit(60); // 5 anos × 12 meses

  if (error) return [];
  return (data as Mensalidade[]) ?? [];
}

export async function registrarPagamentoMensalidade(
  id: string,
  dataPagamento: string,
  comprovanteUrl: string,
  registradoPor: string
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('mensalidades')
    .update({
      status:          'pago',
      data_pagamento:   dataPagamento,
      comprovante_url:  comprovanteUrl,
      registrado_por:   registradoPor,
    })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function getInadimplentes(): Promise<Inadimplente[]> {
  const { data, error } = await supabase
    .from('mensalidades')
    .select('aluno_id, valor, profile:profiles!mensalidades_aluno_id_fkey(full_name, email)')
    .in('status', ['pendente', 'atrasado'])
    .lt('data_vencimento', new Date().toISOString().split('T')[0])
    .limit(200);

  if (error || !data) return [];

  type Row = { aluno_id: string; valor: number; profile: { full_name: string; email: string }[] };

  // Agrega por aluno em JS
  const porAluno = new Map<string, { nome: string; email: string; count: number; total: number }>();
  for (const m of data as unknown as Row[]) {
    const prof = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    const entry = porAluno.get(m.aluno_id) ?? {
      nome:  prof?.full_name ?? m.aluno_id,
      email: prof?.email ?? '',
      count: 0,
      total: 0,
    };
    entry.count++;
    entry.total += m.valor;
    porAluno.set(m.aluno_id, entry);
  }

  return Array.from(porAluno.entries())
    .map(([aluno_id, { nome, email, count, total }]) => ({
      aluno_id,
      nome,
      email,
      mensalidades_atrasadas: count,
      valor_total:            Math.round(total * 100) / 100,
    }))
    .sort((a, b) => b.mensalidades_atrasadas - a.mensalidades_atrasadas);
}

export async function getResumoFinanceiroAluno(alunoId: string): Promise<ResumoFinanceiro> {
  const mensalidades = await getMensalidadesByAluno(alunoId);

  const hoje     = new Date().toISOString().split('T')[0];
  const atrasadas = mensalidades.filter(
    m => (m.status === 'pendente' || m.status === 'atrasado') && m.data_vencimento < hoje
  );
  const pendentes = mensalidades.filter(m => m.status === 'pendente' || m.status === 'atrasado');
  const totalPendente = pendentes.reduce((s, m) => s + m.valor, 0);

  const proxima = mensalidades
    .filter(m => m.status === 'pendente' && m.data_vencimento >= hoje)
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))[0] ?? null;

  return {
    em_dia:                  atrasadas.length === 0,
    total_pendente:          Math.round(totalPendente * 100) / 100,
    mensalidades_atrasadas:  atrasadas.length,
    proxima_mensalidade:     proxima,
  };
}

// ─── Etapa 2c: geração por valor efetivo (070) ───────────────────────────────
// Régua e idempotência no BANCO (preview_/gerar_mensalidades_mes): valor efetivo
// (override ?? tabela × qtd) + ON CONFLICT DO NOTHING (nunca sobrescreve pago).

export interface PreviewMensalidade {
  matricula_id: string;
  aluno_id: string;
  nome: string;
  qtd_disciplinas: number;
  valor: number | null;            // até dia 10 (base)
  valor_com_atraso: number | null; // após dia 10
  origem: 'override' | 'tabela' | 'sem_tabela';
  ja_existe: boolean;
}

export async function previewGerarMensalidades(ano: number, mes: number): Promise<PreviewMensalidade[]> {
  const { data, error } = await supabase.rpc('preview_gerar_mensalidades', { p_ano: ano, p_mes: mes });
  if (error) {
    console.error('[previewGerarMensalidades]', error.message);
    return [];
  }
  return (data as PreviewMensalidade[]) ?? [];
}

export interface ResultadoGeracao {
  geradas: number;
  ja_existiam: number;
  sem_preco: number;
}

// Gera mensalidades pelo valor efetivo (idempotente). matriculaIds:
// undefined/null = todas as ativas (lote); lista = só as selecionadas (071).
export async function gerarMensalidadesMes(
  ano: number,
  mes: number,               // 1-12
  diaVencimento: number,     // ex.: 10
  registradoPor: string,
  matriculaIds?: string[] | null,
): Promise<{ resultado: ResultadoGeracao | null; error: string | null }> {
  const { data, error } = await supabase.rpc('gerar_mensalidades_mes', {
    p_ano: ano,
    p_mes: mes,
    p_dia_vencimento: diaVencimento,
    p_registrado_por: registradoPor,
    p_matricula_ids: matriculaIds && matriculaIds.length > 0 ? matriculaIds : null,
  });
  if (error) {
    console.error('[gerarMensalidadesMes]', error.message);
    return { resultado: null, error: error.message };
  }
  const row = (data as ResultadoGeracao[])?.[0] ?? null;
  return { resultado: row, error: null };
}
