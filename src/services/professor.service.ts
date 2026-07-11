import { supabase } from '@/lib/supabase';

export interface Professor {
  id: string;
  user_id: string | null;
  nome_completo: string;
  cpf: string;
  rg: string | null;
  data_nascimento: string | null;
  telefone: string | null;
  email: string;
  endereco: string | null;
  formacao: string | null;
  titulacao: string | null;
  experiencia_ministerial: string | null;
  igreja_local: string | null;
  ativo: boolean;
  // migration 028 — status expandido (sincronizado com ativo via trigger)
  status?: 'ativo' | 'aguardando' | 'afastado' | 'desligado';
  criado_em: string;
  atualizado_em: string;
}

export interface ContratoProfessor {
  id: string;
  professor_id: string;
  disciplina_id: string;
  status: 'pendente' | 'preenchido' | 'impresso' | 'assinado' | 'encerrado';
  dados_preenchidos: Record<string, unknown> | null;
  pdf_url: string | null;
  gerado_por: string | null;
  gerado_em: string | null;
  preenchido_em: string | null;
  impresso_em: string | null;
  assinado_em: string | null;
  criado_em: string;
}

export type ProfessorPayload = Omit<Professor, 'id' | 'criado_em' | 'atualizado_em'>;

export interface ServiceResult {
  error: string | null;
}

export interface PaginatedProfessores {
  data: Professor[];
  total: number;
}

// Paginação + busca + filtro ativo/todos
export async function getProfessores(
  page = 1,
  limit = 20,
  search = '',
  apenasAtivos = true
): Promise<PaginatedProfessores> {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from('professores')
    .select('*', { count: 'exact' });

  if (apenasAtivos) query = query.not('status', 'eq', 'desligado');
  if (search.trim()) {
    query = query.or(
      `nome_completo.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`
    );
  }

  const { data, count, error } = await query
    .order('nome_completo', { ascending: true })
    .range(from, to);

  if (error) return { data: [], total: 0 };
  return { data: (data as Professor[]) ?? [], total: count ?? 0 };
}

export async function getProfessorById(id: string): Promise<Professor | null> {
  const { data, error } = await supabase
    .from('professores')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Professor;
}

export async function getProfessorByUserId(userId: string): Promise<Professor | null> {
  const { data, error } = await supabase
    .from('professores')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as Professor;
}

export async function createProfessor(
  dados: ProfessorPayload
): Promise<{ data: Professor | null; error: string | null }> {
  const { data, error } = await supabase
    .from('professores')
    .insert(dados)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Professor, error: null };
}

export async function updateProfessor(
  id: string,
  dados: Partial<ProfessorPayload>
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('professores')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function getContratosByProfessor(
  professorId: string
): Promise<ContratoProfessor[]> {
  const { data, error } = await supabase
    .from('contratos_professor')
    .select('*')
    .eq('professor_id', professorId)
    .order('criado_em', { ascending: false })
    .limit(50); // máx. realista: 1-6 contratos/professor/ano, proteção ampla

  if (error) return [];
  return (data as ContratoProfessor[]) ?? [];
}

export async function getContratoById(
  id: string
): Promise<ContratoProfessor | null> {
  const { data, error } = await supabase
    .from('contratos_professor')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as ContratoProfessor;
}

export async function getContratoByDisciplina(
  professorId: string,
  disciplinaId: string
): Promise<ContratoProfessor | null> {
  const { data, error } = await supabase
    .from('contratos_professor')
    .select('*')
    .eq('professor_id', professorId)
    .eq('disciplina_id', disciplinaId)
    .single();

  if (error || !data) return null;
  return data as ContratoProfessor;
}

// ─── Contrato assinado (Storage: bucket privado 'contratos-professor', migração 056) ──
// Fluxo: professor baixa o contrato, assina fora (gov.br) e SOBE o PDF aqui.
// O envio grava pdf_url na linha do contrato mas NÃO muda o status — quem confirma
// ("Marcar como assinado") é a secretaria, no ProfessoresAdmin. O RLS (056) garante
// que o professor só escreve no path do PRÓPRIO contrato e não altera status.

const BUCKET_CONTRATOS = 'contratos-professor';
export const MAX_CONTRATO_BYTES = 20 * 1024 * 1024; // 20 MB — PDF assinado

export async function uploadContratoAssinado(
  contratoId: string,
  file: File
): Promise<ServiceResult> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  const ehPdf = ext === 'pdf' || file.type === 'application/pdf';
  if (!ehPdf) return { error: 'O contrato assinado deve ser um arquivo PDF.' };
  if (file.size > MAX_CONTRATO_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { error: `Arquivo muito grande (${mb} MB). Limite de 20 MB.` };
  }

  // Re-envio gera novo UUID; o PDF anterior permanece no bucket (histórico).
  const path = `${contratoId}/${crypto.randomUUID()}.pdf`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET_CONTRATOS)
    .upload(path, file, { upsert: false, contentType: 'application/pdf' });
  if (upErr) return { error: upErr.message };

  // Só pdf_url: a tabela (009) não tem atualizado_em, e o RLS (056) trava as demais colunas.
  const { error: updErr } = await supabase
    .from('contratos_professor')
    .update({ pdf_url: path })
    .eq('id', contratoId);
  if (updErr) return { error: updErr.message };

  return { error: null };
}

// Signed URL (1h) do PDF assinado — usada pelo professor e pela secretaria.
export async function getContratoAssinadoUrl(
  pdfPath: string
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(BUCKET_CONTRATOS)
    .createSignedUrl(pdfPath, 3600);
  if (error || !data) return { url: null, error: error?.message ?? 'Não foi possível gerar o link.' };
  return { url: data.signedUrl, error: null };
}

// ─── Roster operacional (RPC get_alunos_operacional — migração 057) ─────────────
// Alunos matriculados de uma disciplina com SÓ campos operacionais (nome/foto —
// sem email/cpf/rg por minimização LGPD) + snapshot acadêmico. O gate está na
// função (professor da cadeira OU staff): quem não pode ver recebe [] sem erro.
export interface AlunoOperacional {
  aluno_id: string;
  full_name: string;
  avatar_url: string | null;
  matricula_id: string;
  nota: number | null;
  faltas: number | null;
  frequencia_percentual: number | null;
  status_disciplina: string;
}

// turmaId opcional (058): NULL/ausente = todos os matriculados da disciplina (todas as
// turmas); com turmaId = só os alunos daquela turma. MeusAlunos/Frequência chamam sem
// turma; Notas (escopo-turma) passa o turmaId.
export async function getAlunosOperacional(
  disciplinaId: string,
  turmaId?: string,
): Promise<AlunoOperacional[]> {
  const { data, error } = await supabase.rpc('get_alunos_operacional', {
    p_disciplina_id: disciplinaId,
    ...(turmaId ? { p_turma_id: turmaId } : {}),
  });
  if (error) {
    console.error('[getAlunosOperacional]', error.message);
    return [];
  }
  return (data as AlunoOperacional[]) ?? [];
}

export async function updateStatusContrato(
  id: string,
  status: ContratoProfessor['status']
): Promise<ServiceResult> {
  const now = new Date().toISOString();
  const extra: Record<string, string> = {
    preenchido: 'preenchido_em',
    impresso:   'impresso_em',
    assinado:   'assinado_em',
  };

  const update: Record<string, string> = { status };
  if (extra[status]) update[extra[status]] = now;

  const { error } = await supabase
    .from('contratos_professor')
    .update(update)
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function desativarProfessor(id: string): Promise<ServiceResult> {
  const { error } = await supabase
    .from('professores')
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function reativarProfessor(id: string): Promise<ServiceResult> {
  const { error } = await supabase
    .from('professores')
    .update({ ativo: true, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}
// Atualiza status via campo status (trigger migration 028 sincroniza ativo automaticamente)
export async function updateStatusProfessor(
  professorId: string,
  status: 'ativo' | 'aguardando' | 'afastado' | 'desligado',
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('professores')
    .update({ status })
    .eq('id', professorId);
  if (error) return { error: error.message };
  return { error: null };
}

export interface DisciplinaAtiva {
  contrato_id: string;
  disciplina_id: string;
  disciplina_nome: string;
  turma_id: string | null;
  turma_nome: string | null;
  turma_ano: number | null;
  turma_semestre: number | null;
}

// Status de contrato que contam como VÍNCULO ATIVO (habilitam o professor a trabalhar).
// Decisão C (Hélio): o vínculo — contrato não-encerrado — já destrava o professor;
// a assinatura física é formalidade PARALELA, não bloqueia o uso. Ajuste esta lista
// para mudar o que conta como "disciplina ativa". (Ver LICAO / R3.3a.)
export const CONTRATO_ATIVO = ['pendente', 'preenchido', 'impresso', 'assinado'];

// Disciplinas ativas do professor — contratos NÃO-encerrados (CONTRATO_ATIVO).
// Resolve turma via: contrato → disciplina → modulo → curso → turmas ativas
export async function getDisciplinasAtivasProfessor(
  professorId: string
): Promise<DisciplinaAtiva[]> {
  // Query 1: contratos ativos (não-encerrados) com disciplina + módulo + curso
  type ContratoRow = {
    id: string;
    disciplina_id: string;
    disciplinas_v2: {
      nome: string;
      modulos: { curso_id: string };
    } | null;
  };

  const { data: contratos } = await supabase
    .from('contratos_professor')
    .select('id, disciplina_id, disciplinas_v2(nome, modulos(curso_id))')
    .eq('professor_id', professorId)
    .in('status', CONTRATO_ATIVO)
    .limit(20);

  if (!contratos || contratos.length === 0) return [];

  const rows = contratos as unknown as ContratoRow[];

  // Coleta curso_ids únicos
  const cursoIds = [
    ...new Set(
      rows
        .map(r => r.disciplinas_v2?.modulos?.curso_id)
        .filter((id): id is string => !!id)
    ),
  ];

  if (cursoIds.length === 0) {
    return rows.map(r => ({
      contrato_id: r.id,
      disciplina_id: r.disciplina_id,
      disciplina_nome: r.disciplinas_v2?.nome ?? r.disciplina_id,
      turma_id: null,
      turma_nome: null,
      turma_ano: null,
      turma_semestre: null,
    }));
  }

  // Query 2: turmas ativas para esses cursos
  const { data: turmasData } = await supabase
    .from('turmas')
    .select('id, nome, ano, semestre, curso_id')
    .in('curso_id', cursoIds)
    .in('status', ['ativa', 'planejada'])
    .order('ano', { ascending: false })
    .limit(10);

  type TurmaRow = { id: string; nome: string; ano: number; semestre: number; curso_id: string };
  const turmaByCurso = new Map<string, TurmaRow>();
  for (const t of (turmasData ?? []) as TurmaRow[]) {
    // Mantém a turma mais recente por curso
    if (!turmaByCurso.has(t.curso_id)) turmaByCurso.set(t.curso_id, t);
  }

  return rows.map(r => {
    const cursoId = r.disciplinas_v2?.modulos?.curso_id ?? null;
    const turma = cursoId ? turmaByCurso.get(cursoId) ?? null : null;
    return {
      contrato_id: r.id,
      disciplina_id: r.disciplina_id,
      disciplina_nome: r.disciplinas_v2?.nome ?? r.disciplina_id,
      turma_id: turma?.id ?? null,
      turma_nome: turma?.nome ?? null,
      turma_ano: turma?.ano ?? null,
      turma_semestre: turma?.semestre ?? null,
    };
  });
}

export async function vincularDisciplina(
  professorId: string,
  disciplinaId: string,
  geradoPor: string
): Promise<{ data: ContratoProfessor | null; error: string | null }> {
  const { data, error } = await supabase
    .from('contratos_professor')
    .insert({
      professor_id: professorId,
      disciplina_id: disciplinaId,
      status: 'pendente',
      gerado_por: geradoPor,
      gerado_em: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as ContratoProfessor, error: null };
}

export async function preencherContrato(
  id: string,
  dados: Record<string, unknown>
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('contratos_professor')
    .update({
      dados_preenchidos: dados,
      status: 'preenchido',
      preenchido_em: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}
