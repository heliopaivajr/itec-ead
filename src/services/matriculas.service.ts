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
  motivo_suspensao?: string | null;    // 078 — inadimplência vs trancamento manual
  data_suspensao?: string | null;      // 078
  suspensa_por?: string | null;        // 078
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
  status?: string | string[],
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

  // Aceita um status único ou vários (aba "outros" do funil — inativa/evadida/suspensa)
  if (Array.isArray(status)) {
    if (status.length > 0) query = query.in('status', status);
  } else if (status) {
    query = query.eq('status', status);
  }

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

// Staff que pode aprovar/mudar status de matrícula.
const STAFF_ROLES = ['administracao', 'admin', 'superadmin'];

// Status para os quais SAIR de 'ativa' revoga o acesso do aluno (role → 'pendente').
// 'concluida' fica FORA de propósito (egresso mantém acesso — decisão de negócio 2c).
// Ajuste esta lista para mudar quais transições cortam o acesso.
const STATUS_REVOGA_ACESSO = ['trancada', 'cancelada', 'evadida', 'suspensa', 'inativa'];

async function requesterEhStaff(requesterId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles').select('role').eq('user_id', requesterId).single();
  return STAFF_ROLES.includes((data as { role: string } | null)?.role ?? '');
}

// Efeito de ACESSO vinculado ao status da matrícula (ação de SISTEMA — não passa
// por getRolesPermitidas, que é a hierarquia de edição MANUAL de role na UI).
//  'aluno'    → acesso ao dashboard.
//  'pendente' → sem acesso (ProtectedRoute → /aguardando), preservando os dados do perfil.
async function aplicarAcesso(alunoId: string, role: 'aluno' | 'pendente'): Promise<void> {
  await supabase.from('profiles').update({ role }).eq('id', alunoId);
  await supabase.from('user_roles').upsert({ user_id: alunoId, role });
}

// ÚNICO caminho de aprovação (unifica Matriculas.tsx + FichaAluno.tsx — R3.2 Leva 2a).
// administracao/admin/superadmin; aceita 'pendente' OU 'aguardando_aprovacao';
// seta ativa + validado_* + libera acesso (role 'aluno'). Idempotente se já ativa.
export async function aprovarMatricula(
  matriculaId: string,
  requesterId: string
): Promise<ServiceResult> {
  if (!(await requesterEhStaff(requesterId))) {
    return { error: 'Permissão insuficiente para aprovar matrículas' };
  }

  const { data: mat } = await supabase
    .from('matriculas').select('status, aluno_id').eq('id', matriculaId).single();

  if (!mat) return { error: 'Matrícula não encontrada' };
  const m = mat as { status: string; aluno_id: string };

  if (m.status === 'ativa') return { error: null }; // idempotente — já aprovada

  if (!['pendente', 'aguardando_aprovacao'].includes(m.status)) {
    return { error: 'Apenas matrículas pendentes ou aguardando aprovação podem ser aprovadas' };
  }

  const { error } = await supabase
    .from('matriculas')
    .update({ status: 'ativa', validado_por: requesterId, validado_em: new Date().toISOString() })
    .eq('id', matriculaId);

  if (error) return { error: error.message };

  await aplicarAcesso(m.aluno_id, 'aluno'); // libera acesso
  return { error: null };
}

// Transição LIVRE de status (qualquer → qualquer) com efeito de acesso vinculado:
//  - novoStatus 'ativa'         → validado_* + libera acesso (mesma regra da aprovação).
//  - saindo de 'ativa'          → revoga acesso (role 'pendente'; mantém dados).
//  - sempre grava observacoes.
// observacao é posicional (pode ser undefined) para manter a ordem obs → requesterId.
export async function mudarStatusMatricula(
  matriculaId: string,
  novoStatus: string,
  observacao: string | undefined,
  requesterId: string
): Promise<ServiceResult> {
  if (!(await requesterEhStaff(requesterId))) {
    return { error: 'Permissão insuficiente para alterar matrículas' };
  }

  const { data: mat } = await supabase
    .from('matriculas').select('status, aluno_id').eq('id', matriculaId).single();

  if (!mat) return { error: 'Matrícula não encontrada' };
  const m = mat as { status: string; aluno_id: string };

  const payload: Record<string, unknown> = { status: novoStatus, observacoes: observacao || null };
  if (novoStatus === 'ativa') {
    payload.validado_por = requesterId;
    payload.validado_em  = new Date().toISOString();
  }

  const { error } = await supabase.from('matriculas').update(payload).eq('id', matriculaId);
  if (error) return { error: error.message };

  if (novoStatus === 'ativa') {
    await aplicarAcesso(m.aluno_id, 'aluno');
  } else if (m.status === 'ativa' && STATUS_REVOGA_ACESSO.includes(novoStatus)) {
    // Saiu de 'ativa' para um status revogador → remove acesso (role 'pendente'; mantém dados).
    // 'concluida' NÃO está na lista: egresso mantém acesso para ver histórico / baixar certificado.
    await aplicarAcesso(m.aluno_id, 'pendente');
  }
  return { error: null };
}

// NOTA (R3.2 Leva 2c): removida a antiga `updateStatusMatricula` (troca de status SEM
// efeito de acesso). Toda mudança de status passa por `mudarStatusMatricula`, que mantém
// role/acesso consistentes com o status — evitando o bug de aluno 'ativo' sem acesso.

// ─── E5: suspender/reativar por inadimplência (RPCs 078) ─────────────────────
// Gate no BANCO (is_staff() OR is_financeiro()) — inclui o financeiro (Breno) sem
// UPDATE amplo em matriculas (fronteira 067). Efeito de acesso completo dentro da RPC
// (matriculas.status + profiles.role; user_roles é view e reflete sozinho — LICAO-039).
export async function suspenderMatriculaInadimplencia(matriculaId: string, motivo: string): Promise<ServiceResult> {
  const { error } = await supabase.rpc('suspender_matricula_inadimplencia', {
    p_matricula_id: matriculaId,
    p_motivo: motivo,
  });
  if (error) {
    console.error('[suspenderMatriculaInadimplencia]', error.message);
    return { error: error.message };
  }
  return { error: null };
}

export async function reativarMatricula(matriculaId: string): Promise<ServiceResult> {
  const { error } = await supabase.rpc('reativar_matricula', { p_matricula_id: matriculaId });
  if (error) {
    console.error('[reativarMatricula]', error.message);
    return { error: error.message };
  }
  return { error: null };
}
