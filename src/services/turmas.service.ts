import { supabase } from '@/lib/supabase';

export interface Turma {
  id: string;
  codigo: string;
  curso_id: string | null;
  nome: string;
  ano: number;
  semestre: number | null;
  data_inicio: string;
  data_fim: string | null;
  status: 'ativa' | 'concluida' | 'planejada' | 'cancelada';
  vagas_total: number;
  observacoes: string | null;
  cor?: string | null; // migration 3A — cor das aulas no calendário
  criado_em: string;
  atualizado_em: string;
  // join
  total_matriculas?: number;
}

export interface TurmaPayload {
  codigo: string;
  curso_id?: string | null;
  nome: string;
  ano: number;
  semestre?: number | null;
  data_inicio: string;
  data_fim?: string | null;
  status: 'ativa' | 'concluida' | 'planejada' | 'cancelada';
  vagas_total: number;
  observacoes?: string | null;
}

export interface ServiceResult<T = void> {
  data?: T;
  error?: string;
}

export async function getTurmas(): Promise<Turma[]> {
  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .order('ano', { ascending: false })
    .order('semestre', { ascending: false })
    .limit(50);

  if (error) {
    console.error('getTurmas:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getTurmasAtivas(): Promise<Turma[]> {
  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .in('status', ['ativa', 'planejada'])
    .order('ano', { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getTurmaById(id: string): Promise<Turma | null> {
  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createTurma(payload: TurmaPayload): Promise<ServiceResult<Turma>> {
  const { data, error } = await supabase
    .from('turmas')
    .insert(payload)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateTurma(id: string, payload: Partial<TurmaPayload>): Promise<ServiceResult<Turma>> {
  const { data, error } = await supabase
    .from('turmas')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function deleteTurma(id: string): Promise<ServiceResult> {
  const { error } = await supabase
    .from('turmas')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  return {};
}

export interface AlunoTurma {
  matricula_id: string;
  aluno_id: string;
  status: string;
  full_name: string;
  avatar_url: string | null;
  codigo_itec: string | null;
}

// Lista de alunos matriculados numa turma — exibida na gestão de turmas e impressão
export async function getAlunosByTurma(turmaId: string): Promise<AlunoTurma[]> {
  const { data, error } = await supabase
    .from('matriculas')
    .select('id, aluno_id, status, profiles!matriculas_aluno_id_fkey(full_name, avatar_url, codigo_itec)')
    .eq('turma_id', turmaId)
    .order('created_at', { ascending: true })
    .limit(60);

  if (error) return [];

  type Row = {
    id: string;
    aluno_id: string;
    status: string;
    profiles: { full_name: string; avatar_url: string | null; codigo_itec: string | null } | null;
  };

  return ((data ?? []) as unknown as Row[]).map(r => {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      matricula_id: r.id,
      aluno_id: r.aluno_id,
      status: r.status,
      full_name: p?.full_name ?? '—',
      avatar_url: p?.avatar_url ?? null,
      codigo_itec: p?.codigo_itec ?? null,
    };
  });
}

export interface DisciplinaTurma {
  id: string;
  nome: string;
  codigo: string;
  modulo_ordem: number | null;   // disciplinas_v2.modulo_id → modulos.ordem (filtro por módulo)
}

export interface ModuloInfo {
  ordem: number;
  nome: string;
  data_inicio: string;
  data_fim: string | null;
}

type DiscBasica = { id: string; nome: string; codigo: string };

// Enriquece as disciplinas com a ordem do módulo (disciplinas_v2.modulo_id → modulos.ordem,
// leitura pública 008). Uma query só; ordena por (módulo, nome) — default agrupado por módulo.
async function enrichModuloOrdem(discs: DiscBasica[]): Promise<DisciplinaTurma[]> {
  if (discs.length === 0) return [];
  const { data, error } = await supabase
    .from('disciplinas_v2')
    .select('id, modulo:modulos(ordem)')
    .in('id', discs.map(d => d.id))
    .limit(60);
  if (error) console.error('[getDisciplinasDaTurma] modulo:', error.message);

  type Row = { id: string; modulo: { ordem: number } | { ordem: number }[] | null };
  const ordemPorId = new Map<string, number | null>();
  for (const r of ((data ?? []) as unknown as Row[])) {
    const mo = Array.isArray(r.modulo) ? r.modulo[0] : r.modulo;
    ordemPorId.set(r.id, mo?.ordem ?? null);
  }
  return discs
    .map(d => ({ ...d, modulo_ordem: ordemPorId.get(d.id) ?? null }))
    .sort((a, b) => (a.modulo_ordem ?? 99) - (b.modulo_ordem ?? 99) || a.nome.localeCompare(b.nome));
}

// Módulos do curso (default GRAD-TEO) — ordem + datas. Usado no gerador de datas
// retroativas ("Módulo vai até {data_fim}") da tela de Frequência.
export async function getModulosCurso(codigoCurso = 'GRAD-TEO'): Promise<ModuloInfo[]> {
  const { data: curso } = await supabase
    .from('cursos').select('id').eq('codigo', codigoCurso).single();
  if (!curso) return [];
  const { data, error } = await supabase
    .from('modulos')
    .select('ordem, nome, data_inicio, data_fim')
    .eq('curso_id', (curso as { id: string }).id)
    .order('ordem');
  if (error) { console.error('[getModulosCurso]', error.message); return []; }
  return (data ?? []) as ModuloInfo[];
}

// Disciplinas lecionadas numa turma — porta de Acompanhamento da secretaria (C2/E4).
// Fonte 1: grade horária (aulas_recorrentes). Fallback: matrículas da turma →
// matriculas_disciplina (queries SEPARADAS, LICAO-026) — caminho REAL quando a
// grade não está cadastrada (ex.: Apologética tem aulas_recorrentes count=0).
// Erros logados (LICAO-027).
export async function getDisciplinasDaTurma(turmaId: string): Promise<DisciplinaTurma[]> {
  type AulaRow = { disciplina_id: string; disciplinas_v2: DiscBasica | DiscBasica[] | null };

  // Fonte 1: grade horária
  const { data: aulas, error: errAulas } = await supabase
    .from('aulas_recorrentes')
    .select('disciplina_id, disciplinas_v2(id, nome, codigo)')
    .eq('turma_id', turmaId)
    .eq('ativo', true)
    .limit(60);

  if (errAulas) console.error('[getDisciplinasDaTurma] aulas_recorrentes:', errAulas.message);

  const unicas = new Map<string, DiscBasica>();
  for (const r of ((aulas ?? []) as unknown as AulaRow[])) {
    const d = Array.isArray(r.disciplinas_v2) ? r.disciplinas_v2[0] : r.disciplinas_v2;
    if (d) unicas.set(d.id, { id: d.id, nome: d.nome, codigo: d.codigo });
  }
  if (unicas.size > 0) {
    return enrichModuloOrdem([...unicas.values()]);
  }

  // Fallback: matrículas da turma → matriculas_disciplina → disciplinas_v2
  const { data: mats, error: errMats } = await supabase
    .from('matriculas')
    .select('id')
    .eq('turma_id', turmaId)
    .limit(100);

  if (errMats) console.error('[getDisciplinasDaTurma] matriculas:', errMats.message);
  const matriculaIds = ((mats ?? []) as { id: string }[]).map(m => m.id);
  if (matriculaIds.length === 0) return [];

  const { data: mds, error: errMds } = await supabase
    .from('matriculas_disciplina')
    .select('disciplina_id')
    .in('matricula_id', matriculaIds)
    .limit(500);

  if (errMds) console.error('[getDisciplinasDaTurma] matriculas_disciplina:', errMds.message);
  const discIds = [...new Set(((mds ?? []) as { disciplina_id: string }[]).map(m => m.disciplina_id))];
  if (discIds.length === 0) return [];

  const { data: discs, error: errDiscs } = await supabase
    .from('disciplinas_v2')
    .select('id, nome, codigo')
    .in('id', discIds)
    .limit(60);

  if (errDiscs) console.error('[getDisciplinasDaTurma] disciplinas_v2:', errDiscs.message);
  return enrichModuloOrdem((discs ?? []) as DiscBasica[]);
}

export async function getVagasDisponiveis(turmaId: string): Promise<number> {
  const { data: turma } = await supabase
    .from('turmas')
    .select('vagas_total')
    .eq('id', turmaId)
    .single();

  if (!turma) return 0;

  const { count } = await supabase
    .from('matriculas')
    .select('id', { count: 'exact', head: true })
    .eq('turma_id', turmaId)
    .not('status', 'eq', 'cancelada');

  return turma.vagas_total - (count ?? 0);
}

// Atualiza a cor da turma no calendário — apenas staff
export async function atualizarCorTurma(
  turmaId: string,
  cor: string,
  requesterId: string
): Promise<ServiceResult> {
  // Validar formato hex
  if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
    return { error: 'Cor inválida — use formato hex #RRGGBB' };
  }

  // Verificar role via user_roles
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', requesterId)
    .single();

  if (roleError) return { error: 'Erro ao verificar permissão' };
  const role = (roleData as { role: string } | null)?.role ?? '';
  if (!['administracao', 'admin', 'superadmin'].includes(role)) {
    return { error: 'Permissão insuficiente' };
  }

  const { error } = await supabase
    .from('turmas')
    .update({ cor })
    .eq('id', turmaId);

  if (error) return { error: error.message };
  return {};
}
