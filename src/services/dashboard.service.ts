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
    supabase.from('profiles').select('role', { count: 'exact' }).eq('role', 'professor'),
    supabase.from('leads_cursos').select('*', { count: 'exact' }),
    supabase.from('matriculas').select('*', { count: 'exact' }),
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
    .order('created_at', { ascending: false })
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

// Leads recentes ordenados por created_at — usado no DashboardHome (sem paginação)
export async function getLeadsRecentes(limit = 5): Promise<LeadRecente[]> {
  const { data } = await supabase
    .from('leads_cursos')
    .select('*')
    .order('created_at', { ascending: false })
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
  return (data as MatriculaRecente[]) ?? [];
}

// Leads agrupados por curso — agregação em JS (intencional, não migrar para SQL ainda)
export async function getLeadsPorCurso(): Promise<LeadPorCurso[]> {
  const { data } = await supabase.from('leads_cursos').select('curso_interesse');
  if (!data) return [];

  const counts: Record<string, number> = {};
  data.forEach(r => { counts[r.curso_interesse] = (counts[r.curso_interesse] ?? 0) + 1; });

  return Object.entries(counts).map(([curso, total]) => ({ curso, total }));
}
