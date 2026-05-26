import { supabase } from '@/lib/supabase';

export interface MatriculaDisciplina {
  id: string;
  matricula_id: string;
  disciplina_id: string;
  status: 'cursando' | 'aprovado' | 'reprovado' | 'reprovado_falta' | 'convalidado' | 'trancado';
  nota: number | null;
  aprovado_por: string | null;
  criado_em: string;
}

export interface Convalidacao {
  id: string;
  aluno_id: string;
  disciplina_id: string;
  instituicao_origem: string;
  disciplina_origem: string;
  carga_horaria_origem: number | null;
  coordenador_responsavel: string | null;
  aprovado_por: string | null;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  documentos_url: string[] | null;
  observacoes: string | null;
  solicitado_em: string;
  aprovado_em: string | null;
}

export interface ExcecaoPrerequisito {
  id: string;
  aluno_id: string;
  disciplina_id: string;
  prerequisito_dispensado_id: string;
  aprovado_por: string;
  motivo: string;
  aprovado_em: string;
}

export type ConvalidacaoPayload = Omit<Convalidacao, 'id' | 'status' | 'solicitado_em' | 'aprovado_em'>;

export interface ServiceResult {
  error: string | null;
}

// Resolve aluno pelo e-mail — usado em Convalidacoes.tsx para criar solicitação
export async function getAlunoPorEmail(
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

// Resolve disciplina pelo código — usado em Convalidacoes.tsx para criar solicitação
export async function getDisciplinaPorCodigo(
  codigo: string
): Promise<{ id: string; codigo: string; nome: string } | null> {
  const { data, error } = await supabase
    .from('disciplinas_v2')
    .select('id, codigo, nome')
    .eq('codigo', codigo.toUpperCase())
    .single();

  if (error || !data) return null;
  return data as { id: string; codigo: string; nome: string };
}

export async function getMatriculasDisciplinaByAluno(
  alunoId: string
): Promise<MatriculaDisciplina[]> {
  const { data, error } = await supabase
    .from('matriculas_disciplina')
    .select('*, matricula:matriculas!inner(aluno_id)')
    .eq('matricula.aluno_id', alunoId);

  if (error) return [];
  return (data as MatriculaDisciplina[]) ?? [];
}

export async function matricularEmDisciplina(
  matriculaId: string,
  disciplinaId: string,
  aprovadoPor: string
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('matriculas_disciplina')
    .insert({
      matricula_id:  matriculaId,
      disciplina_id: disciplinaId,
      aprovado_por:  aprovadoPor,
      status:        'cursando',
    });

  if (error) return { error: error.message };
  return { error: null };
}

export async function atualizarStatusDisciplina(
  id: string,
  status: MatriculaDisciplina['status'],
  nota?: number
): Promise<ServiceResult> {
  const update: Record<string, unknown> = { status };
  if (nota !== undefined) update.nota = nota;

  const { error } = await supabase
    .from('matriculas_disciplina')
    .update(update)
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function solicitarConvalidacao(
  dados: ConvalidacaoPayload
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('convalidacoes')
    .insert({ ...dados, status: 'pendente' });

  if (error) return { error: error.message };
  return { error: null };
}

export async function getConvalidacoesByAluno(
  alunoId: string
): Promise<Convalidacao[]> {
  const { data, error } = await supabase
    .from('convalidacoes')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('solicitado_em', { ascending: false });

  if (error) return [];
  return (data as Convalidacao[]) ?? [];
}

export async function aprovarConvalidacao(
  id: string,
  aprovadoPor: string
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('convalidacoes')
    .update({
      status:       'aprovado',
      aprovado_por:  aprovadoPor,
      aprovado_em:   new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

// Rejeitar convalidação — com motivo obrigatório
export async function rejeitarConvalidacao(
  id: string,
  motivo: string
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('convalidacoes')
    .update({ status: 'rejeitado', observacoes: motivo })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

// Listar todas as convalidações por status — admin/superadmin
export async function getConvalidacoesPorStatus(
  status: 'pendente' | 'aprovado' | 'rejeitado'
): Promise<Convalidacao[]> {
  const { data, error } = await supabase
    .from('convalidacoes')
    .select('*')
    .eq('status', status)
    .order('solicitado_em', { ascending: false })
    .limit(100);

  if (error) return [];
  return (data as Convalidacao[]) ?? [];
}

// Listar todas as exceções de pré-requisito — para o painel admin
export interface ExcecaoPendente {
  id: string;
  aluno_id: string;
  disciplina_id: string;
  prerequisito_dispensado_id: string;
  aprovado_por: string;
  motivo: string;
  aprovado_em: string;
}

export async function getExcecoesPendentes(): Promise<ExcecaoPendente[]> {
  const { data, error } = await supabase
    .from('excecoes_prerequisito')
    .select('*')
    .order('aprovado_em', { ascending: false })
    .limit(50);

  if (error) return [];
  return (data as ExcecaoPendente[]) ?? [];
}

// Negar exceção de pré-requisito — registra motivo e remove o registro
export async function negarExcecaoPrerequisito(
  id: string,
  _motivo: string
): Promise<ServiceResult> {
  // Exceções aprovadas são registros imutáveis. Negar = deletar o registro.
  const { error } = await supabase
    .from('excecoes_prerequisito')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

// Registra exceção de pré-requisito — somente superadmin chama esta função
export async function aprovarExcecaoPrerequisito(
  alunoId: string,
  disciplinaId: string,
  prerequisitoId: string,
  aprovadoPor: string,
  motivo: string
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('excecoes_prerequisito')
    .insert({
      aluno_id:                   alunoId,
      disciplina_id:               disciplinaId,
      prerequisito_dispensado_id:  prerequisitoId,
      aprovado_por:                aprovadoPor,
      motivo,
    });

  if (error) return { error: error.message };
  return { error: null };
}
