import { supabase } from '@/lib/supabase';

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

  const faltamIds = prereqs
    .filter(p => p.tipo === 'prerequisito' && !cursadasIds.has(p.prerequisito_id))
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

// Batch: pré-requisitos para múltiplas disciplinas de um aluno (2 queries)
export async function verificarPrerequisitoBatch(
  alunoId: string,
  disciplinaIds: string[],
  todasDisciplinas: Disciplina[]
): Promise<Map<string, VerificacaoPrerequisitos>> {
  if (disciplinaIds.length === 0) return new Map();

  const discMap = new Map(todasDisciplinas.map(d => [d.id, d]));

  const [prereqRes, matriculaRes] = await Promise.all([
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
  ]);

  type PreqRow = { disciplina_id: string; prerequisito_id: string; tipo: string };
  const prereqs = (prereqRes.data ?? []) as PreqRow[];
  const cursadas = new Set(
    ((matriculaRes.data ?? []) as { disciplina_id: string }[]).map(r => r.disciplina_id)
  );

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
    const faltam = reqs
      .filter(p => p.tipo === 'prerequisito' && !cursadas.has(p.prerequisito_id))
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
