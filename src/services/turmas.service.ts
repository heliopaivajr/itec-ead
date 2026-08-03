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
    .limit(120);   // união grade ∪ enrollment pode passar de 36
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

// Todas as disciplina_id das matrículas da turma, PAGINANDO.
// ⚠️ Antes era `.limit(500)`: com 36 disciplinas por aluno (081) o teto estoura a
// partir de ~14 alunos e cortava SILENCIOSAMENTE (PostgREST não tem DISTINCT, e sem
// ORDER BY a ordem nem é determinística). Paginação ordenada + dedup em JS resolve
// sem migração. Teto de segurança: MAX_PAGES × PAGE linhas.
async function getDisciplinaIdsDoEnrollment(matriculaIds: string[]): Promise<string[]> {
  const PAGE = 1000;
  const MAX_PAGES = 10;   // 10k linhas ≈ 275 alunos × 36 — folga larga
  const ids = new Set<string>();

  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from('matriculas_disciplina')
      .select('disciplina_id')
      .in('matricula_id', matriculaIds)
      .order('disciplina_id')                                   // paginação determinística
      .range(page * PAGE, page * PAGE + PAGE - 1);

    if (error) { console.error('[getDisciplinasDaTurma] matriculas_disciplina:', error.message); break; }
    const rows = (data ?? []) as { disciplina_id: string }[];
    rows.forEach(r => ids.add(r.disciplina_id));
    if (rows.length < PAGE) break;                              // última página
  }
  return [...ids];
}

// Disciplinas de uma turma — porta de Acompanhamento da secretaria (C2/E4) e da
// tela de Frequência/Chamada.
//
// As duas fontes são COMPLEMENTARES, não excludentes — retornamos a UNIÃO:
//   • aulas_recorrentes      → o que está sendo LECIONADO agora (grade da secretaria);
//   • matriculas_disciplina  → o CURRÍCULO do aluno (as 36 regulares dos 6 módulos, 081).
//
// ⚠️ BUG CORRIGIDO: antes havia `if (grade.size > 0) return grade` (early return). Uma
// turma COM grade cadastrada via SÓ o módulo corrente (1ª turma: 8 do M3, incl. as 2
// eletivas) e NUNCA as 36 do enrollment → o filtro de módulo ficava vazio em todos os
// outros módulos. Turma SEM grade (2ª) caía no fallback e via as 36 — comportamento
// invertido entre turmas, mesma função. Agora ambas veem tudo.
// Queries SEPARADAS (LICAO-026) · erros logados (LICAO-027).
export async function getDisciplinasDaTurma(turmaId: string): Promise<DisciplinaTurma[]> {
  type AulaRow = { disciplina_id: string; disciplinas_v2: DiscBasica | DiscBasica[] | null };

  // Fontes independentes → em paralelo.
  const [aulasRes, matsRes] = await Promise.all([
    supabase
      .from('aulas_recorrentes')
      .select('disciplina_id, disciplinas_v2(id, nome, codigo)')
      .eq('turma_id', turmaId)
      .eq('ativo', true)
      .limit(60),
    supabase
      .from('matriculas')
      .select('id')
      .eq('turma_id', turmaId)
      .limit(100),
  ]);

  if (aulasRes.error) console.error('[getDisciplinasDaTurma] aulas_recorrentes:', aulasRes.error.message);
  if (matsRes.error)  console.error('[getDisciplinasDaTurma] matriculas:', matsRes.error.message);

  // Fonte 1 — grade (já traz nome/código pelo embed).
  const unicas = new Map<string, DiscBasica>();
  for (const r of ((aulasRes.data ?? []) as unknown as AulaRow[])) {
    const d = Array.isArray(r.disciplinas_v2) ? r.disciplinas_v2[0] : r.disciplinas_v2;
    if (d) unicas.set(d.id, { id: d.id, nome: d.nome, codigo: d.codigo });
  }

  // Fonte 2 — enrollment (currículo). Só busca os metadados de quem a grade não trouxe.
  const matriculaIds = ((matsRes.data ?? []) as { id: string }[]).map(m => m.id);
  if (matriculaIds.length > 0) {
    const discIds  = await getDisciplinaIdsDoEnrollment(matriculaIds);
    const faltando = discIds.filter(id => !unicas.has(id));

    if (faltando.length > 0) {
      const { data: discs, error: errDiscs } = await supabase
        .from('disciplinas_v2')
        .select('id, nome, codigo')
        .in('id', faltando)
        .limit(120);                                            // 36+ com folga
      if (errDiscs) console.error('[getDisciplinasDaTurma] disciplinas_v2:', errDiscs.message);
      for (const d of ((discs ?? []) as DiscBasica[])) unicas.set(d.id, d);
    }
  }

  return enrichModuloOrdem([...unicas.values()]);
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
