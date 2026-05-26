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

  const { data, error } = await query;
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
    .eq('aluno_id', alunoId);

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
    .eq('disciplina_id', disciplinaId);

  if (error || !data) return [];

  type Row = { aluno_id: string; presente: boolean; aluno: { full_name: string; email: string } | null };

  // Agrega por aluno em JS
  const porAluno = new Map<string, { total: number; presencas: number; nome: string; email: string }>();
  for (const r of data as Row[]) {
    const entry = porAluno.get(r.aluno_id) ?? {
      total: 0, presencas: 0,
      nome:  r.aluno?.full_name ?? r.aluno_id,
      email: r.aluno?.email ?? '',
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
