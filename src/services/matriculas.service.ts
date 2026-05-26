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

// Todas as matrículas com dados do aluno — usado por admins em Matriculas.tsx
export async function getMatriculas(): Promise<Matricula[]> {
  const { data, error } = await supabase
    .from('matriculas')
    .select('*, profile:profiles(full_name, email)')
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data as Matricula[]) ?? [];
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
