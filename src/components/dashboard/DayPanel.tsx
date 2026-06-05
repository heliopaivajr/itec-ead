import { useEffect, useRef, useState } from 'react';
import { X, Plus, Pencil, Trash2, BookOpen, Clock, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import type { EventoCalendario, TipoEvento } from '@/services/calendario.service';

// ─── Configuração visual por tipo ─────────────────────────────────────────────

const TIPO_CFG: Record<TipoEvento, { cor: string; label: string }> = {
  feriado_nacional:      { cor: '#EF4444', label: 'Feriado Nacional' },
  feriado_estadual:      { cor: '#EF4444', label: 'Feriado Estadual' },
  feriado_institucional: { cor: '#F59E0B', label: 'Feriado Institucional' },
  evento_itec:           { cor: '#3B82F6', label: 'Evento ITEC' },
  reposicao:             { cor: '#22C55E', label: 'Reposição de Aula' },
  recesso:               { cor: '#F59E0B', label: 'Recesso' },
  cancelamento_aula:     { cor: '#EF4444', label: 'Cancelamento de Aula' },
  avaliacao:             { cor: '#8B5CF6', label: 'Avaliação' },
  formatura:             { cor: '#EC4899', label: 'Formatura' },
  aula_recorrente:       { cor: '#22C55E', label: 'Aula' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(dataStr: string): string {
  const d = new Date(dataStr + 'T12:00:00');
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  const rest    = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${rest}`;
}

function formatarDataCurta(dataStr?: string | null): string {
  if (!dataStr) return '';
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

function formatarHora(h: string | null | undefined): string {
  if (!h) return '';
  return h.slice(0, 5);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DayPanelProps {
  data: string; // 'YYYY-MM-DD'
  eventos: EventoCalendario[];
  podeEditar: boolean;
  onNovoEvento: (data: string) => void;
  onEditarEvento: (evento: EventoCalendario) => void;
  onExcluirEvento: (eventoId: string) => Promise<void>;
  onEditarAulaRecorrente: (aulaRecorrenteId: string) => void;
  onExcluirAulaRecorrente: (aulaRecorrenteId: string) => Promise<void>;
  onClose: () => void;
}

// ─── Card de evento ───────────────────────────────────────────────────────────

function EventoCard({
  evento, podeEditar, onEditar, onExcluir, onEditarAula, onExcluirAula,
}: {
  evento: EventoCalendario;
  podeEditar: boolean;
  onEditar: () => void;
  onExcluir: () => void;
  onEditarAula: () => void;
  onExcluirAula: () => void;
}) {
  const cfg   = TIPO_CFG[evento.tipo];
  const isAula = evento.tipo === 'aula_recorrente';
  const corDot = evento.cor || cfg.cor;

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
      {/* Título + cor */}
      <div className="flex items-start gap-2">
        <span className="h-3 w-3 rounded-full shrink-0 mt-1" style={{ background: corDot }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!evento.dia_inteiro && evento.horario_inicio && (
              <span className="text-xs font-mono text-muted-foreground">
                {formatarHora(evento.horario_inicio)}–{formatarHora(evento.horario_fim)}
              </span>
            )}
            <span className="text-sm font-semibold truncate">{evento.titulo}</span>
          </div>
          <span className="text-xs text-muted-foreground">{cfg.label}</span>
        </div>
      </div>

      {/* Detalhes de aula recorrente */}
      {isAula && (
        <div className="text-xs text-muted-foreground space-y-0.5 pl-5">
          {evento.professor_nome && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 shrink-0" />{evento.professor_nome}
            </div>
          )}
          {evento.descricao && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />{evento.descricao}
            </div>
          )}
          {evento.horario_inicio && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" />
              {formatarHora(evento.horario_inicio)} – {formatarHora(evento.horario_fim)}
            </div>
          )}
        </div>
      )}

      {/* Descrição para eventos normais */}
      {!isAula && evento.descricao && (
        <p className="text-xs text-muted-foreground pl-5 line-clamp-2">{evento.descricao}</p>
      )}

      {/* Ações */}
      {podeEditar && (
        <div className="flex gap-1.5 pl-5 pt-0.5">
          <Button size="sm" variant="outline" className="h-6 text-xs px-2"
            onClick={isAula ? onEditarAula : onEditar}>
            {isAula ? <><BookOpen className="h-3 w-3 mr-1" />Editar</> : <><Pencil className="h-3 w-3 mr-1" />Editar</>}
          </Button>
          <Button size="sm" variant="outline"
            className="h-6 text-xs px-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={isAula ? onExcluirAula : onExcluir}>
            <Trash2 className="h-3 w-3 mr-1" /> Excluir
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── DayPanel ─────────────────────────────────────────────────────────────────

export function DayPanel({
  data, eventos, podeEditar,
  onNovoEvento, onEditarEvento, onExcluirEvento,
  onEditarAulaRecorrente, onExcluirAulaRecorrente, onClose,
}: DayPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [excluindo, setExcluindo] = useState(false);

  // Estado de confirmação unificado: eventos e aulas têm handlers diferentes
  const [confirmData, setConfirmData] = useState<{
    id: string;
    tipo: 'evento' | 'aula';
    titulo: string;
  } | null>(null);

  const [visible, setVisible] = useState(false);

  // Slide-in animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Fechar com ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleConfirmado = async () => {
    if (!confirmData) return;
    setExcluindo(true);
    if (confirmData.tipo === 'aula') {
      await onExcluirAulaRecorrente(confirmData.id);
    } else {
      await onExcluirEvento(confirmData.id);
    }
    setExcluindo(false);
    setConfirmData(null);
  };

  const eventosSorted = [...eventos].sort((a, b) => {
    if (a.dia_inteiro && !b.dia_inteiro) return -1;
    if (!a.dia_inteiro && b.dia_inteiro) return 1;
    return (a.horario_inicio ?? '').localeCompare(b.horario_inicio ?? '');
  });

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden />

      {/* Painel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-screen w-80 max-w-full bg-card border-l shadow-2xl z-50 flex flex-col"
        style={{
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1)',
        }}
        aria-label={`Eventos de ${formatarData(data)}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 py-3 border-b bg-muted/20 shrink-0">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Eventos do dia</p>
            <h2 className="text-sm font-semibold leading-snug mt-0.5">{formatarData(data)}</h2>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors shrink-0 mt-0.5"
            aria-label="Fechar painel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {eventosSorted.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDaysIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm text-muted-foreground">Nenhum evento neste dia.</p>
            </div>
          ) : (
            eventosSorted.map(ev => (
              <EventoCard
                key={ev.id}
                evento={ev}
                podeEditar={podeEditar}
                onEditar={() => onEditarEvento(ev)}
                onExcluir={() => setConfirmData({ id: ev.id, tipo: 'evento', titulo: ev.titulo })}
                onEditarAula={() => ev.aula_recorrente_id && onEditarAulaRecorrente(ev.aula_recorrente_id)}
                onExcluirAula={() => ev.aula_recorrente_id && setConfirmData({
                  id: ev.aula_recorrente_id,
                  tipo: 'aula',
                  titulo: ev.titulo,
                })}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {podeEditar && (
          <div className="shrink-0 border-t p-4">
            <Button className="w-full" size="sm" onClick={() => onNovoEvento(data)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Evento neste dia
            </Button>
          </div>
        )}
      </div>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={!!confirmData} onOpenChange={open => { if (!open) setConfirmData(null); }}>
        <DialogContent className="max-w-sm z-[60]">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-1">
            Excluir <strong className="text-foreground">{confirmData?.titulo}</strong>
            {confirmData?.tipo === 'aula' ? ' (aula recorrente)' : ''} de{' '}
            {formatarDataCurta(data)}? Esta ação não pode ser desfeita.
            {confirmData?.tipo === 'aula' && (
              <span className="block mt-1 text-yellow-500 text-xs">
                ⚠️ Isso excluirá todas as futuras ocorrências desta aula.
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmData(null)} disabled={excluindo}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmado} disabled={excluindo}>
              {excluindo ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Ícone inline para evitar dependência circular com lucide
function CalendarDaysIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}
