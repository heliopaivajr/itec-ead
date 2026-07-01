import { supabase } from '@/lib/supabase';

export interface DashboardKpis {
  alunos: number;
  professores: number;
  leads: number;
  matriculas: number;
}

export interface LeadRecente {
  id: string;
  nome: string;
  email: string;
  curso_interesse: string;
  created_at: string;
  [key: string]: any;
}

export interface MatriculaRecente {
  id: string;
  aluno_id: string;
  curso_id: string;
  status: string;
  created_at: string;
  curso_label?: string;
  [key: string]: any;
}

export interface LeadPorCurso {
  curso: string;
  total: number;
}

// KPIs agregados — 4 COUNTs em paralelo
export async function getKpis(): Promise<DashboardKpis> {
  const [alunos, profs, leads, mats] = await Promise.all([
    supabase.from('profiles').select('role', { count: 'exact' }).eq('role', 'aluno'),
    supabase.from('professores').select('id', { count: 'exact' }).eq('ativo', true),
    supabase.from('leads_cursos').select('*', { count: 'exact' }),
    supabase.from('matriculas').select('id', { count: 'exact' }).in('status', ['pendente', 'ativa']),
  ]);

  return {
    alunos:      alunos.count      ?? 0,
    professores: profs.count       ?? 0,
    leads:       leads.count       ?? 0,
    matriculas:  mats.count        ?? 0,
  };
}

export interface PaginatedLeads {
  data: LeadRecente[];
  total: number;
}

// Leads paginados com busca server-side — usado em Leads.tsx (admin)
export async function getLeadsPaginados(
  limit = 20,
  page = 1,
  search = ''
): Promise<PaginatedLeads> {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from('leads_cursos')
    .select('*', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range(from, to);

  if (search.trim()) {
    query = query.or(
      `nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) return { data: [], total: 0 };
  return { data: (data as LeadRecente[]) ?? [], total: count ?? 0 };
}

// Leads recentes — usado no DashboardHome (sem paginação)
export async function getLeadsRecentes(limit = 5): Promise<LeadRecente[]> {
  const { data } = await supabase
    .from('leads_cursos')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(limit);
  return (data as LeadRecente[]) ?? [];
}

// Matrículas recentes ordenadas por created_at
export async function getMatriculasRecentes(limit = 5): Promise<MatriculaRecente[]> {
  const { data } = await supabase
    .from('matriculas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  const matriculas = (data as MatriculaRecente[]) ?? [];

  // Lookup separado de cursos (não há FK matriculas.curso_id -> cursos.id;
  // curso_id é TEXT e cursos.id é UUID). Merge em memória — LICAO-026.
  const cursoIds = [...new Set(matriculas.map(m => m.curso_id).filter(Boolean))];

  if (cursoIds.length > 0) {
    const { data: cursosData, error: cursosError } = await supabase
      .from('cursos')
      .select('id, codigo, nome')
      .in('id', cursoIds);

    if (cursosError) {
      console.error('getMatriculasRecentes cursos lookup error:', cursosError);
    } else {
      const cursosMap = new Map<string, string>(
        (cursosData ?? []).map(c => [String(c.id), `${c.codigo} — ${c.nome}`])
      );
      matriculas.forEach(m => {
        m.curso_label = cursosMap.get(String(m.curso_id)) ?? undefined;
      });
    }
  }

  return matriculas;
}

// ─── Painel de Pendências da Secretaria (R3.2) ───────────────────────────────
// Compõe 4 filas acionáveis com queries SEPARADAS em paralelo + merge de nomes
// em memória (LICAO-026 — nunca join aninhado entre tabelas sob RLS).
// O painel apenas CONTA e LINKA; as ações (aprovar/validar) vivem nas telas de
// destino. Falha parcial em qualquer tabela degrada para bloco vazio (não quebra).

export interface PendenciaItem {
  aluno_id: string;
  nome: string;
  detalhe?: string; // status da matrícula | tipo do doc | motivo do sem-vínculo
}
export interface PendenciaBloco {
  count: number;
  itens: PendenciaItem[];
}
export interface PendenciasSecretaria {
  matriculasPendentes: PendenciaBloco;
  documentosPendentes: PendenciaBloco;
  taxasPendentes: PendenciaBloco;
  alunosSemVinculo: PendenciaBloco;
}

// Status do funil que exigem ação da secretaria (CHECK migração 051).
const FUNIL_PENDENTE = [
  'pendente', 'pre_matricula', 'aguardando_documentos',
  'aguardando_pagamento', 'aguardando_aprovacao',
];

export async function getPendenciasSecretaria(): Promise<PendenciasSecretaria> {
  const [matsPend, docsPend, taxasPend, matsAtivas, lancamentos] = await Promise.all([
    supabase.from('matriculas').select('id, aluno_id, status').in('status', FUNIL_PENDENTE).limit(200),
    supabase.from('documentos_aluno').select('aluno_id, tipo').eq('status', 'pendente').limit(200),
    supabase.from('taxa_matricula').select('aluno_id').eq('status', 'pendente').limit(200),
    supabase.from('matriculas').select('id, aluno_id, turma_id').eq('status', 'ativa').limit(500),
    supabase.from('matriculas_disciplina').select('matricula_id').limit(2000),
  ]);

  // Log de degradação — bloco vira vazio se a tabela/consulta falhar (RLS, etc.)
  [
    ['matriculas(pendentes)', matsPend.error],
    ['documentos_aluno', docsPend.error],
    ['taxa_matricula', taxasPend.error],
    ['matriculas(ativas)', matsAtivas.error],
    ['matriculas_disciplina', lancamentos.error],
  ].forEach(([nome, err]) => { if (err) console.error(`getPendenciasSecretaria: ${nome}:`, err); });

  const matsPendRows  = (matsPend.data  ?? []) as { id: string; aluno_id: string; status: string }[];
  const docsRows      = (docsPend.data  ?? []) as { aluno_id: string; tipo: string }[];
  const taxasRows     = (taxasPend.data ?? []) as { aluno_id: string }[];
  const ativasRows    = (matsAtivas.data ?? []) as { id: string; aluno_id: string; turma_id: string | null }[];
  const comLancamento = new Set(((lancamentos.data ?? []) as { matricula_id: string }[]).map(r => r.matricula_id));

  // F1 — matrícula ativa sem turma OU sem nenhuma disciplina lançada
  const semVinculoRows = ativasRows
    .map(m => {
      const motivo: 'sem_turma' | 'sem_lancamento' | null =
        !m.turma_id ? 'sem_turma' : (!comLancamento.has(m.id) ? 'sem_lancamento' : null);
      return motivo ? { aluno_id: m.aluno_id, motivo } : null;
    })
    .filter((x): x is { aluno_id: string; motivo: 'sem_turma' | 'sem_lancamento' } => x !== null);

  // Merge de nomes — 1 query de profiles para todos os aluno_ids (LICAO-026)
  const ids = [...new Set([
    ...matsPendRows.map(r => r.aluno_id),
    ...docsRows.map(r => r.aluno_id),
    ...taxasRows.map(r => r.aluno_id),
    ...semVinculoRows.map(r => r.aluno_id),
  ].filter(Boolean))];

  const nomes = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profs, error: profErr } = await supabase
      .from('profiles').select('id, full_name').in('id', ids);
    if (profErr) console.error('getPendenciasSecretaria: profiles:', profErr);
    (profs ?? []).forEach(p => nomes.set(p.id, (p as { id: string; full_name: string }).full_name));
  }
  const nome = (id: string) => nomes.get(id) ?? 'Aluno';

  const MOTIVO_LABEL: Record<string, string> = {
    sem_turma: 'Sem turma', sem_lancamento: 'Sem lançamento',
  };

  return {
    matriculasPendentes: {
      count: matsPendRows.length,
      itens: matsPendRows.map(r => ({ aluno_id: r.aluno_id, nome: nome(r.aluno_id), detalhe: r.status })),
    },
    documentosPendentes: {
      count: docsRows.length,
      itens: docsRows.map(r => ({ aluno_id: r.aluno_id, nome: nome(r.aluno_id), detalhe: r.tipo })),
    },
    taxasPendentes: {
      count: taxasRows.length,
      itens: taxasRows.map(r => ({ aluno_id: r.aluno_id, nome: nome(r.aluno_id) })),
    },
    alunosSemVinculo: {
      count: semVinculoRows.length,
      itens: semVinculoRows.map(r => ({ aluno_id: r.aluno_id, nome: nome(r.aluno_id), detalhe: MOTIVO_LABEL[r.motivo] })),
    },
  };
}

// Leads agrupados por curso — agregação em JS (intencional, não migrar para SQL ainda)
export async function getLeadsPorCurso(): Promise<LeadPorCurso[]> {
  const { data } = await supabase.from('leads_cursos').select('curso_interesse').limit(500);
  if (!data) return [];

  const counts: Record<string, number> = {};
  data.forEach(r => { counts[r.curso_interesse] = (counts[r.curso_interesse] ?? 0) + 1; });

  return Object.entries(counts).map(([curso, total]) => ({ curso, total }));
}
