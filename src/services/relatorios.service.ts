/**
 * Service para geração de relatórios da secretaria
 * Sprint Relatórios — Fase 1: Setup (estrutura e tipos)
 */

import { supabase } from '@/lib/supabase';

// ===== TIPOS =====

export interface FiltroAlunosTurma {
  turmaId: string;
  status?: 'ativa' | 'trancada' | 'concluida' | 'cancelada';
}

export interface FiltroListaPresenca {
  turmaId: string;
  disciplinaId: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface FiltroDisciplinasAluno {
  turmaId?: string;
  status?: 'cursando' | 'aprovado' | 'reprovado' | 'trancado';
}

export interface FiltroSituacaoFinanceira {
  turmaId?: string;
  statusPagamento?: 'em_dia' | 'pendente' | 'atrasado';
}

export interface FiltroInadimplentes {
  turmaId?: string;
  diasAtraso?: number;
}

export interface FiltroHistoricoAcademico {
  alunoId: string;
}

// ===== TIPOS DE RETORNO =====

export interface AlunoTurmaRelatorio {
  aluno_id: string;
  codigo_itec: string | null;
  nome_completo: string;
  email: string;
  telefone: string | null;
  status_matricula: string;
  data_matricula: string;
}

export interface PresencaRelatorio {
  aluno_id: string;
  nome_aluno: string;
  data_aula: string;
  presente: boolean;
  justificada: boolean;
  observacao: string | null;
}

export interface DisciplinaAlunoRelatorio {
  aluno_id: string;
  nome_aluno: string;
  codigo_itec: string | null;
  disciplina: string;
  modulo: string;
  status: string;
  nota_final: number | null;
  frequencia_percentual: number | null;
}

export interface SituacaoFinanceiraRelatorio {
  aluno_id: string;
  nome_aluno: string;
  codigo_itec: string | null;
  turma: string;
  mensalidades_pagas: number;
  mensalidades_pendentes: number;
  valor_total_pago: number;
  valor_total_pendente: number;
  status: 'em_dia' | 'pendente' | 'atrasado';
}

export interface InadimplenteRelatorio {
  aluno_id: string;
  nome_aluno: string;
  codigo_itec: string | null;
  email: string;
  telefone: string | null;
  turma: string;
  mensalidades_atrasadas: number;
  valor_total_atrasado: number;
  dias_atraso: number;
  ultima_mensalidade_vencimento: string;
}

export interface HistoricoAcademicoRelatorio {
  aluno: {
    id: string;
    codigo_itec: string | null;
    nome_completo: string;
    email: string;
    cpf: string | null;
    data_nascimento: string | null;
    turma: string;
  };
  disciplinas: {
    modulo: string;
    codigo: string;
    nome: string;
    carga_horaria: number;
    creditos: number;
    nota_final: number | null;
    frequencia_percentual: number | null;
    status: string;
  }[];
  resumo: {
    total_creditos_cursados: number;
    total_creditos_aprovados: number;
    media_geral: number | null;
    frequencia_media: number | null;
  };
}

// ===== FUNÇÕES (stubs para Fase 2+) =====

/**
 * R01 — Lista de alunos por turma
 * Padrão RLS: queries separadas + merge manual (LICAO-026)
 */
export async function getAlunosPorTurma(
  filtro: FiltroAlunosTurma
): Promise<AlunoTurmaRelatorio[]> {
  // Query 1: buscar turma para validar
  const { data: turma, error: errorTurma } = await supabase
    .from('turmas')
    .select('id, nome, codigo')
    .eq('id', filtro.turmaId)
    .single();

  if (errorTurma || !turma) {
    console.error('[R01] Turma não encontrada:', errorTurma?.message);
    return [];
  }

  // Query 2: buscar matrículas da turma
  let queryMatriculas = supabase
    .from('matriculas')
    .select('aluno_id, status, created_at')
    .eq('turma_id', filtro.turmaId)
    .order('created_at', { ascending: true });

  // Filtro opcional por status
  if (filtro.status) {
    queryMatriculas = queryMatriculas.eq('status', filtro.status);
  }

  const { data: matriculas, error: errorMatriculas } = await queryMatriculas;

  if (errorMatriculas) {
    console.error('[R01] Erro ao buscar matrículas:', errorMatriculas.message);
    return [];
  }

  if (!matriculas || matriculas.length === 0) {
    return [];
  }

  // Query 3: buscar profiles dos alunos
  const alunoIds = matriculas.map(m => m.aluno_id);
  const { data: profiles, error: errorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, telefone, codigo_itec')
    .in('id', alunoIds);

  if (errorProfiles) {
    console.error('[R01] Erro ao buscar profiles:', errorProfiles.message);
    return [];
  }

  // Merge manual: combinar matriculas + profiles
  const resultado: AlunoTurmaRelatorio[] = matriculas.map(mat => {
    const profile = profiles?.find(p => p.id === mat.aluno_id);
    return {
      aluno_id: mat.aluno_id,
      codigo_itec: profile?.codigo_itec || null,
      nome_completo: profile?.full_name || 'Nome não disponível',
      email: profile?.email || '',
      telefone: profile?.telefone || null,
      status_matricula: mat.status,
      data_matricula: mat.created_at,
    };
  });

  return resultado;
}

/**
 * R02 — Lista de presença
 */
export async function getListaPresenca(
  filtro: FiltroListaPresenca
): Promise<PresencaRelatorio[]> {
  // TODO: implementar na Fase 3
  console.log('getListaPresenca:', filtro);
  return [];
}

/**
 * R03 — Disciplinas por aluno
 */
export async function getDisciplinasPorAluno(
  filtro: FiltroDisciplinasAluno
): Promise<DisciplinaAlunoRelatorio[]> {
  // TODO: implementar na Fase 3
  console.log('getDisciplinasPorAluno:', filtro);
  return [];
}

/**
 * R04 — Situação financeira
 */
export async function getSituacaoFinanceira(
  filtro: FiltroSituacaoFinanceira
): Promise<SituacaoFinanceiraRelatorio[]> {
  // TODO: implementar na Fase 2
  console.log('getSituacaoFinanceira:', filtro);
  return [];
}

/**
 * R05 — Alunos inadimplentes
 */
export async function getInadimplentes(
  filtro: FiltroInadimplentes
): Promise<InadimplenteRelatorio[]> {
  // TODO: implementar na Fase 2
  console.log('getInadimplentes:', filtro);
  return [];
}

/**
 * R06 — Histórico acadêmico individual
 */
export async function getHistoricoAcademico(
  filtro: FiltroHistoricoAcademico
): Promise<HistoricoAcademicoRelatorio | null> {
  // TODO: implementar na Fase 4
  console.log('getHistoricoAcademico:', filtro);
  return null;
}
