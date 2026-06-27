import { supabase } from '@/lib/supabase';

// Funil de status de matrícula (gênero feminino — CHECK do banco, migração 051).
export type StatusMatricula =
  | 'pendente' | 'ativa' | 'inativa' | 'trancada' | 'evadida' | 'concluida' | 'suspensa'
  | 'pre_matricula' | 'aguardando_documentos' | 'aguardando_pagamento' | 'aguardando_aprovacao' | 'cancelada';

export interface Matricula {
  id: string;
  aluno_id: string;
  curso_id: string;
  status: StatusMatricula;
  observacoes?: string | null;        // coluna real (plural) — antes 'observacao' (defasado)
  created_at: string;
  // Campos opcionais existentes na tabela (vêm via select('*'))
  numero_matricula?: string | null;   // populado no R2
  turma_id?: string | null;
  data_inicio?: string | null;
  semestre_ingresso?: string | null;
  obs_retroativa?: string | null;
  validado_por?: string | null;
  validado_em?: string | null;
  modulo_atual?: string | null;
  tipo_financiamento?: string | null;
  percentual_desconto?: number | null;
  observacao_financeira?: string | null;
  // Derivados (não são colunas)
  profile?: { full_name: string; email?: string };
  curso_label?: string;
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
    .select('*, profile:profiles!matriculas_aluno_id_fkey(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);

  const { data, count, error } = await query;

  if (error) {
    console.error('getMatriculas error:', error);
    return { data: [], total: 0 };
  }

  const matriculas = (data as Matricula[]) ?? [];

  // Lookup separado de cursos (não há FK matriculas.curso_id -> cursos.id;
  // curso_id é TEXT e cursos.id é UUID). Merge em memória — LICAO-026.
  const cursoIds = [...new Set(matriculas.map(m => m.curso_id).filter(Boolean))];

  if (cursoIds.length > 0) {
    const { data: cursosData, error: cursosError } = await supabase
      .from('cursos')
      .select('id, codigo, nome')
      .in('id', cursoIds);

    if (cursosError) {
      console.error('getMatriculas cursos lookup error:', cursosError);
    } else {
      const cursosMap = new Map<string, string>(
        (cursosData ?? []).map(c => [String(c.id), `${c.codigo} — ${c.nome}`])
      );
      matriculas.forEach(m => {
        m.curso_label = cursosMap.get(String(m.curso_id)) ?? undefined;
      });
    }
  }

  return { data: matriculas, total: count ?? 0 };
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
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', requesterId)
    .single();

  if (roleError) return { error: 'Erro ao verificar permissão' };
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
    .update({ status, observacoes: observacao || null })
    .eq('id', matriculaId);

  if (error) return { error: error.message };
  return { error: null };
}
