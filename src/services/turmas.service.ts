import { supabase } from '@/lib/supabase';

export interface Turma {
  id: string;
  codigo: string;
  curso_id: string | null;
  nome: string;
  ano: number;
  semestre: number | null;
  data_inicio: string;
  data_fim: string | null;
  status: 'ativa' | 'concluida' | 'planejada' | 'cancelada';
  vagas_total: number;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  // join
  total_matriculas?: number;
}

export interface TurmaPayload {
  codigo: string;
  curso_id?: string | null;
  nome: string;
  ano: number;
  semestre?: number | null;
  data_inicio: string;
  data_fim?: string | null;
  status: 'ativa' | 'concluida' | 'planejada' | 'cancelada';
  vagas_total: number;
  observacoes?: string | null;
}

export interface ServiceResult<T = void> {
  data?: T;
  error?: string;
}

export async function getTurmas(): Promise<Turma[]> {
  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .order('ano', { ascending: false })
    .order('semestre', { ascending: false })
    .limit(50);

  if (error) {
    console.error('getTurmas:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getTurmasAtivas(): Promise<Turma[]> {
  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .in('status', ['ativa', 'planejada'])
    .order('ano', { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getTurmaById(id: string): Promise<Turma | null> {
  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createTurma(payload: TurmaPayload): Promise<ServiceResult<Turma>> {
  const { data, error } = await supabase
    .from('turmas')
    .insert(payload)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateTurma(id: string, payload: Partial<TurmaPayload>): Promise<ServiceResult<Turma>> {
  const { data, error } = await supabase
    .from('turmas')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function deleteTurma(id: string): Promise<ServiceResult> {
  const { error } = await supabase
    .from('turmas')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  return {};
}

export async function getVagasDisponiveis(turmaId: string): Promise<number> {
  const { data: turma } = await supabase
    .from('turmas')
    .select('vagas_total')
    .eq('id', turmaId)
    .single();

  if (!turma) return 0;

  const { count } = await supabase
    .from('matriculas')
    .select('id', { count: 'exact', head: true })
    .eq('turma_id', turmaId)
    .not('status', 'eq', 'cancelada');

  return turma.vagas_total - (count ?? 0);
}
