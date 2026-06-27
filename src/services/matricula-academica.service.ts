import { supabase } from '@/lib/supabase';
import { calcularStatus, type StatusNota } from './notas.service';

export type StatusDisciplina =
  | 'cursando' | 'aprovado' | 'reprovado' | 'reprovado_falta' | 'convalidado' | 'trancado';

export interface MatriculaDisciplina {
  id: string;
  matricula_id: string;
  disciplina_id: string;
  status: StatusDisciplina;
  nota: number | null;
  aprovado_por: string | null;
  criado_em: string;
  // Lançamento retroativo (colunas 051/052)
  professor_id?: string | null;
  faltas?: number | null;
  frequencia_percentual?: number | null;
  observacao?: string | null;
}

// Mapeia o status acadêmico (notas.service) → status de matriculas_disciplina.
// Para lançamento retroativo a nota é a FINAL consolidada: média < 7 (com freq ok)
// = não aprovado → 'reprovado' (recuperacao/reprovado_nota colapsam em reprovado).
// Casos de borda (ex.: aprovado na recuperação) tratam-se pelo override manual.
export function statusFromNota(s: StatusNota): StatusDisciplina {
  switch (s) {
    case 'aprovado':        return 'aprovado';
    case 'reprovado_falta': return 'reprovado_falta';
    case 'recuperacao':
    case 'reprovado_nota':  return 'reprovado';
    case 'cursando':
    default:                return 'cursando';
  }
}

export interface Convalidacao {
  id: string;
  aluno_id: string;
  disciplina_id: string;
  disciplina?: { codigo: string; nome: string } | null;
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

// ─── Lançamento Retroativo (R2) ───────────────────────────────────────────────
// Função NOVA — não altera matricularEmDisciplina/atualizarStatusDisciplina (ERR-LOGIC-004).

export interface LancamentoInput {
  matriculaId: string;
  disciplinaId: string;
  professorId?: string | null;
  nota?: number | null;
  faltas?: number | null;
  frequencia?: number | null;   // → frequencia_percentual
  observacao?: string | null;
  aprovadoPor?: string | null;
  statusOverride?: StatusDisciplina;  // override manual opcional (item 10)
}

export interface LancamentoItem extends MatriculaDisciplina {
  disciplina_codigo?: string;
  disciplina_nome?: string;
  professor_nome?: string | null;
}

// Lança (ou re-lança) uma cadeira cursada — UPSERT por (matricula_id, disciplina_id).
// Status derivado por calcularStatus(nota, freq), salvo override manual.
export async function lancarDisciplinaRetroativa(input: LancamentoInput): Promise<ServiceResult> {
  const freq = input.frequencia ?? 100;
  const status = input.statusOverride ?? statusFromNota(calcularStatus(input.nota ?? null, freq));

  const { error } = await supabase
    .from('matriculas_disciplina')
    .upsert({
      matricula_id:          input.matriculaId,
      disciplina_id:         input.disciplinaId,
      professor_id:          input.professorId ?? null,
      nota:                  input.nota ?? null,
      faltas:                input.faltas ?? null,
      frequencia_percentual: input.frequencia ?? null,
      observacao:            input.observacao ?? null,
      status,
      aprovado_por:          input.aprovadoPor ?? null,
    }, { onConflict: 'matricula_id,disciplina_id' });

  if (error) return { error: error.message };
  return { error: null };
}

// Edição parcial de um lançamento existente (por id). Se nota OU frequencia mudarem,
// recalcula o status (a menos que statusOverride seja informado).
export async function editarLancamento(
  id: string,
  campos: Partial<Pick<LancamentoInput, 'professorId' | 'nota' | 'faltas' | 'frequencia' | 'observacao' | 'statusOverride'>>
): Promise<ServiceResult> {
  const update: Record<string, unknown> = {};
  if (campos.professorId !== undefined) update.professor_id = campos.professorId;
  if (campos.nota !== undefined)        update.nota = campos.nota;
  if (campos.faltas !== undefined)      update.faltas = campos.faltas;
  if (campos.frequencia !== undefined)  update.frequencia_percentual = campos.frequencia;
  if (campos.observacao !== undefined)  update.observacao = campos.observacao;

  // Recalcula status se nota/frequencia mudaram (e sem override explícito)
  if (campos.statusOverride !== undefined) {
    update.status = campos.statusOverride;
  } else if (campos.nota !== undefined || campos.frequencia !== undefined) {
    // precisa do par (nota, freq) atual para recalcular — lê o registro
    const { data: atual } = await supabase
      .from('matriculas_disciplina')
      .select('nota, frequencia_percentual')
      .eq('id', id)
      .single();
    const notaFinal = campos.nota !== undefined ? campos.nota : (atual as { nota: number | null } | null)?.nota ?? null;
    const freqFinal = campos.frequencia !== undefined ? campos.frequencia : (atual as { frequencia_percentual: number | null } | null)?.frequencia_percentual ?? 100;
    update.status = statusFromNota(calcularStatus(notaFinal, freqFinal ?? 100));
  }

  if (Object.keys(update).length === 0) return { error: null };

  const { error } = await supabase
    .from('matriculas_disciplina')
    .update(update)
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

// Soft delete — nunca DELETE físico. Marca status='trancado' + observação.
export async function removerLancamento(id: string, motivo = 'Removido pela secretaria'): Promise<ServiceResult> {
  const { error } = await supabase
    .from('matriculas_disciplina')
    .update({ status: 'trancado', observacao: motivo })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

// Gera e grava o número da matrícula (ITEC{AA}T{NNN}) via função SQL gerar_numero_matricula.
// Idempotente: não sobrescreve se a matrícula já tiver número.
export async function gerarNumeroMatricula(
  matriculaId: string,
  ano = 2025
): Promise<{ numero: string | null; error: string | null }> {
  // 1. Já tem número? (idempotência)
  const { data: mat, error: readErr } = await supabase
    .from('matriculas')
    .select('numero_matricula')
    .eq('id', matriculaId)
    .single();
  if (readErr) return { numero: null, error: readErr.message };
  const existente = (mat as { numero_matricula: string | null } | null)?.numero_matricula ?? null;
  if (existente) return { numero: existente, error: null };

  // 2. Gera via RPC (função à prova de corrida)
  const { data: numero, error: rpcErr } = await supabase.rpc('gerar_numero_matricula', { p_ano: ano });
  if (rpcErr || !numero) return { numero: null, error: rpcErr?.message ?? 'Falha ao gerar número.' };

  // 3. Grava
  const { error: updErr } = await supabase
    .from('matriculas')
    .update({ numero_matricula: numero })
    .eq('id', matriculaId);
  if (updErr) return { numero: null, error: updErr.message };

  return { numero: numero as string, error: null };
}

// Lista os lançamentos de uma matrícula com nome da disciplina e do professor.
// LICAO-026: queries separadas + merge em memória (sem join aninhado sob RLS).
export async function listarLancamentos(matriculaId: string): Promise<LancamentoItem[]> {
  const { data: lancamentos, error } = await supabase
    .from('matriculas_disciplina')
    .select('*')
    .eq('matricula_id', matriculaId)
    .limit(100);
  if (error || !lancamentos) return [];

  const rows = lancamentos as MatriculaDisciplina[];
  const discIds = [...new Set(rows.map(r => r.disciplina_id).filter(Boolean))];
  const profIds = [...new Set(rows.map(r => r.professor_id).filter(Boolean))] as string[];

  const [discRes, profRes] = await Promise.all([
    discIds.length
      ? supabase.from('disciplinas_v2').select('id, codigo, nome').in('id', discIds)
      : Promise.resolve({ data: [] as { id: string; codigo: string; nome: string }[] }),
    profIds.length
      ? supabase.from('professores').select('id, nome_completo').in('id', profIds)
      : Promise.resolve({ data: [] as { id: string; nome_completo: string }[] }),
  ]);

  const discMap = new Map((discRes.data ?? []).map(d => [d.id, d]));
  const profMap = new Map((profRes.data ?? []).map(p => [p.id, p.nome_completo]));

  return rows.map(r => ({
    ...r,
    disciplina_codigo: discMap.get(r.disciplina_id)?.codigo,
    disciplina_nome:   discMap.get(r.disciplina_id)?.nome,
    professor_nome:    r.professor_id ? profMap.get(r.professor_id) ?? null : null,
  }));
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

// Encaminha convalidação para aprovação (atribui coordenador responsável)
export async function encaminharConvalidacao(
  id: string,
  coordenadorId: string
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('convalidacoes')
    .update({ coordenador_responsavel: coordenadorId })
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
    .select('*, disciplina:disciplinas_v2(codigo, nome)')
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
  disciplina?: { codigo: string; nome: string } | null;
  prerequisito_dispensado_id: string;
  prerequisito?: { codigo: string; nome: string } | null;
  aprovado_por: string;
  motivo: string;
  aprovado_em: string;
}

export async function getExcecoesPendentes(): Promise<ExcecaoPendente[]> {
  const { data, error } = await supabase
    .from('excecoes_prerequisito')
    .select(`
      *,
      disciplina:disciplinas_v2!disciplina_id(codigo, nome),
      prerequisito:disciplinas_v2!prerequisito_dispensado_id(codigo, nome)
    `)
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
