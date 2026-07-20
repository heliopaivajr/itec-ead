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

// Gera mensalidades para todos os alunos ativos no mês indicado
export async function gerarMensalidadesMes(
  mes: string,         // formato YYYY-MM-01
  valor: number,
  vencimento: string,  // formato YYYY-MM-DD
  registradoPor: string
): Promise<{ geradas: number; error: string | null }> {
  // Busca alunos com matrícula ativa
  const { data: matriculas, error: errMat } = await supabase
    .from('matriculas')
    .select('id, aluno_id')
    .eq('status', 'ativa')
    .limit(500);

  if (errMat || !matriculas) return { geradas: 0, error: errMat?.message ?? 'Erro ao buscar matrículas' };

  const registros = matriculas.map(m => ({
    aluno_id:        m.aluno_id,
    matricula_id:    m.id,
    valor,
    mes_referencia:  mes,
    data_vencimento: vencimento,
    status:          'pendente' as const,
    registrado_por:  registradoPor,
  }));

  const { error } = await supabase
    .from('mensalidades')
    .upsert(registros, { onConflict: 'aluno_id,mes_referencia' });

  if (error) return { geradas: 0, error: error.message };
  return { geradas: registros.length, error: null };
}
