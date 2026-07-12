/**
 * Service para geração de relatórios da secretaria
 * Sprint Relatórios — Fase 1: Setup (estrutura e tipos)
 */

import { supabase } from '@/lib/supabase';
import { getHistoricoAluno, type HistoricoAluno } from './academico.service';
import { getAlunosOperacional } from './professor.service';

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
  status?: 'em_dia' | 'atrasado' | 'isento';
}

export interface FiltroInadimplentes {
  turmaId?: string;
  diasAtraso?: number;
}

export interface FiltroHistoricoAcademico {
  alunoId: string;
}

export interface FiltroR06 {
  alunoId: string;
  turmaId: string;
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

export interface ListaPresencaRelatorio {
  disciplina: {
    id: string;
    nome: string;
  };
  turma: {
    id: string;
    nome: string;
    codigo: string;
  };
  periodo: {
    inicio: string;
    fim: string;
  };
  datas_aulas: string[];
  alunos: {
    aluno_id: string;
    nome_aluno: string;
    codigo_itec: string | null;
    presencas: {
      data_aula: string;
      status: 'P' | 'F' | null;
      justificada?: boolean;
    }[];
    resumo: {
      total_aulas: number;
      presencas: number;
      faltas: number;
      percentual: number;
    };
  }[];
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

// R03 — Disciplinas por Aluno
export interface FiltroR03 {
  alunoId?: string;
  turmaId?: string;
  status?: 'cursando' | 'aprovado' | 'reprovado' | 'todos';
}

export interface DisciplinasPorAlunoRelatorio {
  aluno_id: string;
  nome_aluno: string;
  codigo_itec: string | null;
  turma: {
    id: string;
    nome: string;
    codigo: string;
  };
  disciplinas: {
    disciplina_id: string;
    codigo: string;
    nome: string;
    status: 'cursando' | 'aprovado' | 'reprovado' | 'reprovado_falta' | 'convalidado' | 'trancado';
    nota: number | null;
  }[];
  totais: {
    cursando: number;
    aprovadas: number;
    reprovadas: number;
    convalidadas: number;
  };
}

export interface SituacaoFinanceiraRelatorio {
  aluno_id: string;
  nome_aluno: string;
  codigo_itec: string | null;
  turma: string;
  tipo_financiamento: 'integral' | 'bolsista' | 'desconto_indicacao' | 'desconto_familia';
  percentual_desconto: number;
  mensalidades_pagas: number;
  mensalidades_pendentes: number;
  valor_em_aberto: number;
  status_geral: 'em_dia' | 'atrasado' | 'isento';
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

export interface R06_HistoricoAcademicoRelatorio {
  dados_pessoais: {
    nome_completo: string;
    codigo_itec: string | null;
    cpf: string | null;
    turma_codigo: string;
    turma_nome: string;
  };
  historico: HistoricoAluno;
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
 * R02 — Lista de presença (grade alunos × datas)
 * Padrão RLS: queries separadas + merge manual (LICAO-026)
 * Gera datas baseado em aulas_recorrentes + eventos_calendario
 */
export async function getListaPresencaRelatorio(
  filtro: FiltroListaPresenca
): Promise<ListaPresencaRelatorio | { erro: string }> {
  const { turmaId, disciplinaId, dataInicio, dataFim } = filtro;

  // Query 1: buscar aula recorrente da disciplina/turma
  const { data: aulaRecorrente, error: errorAula } = await supabase
    .from('aulas_recorrentes')
    .select('dia_semana, data_inicio, data_fim')
    .eq('disciplina_id', disciplinaId)
    .eq('turma_id', turmaId)
    .eq('ativo', true)
    .single();

  if (errorAula || !aulaRecorrente) {
    console.error('[R02] Erro ao buscar aula recorrente:', errorAula?.message);
    return {
      erro: 'sem_calendario',
    };
  }

  // Determinar período efetivo
  const periodoInicio = dataInicio || aulaRecorrente.data_inicio;
  const periodoFim = dataFim || aulaRecorrente.data_fim;

  // Query 2: buscar eventos do período (cancelamentos + reposições)
  const { data: eventos, error: errorEventos } = await supabase
    .from('eventos_calendario')
    .select('data, tipo, cancelar_aula, turma_id, disciplina_id')
    .gte('data', periodoInicio)
    .lte('data', periodoFim);

  if (errorEventos) {
    console.error('[R02] Erro ao buscar eventos:', errorEventos.message);
  }

  // Gerar datas recorrentes em memória
  const datasRecorrentes: string[] = [];
  const dataAtual = new Date(
    Math.max(new Date(periodoInicio).getTime(), new Date(aulaRecorrente.data_inicio).getTime())
  );
  const dataLimite = new Date(
    Math.min(new Date(periodoFim).getTime(), new Date(aulaRecorrente.data_fim).getTime())
  );

  while (dataAtual <= dataLimite) {
    if (dataAtual.getDay() === aulaRecorrente.dia_semana) {
      datasRecorrentes.push(dataAtual.toISOString().split('T')[0]);
    }
    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  // Filtrar cancelamentos (eventos que cancelam aula)
  const cancelamentos = new Set<string>();
  const reposicoes = new Set<string>();

  if (eventos) {
    for (const evt of eventos) {
      const afetaTurma = evt.turma_id === null || evt.turma_id === turmaId;
      const afetaDisciplina = evt.disciplina_id === null || evt.disciplina_id === disciplinaId;

      if (!afetaTurma && !afetaDisciplina) continue;

      // Cancelamentos
      if (
        evt.cancelar_aula &&
        (evt.tipo === 'feriado_nacional' ||
          evt.tipo === 'feriado_estadual' ||
          evt.tipo === 'feriado_institucional' ||
          evt.tipo === 'recesso' ||
          evt.tipo === 'cancelamento_aula')
      ) {
        cancelamentos.add(evt.data);
      }

      // Reposições
      if (evt.tipo === 'reposicao' && evt.disciplina_id === disciplinaId) {
        reposicoes.add(evt.data);
      }
    }
  }

  // Aplicar cancelamentos e adicionar reposições
  const datasComCancelamentos = datasRecorrentes.filter((d) => !cancelamentos.has(d));
  const datasFinais = [...new Set([...datasComCancelamentos, ...reposicoes])].sort();

  if (datasFinais.length === 0) {
    console.error('[R02] Nenhuma data de aula encontrada no período');
    return {
      erro: 'sem_datas',
    };
  }

  // Lista de alunos via ROSTER (get_alunos_operacional — 057/058/060), no lugar das
  // antigas Q3 (matriculas) + Q4 (matriculas_disciplina) + Q5 (profiles). O roster já
  // devolve aluno_id, full_name e codigo_itec (060), é gated por professor_leciona_
  // disciplina OR staff (SECURITY DEFINER) e é a MESMA fonte de LancarFrequencia/
  // VerTurma — o R02 deixa de ler profiles direto (LGPD-01 fase 2 · Mov.2) e passa a
  // exibir exatamente o conjunto de alunos das telas operacionais.
  const roster = await getAlunosOperacional(disciplinaId, turmaId);

  if (roster.length === 0) {
    // Vazio = sem matrícula na disciplina/turma OU disciplina fora do escopo do
    // professor (gate do roster). Em ambos os casos não há lista a montar.
    console.error('[R02] Roster vazio para a disciplina/turma (sem matriculados ou fora do escopo)');
    return {
      erro: 'sem_alunos',
    };
  }

  const alunoIds = roster.map((r) => r.aluno_id);
  const perfilPorAluno = new Map(roster.map((r) => [r.aluno_id, r]));

  // Query 6: buscar frequências do período
  const { data: frequencias, error: errorFreq } = await supabase
    .from('frequencia')
    .select('aluno_id, data_aula, presente, justificada')
    .eq('disciplina_id', disciplinaId)
    .in('aluno_id', alunoIds)
    .gte('data_aula', periodoInicio)
    .lte('data_aula', periodoFim)
    .limit(alunoIds.length * datasFinais.length);

  if (errorFreq) {
    console.error('[R02] Erro ao buscar frequências:', errorFreq.message);
  }

  // Criar mapa de frequências: aluno_id:data_aula -> registro
  type FreqKey = string;
  const freqMap = new Map<FreqKey, { presente: boolean; justificada: boolean }>();
  if (frequencias) {
    for (const f of frequencias) {
      const key = `${f.aluno_id}:${f.data_aula}`;
      freqMap.set(key, { presente: f.presente, justificada: f.justificada });
    }
  }

  // Buscar dados da disciplina e turma
  const { data: disciplinaData } = await supabase
    .from('disciplinas_v2')
    .select('id, nome')
    .eq('id', disciplinaId)
    .single();

  const { data: turmaData } = await supabase
    .from('turmas')
    .select('id, nome, codigo')
    .eq('id', turmaId)
    .single();

  // Merge manual: construir resultado
  const resultado: ListaPresencaRelatorio = {
    disciplina: {
      id: disciplinaData?.id || disciplinaId,
      nome: disciplinaData?.nome || 'Disciplina não encontrada',
    },
    turma: {
      id: turmaData?.id || turmaId,
      nome: turmaData?.nome || 'Turma não encontrada',
      codigo: turmaData?.codigo || '',
    },
    periodo: {
      inicio: periodoInicio,
      fim: periodoFim,
    },
    datas_aulas: datasFinais,
    alunos: [],
  };

  for (const alunoId of alunoIds) {
    const perfil = perfilPorAluno.get(alunoId);
    const presencas: {
      data_aula: string;
      status: 'P' | 'F' | null;
      justificada?: boolean;
    }[] = [];

    let totalPresencas = 0;
    let totalFaltas = 0;

    for (const data of datasFinais) {
      const key = `${alunoId}:${data}`;
      const freq = freqMap.get(key);

      if (freq) {
        const status = freq.presente ? 'P' : 'F';
        presencas.push({
          data_aula: data,
          status,
          justificada: freq.justificada || undefined,
        });
        if (freq.presente) totalPresencas++;
        else totalFaltas++;
      } else {
        presencas.push({
          data_aula: data,
          status: null,
        });
      }
    }

    const percentual =
      datasFinais.length > 0
        ? Math.round((totalPresencas / (totalPresencas + totalFaltas || 1)) * 100)
        : 0;

    resultado.alunos.push({
      aluno_id: alunoId,
      nome_aluno: perfil?.full_name || 'Nome não disponível',
      codigo_itec: perfil?.codigo_itec || null,
      presencas,
      resumo: {
        total_aulas: datasFinais.length,
        presencas: totalPresencas,
        faltas: totalFaltas,
        percentual,
      },
    });
  }

  // Ordenar alunos por nome
  resultado.alunos.sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));

  return resultado;
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
 * Padrão RLS: queries separadas + merge manual (LICAO-026)
 */
export async function getSituacaoFinanceiraRelatorio(
  filtro: FiltroSituacaoFinanceira
): Promise<SituacaoFinanceiraRelatorio[]> {
  const hoje = new Date().toISOString().split('T')[0];

  // Query 1: matriculas ativas com dados de financiamento
  let queryMatriculas = supabase
    .from('matriculas')
    .select('aluno_id, turma_id, tipo_financiamento, percentual_desconto')
    .eq('status', 'ativa')
    .limit(1000);

  // Filtro opcional: turma
  if (filtro.turmaId) {
    queryMatriculas = queryMatriculas.eq('turma_id', filtro.turmaId);
  }

  const { data: matriculas, error: errorMat } = await queryMatriculas;

  if (errorMat) {
    console.error('[R04] Erro ao buscar matrículas:', errorMat.message);
    return [];
  }

  if (!matriculas || matriculas.length === 0) {
    return [];
  }

  const alunoIds = matriculas.map(m => m.aluno_id);

  // Query 2: mensalidades — buscar todas por aluno
  const { data: mensalidades, error: errorMens } = await supabase
    .from('mensalidades')
    .select('aluno_id, valor, status, data_vencimento')
    .in('aluno_id', alunoIds)
    .limit(5000);

  if (errorMens) {
    console.error('[R04] Erro ao buscar mensalidades:', errorMens.message);
  }

  // Agrupar mensalidades por aluno em memória
  type MensalidadeRow = {
    aluno_id: string;
    valor: number;
    status: string;
    data_vencimento: string;
  };

  const porAluno = new Map<
    string,
    {
      pagas: number;
      pendentes: number;
      valorEmAberto: number;
      temAtrasada: boolean;
    }
  >();

  if (mensalidades) {
    for (const m of mensalidades as MensalidadeRow[]) {
      const entry = porAluno.get(m.aluno_id) ?? {
        pagas: 0,
        pendentes: 0,
        valorEmAberto: 0,
        temAtrasada: false,
      };

      if (m.status === 'pago') {
        entry.pagas++;
      } else if (m.status === 'pendente' || m.status === 'atrasado') {
        entry.pendentes++;
        entry.valorEmAberto += m.valor;
        // Verifica se está vencida
        if (m.data_vencimento < hoje) {
          entry.temAtrasada = true;
        }
      }

      porAluno.set(m.aluno_id, entry);
    }
  }

  // Query 3: profiles — buscar dados pessoais
  const { data: profiles, error: errorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, codigo_itec')
    .in('id', alunoIds);

  if (errorProfiles) {
    console.error('[R04] Erro ao buscar profiles:', errorProfiles.message);
  }

  // Query 4: turmas — buscar nomes
  const turmaIds = Array.from(new Set(matriculas.map(m => m.turma_id))).filter(Boolean);
  const { data: turmas, error: errorTurmas } = await supabase
    .from('turmas')
    .select('id, nome, codigo')
    .in('id', turmaIds);

  if (errorTurmas) {
    console.error('[R04] Erro ao buscar turmas:', errorTurmas.message);
  }

  // Mapear turma_id → nome
  const turmaNomeMap = new Map<string, string>();
  if (turmas) {
    for (const t of turmas) {
      turmaNomeMap.set(t.id, `${t.codigo} — ${t.nome}`);
    }
  }

  // Merge manual: combinar todos os dados
  const resultado: SituacaoFinanceiraRelatorio[] = [];

  for (const mat of matriculas) {
    const profile = profiles?.find(p => p.id === mat.aluno_id);
    const turmaNome = turmaNomeMap.get(mat.turma_id) || 'Sem turma';
    const financeiro = porAluno.get(mat.aluno_id) ?? {
      pagas: 0,
      pendentes: 0,
      valorEmAberto: 0,
      temAtrasada: false,
    };

    // Calcular status_geral
    let statusGeral: 'em_dia' | 'atrasado' | 'isento';

    // Isento: tipo_financiamento diferente de 'integral' OU percentual_desconto > 0
    const ehIsento = mat.tipo_financiamento !== 'integral' || (mat.percentual_desconto && mat.percentual_desconto > 0);

    if (ehIsento) {
      statusGeral = 'isento';
    } else if (financeiro.temAtrasada) {
      statusGeral = 'atrasado';
    } else {
      statusGeral = 'em_dia';
    }

    // Filtro opcional: status
    if (filtro.status && statusGeral !== filtro.status) {
      continue;
    }

    resultado.push({
      aluno_id: mat.aluno_id,
      nome_aluno: profile?.full_name || 'Nome não disponível',
      codigo_itec: profile?.codigo_itec || null,
      turma: turmaNome,
      tipo_financiamento: mat.tipo_financiamento || 'integral',
      percentual_desconto: mat.percentual_desconto || 0,
      mensalidades_pagas: financeiro.pagas,
      mensalidades_pendentes: financeiro.pendentes,
      valor_em_aberto: Math.round(financeiro.valorEmAberto * 100) / 100,
      status_geral: statusGeral,
    });
  }

  // Ordenar: isentos primeiro, depois atrasados, depois em dia
  const statusOrder = { isento: 0, atrasado: 1, em_dia: 2 };
  return resultado.sort((a, b) => statusOrder[a.status_geral] - statusOrder[b.status_geral]);
}

/**
 * R05 — Alunos inadimplentes
 * Padrão RLS: queries separadas + merge manual (LICAO-026)
 */
export async function getInadimplentesRelatorio(
  filtro: FiltroInadimplentes
): Promise<InadimplenteRelatorio[]> {
  const hoje = new Date().toISOString().split('T')[0];

  // Query 1: mensalidades atrasadas — agrupar por aluno
  const { data: mensalidades, error: errorMens } = await supabase
    .from('mensalidades')
    .select('aluno_id, valor, data_vencimento, matricula_id')
    .in('status', ['pendente', 'atrasado'])
    .lt('data_vencimento', hoje)
    .limit(1000);

  if (errorMens) {
    console.error('[R05] Erro ao buscar mensalidades:', errorMens.message);
    return [];
  }

  if (!mensalidades || mensalidades.length === 0) {
    return [];
  }

  // Agrupar por aluno_id em memória
  type MensalidadeRow = {
    aluno_id: string;
    valor: number;
    data_vencimento: string;
    matricula_id: string | null;
  };

  const porAluno = new Map<
    string,
    {
      count: number;
      total: number;
      vencimentoMaisAntigo: string;
      matriculaId: string | null;
    }
  >();

  for (const m of mensalidades as MensalidadeRow[]) {
    const entry = porAluno.get(m.aluno_id) ?? {
      count: 0,
      total: 0,
      vencimentoMaisAntigo: m.data_vencimento,
      matriculaId: m.matricula_id,
    };
    entry.count++;
    entry.total += m.valor;
    if (m.data_vencimento < entry.vencimentoMaisAntigo) {
      entry.vencimentoMaisAntigo = m.data_vencimento;
    }
    if (!entry.matriculaId && m.matricula_id) {
      entry.matriculaId = m.matricula_id;
    }
    porAluno.set(m.aluno_id, entry);
  }

  const alunoIds = Array.from(porAluno.keys());

  // Query 2: profiles — buscar dados pessoais
  const { data: profiles, error: errorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, telefone, codigo_itec')
    .in('id', alunoIds);

  if (errorProfiles) {
    console.error('[R05] Erro ao buscar profiles:', errorProfiles.message);
    return [];
  }

  // Query 3: matriculas — buscar turma_id
  const { data: matriculas, error: errorMat } = await supabase
    .from('matriculas')
    .select('aluno_id, turma_id, id')
    .in('aluno_id', alunoIds)
    .eq('status', 'ativa');

  if (errorMat) {
    console.error('[R05] Erro ao buscar matrículas:', errorMat.message);
  }

  // Mapear aluno → turma_id
  const alunoTurmaMap = new Map<string, string>();
  if (matriculas) {
    for (const mat of matriculas) {
      alunoTurmaMap.set(mat.aluno_id, mat.turma_id);
    }
  }

  const turmaIds = Array.from(new Set(alunoTurmaMap.values())).filter(Boolean);

  // Query 4: turmas — buscar nome das turmas
  const { data: turmas, error: errorTurmas } = await supabase
    .from('turmas')
    .select('id, nome, codigo')
    .in('id', turmaIds);

  if (errorTurmas) {
    console.error('[R05] Erro ao buscar turmas:', errorTurmas.message);
  }

  // Mapear turma_id → nome
  const turmaNomeMap = new Map<string, string>();
  if (turmas) {
    for (const t of turmas) {
      turmaNomeMap.set(t.id, `${t.codigo} — ${t.nome}`);
    }
  }

  // Merge manual: combinar todos os dados
  const resultado: InadimplenteRelatorio[] = [];

  for (const [alunoId, alunoData] of porAluno.entries()) {
    const profile = profiles?.find((p) => p.id === alunoId);
    const turmaId = alunoTurmaMap.get(alunoId);
    const turmaNome = turmaId ? turmaNomeMap.get(turmaId) || 'Sem turma' : 'Sem turma';

    // Filtro opcional: turma
    if (filtro.turmaId && turmaId !== filtro.turmaId) {
      continue;
    }

    // Calcular dias de atraso
    const vencimento = new Date(alunoData.vencimentoMaisAntigo);
    const hojeDt = new Date(hoje);
    const diasAtraso = Math.floor((hojeDt.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));

    // Filtro opcional: dias mínimos de atraso
    if (filtro.diasAtraso && diasAtraso < filtro.diasAtraso) {
      continue;
    }

    resultado.push({
      aluno_id: alunoId,
      nome_aluno: profile?.full_name || 'Nome não disponível',
      codigo_itec: profile?.codigo_itec || null,
      email: profile?.email || '',
      telefone: profile?.telefone || null,
      turma: turmaNome,
      mensalidades_atrasadas: alunoData.count,
      valor_total_atrasado: Math.round(alunoData.total * 100) / 100,
      dias_atraso: diasAtraso,
      ultima_mensalidade_vencimento: alunoData.vencimentoMaisAntigo,
    });
  }

  // Ordenar por dias de atraso (mais grave primeiro)
  return resultado.sort((a, b) => b.dias_atraso - a.dias_atraso);
}

/**
 * R03 — Disciplinas por Aluno
 * Padrão RLS: queries separadas + merge manual (LICAO-026)
 */
export async function getDisciplinasPorAlunoRelatorio(
  filtro: FiltroR03
): Promise<DisciplinasPorAlunoRelatorio[]> {
  // Query 1: matriculas WHERE turma_id (se filtro) + status='ativa'
  let queryMatriculas = supabase
    .from('matriculas')
    .select('id, aluno_id, turma_id')
    .eq('status', 'ativa')
    .limit(500);

  if (filtro.turmaId) {
    queryMatriculas = queryMatriculas.eq('turma_id', filtro.turmaId);
  }

  if (filtro.alunoId) {
    queryMatriculas = queryMatriculas.eq('aluno_id', filtro.alunoId);
  }

  const { data: matriculas, error: errorMat } = await queryMatriculas;

  if (errorMat) {
    console.error('[R03] Erro ao buscar matrículas:', errorMat.message);
    return [];
  }

  if (!matriculas || matriculas.length === 0) {
    return [];
  }

  const alunoIds = Array.from(new Set(matriculas.map((m) => m.aluno_id)));
  const turmaIds = Array.from(new Set(matriculas.map((m) => m.turma_id).filter(Boolean)));
  const matriculaIds = matriculas.map((m) => m.id);

  // Query 2: profiles WHERE id IN alunoIds
  const { data: profiles, error: errorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, codigo_itec')
    .in('id', alunoIds);

  if (errorProfiles) {
    console.error('[R03] Erro ao buscar profiles:', errorProfiles.message);
    return [];
  }

  // Query 3: turmas WHERE id IN turmaIds
  const { data: turmas, error: errorTurmas } = await supabase
    .from('turmas')
    .select('id, nome, codigo')
    .in('id', turmaIds);

  if (errorTurmas) {
    console.error('[R03] Erro ao buscar turmas:', errorTurmas.message);
  }

  // Query 4: matriculas_disciplina WHERE matricula_id IN matriculaIds + filtro status
  let queryMatDisc = supabase
    .from('matriculas_disciplina')
    .select('id, matricula_id, disciplina_id, status, nota')
    .in('matricula_id', matriculaIds)
    .limit(2000);

  if (filtro.status && filtro.status !== 'todos') {
    queryMatDisc = queryMatDisc.eq('status', filtro.status);
  }

  const { data: matriculasDisc, error: errorMatDisc } = await queryMatDisc;

  if (errorMatDisc) {
    console.error('[R03] Erro ao buscar matriculas_disciplina:', errorMatDisc.message);
    return [];
  }

  if (!matriculasDisc || matriculasDisc.length === 0) {
    return [];
  }

  const disciplinaIds = Array.from(new Set(matriculasDisc.map((md) => md.disciplina_id)));

  // Query 5: disciplinas_v2 WHERE id IN disciplinaIds
  const { data: disciplinas, error: errorDisc } = await supabase
    .from('disciplinas_v2')
    .select('id, codigo, nome')
    .in('id', disciplinaIds);

  if (errorDisc) {
    console.error('[R03] Erro ao buscar disciplinas:', errorDisc.message);
    return [];
  }

  // Merge manual em memória (LICAO-026)
  // Mapear para acesso rápido
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  const turmaMap = new Map(turmas?.map((t) => [t.id, t]) ?? []);
  const disciplinaMap = new Map(disciplinas?.map((d) => [d.id, d]) ?? []);

  // Mapear matricula_id → aluno_id + turma_id
  const matriculaMap = new Map(
    matriculas.map((m) => [
      m.id,
      { aluno_id: m.aluno_id, turma_id: m.turma_id },
    ])
  );

  // Agrupar matriculas_disciplina por aluno
  const porAluno = new Map<string, typeof matriculasDisc>();

  for (const md of matriculasDisc) {
    const mat = matriculaMap.get(md.matricula_id);
    if (!mat) continue;

    const alunoId = mat.aluno_id;
    const arr = porAluno.get(alunoId) ?? [];
    arr.push(md);
    porAluno.set(alunoId, arr);
  }

  // Construir resultado
  const resultado: DisciplinasPorAlunoRelatorio[] = [];

  for (const [alunoId, discs] of porAluno.entries()) {
    const profile = profileMap.get(alunoId);
    if (!profile) continue;

    // Buscar turma do aluno (primeira matrícula)
    const primeiraMatricula = matriculas.find((m) => m.aluno_id === alunoId);
    const turmaId = primeiraMatricula?.turma_id;
    const turma = turmaId ? turmaMap.get(turmaId) : null;

    if (!turma) continue;

    // Montar lista de disciplinas
    const disciplinasAluno = discs
      .map((md) => {
        const disc = disciplinaMap.get(md.disciplina_id);
        if (!disc) return null;

        return {
          disciplina_id: disc.id,
          codigo: disc.codigo,
          nome: disc.nome,
          status: md.status as DisciplinasPorAlunoRelatorio['disciplinas'][0]['status'],
          nota: md.nota,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => a.nome.localeCompare(b.nome));

    // Calcular totais
    const totais = {
      cursando: disciplinasAluno.filter((d) => d.status === 'cursando').length,
      aprovadas: disciplinasAluno.filter((d) => d.status === 'aprovado').length,
      reprovadas: disciplinasAluno.filter(
        (d) => d.status === 'reprovado' || d.status === 'reprovado_falta'
      ).length,
      convalidadas: disciplinasAluno.filter((d) => d.status === 'convalidado').length,
    };

    resultado.push({
      aluno_id: alunoId,
      nome_aluno: profile.full_name,
      codigo_itec: profile.codigo_itec || null,
      turma: {
        id: turma.id,
        nome: turma.nome,
        codigo: turma.codigo,
      },
      disciplinas: disciplinasAluno,
      totais,
    });
  }

  // Ordenar por nome_aluno
  return resultado.sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));
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

/**
 * R06 — Histórico Acadêmico Individual
 * Padrão RLS: queries separadas + merge manual (LICAO-026)
 */
export async function getHistoricoAcademicoR06(
  filtro: FiltroR06
): Promise<R06_HistoricoAcademicoRelatorio | null> {
  const { alunoId, turmaId } = filtro;

  // Query 1: Buscar dados do aluno (profile)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, codigo_itec, cpf')
    .eq('id', alunoId)
    .single();

  if (!profile) {
    console.error('getHistoricoAcademicoR06: aluno não encontrado', alunoId);
    return null;
  }

  // Query 2: Buscar dados da turma
  type TurmaRow = { codigo: string; nome: string };
  const { data: turma } = await supabase
    .from('turmas')
    .select('codigo, nome')
    .eq('id', turmaId)
    .single();

  if (!turma) {
    console.error('getHistoricoAcademicoR06: turma não encontrada', turmaId);
    return null;
  }

  const turmaData = turma as TurmaRow;

  // Query 3: Buscar histórico acadêmico completo (reusar função existente)
  const historico = await getHistoricoAluno(alunoId, turmaId);

  // Verificar se aluno tem disciplinas cursadas
  if (historico.modulos.length === 0) {
    console.warn('getHistoricoAcademicoR06: aluno sem disciplinas cursadas', alunoId);
    // Retornar estrutura vazia mas válida
  }

  // Merge manual: montar objeto de retorno
  return {
    dados_pessoais: {
      nome_completo: (profile as { full_name: string }).full_name,
      codigo_itec: (profile as { codigo_itec: string | null }).codigo_itec,
      cpf: (profile as { cpf: string | null }).cpf,
      turma_codigo: turmaData.codigo,
      turma_nome: turmaData.nome,
    },
    historico,
  };
}

/**
 * Busca alunos de uma turma (para dropdown)
 * Padrão RLS: queries separadas + merge manual (LICAO-026)
 */
export async function getAlunosDaTurma(
  turmaId: string
): Promise<{ id: string; nome: string; codigo_itec: string | null }[]> {
  // Query 1: Buscar alunos matriculados na turma
  const { data: matriculas } = await supabase
    .from('matriculas')
    .select('aluno_id')
    .eq('turma_id', turmaId)
    .eq('status', 'ativa')
    .limit(200);

  if (!matriculas || matriculas.length === 0) {
    return [];
  }

  type MatriculaRow = { aluno_id: string };
  const alunoIds = (matriculas as MatriculaRow[]).map((m) => m.aluno_id);

  // Query 2: Buscar dados dos alunos
  type ProfileRow = {
    id: string;
    full_name: string;
    codigo_itec: string | null;
  };

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, codigo_itec')
    .in('id', alunoIds)
    .limit(200);

  if (!profiles || profiles.length === 0) {
    return [];
  }

  // Merge manual: Map para lookup O(1)
  const profilesMap = new Map<string, ProfileRow>();
  for (const p of profiles as ProfileRow[]) {
    profilesMap.set(p.id, p);
  }

  // Merge: criar lista final
  const alunos = alunoIds
    .map((id) => {
      const profile = profilesMap.get(id);
      if (!profile) return null;
      return {
        id,
        nome: profile.full_name,
        codigo_itec: profile.codigo_itec,
      };
    })
    .filter((a): a is { id: string; nome: string; codigo_itec: string | null } => a !== null)
    .sort((a, b) => a.nome.localeCompare(b.nome)); // Ordenar alfabeticamente

  return alunos;
}
