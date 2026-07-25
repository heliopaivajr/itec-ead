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

// ─── 2g: Ficha Financeira do Aluno ───────────────────────────────────────────

// Linha do tempo com status_efetivo (atrasado derivado na leitura — 073).
// Lê vw_mensalidades (security_invoker → RLS 037 aplica: financeiro/staff veem todas).
export interface MensalidadeVw extends Mensalidade {
  status_efetivo: 'pago' | 'atrasado' | 'pendente' | 'isento' | 'cancelado';
  valor_pago?: number | null;
  forma_pagamento?: FormaPagamento | null;
}

export async function getMensalidadesVw(alunoId: string): Promise<MensalidadeVw[]> {
  const { data, error } = await supabase
    .from('vw_mensalidades')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('mes_referencia', { ascending: true })
    .limit(60);
  if (error) {
    console.error('[getMensalidadesVw]', error.message);
    return [];
  }
  return (data as MensalidadeVw[]) ?? [];
}

// Edição inline de UMA mensalidade (valor cobrado e/ou vencimento daquela linha).
// Persistência na FONTE ÚNICA (mensalidades — LICAO-042). RLS 037: staff/financeiro
// têm UPDATE. Não confundir com override de matrícula (072, que afeta gerações futuras).
export async function atualizarMensalidade(
  id: string,
  patch: { valor?: number; dataVencimento?: string },
): Promise<ServiceResult> {
  const upd: Record<string, unknown> = {};
  if (patch.valor != null)          upd.valor = patch.valor;
  if (patch.dataVencimento)         upd.data_vencimento = patch.dataVencimento;
  if (Object.keys(upd).length === 0) return { error: null };

  const { error } = await supabase.from('mensalidades').update(upd).eq('id', id);
  if (error) {
    console.error('[atualizarMensalidade]', error.message);
    return { error: error.message };
  }
  return { error: null };
}

// Dia de vencimento padrão do aluno — persiste em matriculas.dia_vencimento_padrao (074).
// Via RPC SECURITY DEFINER: o financeiro edita 1 campo sem ganhar UPDATE amplo em
// matriculas (fronteira 067). Gate is_staff() OR is_financeiro(); valida 1..28.
export async function setDiaVencimentoPadrao(
  matriculaId: string,
  dia: number,
): Promise<ServiceResult> {
  const { error } = await supabase.rpc('set_dia_vencimento_padrao', {
    p_matricula_id: matriculaId,
    p_dia: dia,
  });
  if (error) {
    console.error('[setDiaVencimentoPadrao]', error.message);
    return { error: error.message };
  }
  return { error: null };
}

// Cabeçalho PII-FREE da ficha: nome, contato, curso, turma, matrícula ativa.
// NUNCA expõe CPF/RG/endereço. Queries SEPARADas (LICAO-026 — sem join aninhado sob RLS).
export interface FichaAlunoInfo {
  aluno_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  codigo_itec: string | null;
  avatar_url: string | null;
  matricula_id: string | null;
  matricula_status: string | null;
  turma_nome: string | null;
  curso_nome: string | null;
  // Dia de vencimento padrão do aluno — coluna persistente matriculas.dia_vencimento_padrao (074).
  dia_vencimento_padrao: number | null;
}

export async function getFichaAlunoInfo(alunoId: string): Promise<FichaAlunoInfo | null> {
  // 1) perfil (PII-free: só nome/contato/código)
  const { data: prof, error: errProf } = await supabase
    .from('profiles')
    .select('id, full_name, email, telefone, codigo_itec, avatar_url')
    .eq('id', alunoId)
    .single();
  if (errProf || !prof) {
    if (errProf) console.error('[getFichaAlunoInfo] profiles:', errProf.message);
    return null;
  }

  // 2) matrículas do aluno (escolhe a ativa; senão a mais recente)
  const { data: mats, error: errMats } = await supabase
    .from('matriculas')
    .select('id, turma_id, status, created_at, dia_vencimento_padrao')
    .eq('aluno_id', alunoId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (errMats) console.error('[getFichaAlunoInfo] matriculas:', errMats.message);

  type MatRow = { id: string; turma_id: string | null; status: string; created_at: string; dia_vencimento_padrao: number | null };
  const matriculas = (mats ?? []) as MatRow[];
  const matricula = matriculas.find(m => m.status === 'ativa') ?? matriculas[0] ?? null;

  // 3) turma → curso (queries separadas)
  let turmaNome: string | null = null;
  let cursoNome: string | null = null;
  if (matricula?.turma_id) {
    const { data: turma } = await supabase
      .from('turmas')
      .select('nome, codigo, curso_id')
      .eq('id', matricula.turma_id)
      .single();
    if (turma) {
      turmaNome = (turma as { nome: string; codigo: string }).nome
        ?? (turma as { codigo: string }).codigo ?? null;
      const cursoId = (turma as { curso_id: string | null }).curso_id;
      if (cursoId) {
        const { data: curso } = await supabase
          .from('cursos').select('nome').eq('id', cursoId).single();
        cursoNome = (curso as { nome: string } | null)?.nome ?? null;
      }
    }
  }

  // 4) dia de vencimento padrão — coluna persistente da matrícula (074)
  const diaVenc = matricula?.dia_vencimento_padrao ?? null;

  const p = prof as { full_name: string | null; email: string | null; telefone: string | null; codigo_itec: string | null; avatar_url: string | null };
  return {
    aluno_id:            alunoId,
    nome:                p.full_name ?? '—',
    email:               p.email ?? null,
    telefone:            p.telefone ?? null,
    codigo_itec:         p.codigo_itec ?? null,
    avatar_url:          p.avatar_url ?? null,
    matricula_id:        matricula?.id ?? null,
    matricula_status:    matricula?.status ?? null,
    turma_nome:          turmaNome,
    curso_nome:          cursoNome,
    dia_vencimento_padrao: diaVenc,
  };
}

// ─── 2f: confirmação de pagamento (fila compartilhada secretaria+financeiro) ──
export type FormaPagamento = 'pix' | 'dinheiro' | 'boleto' | 'transferencia';

// Sobe o comprovante no bucket PRIVADO (073) e devolve o path (não URL pública).
// Path: {aluno_id}/{mensalidade_id}.<ext> — casa com o gate foldername[1]=aluno_id.
export async function uploadComprovante(
  alunoId: string, mensalidadeId: string, file: File
): Promise<{ path: string | null; error: string | null }> {
  const ext  = file.name.split('.').pop() ?? 'bin';
  const path = `${alunoId}/${mensalidadeId}.${ext}`;
  const { error } = await supabase.storage
    .from('comprovantes-pagamento')
    .upload(path, file, { upsert: true });
  if (error) {
    console.error('[uploadComprovante]', error.message);
    return { path: null, error: error.message };
  }
  return { path, error: null };
}

// URL assinada temporária para VER o comprovante (bucket privado).
export async function getComprovanteUrl(path: string, segundos = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('comprovantes-pagamento')
    .createSignedUrl(path, segundos);
  if (error) { console.error('[getComprovanteUrl]', error.message); return null; }
  return data.signedUrl;
}

// Confirma o pagamento (RPC 073): idempotente, gate is_staff OR is_financeiro.
export async function confirmarPagamento(params: {
  mensalidadeId: string;
  valorPago: number;
  forma: FormaPagamento;
  comprovantePath?: string | null;   // path no bucket privado (não URL pública)
  dataPagamento?: string;            // YYYY-MM-DD (default hoje no banco)
}): Promise<ServiceResult> {
  const { error } = await supabase.rpc('confirmar_pagamento', {
    p_mensalidade_id:  params.mensalidadeId,
    p_valor_pago:      params.valorPago,
    p_forma:           params.forma,
    p_comprovante_url: params.comprovantePath ?? null,
    ...(params.dataPagamento ? { p_data_pagamento: params.dataPagamento } : {}),
  });
  if (error) {
    console.error('[confirmarPagamento]', error.message);
    return { error: error.message };
  }
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
