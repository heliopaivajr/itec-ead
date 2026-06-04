import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Printer } from 'lucide-react';
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

const MESES_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// ─── Helpers de data ─────────────────────────────────────────────────────────

function toDateStrLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface CalendarioDia { data: Date; dataStr: string; mesAtual: boolean; isHoje: boolean }

function gerarGrade(ano: number, mes: number): CalendarioDia[] {
  const hojeStr = toDateStrLocal(new Date());
  const primeira = new Date(ano, mes - 1, 1);
  const ultima   = new Date(ano, mes, 0);
  const dias: CalendarioDia[] = [];

  // Dias do mês anterior para completar a primeira linha
  const leading = primeira.getDay(); // 0=Dom
  for (let i = leading - 1; i >= 0; i--) {
    const d = new Date(ano, mes - 1, -i);
    dias.push({ data: d, dataStr: toDateStrLocal(d), mesAtual: false, isHoje: toDateStrLocal(d) === hojeStr });
  }

  // Dias do mês atual
  for (let day = 1; day <= ultima.getDate(); day++) {
    const d = new Date(ano, mes - 1, day);
    dias.push({ data: d, dataStr: toDateStrLocal(d), mesAtual: true, isHoje: toDateStrLocal(d) === hojeStr });
  }

  // Dias do mês seguinte para completar 42 células (6 linhas × 7)
  let next = 1;
  while (dias.length < 42) {
    const d = new Date(ano, mes, next++);
    dias.push({ data: d, dataStr: toDateStrLocal(d), mesAtual: false, isHoje: toDateStrLocal(d) === hojeStr });
  }

  return dias;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CalendarioAcademico() {
  const { profile } = useOutletContext<DashboardContext>();

  const hoje = new Date();
  const [ano,     setAno]     = useState(hoje.getFullYear());
  const [mes,     setMes]     = useState(hoje.getMonth() + 1);
  const [turmaId, setTurmaId] = useState<string>('');
  const [turmas,  setTurmas]  = useState<Turma[]>([]);
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [calError, setCalError] = useState<string | null>(null);
  const [eventoEditando, setEventoEditando] = useState<EventoCalendario | null>(null);
  const [modalAberto,    setModalAberto]    = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<string>('');
  const [professorId, setProfessorId] = useState<string | null>(null);

  const podeEditar = ['superadmin', 'admin', 'administracao'].includes(profile.role);
  const isProfessor = profile.role === 'professor';

  // Carregamentos iniciais
  useEffect(() => {
    getTurmasAtivas().then(setTurmas);
    if (isProfessor) {
      getProfessorByUserId(profile.id).then(p => setProfessorId(p?.id ?? null));
    }
  }, [isProfessor, profile.id]);

  // Carregar eventos do mês
  useEffect(() => { carregarEventos(); }, [ano, mes, turmaId, professorId]);

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

      const inicio = new Date(ano, mes - 1, 1, 12, 0, 0);
      const fim    = new Date(ano, mes - 1, new Date(ano, mes, 0).getDate(), 12, 0, 0);
      const aulasExpandidas = expandirAulasParaPeriodo(aulas, inicio, fim);

      setEventos([...aulasExpandidas, ...eventosBanco]);
    } catch {
      setCalError('Erro ao carregar calendário. Tente recarregar a página.');
    } finally {
      setLoading(false);
    }
  };

  // Grade mensal e agrupamento de eventos por data
  const grade = useMemo(() => gerarGrade(ano, mes), [ano, mes]);

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, EventoCalendario[]>();
    for (const ev of eventos) {
      const arr = map.get(ev.data) ?? [];
      arr.push(ev);
      map.set(ev.data, arr);
    }
    return map;
  }, [eventos]);

  // Navegação
  const mesAnterior = () => {
    if (mes === 1) { setMes(12); setAno(a => a - 1); }
    else setMes(m => m - 1);
  };
  const proximoMes = () => {
    if (mes === 12) { setMes(1); setAno(a => a + 1); }
    else setMes(m => m + 1);
  };

  // Impressão
  const handlePrint = () => {
    const turmaNome = turmas.find(t => t.id === turmaId)?.nome ?? 'Todas as turmas';
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = eventos
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(e => {
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

  const abrirEvento = (ev: EventoCalendario) => {
    if (!podeEditar || ev.tipo === 'aula_recorrente') return;
    setEventoEditando(ev);
    setDataSelecionada('');
    setModalAberto(true);
  };

  const abrirCriar = (dataStr?: string) => {
    if (!podeEditar) return;
    setEventoEditando(null);
    setDataSelecionada(dataStr ?? '');
    setModalAberto(true);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

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
            <Button size="sm" onClick={() => abrirCriar()}>
              <Plus className="h-4 w-4 mr-1.5" /> Novo Evento
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-card border rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={mesAnterior}
            className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-muted transition-colors"
            aria-label="Mês anterior"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold min-w-36 text-center">
            {MESES_PT[mes-1]} {ano}
          </span>
          <button onClick={proximoMes}
            className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-muted transition-colors"
            aria-label="Próximo mês"><ChevronRight className="h-4 w-4" /></button>
        </div>
        {!isProfessor && (
          <select value={turmaId} onChange={e => setTurmaId(e.target.value)}
            className="text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filtrar por turma">
            <option value="">Todas as turmas</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        )}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {[
          { cor: '#22C55E', label: 'Aulas' },
          { cor: '#EF4444', label: 'Feriados' },
          { cor: '#3B82F6', label: 'Eventos ITEC' },
          { cor: '#8B5CF6', label: 'Avaliações' },
          { cor: '#F59E0B', label: 'Recesso' },
          { cor: '#EC4899', label: 'Formatura' },
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
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-7 gap-1">
              {DIAS_SEMANA.map(d => <Skeleton key={d} className="h-8" />)}
            </div>
            {[1,2,3,4,5,6].map(r => (
              <div key={r} className="grid grid-cols-7 gap-1">
                {[1,2,3,4,5,6,7].map(c => <Skeleton key={c} className="h-20" />)}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-border">
            {/* Header dias da semana */}
            {DIAS_SEMANA.map(d => (
              <div key={d} className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {d}
              </div>
            ))}

            {/* Células dos dias */}
            {grade.map((dia, i) => {
              const evsDia = eventosPorDia.get(dia.dataStr) ?? [];
              const visivel = evsDia.slice(0, 3);
              const extra = evsDia.length - visivel.length;
              return (
                <div key={i}
                  onClick={() => { if (podeEditar && dia.mesAtual) abrirCriar(dia.dataStr); }}
                  className={[
                    'bg-card min-h-[90px] p-1 flex flex-col gap-0.5 transition-colors',
                    dia.mesAtual ? 'cursor-pointer hover:bg-muted/30' : 'opacity-40',
                    dia.isHoje ? 'ring-2 ring-inset ring-primary' : '',
                  ].filter(Boolean).join(' ')}>
                  <span className={[
                    'text-xs font-medium self-end px-1 rounded-full',
                    dia.isHoje ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                  ].join(' ')}>
                    {dia.data.getDate()}
                  </span>
                  {visivel.map(ev => (
                    <div key={ev.id}
                      onClick={e => { e.stopPropagation(); abrirEvento(ev); }}
                      title={ev.titulo}
                      className={[
                        'text-xs rounded px-1 py-0.5 truncate text-white leading-tight',
                        ev.tipo !== 'aula_recorrente' && podeEditar ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
                      ].join(' ')}
                      style={{ backgroundColor: ev.cor || COR_POR_TIPO[ev.tipo] || '#3B82F6' }}>
                      {!ev.dia_inteiro && ev.horario_inicio
                        ? `${ev.horario_inicio.slice(0,5)} ${ev.titulo}`
                        : ev.titulo}
                    </div>
                  ))}
                  {extra > 0 && (
                    <span className="text-xs text-muted-foreground px-1">+{extra} mais</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
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
