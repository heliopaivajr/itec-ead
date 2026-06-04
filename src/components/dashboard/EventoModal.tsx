import React, { useEffect, useState } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  criarEvento,
  atualizarEvento,
  excluirEvento,
  type EventoCalendario,
  type EventoCalendarioPayload,
  type TipoEventoPayload,
} from '@/services/calendario.service';
import type { Turma } from '@/services/turmas.service';

// ─── Tipos de evento disponíveis para criar (sem 'aula_recorrente') ───────────

const TIPOS_OPCOES: { value: TipoEventoPayload; label: string }[] = [
  { value: 'feriado_nacional',      label: 'Feriado Nacional' },
  { value: 'feriado_estadual',      label: 'Feriado Estadual' },
  { value: 'feriado_institucional', label: 'Feriado Institucional' },
  { value: 'evento_itec',           label: 'Evento ITEC' },
  { value: 'reposicao',             label: 'Aula de Reposição' },
  { value: 'recesso',               label: 'Recesso' },
  { value: 'cancelamento_aula',     label: 'Cancelamento de Aula' },
  { value: 'avaliacao',             label: 'Avaliação / Prova' },
  { value: 'formatura',             label: 'Formatura' },
];

const CORES_OPCOES = [
  { value: '#3B82F6', label: 'Azul (Evento ITEC)' },
  { value: '#EF4444', label: 'Vermelho (Feriado)' },
  { value: '#22C55E', label: 'Verde (Reposição)' },
  { value: '#8B5CF6', label: 'Roxo (Avaliação)' },
  { value: '#F59E0B', label: 'Âmbar (Recesso)' },
  { value: '#EC4899', label: 'Rosa (Formatura)' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface EventoModalProps {
  open: boolean;
  evento: EventoCalendario | null; // null = criar; preenchido = editar
  dataInicial?: string;            // pré-preenche a data ao criar
  turmas: Turma[];
  requesterId: string;
  onClose: () => void;
  onSaved: () => void;            // recarrega o calendário
}

// ─── Google Calendar link ─────────────────────────────────────────────────────

function googleCalendarLink(evento: EventoCalendario): string {
  const formatDate = (dateStr: string, timeStr?: string | null) => {
    const d = dateStr.replace(/-/g, '');
    if (!timeStr) return d;
    return d + 'T' + timeStr.replace(/:/g, '').slice(0, 6);
  };

  // Google Calendar usa range exclusivo para dia inteiro → end = data + 1 dia
  let endData = evento.data;
  if (evento.dia_inteiro) {
    const d = new Date(evento.data + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    endData = d.getFullYear() + '-'
      + String(d.getMonth() + 1).padStart(2, '0') + '-'
      + String(d.getDate()).padStart(2, '0');
  }

  const start = formatDate(evento.data, evento.dia_inteiro ? null : evento.horario_inicio);
  const end   = formatDate(endData,     evento.dia_inteiro ? null : evento.horario_fim);

  return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text='     + encodeURIComponent(evento.titulo)
    + '&dates='    + start + '/' + end
    + '&details='  + encodeURIComponent(evento.descricao ?? '')
    + '&location=' + encodeURIComponent('ITEC Janga, Paulista/PE');
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function EventoModal({
  open, evento, dataInicial, turmas, requesterId, onClose, onSaved,
}: EventoModalProps) {
  const { toast } = useToast();
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmExcluir, setConfirmExcluir] = useState(false);

  // Campos do formulário
  const [titulo,       setTitulo]       = useState('');
  const [data,         setData]         = useState('');
  const [tipo,         setTipo]         = useState<TipoEventoPayload>('evento_itec');
  const [descricao,    setDescricao]    = useState('');
  const [turmaId,      setTurmaId]      = useState('');
  const [diaInteiro,   setDiaInteiro]   = useState(true);
  const [horaInicio,   setHoraInicio]   = useState('');
  const [horaFim,      setHoraFim]      = useState('');
  const [cor,          setCor]          = useState('#3B82F6');
  const [cancelarAula, setCancelarAula] = useState(false);

  // Pré-preenche ao abrir
  useEffect(() => {
    if (evento) {
      setTitulo(evento.titulo);
      setData(evento.data);
      const tipoSeguro: TipoEventoPayload =
        evento.tipo !== 'aula_recorrente'
          ? (evento.tipo as TipoEventoPayload)
          : 'evento_itec';
      setTipo(tipoSeguro);
      setDescricao(evento.descricao ?? '');
      setTurmaId(evento.turma_id ?? '');
      setDiaInteiro(evento.dia_inteiro);
      setHoraInicio(evento.horario_inicio?.slice(0, 5) ?? '');
      setHoraFim(evento.horario_fim?.slice(0, 5) ?? '');
      setCor(evento.cor ?? '#3B82F6');
      setCancelarAula(evento.cancelar_aula);
    } else {
      setTitulo('');
      setData(dataInicial ?? '');
      setTipo('evento_itec');
      setDescricao('');
      setTurmaId('');
      setDiaInteiro(true);
      setHoraInicio('');
      setHoraFim('');
      setCor('#3B82F6');
      setCancelarAula(false);
    }
    setConfirmExcluir(false);
  }, [evento, dataInicial, open]);

  const handleSalvar = async () => {
    if (!titulo.trim() || !data) {
      toast({ title: 'Título e data são obrigatórios.', variant: 'destructive' });
      return;
    }
    if (!diaInteiro && (!horaInicio || !horaFim)) {
      toast({ title: 'Informe o horário de início e fim.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload: EventoCalendarioPayload = {
      titulo: titulo.trim(),
      data,
      tipo,
      descricao: descricao.trim() || null,
      turma_id: turmaId || null,
      dia_inteiro: diaInteiro,
      horario_inicio: diaInteiro ? null : `${horaInicio}:00`,
      horario_fim:    diaInteiro ? null : `${horaFim}:00`,
      cor,
      cancelar_aula: cancelarAula,
    };

    const result = evento
      ? await atualizarEvento(evento.id, payload, requesterId)
      : await criarEvento(payload, requesterId);

    setSaving(false);

    if (result.error) {
      toast({ title: 'Erro ao salvar evento', description: result.error, variant: 'destructive' });
      return;
    }

    toast({ title: evento ? 'Evento atualizado.' : 'Evento criado.' });
    onSaved();
    onClose();
  };

  const handleExcluir = async () => {
    if (!evento) return;
    setDeleting(true);
    const { error } = await excluirEvento(evento.id, requesterId);
    setDeleting(false);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Evento excluído.' });
    onSaved();
    onClose();
  };

  const inputCls = 'w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1 block';

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{evento ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Título */}
          <div>
            <label className={labelCls}>Título *</label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Avaliação de NT I"
              className={inputCls}
              autoFocus
            />
          </div>

          {/* Data + Tipo (2 colunas) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Data *</label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tipo *</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoEventoPayload)} className={inputCls}>
                {TIPOS_OPCOES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Turma */}
          <div>
            <label className={labelCls}>Turma (deixe vazio para afetar todo o ITEC)</label>
            <select value={turmaId} onChange={e => setTurmaId(e.target.value)} className={inputCls}>
              <option value="">Todo o ITEC</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          {/* Dia inteiro toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input
              type="checkbox"
              checked={diaInteiro}
              onChange={e => setDiaInteiro(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Dia inteiro
          </label>

          {/* Horários (visíveis se !diaInteiro) */}
          {!diaInteiro && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Início *</label>
                <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fim *</label>
                <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className={inputCls} />
              </div>
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className={labelCls}>Descrição (opcional)</label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Informações adicionais…"
            />
          </div>

          {/* Cor */}
          <div>
            <label className={labelCls}>Cor</label>
            <div className="flex gap-2 flex-wrap">
              {CORES_OPCOES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setCor(c.value)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${cor === c.value ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ background: c.value }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          {/* Cancelar aula */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input
              type="checkbox"
              checked={cancelarAula}
              onChange={e => setCancelarAula(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Cancelar aula recorrente deste dia
          </label>

          {/* Botão Google Calendar (só ao editar evento existente) */}
          {evento && (
            <a
              href={googleCalendarLink(evento)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Adicionar ao Google Calendar
            </a>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {/* Excluir (só ao editar) */}
          {evento && !confirmExcluir && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 mr-auto"
              onClick={() => setConfirmExcluir(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Excluir
            </Button>
          )}
          {evento && confirmExcluir && (
            <Button
              variant="destructive"
              size="sm"
              className="mr-auto"
              disabled={deleting}
              onClick={handleExcluir}
            >
              {deleting ? 'Excluindo…' : 'Confirmar exclusão'}
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSalvar} disabled={saving}>
              {saving ? 'Salvando…' : evento ? 'Salvar alterações' : 'Criar evento'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
