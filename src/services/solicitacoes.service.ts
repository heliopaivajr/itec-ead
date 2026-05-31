import { supabase } from '@/lib/supabase';

export type StatusSolicitacao = 'pendente' | 'aprovada' | 'recusada' | 'encerrada';

export interface SolicitacaoDisciplina {
  id: string;
  professor_id: string;
  disciplina_id: string;
  turma_id: string | null;
  status: StatusSolicitacao;
  observacao: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  encerrado_por: string | null;
  encerrado_em: string | null;
  contrato_id: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface SolicitacaoComDetalhes extends SolicitacaoDisciplina {
  professor_nome: string;
  disciplina_nome: string;
  disciplina_codigo: string;
  turma_codigo: string | null;
}

// Professor cria solicitação para uma disciplina
export async function criarSolicitacao(
  professorId: string,
  disciplinaId: string,
  turmaId: string | null,
  observacao?: string,
): Promise<{ data: SolicitacaoDisciplina | null; error: string | null }> {
  const { data, error } = await supabase
    .from('solicitacoes_disciplina')
    .insert({
      professor_id: professorId,
      disciplina_id: disciplinaId,
      turma_id: turmaId,
      observacao: observacao ?? null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as SolicitacaoDisciplina, error: null };
}

// Lista solicitações de um professor
export async function getSolicitacoesByProfessor(
  professorId: string,
): Promise<SolicitacaoDisciplina[]> {
  const { data } = await supabase
    .from('solicitacoes_disciplina')
    .select('*')
    .eq('professor_id', professorId)
    .order('criado_em', { ascending: false })
    .limit(50);

  return (data as SolicitacaoDisciplina[]) ?? [];
}

// Admin/secretaria lista todas as solicitações pendentes
export async function getSolicitacoesPendentes(): Promise<SolicitacaoComDetalhes[]> {
  const { data } = await supabase
    .from('solicitacoes_disciplina')
    .select(`
      *,
      professores!inner(nome_completo),
      disciplinas_v2!inner(nome, codigo),
      turmas(codigo)
    `)
    .eq('status', 'pendente')
    .order('criado_em', { ascending: true })
    .limit(100);

  if (!data) return [];

  return data.map((row: Record<string, unknown>) => ({
    ...(row as SolicitacaoDisciplina),
    professor_nome: (row.professores as { nome_completo: string }).nome_completo,
    disciplina_nome: (row.disciplinas_v2 as { nome: string }).nome,
    disciplina_codigo: (row.disciplinas_v2 as { codigo: string }).codigo,
    turma_codigo: row.turmas ? (row.turmas as { codigo: string }).codigo : null,
  }));
}

// Admin aprova solicitação → cria contrato_professor automaticamente
export async function aprovarSolicitacao(
  solicitacaoId: string,
  aprovadoPor: string,
): Promise<{ error: string | null }> {
  // 1. Busca a solicitação
  const { data: sol, error: fetchErr } = await supabase
    .from('solicitacoes_disciplina')
    .select('*')
    .eq('id', solicitacaoId)
    .single();

  if (fetchErr || !sol) return { error: fetchErr?.message ?? 'Solicitação não encontrada' };

  const s = sol as SolicitacaoDisciplina;

  // 2. Cria contrato_professor
  const { data: contrato, error: contratoErr } = await supabase
    .from('contratos_professor')
    .insert({ professor_id: s.professor_id, disciplina_id: s.disciplina_id, status: 'pendente' })
    .select('id')
    .single();

  if (contratoErr) return { error: contratoErr.message };

  // 3. Atualiza solicitação
  const { error: updateErr } = await supabase
    .from('solicitacoes_disciplina')
    .update({
      status: 'aprovada',
      aprovado_por: aprovadoPor,
      aprovado_em: new Date().toISOString(),
      contrato_id: (contrato as { id: string }).id,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', solicitacaoId);

  return { error: updateErr?.message ?? null };
}

// Admin recusa solicitação
export async function recusarSolicitacao(
  solicitacaoId: string,
  recusadoPor: string,
  motivo?: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('solicitacoes_disciplina')
    .update({
      status: 'recusada',
      aprovado_por: recusadoPor,
      aprovado_em: new Date().toISOString(),
      observacao: motivo ?? null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', solicitacaoId);

  return { error: error?.message ?? null };
}

// Professor ou admin encerra disciplina
export async function encerrarSolicitacao(
  solicitacaoId: string,
  encerradoPor: string,
): Promise<{ error: string | null }> {
  // Encerra a solicitação
  const { error: solErr } = await supabase
    .from('solicitacoes_disciplina')
    .update({
      status: 'encerrada',
      encerrado_por: encerradoPor,
      encerrado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', solicitacaoId);

  if (solErr) return { error: solErr.message };

  // Encerra também o contrato vinculado
  const { data: sol } = await supabase
    .from('solicitacoes_disciplina')
    .select('contrato_id')
    .eq('id', solicitacaoId)
    .single();

  if (sol && (sol as SolicitacaoDisciplina).contrato_id) {
    await supabase
      .from('contratos_professor')
      .update({ status: 'encerrado' })
      .eq('id', (sol as SolicitacaoDisciplina).contrato_id!);
  }

  return { error: null };
}
