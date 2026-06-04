import React, { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Printer } from 'lucide-react';
import { ScheduleXCalendar, useNextCalendarApp } from '@schedule-x/react';
import { createViewMonthGrid, createViewWeek } from '@schedule-x/calendar';
import '@schedule-x/theme-default/dist/index.css';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getEventosMes,
  getAulasRecorrentes,
  expandirAulasParaPeriodo,
  type EventoCalendario,
  type TipoEvento,
} from '@/services/calendario.service';
import { getTurmasAtivas, type Turma } from '@/services/turmas.service';
import { getProfessorByUserId } from '@/services/professor.service';
import { EventoModal } from '@/components/dashboard/EventoModal';
import type { DashboardContext } from '../Dashboard';

// ─── Cores por tipo ───────────────────────────────────────────────────────────

const COR_POR_TIPO: Record<TipoEvento, string> = {
  feriado_nacional:     '#EF4444',
  feriado_estadual:     '#EF4444',
  feriado_institucional: '#F59E0B',
  evento_itec:          '#3B82F6',
  reposicao:            '#22C55E',
  recesso:              '#F59E0B',
  cancelamento_aula:    '#EF4444',
  avaliacao:            '#8B5CF6',
  formatura:            '#EC4899',
  aula_recorrente:      '#22C55E',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toScheduleXEvent(e: EventoCalendario) {
  const color = e.cor || COR_POR_TIPO[e.tipo] || '#3B82F6';
  // Eventos de dia inteiro: start/end = 'YYYY-MM-DD'
  // Eventos com horário: start/end = 'YYYY-MM-DD HH:MM'
  const start = (!e.dia_inteiro && e.horario_inicio)
    ? `${e.data} ${e.horario_inicio.slice(0, 5)}`
    : e.data;
  const end = (!e.dia_inteiro && e.horario_fim)
    ? `${e.data} ${e.horario_fim.slice(0, 5)}`
    : e.data;

  return { id: e.id, title: e.titulo, start, end, color };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CalendarioAcademico() {
  const { profile } = useOutletContext<DashboardContext>();

  const hoje = new Date();
  const [ano,     setAno]     = useState(hoje.getFullYear());
  const [mes,     setMes]     = useState(hoje.getMonth() + 1); // 1-12
  const [view,    setView]    = useState<'month' | 'week'>('month');
  const [turmaId, setTurmaId] = useState<string>('');
  const [turmas,  setTurmas]  = useState<Turma[]>([]);
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [calError, setCalError] = useState<string | null>(null);
  const [eventoEditando, setEventoEditando] = useState<EventoCalendario | null>(null);
  const [modalAberto,    setModalAberto]    = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<string>('');
  // professor_id da tabela professores (para filtrar suas aulas)
  const [professorId, setProfessorId] = useState<string | null>(null);

  const podeEditar = ['superadmin', 'admin', 'administracao'].includes(profile.role);
  const isProfessor = profile.role === 'professor';

  // ─── Carregamento inicial ───────────────────────────────────────────────────

  useEffect(() => {
    getTurmasAtivas().then(setTurmas);
    if (isProfessor) {
      getProfessorByUserId(profile.id).then(p => setProfessorId(p?.id ?? null));
    }
  }, [isProfessor, profile.id]);

  // ─── Carregar eventos do mês ────────────────────────────────────────────────

  useEffect(() => {
    carregarEventos();
  }, [ano, mes, turmaId, professorId]);

  const carregarEventos = async () => {
    setLoading(true);
    setCalError(null);
    try {
      const turmaFiltro = turmaId || undefined;
      const profFiltro  = isProfessor ? (professorId ?? undefined) : undefined;

      const [eventosBanco, aulas] = await Promise.all([
        getEventosMes(ano, mes, turmaFiltro),
        getAulasRecorrentes(turmaFiltro, profFiltro),
      ]);

      // Primeiro e último dia do mês para expansão de recorrentes
      const inicio    = new Date(ano, mes - 1, 1, 12, 0, 0);
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const fim       = new Date(ano, mes - 1, ultimoDia, 12, 0, 0);

      const aulasExpandidas = expandirAulasParaPeriodo(aulas, inicio, fim);

      // Combina: aulas expandidas primeiro, depois eventos do banco
      setEventos([...aulasExpandidas, ...eventosBanco]);
    } catch (err) {
      setCalError('Erro ao carregar calendário. Tente recarregar a página.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Schedule-X ────────────────────────────────────────────────────────────

  const scheduleXEvents = useMemo(
    () => eventos.map(toScheduleXEvent),
    [eventos]
  );

  const calendar = useNextCalendarApp({
    views:         [createViewMonthGrid(), createViewWeek()],
    defaultView:   view === 'month' ? 'month-grid' : 'week',
    events:        scheduleXEvents,
    locale:        'pt-BR',
    firstDayOfWeek: 1 as 1, // Segunda-feira — fix LICAO-023 (@schedule-x: 1-7, não 0-6 do JS)
    callbacks: {
      onEventClick(event) {
        if (!podeEditar) return;
        // Aulas recorrentes são somente leitura (são virtuais)
        const original = eventos.find(e => e.id === event.id);
        if (original && original.tipo !== 'aula_recorrente') {
          setEventoEditando(original);
          setModalAberto(true);
        }
      },
    },
  });

  // Atualiza eventos no calendário quando mudam
  useEffect(() => {
    if (!calendar) return;
    calendar.events.set(scheduleXEvents);
  }, [scheduleXEvents, calendar]);

  // ─── Navegação mês ─────────────────────────────────────────────────────────

  const irParaMesAnterior = () => {
    if (mes === 1) { setMes(12); setAno(a => a - 1); }
    else setMes(m => m - 1);
  };

  const irParaProximoMes = () => {
    if (mes === 12) { setMes(1); setAno(a => a + 1); }
    else setMes(m => m + 1);
  };

  // ─── Impressão ─────────────────────────────────────────────────────────────

  const handlePrint = () => {
    const turmaNome = turmas.find(t => t.id === turmaId)?.nome ?? 'Todas as turmas';
    const w = window.open('', '_blank');
    if (!w) return;

    const rows = eventos
      .filter(e => e.tipo !== 'aula_recorrente' || !e.dia_inteiro)
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(e => {
        const hora = (!e.dia_inteiro && e.horario_inicio)
          ? `${e.horario_inicio.slice(0, 5)}–${(e.horario_fim ?? '').slice(0, 5)}`
          : 'Dia inteiro';
        return `<tr><td>${new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td><td>${e.titulo}</td><td>${hora}</td></tr>`;
      })
      .join('');

    w.document.write(`<!DOCTYPE html><html><head>
      <title>Calendário — ${MESES_PT[mes - 1]} ${ano}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px}h1{font-size:15px;margin-bottom:2px}
      p{font-size:12px;color:#666;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:7px 10px;font-size:12px;text-align:left}
      th{background:#f5f5f5;font-weight:600}</style>
    </head><body>
      <h1>ITEC — Instituto de Teologia Cristã</h1>
      <p>${MESES_PT[mes - 1]} ${ano} · ${turmaNome}</p>
      <table><thead><tr><th>Data</th><th>Evento</th><th>Horário</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </body></html>`);
    w.document.close();
    w.print();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Calendário Acadêmico</h1>
            <p className="text-sm text-muted-foreground">Grade de aulas, feriados e eventos do ITEC</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {podeEditar && (
            <Button size="sm" onClick={() => { setEventoEditando(null); setDataSelecionada(''); setModalAberto(true); }}>
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Evento
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-card border rounded-xl px-4 py-3">
        {/* Navegação mês */}
        <div className="flex items-center gap-2">
          <button
            onClick={irParaMesAnterior}
            className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-muted transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold min-w-36 text-center">
            {MESES_PT[mes - 1]} {ano}
          </span>
          <button
            onClick={irParaProximoMes}
            className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-muted transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtro turma — oculto para professor (auto-filtrado) */}
          {!isProfessor && (
            <select
              value={turmaId}
              onChange={e => setTurmaId(e.target.value)}
              className="text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Filtrar por turma"
            >
              <option value="">Todas as turmas</option>
              {turmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          )}

          {/* Toggle mensal/semanal */}
          <div className="flex rounded-md border overflow-hidden text-sm">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 transition-colors ${view === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Mês
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 transition-colors ${view === 'week' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Semana
            </button>
          </div>
        </div>
      </div>

      {/* Legenda de cores */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {[
          { cor: '#22C55E', label: 'Aulas' },
          { cor: '#EF4444', label: 'Feriados / Cancelamentos' },
          { cor: '#3B82F6', label: 'Eventos ITEC' },
          { cor: '#8B5CF6', label: 'Avaliações' },
          { cor: '#F59E0B', label: 'Recesso / Institucional' },
          { cor: '#EC4899', label: 'Formatura' },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full shrink-0" style={{ background: item.cor }} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Calendário */}
      <div className="bg-card border rounded-xl">
        {calError ? (
          <div className="p-8 text-center text-destructive text-sm">{calError}</div>
        ) : loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : eventos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <CalendarDays className="h-10 w-10 opacity-20" />
            <p className="text-sm">Nenhum evento em {MESES_PT[mes - 1]} {ano}.</p>
            {podeEditar && (
              <Button variant="outline" size="sm" className="mt-2"
                onClick={() => { setEventoEditando(null); setModalAberto(true); }}>
                <Plus className="h-4 w-4 mr-1.5" />
                Criar primeiro evento
              </Button>
            )}
          </div>
        ) : (
          <div
            className="sx-react-calendar-wrapper p-1"
            data-theme="light"
            style={{ colorScheme: 'light' }}
          >
            {calendar && <ScheduleXCalendar calendarApp={calendar} />}
          </div>
        )}
      </div>

      {/* Modal de criação/edição — só para staff */}
      {podeEditar && (
        <EventoModal
          open={modalAberto}
          evento={eventoEditando}
          dataInicial={dataSelecionada}
          turmas={turmas}
          requesterId={profile.id}
          onClose={() => { setModalAberto(false); setEventoEditando(null); }}
          onSaved={carregarEventos}
        />
      )}
    </div>
  );
}
