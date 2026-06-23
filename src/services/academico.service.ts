import { supabase } from '@/lib/supabase';
import { getNotasBatchByAluno } from './notas.service';
import { getResumoFrequenciaBatch } from './frequencia.service';
import { calcularStatus } from './notas.service';

// ─── Tipos do Histórico Acadêmico ─────────────────────────────────────────────

export type StatusHistorico =
  | 'aprovado_direto'
  | 'recuperacao'
  | 'reprovado_nota'
  | 'reprovado_falta'
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

// Verifica se o aluno cumpriu os pré-requisitos de uma disciplina.
// Retorna aprovado=false e a lista de disciplinas que ainda faltam.
export async function verificarPrerequisitos(
  alunoId: string,
  disciplinaId: string
): Promise<VerificacaoPrerequisitos> {
  const prereqs = await getPrerequisitos(disciplinaId);
  if (prereqs.length === 0) return { aprovado: true, faltam: [] };

  // Busca disciplinas já cursadas/aprovadas pelo aluno
  const { data: cursadas } = await supabase
    .from('matriculas_disciplina')
    .select('disciplina_id, status')
    .in('status', ['aprovado', 'convalidado'])
    .eq('matricula_id',
      supabase.from('matriculas').select('id').eq('aluno_id', alunoId)
    );

  const cursadasIds = new Set((cursadas ?? []).map((r: { disciplina_id: string }) => r.disciplina_id));

  // Busca exceções autorizadas para esta disciplina
  const { data: excecoes } = await supabase
    .from('excecoes_prerequisito')
    .select('prerequisito_dispensado_id')
    .eq('aluno_id', alunoId)
    .eq('disciplina_id', disciplinaId);

  const dispensados = new Set(
    (excecoes ?? []).map((e: { prerequisito_dispensado_id: string }) => e.prerequisito_dispensado_id)
  );

  // Considera tanto disciplinas cursadas quanto exceções autorizadas
  const faltamIds = prereqs
    .filter(p =>
      p.tipo === 'prerequisito' &&
      !cursadasIds.has(p.prerequisito_id) &&
      !dispensados.has(p.prerequisito_id)
    )
    .map(p => p.prerequisito_id);

  if (faltamIds.length === 0) return { aprovado: true, faltam: [] };

  const { data: faltamDiscs } = await supabase
    .from('disciplinas_v2')
    .select('*')
    .in('id', faltamIds);

  return {
    aprovado: false,
    faltam: (faltamDiscs as Disciplina[]) ?? [],
  };
}

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
      .select('disciplina_id')
      .in('status', ['aprovado', 'convalidado'])
      .eq('aluno_id', alunoId)
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

export async function getTurmaIdByDisciplina(disciplinaId: string): Promise<string | null> {
  const { data } = await supabase
    .from('matriculas_disciplina')
    .select('matricula_id, matriculas!inner(turma_id)')
    .eq('disciplina_id', disciplinaId)
    .not('matriculas.turma_id', 'is', null)
    .limit(1)
    .single();

  if (!data) return null;
  const m = (data as unknown as { matriculas: { turma_id: string } }).matriculas;
  return m?.turma_id ?? null;
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

  // 2. Busca disciplinas matriculadas com dados de módulo (1 query)
  type DiscRow = {
    disciplina_id: string;
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
      disciplina_id,
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

    const percentual = freq?.percentual_presenca ?? 100;
    const status = mapStatusHistorico(notas.n1, notas.n2, notas.media, percentual);

    const disc: DisciplinaHistorico = {
      id: d.id,
      nome: d.nome,
      carga_horaria: d.carga_horaria_presencial,
      creditos: d.creditos,
      notas: {
        n1: notas.n1,
        n2: notas.n2,
        recuperacao: notas.recuperacao,
        media_final: notas.media,
      },
      frequencia: {
        total_aulas: freq?.total_aulas ?? 0,
        presencas: freq?.presencas ?? 0,
        percentual,
      },
      status,
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

  const modulos: ModuloHistorico[] = [...modulosMap.values()]
    .sort((a, b) => a.meta.ordem - b.meta.ordem)
    .map(({ meta, disciplinas }) => {
      const comMedia = disciplinas.filter(d => d.notas.media_final !== null);
      const media_modulo = comMedia.length > 0
        ? Math.round((comMedia.reduce((s, d) => s + (d.notas.media_final ?? 0), 0) / comMedia.length) * 10) / 10
        : null;

      const status_modulo: ModuloHistorico['status_modulo'] =
        disciplinas.every(d => d.status === 'aprovado_direto') ? 'aprovado'
        : disciplinas.every(d => d.status === 'pendente') ? 'pendente'
        : 'em_andamento';

      for (const d of disciplinas) {
        totalCH += d.carga_horaria;
        totalCreditos += d.creditos;
        if (d.status === 'aprovado_direto') aprovadas++;
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
    disciplinas_aprovadas: aprovadas,
    disciplinas_reprovadas: reprovadas,
    disciplinas_em_andamento: emAndamento,
  };
}
