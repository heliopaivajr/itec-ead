import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Printer, BookOpen } from 'lucide-react';
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
import { GradeRapidaModal } from '@/components/dashboard/GradeRapidaModal';
import type { DashboardContext } from '../Dashboard';

// ─── Cores ───────────────────────────────────────────────────────────────────

const COR_POR_TIPO: Record<TipoEvento, string> = {
  feriado_nacional:      '#EF4444',
  feriado_estadual:      '#EF4444',
  feriado_institucional: '#F59E0B',
  evento_itec:           '#3B82F6',
  reposicao:             '#22C55E',
  recesso:               '#F59E0B',
  cancelamento_aula:     '#EF4444',
  avaliacao:             '#8B5CF6',
  formatura:             '#EC4899',
  aula_recorrente:       '#22C55E',
};

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStrLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

interface CalendarioDia { data: Date; dataStr: string; mesAtual: boolean; isHoje: boolean }

function gerarGrade(ano: number, mes: number): CalendarioDia[] {
  const hoje = toDateStrLocal(new Date());
  const p = new Date(ano, mes-1, 1), u = new Date(ano, mes, 0);
  const dias: CalendarioDia[] = [];
  const leading = p.getDay();
  for (let i = leading-1; i >= 0; i--) {
    const d = new Date(ano, mes-1, -i);
    dias.push({ data: d, dataStr: toDateStrLocal(d), mesAtual: false, isHoje: toDateStrLocal(d) === hoje });
  }
  for (let day = 1; day <= u.getDate(); day++) {
    const d = new Date(ano, mes-1, day);
    dias.push({ data: d, dataStr: toDateStrLocal(d), mesAtual: true, isHoje: toDateStrLocal(d) === hoje });
  }
  let next = 1;
  while (dias.length < 42) {
    const d = new Date(ano, mes, next++);
    dias.push({ data: d, dataStr: toDateStrLocal(d), mesAtual: false, isHoje: toDateStrLocal(d) === hoje });
  }
  return dias;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d); r.setHours(12,0,0,0);
  r.setDate(d.getDate() - d.getDay()); // recua para o Domingo
  return r;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CalendarioAcademico() {
  const { profile } = useOutletContext<DashboardContext>();

  const hoje = new Date();
  const [ano,     setAno]     = useState(hoje.getFullYear());
  const [mes,     setMes]     = useState(hoje.getMonth() + 1);
  const [view,    setView]    = useState<'mes' | 'semana'>('mes');
  const [semanaBase, setSemanaBase] = useState<Date>(() => startOfWeek(new Date()));
  const [turmaId, setTurmaId] = useState('');
  const [turmas,  setTurmas]  = useState<Turma[]>([]);
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [calError, setCalError] = useState<string | null>(null);
  const [eventoEditando, setEventoEditando] = useState<EventoCalendario | null>(null);
  const [modalAberto, setModalAberto]       = useState(false);
  const [gradeOpen,   setGradeOpen]         = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [professorId, setProfessorId] = useState<string | null>(null);

  const podeEditar  = ['superadmin','admin','administracao'].includes(profile.role);
  const isProfessor = profile.role === 'professor';

  useEffect(() => {
    getTurmasAtivas().then(setTurmas);
    if (isProfessor) getProfessorByUserId(profile.id).then(p => setProfessorId(p?.id ?? null));
  }, [isProfessor, profile.id]);

  useEffect(() => { carregarEventos(); }, [ano, mes, turmaId, professorId]);

  // Quando muda de semana, sincroniza ano/mes
  useEffect(() => {
    if (view !== 'semana') return;
    setAno(semanaBase.getFullYear());
    setMes(semanaBase.getMonth() + 1);
  }, [semanaBase, view]);

  const carregarEventos = async () => {
    setLoading(true); setCalError(null);
    try {
      const turmaFiltro = turmaId || undefined;
      const profFiltro  = isProfessor ? (professorId ?? undefined) : undefined;
      const [eventosBanco, aulas] = await Promise.all([
        getEventosMes(ano, mes, turmaFiltro),
        getAulasRecorrentes(turmaFiltro, profFiltro),
      ]);
      const inicio = new Date(ano, mes-1, 1, 12, 0, 0);
      const fim    = new Date(ano, mes-1, new Date(ano, mes, 0).getDate(), 12, 0, 0);
      const aulasExpandidas = expandirAulasParaPeriodo(aulas, inicio, fim);

      // FIX 3: remover aulas que caem em dias com cancelar_aula=true
      const datasComCancelamento = new Set(
        eventosBanco.filter(ev => ev.cancelar_aula).map(ev => ev.data)
      );
      const aulasValidas = aulasExpandidas.filter(a => !datasComCancelamento.has(a.data));

      setEventos([...aulasValidas, ...eventosBanco]);
    } catch {
      setCalError('Erro ao carregar calendário. Tente recarregar a página.');
    } finally { setLoading(false); }
  };

  // FIX 1: handlers separados para evento vs dia
  const handleEventoClick = (e: React.MouseEvent, evento: EventoCalendario) => {
    e.stopPropagation();
    if (evento.tipo === 'aula_recorrente') return; // aulas recorrentes são somente leitura
    if (!podeEditar) return;
    setEventoEditando(evento);
    setDataSelecionada('');
    setModalAberto(true);
  };

  const handleDiaClick = (dataStr: string) => {
    if (!podeEditar) return;
    setEventoEditando(null);
    setDataSelecionada(dataStr);
    setModalAberto(true);
  };

  // Navegação
  const mesAnterior = () => {
    if (view === 'semana') {
      setSemanaBase(d => { const r = new Date(d); r.setDate(r.getDate()-7); return r; });
    } else {
      if (mes === 1) { setMes(12); setAno(a => a-1); } else setMes(m => m-1);
    }
  };
  const proximoMes = () => {
    if (view === 'semana') {
      setSemanaBase(d => { const r = new Date(d); r.setDate(r.getDate()+7); return r; });
    } else {
      if (mes === 12) { setMes(1); setAno(a => a+1); } else setMes(m => m+1);
    }
  };

  // Grade mensal
  const grade = useMemo(() => gerarGrade(ano, mes), [ano, mes]);

  // Agrupamento por data
  const eventosPorDia = useMemo(() => {
    const map = new Map<string, EventoCalendario[]>();
    for (const ev of eventos) {
      const arr = map.get(ev.data) ?? [];
      arr.push(ev);
      map.set(ev.data, arr);
    }
    return map;
  }, [eventos]);

  // Semana atual (7 dias a partir de semanaBase)
  const diasDaSemana = useMemo(() => {
    const hojeStr = toDateStrLocal(new Date());
    return Array.from({length:7}, (_, i) => {
      const d = new Date(semanaBase);
      d.setDate(d.getDate() + i);
      return { data: d, dataStr: toDateStrLocal(d), isHoje: toDateStrLocal(d) === hojeStr };
    });
  }, [semanaBase]);

  // Impressão
  const handlePrint = () => {
    const turmaNome = turmas.find(t => t.id === turmaId)?.nome ?? 'Todas as turmas';
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = eventos.sort((a,b) => a.data.localeCompare(b.data)).map(e => {
      const hora = (!e.dia_inteiro && e.horario_inicio)
        ? `${e.horario_inicio.slice(0,5)}–${(e.horario_fim??'').slice(0,5)}` : 'Dia inteiro';
      return `<tr><td>${new Date(e.data+'T12:00:00').toLocaleDateString('pt-BR')}</td><td>${e.titulo}</td><td>${hora}</td></tr>`;
    }).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Calendário — ${MESES_PT[mes-1]} ${ano}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px}h1{font-size:15px}p{font-size:12px;color:#666;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:7px 10px;font-size:12px;text-align:left}
      th{background:#f5f5f5;font-weight:600}</style></head><body>
      <h1>ITEC — Instituto de Teologia Cristã</h1>
      <p>${MESES_PT[mes-1]} ${ano} · ${turmaNome}</p>
      <table><thead><tr><th>Data</th><th>Evento</th><th>Horário</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`);
    w.document.close(); w.print();
  };

  // ─── Render: badge de evento (reutilizado em mês e semana) ─────────────────

  const EventoBadge = ({ ev, compact = false }: { ev: EventoCalendario; compact?: boolean }) => (
    <div
      onClick={e => handleEventoClick(e as React.MouseEvent, ev)}
      title={ev.titulo}
      className={[
        'text-xs rounded px-1 py-0.5 text-white leading-tight truncate',
        ev.tipo !== 'aula_recorrente' && podeEditar ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
        compact ? '' : 'mb-0.5',
      ].join(' ')}
      style={{ backgroundColor: ev.cor || COR_POR_TIPO[ev.tipo] || '#3B82F6' }}>
      {!ev.dia_inteiro && ev.horario_inicio ? `${ev.horario_inicio.slice(0,5)} ` : ''}
      {ev.titulo}
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  const tituloNavegacao = view === 'semana'
    ? `${diasDaSemana[0].data.getDate()}/${diasDaSemana[0].data.getMonth()+1} – ${diasDaSemana[6].data.getDate()}/${diasDaSemana[6].data.getMonth()+1}/${diasDaSemana[6].data.getFullYear()}`
    : `${MESES_PT[mes-1]} ${ano}`;

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
            <p className="text-sm text-muted-foreground">Grade de aulas, feriados e eventos</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {podeEditar && (
            <>
              <Button variant="outline" size="sm" onClick={() => setGradeOpen(true)}>
                <BookOpen className="h-4 w-4 mr-1.5" /> Grade Rápida
              </Button>
              <Button size="sm" onClick={() => { setEventoEditando(null); setDataSelecionada(''); setModalAberto(true); }}>
                <Plus className="h-4 w-4 mr-1.5" /> Novo Evento
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-card border rounded-xl px-4 py-3">
        {/* Navegação */}
        <div className="flex items-center gap-2">
          <button onClick={mesAnterior}
            className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-muted transition-colors"
            aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold min-w-44 text-center">{tituloNavegacao}</span>
          <button onClick={proximoMes}
            className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-muted transition-colors"
            aria-label="Próximo"><ChevronRight className="h-4 w-4" /></button>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle mês/semana */}
          <div className="flex rounded-md border overflow-hidden text-sm">
            {(['mes','semana'] as const).map(v => (
              <button key={v} onClick={() => {
                setView(v);
                if (v === 'semana') setSemanaBase(startOfWeek(new Date()));
              }}
                className={`px-3 py-1.5 transition-colors capitalize ${view === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                {v === 'mes' ? 'Mês' : 'Semana'}
              </button>
            ))}
          </div>

          {/* Filtro turma */}
          {!isProfessor && (
            <select value={turmaId} onChange={e => setTurmaId(e.target.value)}
              className="text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Filtrar por turma">
              <option value="">Todas as turmas</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {[
          { cor: '#22C55E', label: 'Aulas' },
          { cor: '#EF4444', label: 'Feriados' },
          { cor: '#3B82F6', label: 'Eventos ITEC' },
          { cor: '#8B5CF6', label: 'Avaliações' },
          { cor: '#F59E0B', label: 'Recesso' },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full shrink-0" style={{ background: item.cor }} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Grade */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {calError ? (
          <p className="p-8 text-center text-destructive text-sm">{calError}</p>
        ) : loading ? (
          <div className="p-4 space-y-1">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DIAS_SEMANA.map(d => <Skeleton key={d} className="h-8" />)}
            </div>
            {[1,2,3,4,5,6].map(r => (
              <div key={r} className="grid grid-cols-7 gap-1">
                {[1,2,3,4,5,6,7].map(c => <Skeleton key={c} className="h-20" />)}
              </div>
            ))}
          </div>
        ) : view === 'mes' ? (

          // ── VISÃO MÊS ─────────────────────────────────────────────────────
          <div className="grid grid-cols-7 gap-px bg-border">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">{d}</div>
            ))}
            {grade.map((dia, i) => {
              const evsDia = eventosPorDia.get(dia.dataStr) ?? [];
              const visivel = evsDia.slice(0, 3);
              const extra   = evsDia.length - visivel.length;
              return (
                <div key={i}
                  onClick={() => { if (podeEditar && dia.mesAtual) handleDiaClick(dia.dataStr); }}
                  className={[
                    'bg-card min-h-[90px] p-1 flex flex-col gap-0.5 transition-colors',
                    dia.mesAtual && podeEditar ? 'cursor-pointer hover:bg-muted/30' : '',
                    !dia.mesAtual ? 'opacity-40' : '',
                    dia.isHoje ? 'ring-2 ring-inset ring-primary' : '',
                  ].filter(Boolean).join(' ')}>
                  <span className={[
                    'text-xs font-medium self-end px-1 rounded-full',
                    dia.isHoje ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                  ].join(' ')}>{dia.data.getDate()}</span>
                  {visivel.map(ev => <EventoBadge key={ev.id} ev={ev} />)}
                  {extra > 0 && <span className="text-xs text-muted-foreground px-1">+{extra} mais</span>}
                </div>
              );
            })}
          </div>

        ) : (

          // ── VISÃO SEMANA ──────────────────────────────────────────────────
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header dias */}
              <div className="grid grid-cols-7 gap-px bg-border">
                {diasDaSemana.map((d) => (
                  <div key={d.dataStr}
                    onClick={() => { if (podeEditar) handleDiaClick(d.dataStr); }}
                    className={[
                      'bg-muted/50 p-2 text-center cursor-pointer hover:bg-muted/80 transition-colors',
                      d.isHoje ? 'bg-primary/10' : '',
                    ].join(' ')}>
                    <div className="text-xs font-semibold text-muted-foreground uppercase">{DIAS_SEMANA[d.data.getDay()]}</div>
                    <div className={[
                      'text-lg font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full',
                      d.isHoje ? 'bg-primary text-primary-foreground' : '',
                    ].join(' ')}>{d.data.getDate()}</div>
                  </div>
                ))}
              </div>

              {/* Eventos da semana */}
              <div className="grid grid-cols-7 gap-px bg-border">
                {diasDaSemana.map((d) => {
                  const evsDia = (eventosPorDia.get(d.dataStr) ?? [])
                    .sort((a, b) => (a.horario_inicio ?? '00:00').localeCompare(b.horario_inicio ?? '00:00'));
                  return (
                    <div key={d.dataStr}
                      onClick={() => { if (podeEditar) handleDiaClick(d.dataStr); }}
                      className={[
                        'bg-card min-h-[300px] p-1 space-y-0.5 cursor-pointer hover:bg-muted/20 transition-colors',
                        d.isHoje ? 'ring-1 ring-inset ring-primary/30' : '',
                      ].join(' ')}>
                      {evsDia.length === 0 ? (
                        <p className="text-xs text-muted-foreground/40 text-center pt-4">—</p>
                      ) : evsDia.map(ev => <EventoBadge key={ev.id} ev={ev} />)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        )}
      </div>

      {/* Modais */}
      {podeEditar && (
        <>
          <EventoModal
            open={modalAberto}
            evento={eventoEditando}
            dataInicial={dataSelecionada}
            turmas={turmas}
            requesterId={profile.id}
            onClose={() => { setModalAberto(false); setEventoEditando(null); }}
            onSaved={carregarEventos}
          />
          <GradeRapidaModal
            open={gradeOpen}
            requesterId={profile.id}
            onClose={() => setGradeOpen(false)}
            onSaved={carregarEventos}
          />
        </>
      )}
    </div>
  );
}
