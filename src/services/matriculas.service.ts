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

// Busca aluno por email — para NovaMatricula verificar se aluno existe
export async function getAlunoByEmail(
  email: string
): Promise<{ id: string; full_name: string } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return data as { id: string; full_name: string };
}

export interface CreateMatriculaPayload {
  aluno_id: string;
  status: 'pendente';
  curso_id?: string;
  turma_id?: string;
  observacoes?: string;
}

// Cria nova matrícula — retorna id gerado
export async function createMatricula(
  payload: CreateMatriculaPayload
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('matriculas')
    .insert(payload)
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as { id: string }, error: null };
}

// Cria taxa de matrícula vinculada — valor definido pela secretaria
export async function createTaxaMatricula(
  alunoId: string,
  matriculaId: string,
  registradoPor: string,
  valor = 0,
  vencimento?: string
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('taxa_matricula')
    .insert({
      aluno_id:        alunoId,
      matricula_id:    matriculaId,
      valor,
      status:          'pendente',
      data_vencimento: vencimento ?? null,
      registrado_por:  registradoPor,
    });

  if (error) return { error: error.message };
  return { error: null };
}

// Aprova matrícula pendente — apenas administracao/admin/superadmin
// Requer status atual = 'pendente'; seta validado_por e validado_em
export async function aprovarMatricula(
  matriculaId: string,
  requesterId: string
): Promise<ServiceResult> {
  // Verifica role do requester via user_roles (sem recursão de RLS)
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', requesterId)
    .single();

  const role = (roleData as { role: string } | null)?.role ?? '';
  if (!['administracao', 'admin', 'superadmin'].includes(role)) {
    return { error: 'Permissão insuficiente para aprovar matrículas' };
  }

  // Verifica status atual — deve ser 'pendente'
  const { data: mat } = await supabase
    .from('matriculas')
    .select('status')
    .eq('id', matriculaId)
    .single();

  if (!mat) return { error: 'Matrícula não encontrada' };
  if ((mat as { status: string }).status !== 'pendente') {
    return { error: 'Apenas matrículas com status pendente podem ser aprovadas' };
  }

  const { error } = await supabase
    .from('matriculas')
    .update({
      status: 'ativa',
      validado_por: requesterId,
      validado_em: new Date().toISOString(),
    })
    .eq('id', matriculaId);

  if (error) return { error: error.message };
  return { error: null };
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
