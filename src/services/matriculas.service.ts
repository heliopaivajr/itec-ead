import { supabase } from '@/lib/supabase';

export interface Matricula {
  id: string;
  aluno_id: string;
  curso_id: string;
  status: string;
  observacao?: string;
  created_at: string;
  profile?: { full_name: string; email?: string };
}

export interface ServiceResult {
  error: string | null;
}

export interface PaginatedMatriculas {
  data: Matricula[];
  total: number;
}

// Matrículas paginadas com filtro por status — usado em Matriculas.tsx
export async function getMatriculas(
  status?: string,
  limit = 20,
  page = 1
): Promise<PaginatedMatriculas> {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from('matriculas')
    .select('*, profile:profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);

  const { data, count, error } = await query;

  if (error) return { data: [], total: 0 };
  return { data: (data as Matricula[]) ?? [], total: count ?? 0 };
}

// Matrículas do próprio aluno — usado em MeusCursos.tsx
export async function getMinhasMatriculas(alunoId: string): Promise<Matricula[]> {
  const { data, error } = await supabase
    .from('matriculas')
    .select('*')
    .eq('aluno_id', alunoId);

  if (error) return [];
  return (data as Matricula[]) ?? [];
}

// Atualização de status — aprovação, recusa, trancamento
export async function updateStatusMatricula(
  matriculaId: string,
  status: string,
  observacao?: string
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('matriculas')
    .update({ status, observacao: observacao || null })
    .eq('id', matriculaId);

  if (error) return { error: error.message };
  return { error: null };
}
