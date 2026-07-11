import { supabase } from '@/lib/supabase';
import { getResumoFrequenciaPorTurma } from './frequencia.service';
import { getAlunosOperacional } from './professor.service';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoAvaliacao = 'N1' | 'N2' | 'recuperacao' | 'trabalho' | 'extra';

export type StatusNota =
  | 'aprovado'
  | 'recuperacao'
  | 'reprovado_nota'
  | 'reprovado_falta'
  | 'cursando';

export interface Avaliacao {
  id: string;
  disciplina_id: string;
  turma_id: string;
  tipo: TipoAvaliacao;
  descricao: string | null;
  peso: number;
  data_avaliacao: string | null;
  criado_por: string | null;
  created_at: string;
}

export interface NotaAluno {
  id: string;
  avaliacao_id: string;
  aluno_id: string;
  disciplina_id: string;
  turma_id: string;
  nota: number | null;
  lancado_por: string | null;
  lancado_em: string;
  updated_at: string;
  // join
  avaliacao?: Pick<Avaliacao, 'tipo' | 'descricao' | 'peso'>;
  aluno?: { full_name: string; email: string };
}

export interface ResultadoDisciplina {
  n1: number | null;
  n2: number | null;
  recuperacao: number | null;
  media: number | null;
  frequencia: number;
  status: StatusNota;
}

export interface ConsolidadoAluno {
  aluno_id: string;
  nome: string;
  email: string;
  n1: number | null;
  n2: number | null;
  recuperacao: number | null;
  media: number | null;
  frequencia: number;
  status: StatusNota;
}

// ─── Regra de negócio aprovada (Hélio, 2026-05-28) ───────────────────────────
// Fórmula: (N1 + N2) / 2
// Aprovado:         média >= 7.0 E frequência >= 75%
// Recuperação:      média 5.0–6.9
// Reprovado nota:   média < 5.0
// Reprovado falta:  frequência < 75% (independe da nota)

export function calcularStatus(media: number | null, frequencia: number): StatusNota {
  if (media === null) return 'cursando';
  if (frequencia < 75) return 'reprovado_falta';
  if (media >= 7.0) return 'aprovado';
  if (media >= 5.0) return 'recuperacao';
  return 'reprovado_nota';
}

function calcularMedia(n1: number | null, n2: number | null): number | null {
  if (n1 === null || n2 === null) return null;
  return Math.round(((n1 + n2) / 2) * 10) / 10;
}

// ─── Avaliações ───────────────────────────────────────────────────────────────

export async function createAvaliacao(
  disciplinaId: string,
  turmaId: string,
  tipo: TipoAvaliacao,
  criadoPor: string,
  descricao?: string,
  dataAvaliacao?: string
): Promise<{ data: Avaliacao | null; error: string | null }> {
  const { data, error } = await supabase
    .from('avaliacoes')
    .insert({ disciplina_id: disciplinaId, turma_id: turmaId, tipo, descricao, data_avaliacao: dataAvaliacao, criado_por: criadoPor })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Avaliacao, error: null };
}

export async function getAvaliacoesByDisciplina(
  disciplinaId: string,
  turmaId: string
): Promise<Avaliacao[]> {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('*')
    .eq('disciplina_id', disciplinaId)
    .eq('turma_id', turmaId)
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) return [];
  return (data as Avaliacao[]) ?? [];
}

// ─── Notas ────────────────────────────────────────────────────────────────────

export async function lancarNota(
  avaliacaoId: string,
  alunoId: string,
  disciplinaId: string,
  turmaId: string,
  nota: number,
  lancadoPor: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notas_aluno')
    .upsert(
      { avaliacao_id: avaliacaoId, aluno_id: alunoId, disciplina_id: disciplinaId, turma_id: turmaId, nota, lancado_por: lancadoPor, updated_at: new Date().toISOString() },
      { onConflict: 'avaliacao_id,aluno_id' }
    );

  if (error) return { error: error.message };
  return { error: null };
}

export async function atualizarNota(
  notaId: string,
  nota: number,
  lancadoPor: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notas_aluno')
    .update({ nota, lancado_por: lancadoPor, updated_at: new Date().toISOString() })
    .eq('id', notaId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function getNotasByAlunoDisciplina(
  alunoId: string,
  disciplinaId: string
): Promise<NotaAluno[]> {
  const { data, error } = await supabase
    .from('notas_aluno')
    .select('*, avaliacao:avaliacoes(tipo, descricao, peso)')
    .eq('aluno_id', alunoId)
    .eq('disciplina_id', disciplinaId)
    .limit(10);

  if (error) return [];
  return (data as NotaAluno[]) ?? [];
}

// ─── Cálculo de resultado ─────────────────────────────────────────────────────

export async function calcularResultado(
  alunoId: string,
  disciplinaId: string,
  turmaId: string
): Promise<ResultadoDisciplina> {
  const notas = await getNotasByAlunoDisciplina(alunoId, disciplinaId);
  const resumos = await getResumoFrequenciaPorTurma(disciplinaId, [alunoId]);
  const frequencia = resumos.get(alunoId)?.percentual_presenca ?? 100;

  const n1 = notas.find(n => n.avaliacao?.tipo === 'N1')?.nota ?? null;
  const n2 = notas.find(n => n.avaliacao?.tipo === 'N2')?.nota ?? null;
  const rec = notas.find(n => n.avaliacao?.tipo === 'recuperacao')?.nota ?? null;

  const media = calcularMedia(n1, n2);
  const status = calcularStatus(media, frequencia);

  return { n1, n2, recuperacao: rec, media, frequencia, status };
}

// ─── Consolidado por turma ────────────────────────────────────────────────────

export async function getConsolidadoTurma(
  turmaId: string,
  disciplinaId: string
): Promise<ConsolidadoAluno[]> {
  // A LISTA de alunos vem do ROSTER (matriculados na turma via get_alunos_operacional/058),
  // não de notas_aluno — assim uma turma sem nota lançada ainda mostra todos os alunos.
  // As notas são SOBREPOSTAS por aluno_id (merge LICAO-026). O nome vem do roster, então
  // a query de notas dispensa o embed de profiles (bônus LGPD-01 fase 2).
  const roster = await getAlunosOperacional(disciplinaId, turmaId);
  if (roster.length === 0) return [];

  // Notas da disciplina/turma (sem join de profiles — nome vem do roster)
  const { data: notasData, error } = await supabase
    .from('notas_aluno')
    .select('aluno_id, nota, avaliacao:avaliacoes(tipo)')
    .eq('disciplina_id', disciplinaId)
    .eq('turma_id', turmaId)
    .limit(500);

  if (error) console.error('[getConsolidadoTurma] notas:', error.message);

  type NotaRow = {
    aluno_id: string;
    nota: number | null;
    avaliacao: { tipo: string } | null;
  };

  // Agrupa notas por aluno (n1/n2/recuperacao)
  const notasByAluno = new Map<string, { n1: number | null; n2: number | null; rec: number | null }>();
  for (const r of (notasData ?? []) as unknown as NotaRow[]) {
    const tipo = r.avaliacao?.tipo ?? '';
    const entry = notasByAluno.get(r.aluno_id) ?? { n1: null, n2: null, rec: null };
    if (tipo === 'N1') entry.n1 = r.nota;
    else if (tipo === 'N2') entry.n2 = r.nota;
    else if (tipo === 'recuperacao') entry.rec = r.nota;
    notasByAluno.set(r.aluno_id, entry);
  }

  // Frequência ao vivo (por aluno do roster)
  const alunoIds = roster.map(a => a.aluno_id);
  const resumos = await getResumoFrequenciaPorTurma(disciplinaId, alunoIds);

  // Base = roster; sobrepõe notas + frequência por aluno_id
  return roster.map((al): ConsolidadoAluno => {
    const notas = notasByAluno.get(al.aluno_id) ?? { n1: null, n2: null, rec: null };
    // % ao vivo se há chamada; senão o consolidado da matrícula (retroativo); senão 100.
    const frequencia = resumos.get(al.aluno_id)?.percentual_presenca
      ?? (al.frequencia_percentual !== null ? Math.round(al.frequencia_percentual) : 100);
    const media = calcularMedia(notas.n1, notas.n2);
    return {
      aluno_id: al.aluno_id,
      nome: al.full_name,
      email: '',                       // roster não expõe email (minimização LGPD); campo mantido no shape
      n1: notas.n1,
      n2: notas.n2,
      recuperacao: notas.rec,
      media,
      frequencia,
      status: calcularStatus(media, frequencia),
    };
  });
}

// Consolidado para o painel do professor: alunos × notas de uma disciplina/turma
export async function getNotasByTurmaAndDisciplina(
  turmaId: string,
  disciplinaId: string
): Promise<ConsolidadoAluno[]> {
  return getConsolidadoTurma(turmaId, disciplinaId);
}

// Batch: resumo de notas de um aluno em múltiplas disciplinas (1 query)
// Usado por useMeusCursos para exibir notas no painel do aluno sem N+1
export async function getNotasBatchByAluno(
  alunoId: string,
  disciplinaIds: string[]
): Promise<Map<string, { n1: number | null; n2: number | null; recuperacao: number | null; media: number | null }>> {
  if (disciplinaIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('notas_aluno')
    .select('disciplina_id, nota, avaliacao:avaliacoes(tipo)')
    .eq('aluno_id', alunoId)
    .in('disciplina_id', disciplinaIds)
    .limit(disciplinaIds.length * 5);

  const result = new Map<string, { n1: number | null; n2: number | null; recuperacao: number | null; media: number | null }>();
  if (error || !data) return result;

  type Row = { disciplina_id: string; nota: number | null; avaliacao: { tipo: string } | null };

  for (const r of data as unknown as Row[]) {
    const tipo = (Array.isArray(r.avaliacao) ? r.avaliacao[0]?.tipo : r.avaliacao?.tipo) ?? '';
    const entry = result.get(r.disciplina_id) ?? { n1: null, n2: null, recuperacao: null, media: null };
    if (tipo === 'N1') entry.n1 = r.nota;
    else if (tipo === 'N2') entry.n2 = r.nota;
    else if (tipo === 'recuperacao') entry.recuperacao = r.nota;
    result.set(r.disciplina_id, entry);
  }

  // calcula média para cada entrada
  for (const [id, entry] of result) {
    if (entry.n1 !== null && entry.n2 !== null) {
      entry.media = Math.round(((entry.n1 + entry.n2) / 2) * 10) / 10;
    }
    result.set(id, entry);
  }

  return result;
}
