import { supabase } from '@/lib/supabase';
import { getNotasBatchByAluno } from './notas.service';
import { getResumoFrequenciaBatch } from './frequencia.service';
import { calcularStatus } from './notas.service';
import type { StatusDisciplina } from './matricula-academica.service';

// ─── Tipos do Histórico Acadêmico ─────────────────────────────────────────────

export type StatusHistorico =
  | 'aprovado_direto'
  | 'recuperacao'
  | 'reprovado_nota'
  | 'reprovado_falta'
  | 'convalidado'
  | 'em_andamento'
  | 'pendente';

export interface DisciplinaHistorico {
  id: string;
  nome: string;
  carga_horaria: number;
  creditos: number;
  notas: {
    n1: number | null;
    n2: number | null;
    recuperacao: number | null;
    media_final: number | null;
  };
  frequencia: {
    total_aulas: number;
    presencas: number;
    percentual: number;
  };
  status: StatusHistorico;
  // Status bruto de matriculas_disciplina (lançamento consolidado R2). Opcional.
  status_disciplina?: StatusDisciplina | null;
  // true quando os valores vieram do lançamento consolidado (matriculas_disciplina)
  consolidado?: boolean;
}

export interface ModuloHistorico {
  id: string;
  nome: string;
  ordem: number;
  disciplinas: DisciplinaHistorico[];
  media_modulo: number | null;
  status_modulo: 'aprovado' | 'em_andamento' | 'pendente';
}

export interface HistoricoAluno {
  modulos: ModuloHistorico[];
  media_geral: number | null;
  total_carga_horaria: number;
  total_creditos: number;
  // Créditos concluídos (status aprovado_direto ou convalidado). Opcional.
  creditos_aprovados?: number;
  disciplinas_aprovadas: number;
  disciplinas_reprovadas: number;
  disciplinas_em_andamento: number;
}

export interface Curso {
  id: string;
  codigo: string;
  nome: string;
  modalidade: string | null;
  horario: string | null;
  carga_horaria_total: number | null;
  creditos_total: number | null;
  ativo: boolean;
  inicio_turma: string | null;
  manual_aluno_url: string | null;
  criado_em: string;
}

export interface Modulo {
  id: string;
  curso_id: string;
  nome: string;
  ordem: number;
  ano_curso: 1 | 2 | 3;
  semestre: 1 | 2;
  periodo: string | null;
  data_inicio: string | null;
  data_fim: string | null;
}

export interface Disciplina {
  id: string;
  modulo_id: string;
  codigo: string;
  nome: string;
  area: 'B' | 'T' | 'P';
  ano_curso: 1 | 2 | 3;
  carga_horaria_presencial: number;
  carga_horaria_ead: number;
  creditos: number;
  tipo: 'regular' | 'eletiva' | 'obrigatoria';
  status_manual: 'pendente' | 'disponivel';
  manual_url: string | null;
  descricao: string | null;
}

export interface Prerequisito {
  id: string;
  disciplina_id: string;
  prerequisito_id: string;
  tipo: 'prerequisito' | 'corequisito';
}

export interface VerificacaoPrerequisitos {
  aprovado: boolean;
  faltam: Disciplina[];
}

// Curso ativo (ativo=true, mais recente)
export async function getCursoAtivo(): Promise<Curso | null> {
  const { data, error } = await supabase
    .from('cursos')
    .select('*')
    .eq('ativo', true)
    .order('inicio_turma', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Curso;
}

export async function getModulosByCurso(cursoId: string): Promise<Modulo[]> {
  const { data, error } = await supabase
    .from('modulos')
    .select('*')
    .eq('curso_id', cursoId)
    .order('ordem', { ascending: true })
    .limit(12); // máx. realista: 6 módulos/curso, proteção 2×

  if (error) return [];
  return (data as Modulo[]) ?? [];
}

export async function getDisciplinasByModulo(moduloId: string): Promise<Disciplina[]> {
  const { data, error } = await supabase
    .from('disciplinas_v2')
    .select('*')
    .eq('modulo_id', moduloId)
    .order('codigo', { ascending: true })
    .limit(50); // máx. realista: 8-10 disciplinas/módulo, proteção 5×

  if (error) return [];
  return (data as Disciplina[]) ?? [];
}

export async function getAllDisciplinas(): Promise<Disciplina[]> {
  const { data, error } = await supabase
    .from('disciplinas_v2')
    .select('*')
    .order('codigo', { ascending: true })
    .limit(200); // máx. realista para o ITEC

  if (error) return [];
  return (data as Disciplina[]) ?? [];
}

export async function getDisciplinaById(id: string): Promise<Disciplina | null> {
  const { data, error } = await supabase
    .from('disciplinas_v2')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Disciplina;
}

export async function getPrerequisitos(disciplinaId: string): Promise<Prerequisito[]> {
  const { data, error } = await supabase
    .from('prerequisitos_v2')
    .select('*')
    .eq('disciplina_id', disciplinaId)
    .limit(20); // máx. realista: 3-5 pré-requisitos/disciplina, proteção 4×

  if (error) return [];
  return (data as Prerequisito[]) ?? [];
}

// Verificação individual de pré-requisito REMOVIDA (PERF-01, auditoria 2026-07-05):
// usava uma pseudo-subquery inválida (query builder passado como valor de .eq) e não
// tinha nenhum caller em produção. Use verificarPrerequisitoBatch — para uma única
// disciplina, chame com [disciplinaId].

// Batch: pré-requisitos para múltiplas disciplinas de um aluno (3 queries)
export async function verificarPrerequisitoBatch(
  alunoId: string,
  disciplinaIds: string[],
  todasDisciplinas: Disciplina[]
): Promise<Map<string, VerificacaoPrerequisitos>> {
  if (disciplinaIds.length === 0) return new Map();

  const discMap = new Map(todasDisciplinas.map(d => [d.id, d]));

  const [prereqRes, matriculaRes, excecoesRes] = await Promise.all([
    supabase
      .from('prerequisitos_v2')
      .select('disciplina_id, prerequisito_id, tipo')
      .in('disciplina_id', disciplinaIds)
      .limit(disciplinaIds.length * 10),
    supabase
      .from('matriculas_disciplina')
      // matriculas_disciplina NÃO tem aluno_id — filtrar via join com matriculas
      // (mesmo padrão de matricula-academica.service getMatriculasDisciplinaByAluno).
      // Conta como "cursada" apenas aprovado/convalidado (D2: recuperacao NÃO libera).
      .select('disciplina_id, matricula:matriculas!inner(aluno_id)')
      .in('status', ['aprovado', 'convalidado'])
      .eq('matricula.aluno_id', alunoId)
      .limit(200),
    supabase
      .from('excecoes_prerequisito')
      .select('disciplina_id, prerequisito_dispensado_id')
      .eq('aluno_id', alunoId)
      .in('disciplina_id', disciplinaIds)
      .limit(200),
  ]);

  type PreqRow = { disciplina_id: string; prerequisito_id: string; tipo: string };
  const prereqs = (prereqRes.data ?? []) as PreqRow[];
  const cursadas = new Set(
    ((matriculaRes.data ?? []) as { disciplina_id: string }[]).map(r => r.disciplina_id)
  );

  // Mapear exceções por disciplina
  type ExcecaoRow = { disciplina_id: string; prerequisito_dispensado_id: string };
  const excecoesPorDisc = new Map<string, Set<string>>();

  for (const exc of (excecoesRes.data ?? []) as ExcecaoRow[]) {
    const set = excecoesPorDisc.get(exc.disciplina_id) ?? new Set<string>();
    set.add(exc.prerequisito_dispensado_id);
    excecoesPorDisc.set(exc.disciplina_id, set);
  }

  const byDisc = new Map<string, PreqRow[]>();
  for (const p of prereqs) {
    const arr = byDisc.get(p.disciplina_id) ?? [];
    arr.push(p);
    byDisc.set(p.disciplina_id, arr);
  }

  const result = new Map<string, VerificacaoPrerequisitos>();
  for (const id of disciplinaIds) {
    const reqs = byDisc.get(id) ?? [];
    if (reqs.length === 0) {
      result.set(id, { aprovado: true, faltam: [] });
      continue;
    }

    // Considera exceções autorizadas
    const excecoesDaDisc = excecoesPorDisc.get(id) ?? new Set<string>();

    const faltam = reqs
      .filter(p =>
        p.tipo === 'prerequisito' &&
        !cursadas.has(p.prerequisito_id) &&
        !excecoesDaDisc.has(p.prerequisito_id)
      )
      .map(p => discMap.get(p.prerequisito_id))
      .filter((d): d is Disciplina => d !== undefined);

    result.set(id, { aprovado: faltam.length === 0, faltam });
  }
  return result;
}

// Turmas em que a disciplina é lecionada. DUAS fontes, NENHUM join aninhado:
//
// A versão anterior fazia `matriculas!inner(turma_id)` — join aninhado sob RLS
// (LICAO-026). Para o PROFESSOR o embed voltava vazio (ele não tem NENHUMA policy
// de SELECT em `matriculas` — nem a 035 original incluía professor), o !inner
// derrubava todas as linhas, o `.single()` virava erro 406 e o erro era engolido
// → null silencioso → "Sem turma vinculada" mesmo com a turma existindo no banco.
// (No SQL Editor a mesma query funciona porque service_role bypassa a RLS.)
//
// Fonte 1 — aulas_recorrentes (grade horária): liga disciplina→turma direto,
//   SELECT é `USING (true)` p/ authenticated (029) → o professor LÊ. É a fonte
//   oficial do vínculo e pré-requisito do R02 (grade cadastrada).
// Fonte 2 — fallback via matrículas em 2 queries SEPARADAS (LICAO-026):
//   matriculas_disciplina (professor lê, 010) → matriculas.in(ids) (staff lê).
//   Para professor esta fonte pode voltar vazia por RLS — por isso é fallback.
// Erros são LOGADOS (LICAO-027), nunca engolidos.
export async function getTurmasByDisciplina(disciplinaId: string): Promise<string[]> {
  // Fonte 1: grade horária (legível por qualquer authenticated)
  const { data: aulas, error: errAulas } = await supabase
    .from('aulas_recorrentes')
    .select('turma_id')
    .eq('disciplina_id', disciplinaId)
    .eq('ativo', true)
    .limit(10);

  if (errAulas) console.error('[getTurmasByDisciplina] aulas_recorrentes:', errAulas.message);
  const daGrade = [...new Set(((aulas ?? []) as { turma_id: string }[])
    .map(a => a.turma_id).filter(Boolean))];
  if (daGrade.length > 0) return daGrade;

  // Fonte 2 (fallback): matriculas_disciplina → matriculas, sem join aninhado
  const { data: matsDisc, error: errMd } = await supabase
    .from('matriculas_disciplina')
    .select('matricula_id')
    .eq('disciplina_id', disciplinaId)
    .limit(100);

  if (errMd) console.error('[getTurmasByDisciplina] matriculas_disciplina:', errMd.message);
  const matriculaIds = ((matsDisc ?? []) as { matricula_id: string }[]).map(m => m.matricula_id);
  if (matriculaIds.length === 0) return [];

  const { data: mats, error: errM } = await supabase
    .from('matriculas')
    .select('turma_id')
    .in('id', matriculaIds)
    .not('turma_id', 'is', null)
    .limit(100);

  if (errM) console.error('[getTurmasByDisciplina] matriculas:', errM.message);
  return [...new Set(((mats ?? []) as { turma_id: string }[])
    .map(m => m.turma_id).filter(Boolean))];
}

// Wrapper compatível (consumidor atual: useProfessorDisciplinas → habilita Notas).
// Multi-turma: loga aviso e devolve a primeira — quando houver disciplina em
// 2+ turmas, o caller deve migrar para getTurmasByDisciplina (lista completa).
export async function getTurmaIdByDisciplina(disciplinaId: string): Promise<string | null> {
  const turmas = await getTurmasByDisciplina(disciplinaId);
  if (turmas.length > 1) {
    console.warn(`[getTurmaIdByDisciplina] disciplina ${disciplinaId} em ${turmas.length} turmas — usando a primeira`);
  }
  return turmas[0] ?? null;
}

// ─── Histórico Acadêmico ──────────────────────────────────────────────────────

function mapStatusHistorico(
  n1: number | null,
  n2: number | null,
  media: number | null,
  percentual: number
): StatusHistorico {
  if (n1 === null && n2 === null) return 'pendente';
  const nota = calcularStatus(media, percentual);
  if (nota === 'aprovado') return 'aprovado_direto';
  if (nota === 'cursando') return 'em_andamento';
  return nota; // 'recuperacao' | 'reprovado_nota' | 'reprovado_falta'
}

// matriculas_disciplina.status (consolidado) → StatusHistorico (vocabulário do histórico)
function mapDiscStatusToHist(s: StatusDisciplina): StatusHistorico {
  switch (s) {
    case 'aprovado':        return 'aprovado_direto';
    case 'recuperacao':     return 'recuperacao';
    case 'reprovado':       return 'reprovado_nota';
    case 'reprovado_falta': return 'reprovado_falta';
    case 'convalidado':     return 'convalidado';
    case 'trancado':
    case 'cursando':
    default:                return 'em_andamento';
  }
}

// StatusHistorico → matriculas_disciplina.status (para o badge no fallback de parciais)
function mapHistStatusToDisc(s: StatusHistorico): StatusDisciplina {
  switch (s) {
    case 'aprovado_direto': return 'aprovado';
    case 'recuperacao':     return 'recuperacao';
    case 'reprovado_nota':  return 'reprovado';
    case 'reprovado_falta': return 'reprovado_falta';
    case 'convalidado':     return 'convalidado';
    case 'em_andamento':
    case 'pendente':
    default:                return 'cursando';
  }
}

// Retorna o histórico completo do aluno em uma turma, agrupado por módulo.
// Usa 3 queries (matriculas → disciplinas batch → notas+frequência batch).
export async function getHistoricoAluno(
  alunoId: string,
  turmaId: string
): Promise<HistoricoAluno> {
  const vazio: HistoricoAluno = {
    modulos: [],
    media_geral: null,
    total_carga_horaria: 0,
    disciplinas_aprovadas: 0,
    disciplinas_reprovadas: 0,
    disciplinas_em_andamento: 0,
  };

  // 1. Busca a matricula do aluno nessa turma
  const { data: matriculaData } = await supabase
    .from('matriculas')
    .select('id')
    .eq('aluno_id', alunoId)
    .eq('turma_id', turmaId)
    .limit(1)
    .single();

  if (!matriculaData) return vazio;
  const matriculaId = (matriculaData as { id: string }).id;

  // 2. Busca disciplinas matriculadas com dados de módulo + valores consolidados (1 query).
  //    nota/status/frequencia_percentual são colunas da PRÓPRIA matriculas_disciplina
  //    (mesma linha já lida) — não é join, então sem questão de LICAO-026.
  type DiscRow = {
    disciplina_id: string;
    nota: number | null;
    status: StatusDisciplina;
    frequencia_percentual: number | null;
    disciplinas_v2: {
      id: string;
      nome: string;
      carga_horaria_presencial: number;
      creditos: number;
      modulo_id: string;
      modulos: { id: string; nome: string; ordem: number };
    };
  };

  const { data: discData } = await supabase
    .from('matriculas_disciplina')
    .select(`
      disciplina_id, nota, status, frequencia_percentual,
      disciplinas_v2(
        id, nome, carga_horaria_presencial, creditos, modulo_id,
        modulos(id, nome, ordem)
      )
    `)
    .eq('matricula_id', matriculaId)
    .limit(60);

  const rows = (discData ?? []) as unknown as DiscRow[];
  if (rows.length === 0) return vazio;

  const disciplinaIds = rows.map(r => r.disciplina_id);

  // 3. Batch: notas e frequência em paralelo (2 queries)
  const [notasMap, freqMap] = await Promise.all([
    getNotasBatchByAluno(alunoId, disciplinaIds),
    getResumoFrequenciaBatch(alunoId, disciplinaIds),
  ]);

  // 4. Agrupa por módulo
  const modulosMap = new Map<string, { meta: { id: string; nome: string; ordem: number }; disciplinas: DisciplinaHistorico[] }>();

  for (const row of rows) {
    const d = row.disciplinas_v2;
    if (!d) continue;
    const mod = d.modulos;
    if (!mod) continue;

    const notas = notasMap.get(row.disciplina_id) ?? { n1: null, n2: null, recuperacao: null, media: null };
    const freq = freqMap.get(row.disciplina_id);

    // G4: PREFERIR os valores consolidados de matriculas_disciplina quando existirem.
    // `!= null` cobre null E undefined (coluna ausente).
    const temConsolidado = row.nota != null || row.frequencia_percentual != null
      || (!!row.status && row.status !== 'cursando');

    let media_final: number | null;
    let percentual: number;
    let status: StatusHistorico;
    let statusDisc: StatusDisciplina;

    if (temConsolidado) {
      media_final = row.nota;
      percentual  = row.frequencia_percentual ?? freq?.percentual_presenca ?? 100;
      statusDisc  = row.status;
      status      = mapDiscStatusToHist(row.status);
    } else {
      media_final = notas.media;
      percentual  = freq?.percentual_presenca ?? 100;
      status      = mapStatusHistorico(notas.n1, notas.n2, notas.media, percentual);
      statusDisc  = mapHistStatusToDisc(status);
    }

    const disc: DisciplinaHistorico = {
      id: d.id,
      nome: d.nome,
      carga_horaria: d.carga_horaria_presencial,
      creditos: d.creditos,
      notas: {
        n1: notas.n1,
        n2: notas.n2,
        recuperacao: notas.recuperacao,
        media_final,
      },
      frequencia: {
        total_aulas: freq?.total_aulas ?? 0,
        presencas: freq?.presencas ?? 0,
        percentual,
      },
      status,
      status_disciplina: statusDisc,
      consolidado: !!temConsolidado,
    };

    const entry = modulosMap.get(mod.id) ?? { meta: mod, disciplinas: [] };
    entry.disciplinas.push(disc);
    modulosMap.set(mod.id, entry);
  }

  // 5. Calcula médias e status dos módulos
  let totalMedidas = 0;
  let somaMedias = 0;
  let aprovadas = 0;
  let reprovadas = 0;
  let emAndamento = 0;
  let totalCH = 0;
  let totalCreditos = 0;
  let creditosAprovados = 0;
  // "Concluída" = aprovada por nota OU convalidada (aproveitada).
  const concluida = (s: StatusHistorico) => s === 'aprovado_direto' || s === 'convalidado';

  const modulos: ModuloHistorico[] = [...modulosMap.values()]
    .sort((a, b) => a.meta.ordem - b.meta.ordem)
    .map(({ meta, disciplinas }) => {
      const comMedia = disciplinas.filter(d => d.notas.media_final !== null);
      const media_modulo = comMedia.length > 0
        ? Math.round((comMedia.reduce((s, d) => s + (d.notas.media_final ?? 0), 0) / comMedia.length) * 10) / 10
        : null;

      const status_modulo: ModuloHistorico['status_modulo'] =
        disciplinas.every(d => concluida(d.status)) ? 'aprovado'
        : disciplinas.every(d => d.status === 'pendente') ? 'pendente'
        : 'em_andamento';

      for (const d of disciplinas) {
        totalCH += d.carga_horaria;
        totalCreditos += d.creditos;
        if (concluida(d.status)) { aprovadas++; creditosAprovados += d.creditos; }
        else if (d.status === 'reprovado_nota' || d.status === 'reprovado_falta') reprovadas++;
        else emAndamento++;
        if (d.notas.media_final !== null) {
          somaMedias += d.notas.media_final;
          totalMedidas++;
        }
      }

      return { id: meta.id, nome: meta.nome, ordem: meta.ordem, disciplinas, media_modulo, status_modulo };
    });

  const media_geral = totalMedidas > 0
    ? Math.round((somaMedias / totalMedidas) * 10) / 10
    : null;

  return {
    modulos,
    media_geral,
    total_carga_horaria: totalCH,
    total_creditos: totalCreditos,
    creditos_aprovados: creditosAprovados,
    disciplinas_aprovadas: aprovadas,
    disciplinas_reprovadas: reprovadas,
    disciplinas_em_andamento: emAndamento,
  };
}
