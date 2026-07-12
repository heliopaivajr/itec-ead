import { supabase } from '@/lib/supabase';

export interface AlunoBasico {
  id: string;
  full_name: string;
  email: string;
}

export interface RegistroFrequencia {
  id: string;
  disciplina_id: string;
  aluno_id: string;
  aluno?: AlunoBasico;
  // ⚠️ FK → profiles(id): é o auth.uid() de quem lançou, NÃO professores.id
  // (exceção do schema — as demais tabelas de professor apontam para professores).
  professor_id: string;
  data_aula: string;
  presente: boolean;
  justificada: boolean;
  documento_url: string | null;
  observacao: string | null;
  registrado_em: string;
}

export interface AlunoEmRisco {
  aluno_id: string;
  nome: string;
  email: string;
  percentual: number;
}

export interface AlunoEmRiscoTurma {
  aluno_id: string;
  full_name: string;
  avatar_url: string | null;
  disciplinas_em_risco: { disciplina_id: string; disciplina_nome: string; frequencia_percent: number }[];
}

export type FrequenciaStatus = 'ok' | 'alerta' | 'reprovado';

export interface ResumoFrequencia {
  total_aulas: number;
  presencas: number;
  faltas: number;
  faltas_justificadas: number;
  percentual_presenca: number;
  // ok: >= 75% | alerta: 60–74% | reprovado: < 60%
  status: FrequenciaStatus;
}

export type LancarRegistro = Omit<RegistroFrequencia, 'id' | 'registrado_em'>;

function calcularStatus(percentual: number): FrequenciaStatus {
  if (percentual >= 75) return 'ok';
  if (percentual >= 60) return 'alerta';
  return 'reprovado';
}

export async function getFrequenciaByDisciplina(
  disciplinaId: string,
  alunoId?: string
): Promise<RegistroFrequencia[]> {
  let query = supabase
    .from('frequencia')
    .select('*, aluno:profiles!frequencia_aluno_id_fkey(id, full_name, email)')
    .eq('disciplina_id', disciplinaId)
    .order('data_aula', { ascending: false });

  if (alunoId) query = query.eq('aluno_id', alunoId);

  const { data, error } = await query.limit(120); // 2 anos × aulas semanais
  if (error) return [];
  return (data as RegistroFrequencia[]) ?? [];
}

// Lança frequência de uma aula inteira (array de registros por aluno)
export async function lancarFrequencia(
  registros: LancarRegistro[]
): Promise<{ error: string | null }> {
  if (registros.length === 0) return { error: null };

  const { error } = await supabase
    .from('frequencia')
    .upsert(registros, { onConflict: 'disciplina_id,aluno_id,data_aula' });

  if (error) return { error: error.message };
  return { error: null };
}

export async function getResumoFrequencia(
  alunoId: string,
  disciplinaId: string
): Promise<ResumoFrequencia> {
  const { data, error } = await supabase
    .from('frequencia')
    .select('presente, justificada')
    .eq('disciplina_id', disciplinaId)
    .eq('aluno_id', alunoId)
    .limit(60); // ~2 anos de aulas semanais

  if (error || !data) {
    return { total_aulas: 0, presencas: 0, faltas: 0, faltas_justificadas: 0, percentual_presenca: 0, status: 'ok' };
  }

  const total            = data.length;
  const presencas        = data.filter(r => r.presente).length;
  const faltas           = total - presencas;
  const justificadas     = data.filter(r => !r.presente && r.justificada).length;
  const percentual       = total > 0 ? Math.round((presencas / total) * 100) : 100;

  return {
    total_aulas:         total,
    presencas,
    faltas,
    faltas_justificadas: justificadas,
    percentual_presenca: percentual,
    status:              calcularStatus(percentual),
  };
}

export async function justificarFalta(
  id: string,
  documentoUrl: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('frequencia')
    .update({ justificada: true, documento_url: documentoUrl })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

// Retorna alunos com percentual abaixo do limite (default 75%) com nome e email
export async function getAlunosAbaixoLimite(
  disciplinaId: string,
  limite = 75
): Promise<AlunoEmRisco[]> {
  const { data, error } = await supabase
    .from('frequencia')
    .select('aluno_id, presente, aluno:profiles!frequencia_aluno_id_fkey(full_name, email)')
    .eq('disciplina_id', disciplinaId)
    .limit(120); // proteção: max alunos × aulas

  if (error || !data) return [];

  type Row = { aluno_id: string; presente: boolean; aluno: { full_name: string; email: string }[] | null };

  // Agrega por aluno em JS
  const porAluno = new Map<string, { total: number; presencas: number; nome: string; email: string }>();
  for (const r of data as unknown as Row[]) {
    const aluno = Array.isArray(r.aluno) ? r.aluno[0] : r.aluno;
    const entry = porAluno.get(r.aluno_id) ?? {
      total: 0, presencas: 0,
      nome:  aluno?.full_name ?? r.aluno_id,
      email: aluno?.email ?? '',
    };
    entry.total++;
    if (r.presente) entry.presencas++;
    porAluno.set(r.aluno_id, entry);
  }

  return Array.from(porAluno.entries())
    .map(([aluno_id, { total, presencas, nome, email }]) => ({
      aluno_id,
      nome,
      email,
      percentual: total > 0 ? Math.round((presencas / total) * 100) : 100,
    }))
    .filter(a => a.percentual < limite)
    .sort((a, b) => a.percentual - b.percentual);
}

// Calcula resumo por aluno a partir de registros já em memória — 0 queries extras
export function calcularResumosPorAluno(
  registros: RegistroFrequencia[]
): Map<string, ResumoFrequencia> {
  const byAluno = new Map<string, { total: number; presencas: number; justificadas: number }>();

  for (const r of registros) {
    const entry = byAluno.get(r.aluno_id) ?? { total: 0, presencas: 0, justificadas: 0 };
    entry.total++;
    if (r.presente) entry.presencas++;
    else if (r.justificada) entry.justificadas++;
    byAluno.set(r.aluno_id, entry);
  }

  const result = new Map<string, ResumoFrequencia>();
  for (const [alunoId, { total, presencas, justificadas }] of byAluno) {
    const faltas     = total - presencas;
    const percentual = total > 0 ? Math.round((presencas / total) * 100) : 100;
    result.set(alunoId, {
      total_aulas:         total,
      presencas,
      faltas,
      faltas_justificadas: justificadas,
      percentual_presenca: percentual,
      status:              calcularStatus(percentual),
    });
  }
  return result;
}

// Batch por disciplina: UMA query retorna resumo de todos os alunos da disciplina
// Usado por LancarNotas e consolidado de turma (Sprint J)
export async function getResumoFrequenciaPorTurma(
  disciplinaId: string,
  alunoIds?: string[]
): Promise<Map<string, ResumoFrequencia>> {
  let query = supabase
    .from('frequencia')
    .select('aluno_id, presente, justificada')
    .eq('disciplina_id', disciplinaId)
    .limit(500); // proteção: max 50 alunos × 10 aulas

  if (alunoIds && alunoIds.length > 0) {
    query = query.in('aluno_id', alunoIds);
  }

  const { data, error } = await query;
  const result = new Map<string, ResumoFrequencia>();
  if (error || !data) return result;

  type RawRow = { aluno_id: string; presente: boolean; justificada: boolean };
  const byAluno = new Map<string, RawRow[]>();
  for (const r of data as RawRow[]) {
    const arr = byAluno.get(r.aluno_id) ?? [];
    arr.push(r);
    byAluno.set(r.aluno_id, arr);
  }

  for (const [alunoId, rows] of byAluno) {
    const total        = rows.length;
    const presencas    = rows.filter(r => r.presente).length;
    const faltas       = total - presencas;
    const justificadas = rows.filter(r => !r.presente && r.justificada).length;
    const percentual   = total > 0 ? Math.round((presencas / total) * 100) : 100;
    result.set(alunoId, {
      total_aulas: total, presencas, faltas,
      faltas_justificadas: justificadas,
      percentual_presenca: percentual,
      status: calcularStatus(percentual),
    });
  }
  return result;
}

// Alunos em risco para uma turma inteira — 3 queries, sem N+1
// Retorna alunos com pelo menos 1 disciplina abaixo do limite de frequência
export async function getAlunosEmRiscoByTurma(
  turmaId: string,
  limite = 75
): Promise<AlunoEmRiscoTurma[]> {
  // Query 1: alunos matriculados na turma com perfil
  type MatriculaRow = { aluno_id: string; profiles: { full_name: string; avatar_url: string | null } | null };
  const { data: matriculas } = await supabase
    .from('matriculas')
    .select('aluno_id, profiles!matriculas_aluno_id_fkey(full_name, avatar_url)')
    .eq('turma_id', turmaId)
    .in('status', ['pendente', 'ativa'])
    .limit(60);

  if (!matriculas || matriculas.length === 0) return [];

  const alunoIds = (matriculas as unknown as MatriculaRow[]).map(m => m.aluno_id);
  const perfilByAluno = new Map(
    (matriculas as unknown as MatriculaRow[]).map(m => [m.aluno_id, m.profiles])
  );

  // Query 2: disciplinas matriculadas por esses alunos (via matriculas_disciplina)
  type MatDiscRow = { matricula_id: string; disciplina_id: string; disciplinas_v2: { nome: string } | null };
  const { data: matsDisc } = await supabase
    .from('matriculas_disciplina')
    .select('matricula_id, disciplina_id, disciplinas_v2(nome)')
    .in('matricula_id',
      (await supabase
        .from('matriculas')
        .select('id')
        .eq('turma_id', turmaId)
        .in('aluno_id', alunoIds)
        .limit(60)
      ).data?.map((r: { id: string }) => r.id) ?? []
    )
    .limit(300);

  if (!matsDisc || matsDisc.length === 0) return [];

  // Monta mapa matricula_id → aluno_id
  const { data: matRows } = await supabase
    .from('matriculas')
    .select('id, aluno_id')
    .eq('turma_id', turmaId)
    .in('aluno_id', alunoIds)
    .limit(60);

  const alunoByMatricula = new Map(
    ((matRows ?? []) as { id: string; aluno_id: string }[]).map(r => [r.id, r.aluno_id])
  );

  // Coleta disciplinaIds e mapa disciplina_id → nome
  const discNomeMap = new Map<string, string>();
  for (const r of (matsDisc as unknown as MatDiscRow[])) {
    if (r.disciplinas_v2) discNomeMap.set(r.disciplina_id, r.disciplinas_v2.nome);
  }
  const disciplinaIds = [...new Set((matsDisc as unknown as MatDiscRow[]).map(r => r.disciplina_id))];

  // Query 3: toda a frequência desses alunos nessas disciplinas (1 query)
  const { data: freqData } = await supabase
    .from('frequencia')
    .select('aluno_id, disciplina_id, presente, justificada')
    .in('aluno_id', alunoIds)
    .in('disciplina_id', disciplinaIds)
    .limit(alunoIds.length * disciplinaIds.length * 15);

  type FreqRow = { aluno_id: string; disciplina_id: string; presente: boolean };
  const porAlunoDisc = new Map<string, { total: number; presencas: number }>();

  for (const r of (freqData ?? []) as FreqRow[]) {
    const key = `${r.aluno_id}:${r.disciplina_id}`;
    const entry = porAlunoDisc.get(key) ?? { total: 0, presencas: 0 };
    entry.total++;
    if (r.presente) entry.presencas++;
    porAlunoDisc.set(key, entry);
  }

  // Agrega por aluno
  const porAluno = new Map<string, AlunoEmRiscoTurma>();
  for (const alunoId of alunoIds) {
    const perfil = perfilByAluno.get(alunoId);
    if (!perfil) continue;
    porAluno.set(alunoId, {
      aluno_id: alunoId,
      full_name: perfil.full_name,
      avatar_url: perfil.avatar_url,
      disciplinas_em_risco: [],
    });
  }

  for (const discId of disciplinaIds) {
    for (const alunoId of alunoIds) {
      const key = `${alunoId}:${discId}`;
      const freq = porAlunoDisc.get(key);
      if (!freq || freq.total === 0) continue;
      const percentual = Math.round((freq.presencas / freq.total) * 100);
      if (percentual < limite) {
        const aluno = porAluno.get(alunoId);
        if (aluno) {
          aluno.disciplinas_em_risco.push({
            disciplina_id: discId,
            disciplina_nome: discNomeMap.get(discId) ?? discId,
            frequencia_percent: percentual,
          });
        }
      }
    }
  }

  return [...porAluno.values()]
    .filter(a => a.disciplinas_em_risco.length > 0)
    .sort((a, b) => {
      const minA = Math.min(...a.disciplinas_em_risco.map(d => d.frequencia_percent));
      const minB = Math.min(...b.disciplinas_em_risco.map(d => d.frequencia_percent));
      return minA - minB;
    });
}

// Batch: resumo de frequência para múltiplas disciplinas de um aluno (1 query)
export async function getResumoFrequenciaBatch(
  alunoId: string,
  disciplinaIds: string[]
): Promise<Map<string, ResumoFrequencia>> {
  if (disciplinaIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('frequencia')
    .select('disciplina_id, presente, justificada')
    .eq('aluno_id', alunoId)
    .in('disciplina_id', disciplinaIds)
    .limit(disciplinaIds.length * 60);

  const result = new Map<string, ResumoFrequencia>();
  if (error || !data) return result;

  type RawRow = { disciplina_id: string; presente: boolean; justificada: boolean };
  const byDisc = new Map<string, RawRow[]>();
  for (const r of data as RawRow[]) {
    const arr = byDisc.get(r.disciplina_id) ?? [];
    arr.push(r);
    byDisc.set(r.disciplina_id, arr);
  }

  for (const id of disciplinaIds) {
    const rows = byDisc.get(id) ?? [];
    const total      = rows.length;
    const presencas  = rows.filter(r => r.presente).length;
    const faltas     = total - presencas;
    const justificadas = rows.filter(r => !r.presente && r.justificada).length;
    const percentual = total > 0 ? Math.round((presencas / total) * 100) : 100;
    result.set(id, {
      total_aulas: total, presencas, faltas,
      faltas_justificadas: justificadas,
      percentual_presenca: percentual,
      status: calcularStatus(percentual),
    });
  }
  return result;
}
