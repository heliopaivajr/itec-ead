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
  cor?: string | null; // migration 3A — cor das aulas no calendário
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

export interface AlunoTurma {
  matricula_id: string;
  aluno_id: string;
  status: string;
  full_name: string;
  avatar_url: string | null;
  codigo_itec: string | null;
}

// Lista de alunos matriculados numa turma — exibida na gestão de turmas e impressão
export async function getAlunosByTurma(turmaId: string): Promise<AlunoTurma[]> {
  const { data, error } = await supabase
    .from('matriculas')
    .select('id, aluno_id, status, profiles!matriculas_aluno_id_fkey(full_name, avatar_url, codigo_itec)')
    .eq('turma_id', turmaId)
    .order('created_at', { ascending: true })
    .limit(60);

  if (error) return [];

  type Row = {
    id: string;
    aluno_id: string;
    status: string;
    profiles: { full_name: string; avatar_url: string | null; codigo_itec: string | null } | null;
  };

  return ((data ?? []) as unknown as Row[]).map(r => {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      matricula_id: r.id,
      aluno_id: r.aluno_id,
      status: r.status,
      full_name: p?.full_name ?? '—',
      avatar_url: p?.avatar_url ?? null,
      codigo_itec: p?.codigo_itec ?? null,
    };
  });
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

// Atualiza a cor da turma no calendário — apenas staff
export async function atualizarCorTurma(
  turmaId: string,
  cor: string,
  requesterId: string
): Promise<ServiceResult> {
  // Validar formato hex
  if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
    return { error: 'Cor inválida — use formato hex #RRGGBB' };
  }

  // Verificar role via user_roles
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', requesterId)
    .single();

  if (roleError) return { error: 'Erro ao verificar permissão' };
  const role = (roleData as { role: string } | null)?.role ?? '';
  if (!['administracao', 'admin', 'superadmin'].includes(role)) {
    return { error: 'Permissão insuficiente' };
  }

  const { error } = await supabase
    .from('turmas')
    .update({ cor })
    .eq('id', turmaId);

  if (error) return { error: error.message };
  return {};
}
