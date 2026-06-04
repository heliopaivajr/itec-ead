import { supabase } from '@/lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

// Valores do CHECK constraint em eventos_calendario + virtual para aulas expandidas
export type TipoEvento =
  | 'feriado_nacional'
  | 'feriado_estadual'
  | 'feriado_institucional'
  | 'evento_itec'
  | 'reposicao'
  | 'recesso'
  | 'cancelamento_aula'
  | 'avaliacao'
  | 'formatura'
  | 'aula_recorrente'; // virtual — expandida pelo frontend, não existe no banco

export interface EventoCalendario {
  id: string;
  titulo: string;
  descricao: string | null;
  data: string; // 'YYYY-MM-DD'
  tipo: TipoEvento;
  turma_id: string | null;
  disciplina_id: string | null;
  professor_id: string | null;
  professor_nome: string | null;
  cancelar_aula: boolean;
  dia_inteiro: boolean;
  horario_inicio: string | null; // 'HH:MM:SS' — formato TIME do PostgreSQL
  horario_fim: string | null;
  cor: string;
  // Presente apenas em eventos expandidos de aulas_recorrentes
  aula_recorrente_id?: string;
}

export interface AulaRecorrente {
  id: string;
  disciplina_id: string;
  disciplina_nome: string;
  turma_id: string;
  professor_id: string | null;
  professor_nome: string | null;
  dia_semana: number; // 0=Dom 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sab
  horario_inicio: string; // 'HH:MM:SS'
  horario_fim: string;
  data_inicio: string; // 'YYYY-MM-DD'
  data_fim: string;
  sala: string | null;
  ativo: boolean;
}

export type TipoEventoPayload = Exclude<TipoEvento, 'aula_recorrente'>;

export interface EventoCalendarioPayload {
  titulo: string;
  descricao?: string | null;
  data: string; // 'YYYY-MM-DD'
  tipo: TipoEventoPayload;
  turma_id?: string | null;
  disciplina_id?: string | null;
  professor_id?: string | null;
  cancelar_aula?: boolean;
  dia_inteiro?: boolean;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  cor?: string;
}

export interface ServiceResult {
  error: string | null;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

// Verifica role do requester — padrão aprovarMatricula (LICAO-018 safe)
async function verificarRoleStaff(requesterId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', requesterId)
    .single();

  if (error) return 'Erro ao verificar permissão';
  const role = (data as { role: string } | null)?.role ?? '';
  if (!['administracao', 'admin', 'superadmin'].includes(role)) {
    return 'Permissão insuficiente para gerenciar eventos';
  }
  return null;
}

// Parse 'YYYY-MM-DD' como data local (noon para evitar problemas de DST)
function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

// Formata Date como 'YYYY-MM-DD'
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Eventos do banco ─────────────────────────────────────────────────────────

// Eventos de um mês específico, com filtro no banco (LICAO-012).
// Se turmaId: inclui eventos globais (turma_id IS NULL) + da turma.
// Se sem turmaId: retorna todos os eventos do mês (visão admin).
export async function getEventosMes(
  ano: number,
  mes: number,
  turmaId?: string
): Promise<EventoCalendario[]> {
  const mm       = String(mes).padStart(2, '0');
  const primeiroDia = `${ano}-${mm}-01`;
  const proximoMes  = mes === 12 ? 1 : mes + 1;
  const proximoAno  = mes === 12 ? ano + 1 : ano;
  const proximoDia  = `${proximoAno}-${String(proximoMes).padStart(2, '0')}-01`;

  let query = supabase
    .from('eventos_calendario')
    .select('id, titulo, descricao, data, tipo, turma_id, disciplina_id, professor_id, cancelar_aula, dia_inteiro, horario_inicio, horario_fim, cor')
    .gte('data', primeiroDia)
    .lt('data', proximoDia)
    .order('data', { ascending: true })
    .limit(200);

  if (turmaId) {
    query = query.or(`turma_id.is.null,turma_id.eq.${turmaId}`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as unknown as EventoCalendario[]).map(e => ({
    ...e,
    professor_nome: null, // eventos_calendario não tem join com professor por ora
  }));
}

// ─── Aulas recorrentes ────────────────────────────────────────────────────────

// Aulas recorrentes ativas com nomes de disciplina e professor via join.
// Filtros opcionais no banco — nunca em memória (LICAO-012).
export async function getAulasRecorrentes(
  turmaId?: string,
  professorId?: string
): Promise<AulaRecorrente[]> {
  type Row = {
    id: string;
    disciplina_id: string;
    turma_id: string;
    professor_id: string | null;
    dia_semana: number;
    horario_inicio: string;
    horario_fim: string;
    data_inicio: string;
    data_fim: string;
    sala: string | null;
    ativo: boolean;
    disciplinas_v2: { nome: string } | null;
    professores: { nome_completo: string } | null;
  };

  let query = supabase
    .from('aulas_recorrentes')
    .select(`
      id, disciplina_id, turma_id, professor_id,
      dia_semana, horario_inicio, horario_fim,
      data_inicio, data_fim, sala, ativo,
      disciplinas_v2(nome),
      professores(nome_completo)
    `)
    .eq('ativo', true)
    .order('dia_semana', { ascending: true })
    .limit(100);

  if (turmaId)    query = query.eq('turma_id', turmaId);
  if (professorId) query = query.eq('professor_id', professorId);

  const { data, error } = await query;
  if (error || !data) return [];

  return ((data ?? []) as unknown as Row[]).map(r => {
    const disc = Array.isArray(r.disciplinas_v2) ? r.disciplinas_v2[0] : r.disciplinas_v2;
    const prof = Array.isArray(r.professores)    ? r.professores[0]    : r.professores;
    return {
      id:              r.id,
      disciplina_id:   r.disciplina_id,
      disciplina_nome: disc?.nome ?? r.disciplina_id,
      turma_id:        r.turma_id,
      professor_id:    r.professor_id,
      professor_nome:  prof?.nome_completo ?? null,
      dia_semana:      r.dia_semana,
      horario_inicio:  r.horario_inicio,
      horario_fim:     r.horario_fim,
      data_inicio:     r.data_inicio,
      data_fim:        r.data_fim,
      sala:            r.sala,
      ativo:           r.ativo,
    };
  });
}

// ─── Expansão de aulas recorrentes (função pura) ──────────────────────────────

// Converte padrões semanais de aulas_recorrentes em instâncias individuais
// para um período específico. Sem queries, sem side effects — 100% testável.
//
// Para cada AulaRecorrente:
//   1. Calcula a interseção de [aula.data_inicio, aula.data_fim] com [inicio, fim]
//   2. Encontra a primeira ocorrência do dia_semana no período interseccionado
//   3. Itera semanalmente gerando EventoCalendario para cada data
//
// Exemplo: dia_semana=2 (Terça), data_inicio='2026-03-01', data_fim='2026-11-30'
//   expandirAulasParaPeriodo(aulas, new Date('2026-05-01'), new Date('2026-05-31'))
//   → 4 ou 5 terças de maio com horário da aula
export function expandirAulasParaPeriodo(
  aulas: AulaRecorrente[],
  inicio: Date,
  fim: Date
): EventoCalendario[] {
  const result: EventoCalendario[] = [];

  for (const aula of aulas) {
    if (!aula.ativo) continue;

    const aulaInicio = parseDateStr(aula.data_inicio);
    const aulaFim    = parseDateStr(aula.data_fim);

    // Intersecção dos dois períodos
    const periodoInicio = inicio > aulaInicio ? inicio : aulaInicio;
    const periodoFim    = fim    < aulaFim    ? fim    : aulaFim;

    // Sem interseção → pular
    if (periodoInicio > periodoFim) continue;

    // Primeiro dia do dia_semana a partir de periodoInicio
    const diffDias = (aula.dia_semana - periodoInicio.getDay() + 7) % 7;
    const primeiraData = new Date(periodoInicio);
    primeiraData.setDate(primeiraData.getDate() + diffDias);

    // Gerar instâncias semanais
    const atual = new Date(primeiraData);
    while (atual <= periodoFim) {
      const dataStr = toDateStr(atual);
      result.push({
        id:                `${aula.id}_${dataStr}`,
        titulo:            aula.disciplina_nome,
        descricao:         aula.sala ? `Sala: ${aula.sala}` : null,
        data:              dataStr,
        tipo:              'aula_recorrente',
        turma_id:          aula.turma_id,
        disciplina_id:     aula.disciplina_id,
        professor_id:      aula.professor_id,
        professor_nome:    aula.professor_nome,
        cancelar_aula:     false,
        dia_inteiro:       false,
        horario_inicio:    aula.horario_inicio,
        horario_fim:       aula.horario_fim,
        cor:               '#22C55E',
        aula_recorrente_id: aula.id,
      });
      atual.setDate(atual.getDate() + 7);
    }
  }

  // Ordena por data crescente
  return result.sort((a, b) => a.data.localeCompare(b.data));
}

// ─── CRUD de eventos (staff only) ────────────────────────────────────────────

// Cria evento — apenas administracao/admin/superadmin
export async function criarEvento(
  payload: EventoCalendarioPayload,
  criadoPor: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  const roleErr = await verificarRoleStaff(criadoPor);
  if (roleErr) return { data: null, error: roleErr };

  const { data, error } = await supabase
    .from('eventos_calendario')
    .insert({
      titulo:         payload.titulo,
      descricao:      payload.descricao ?? null,
      data:           payload.data,
      tipo:           payload.tipo,
      turma_id:       payload.turma_id ?? null,
      disciplina_id:  payload.disciplina_id ?? null,
      professor_id:   payload.professor_id ?? null,
      cancelar_aula:  payload.cancelar_aula ?? false,
      dia_inteiro:    payload.dia_inteiro ?? true,
      horario_inicio: payload.horario_inicio ?? null,
      horario_fim:    payload.horario_fim ?? null,
      cor:            payload.cor ?? '#3B82F6',
      created_by:     criadoPor,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as { id: string }, error: null };
}

// Atualiza evento — apenas staff
export async function atualizarEvento(
  id: string,
  payload: Partial<EventoCalendarioPayload>,
  requesterId: string
): Promise<ServiceResult> {
  const roleErr = await verificarRoleStaff(requesterId);
  if (roleErr) return { error: roleErr };

  const { error } = await supabase
    .from('eventos_calendario')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

// Exclui evento — apenas staff
export async function excluirEvento(
  id: string,
  requesterId: string
): Promise<ServiceResult> {
  const roleErr = await verificarRoleStaff(requesterId);
  if (roleErr) return { error: roleErr };

  const { error } = await supabase
    .from('eventos_calendario')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}
