import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { contarAulasNoPeriodo, criarAulaRecorrente } from '@/services/calendario.service';
import { getAllDisciplinas, type Disciplina } from '@/services/academico.service';
import { getProfessores, type Professor } from '@/services/professor.service';
import { getTurmasAtivas, type Turma } from '@/services/turmas.service';

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

interface GradeRapidaModalProps {
  open: boolean;
  requesterId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function GradeRapidaModal({ open, requesterId, onClose, onSaved }: GradeRapidaModalProps) {
  const { toast } = useToast();

  // Drag
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  useEffect(() => {
    if (!open) setPos({ x: 0, y: 0 });
  }, [open]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ x: dragStart.current.px + e.clientX - dragStart.current.mx,
               y: dragStart.current.py + e.clientY - dragStart.current.my });
    };
    const up = () => { dragging.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    e.preventDefault();
  };

  // Listas
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [professores, setProfessores]   = useState<Professor[]>([]);
  const [turmas, setTurmas]             = useState<Turma[]>([]);

  // Campos do formulário
  const [disciplinaId, setDisciplinaId]   = useState('');
  const [professorId,  setProfessorId]    = useState('');
  const [turmaId,      setTurmaId]        = useState('');
  const [diaSemana,    setDiaSemana]      = useState<number | null>(null);
  const [horarioInicio, setHorarioInicio] = useState('18:45');
  const [horarioFim,    setHorarioFim]    = useState('22:00');
  const [dataInicio,    setDataInicio]    = useState('');
  const [dataFim,       setDataFim]       = useState('');
  const [sala,          setSala]          = useState('Sala Principal');

  // Preview + submit
  const [preview,   setPreview]   = useState<{ total: number; feriados: {data:string;titulo:string}[] } | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [salvando,   setSalvando]   = useState(false);

  // Carrega listas ao abrir
  useEffect(() => {
    if (!open) return;
    Promise.all([getAllDisciplinas(), getProfessores(1, 100, '', true), getTurmasAtivas()])
      .then(([discs, profs, ts]) => {
        setDisciplinas(discs);
        setProfessores(profs.data);
        setTurmas(ts);
      });
    // Reset
    setDisciplinaId(''); setProfessorId(''); setTurmaId('');
    setDiaSemana(null); setHorarioInicio('18:45'); setHorarioFim('22:00');
    setDataInicio(''); setDataFim(''); setSala('Sala Principal');
    setPreview(null);
  }, [open]);

  // Calcular preview quando os campos obrigatórios estão preenchidos
  useEffect(() => {
    if (diaSemana === null || !dataInicio || !dataFim) { setPreview(null); return; }
    if (dataInicio > dataFim) { setPreview(null); return; }

    let active = true;
    setCalculando(true);
    contarAulasNoPeriodo(diaSemana, dataInicio, dataFim).then(r => {
      if (active) { setPreview(r); setCalculando(false); }
    });
    return () => { active = false; };
  }, [diaSemana, dataInicio, dataFim]);

  const handleSalvar = async () => {
    if (!disciplinaId || !turmaId || diaSemana === null || !dataInicio || !dataFim) {
      toast({ title: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    const { error } = await criarAulaRecorrente({
      disciplina_id:  disciplinaId,
      turma_id:       turmaId,
      professor_id:   professorId || null,
      dia_semana:     diaSemana,
      horario_inicio: `${horarioInicio}:00`,
      horario_fim:    `${horarioFim}:00`,
      data_inicio:    dataInicio,
      data_fim:       dataFim,
      sala:           sala || null,
    }, requesterId);
    setSalvando(false);
    if (error) { toast({ title: 'Erro ao cadastrar aula', description: error, variant: 'destructive' }); return; }

    const discNome = disciplinas.find(d => d.id === disciplinaId)?.nome ?? 'disciplina';
    toast({ title: `Grade cadastrada! ${preview?.total ?? ''} aulas de ${discNome} adicionadas.` });
    onSaved();
    onClose();
  };

  const sel = 'text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary w-full';

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
      >
        <DialogHeader
          onMouseDown={handleDragStart}
          className="cursor-grab active:cursor-grabbing select-none"
        >
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Assistente de Grade Rápida
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Disciplina + Professor + Turma */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block">Disciplina *</label>
            <select value={disciplinaId} onChange={e => setDisciplinaId(e.target.value)} className={sel}>
              <option value="">Selecione a disciplina</option>
              {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Professor</label>
              <select value={professorId} onChange={e => setProfessorId(e.target.value)} className={sel}>
                <option value="">Sem professor</option>
                {professores.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Turma *</label>
              <select value={turmaId} onChange={e => setTurmaId(e.target.value)} className={sel}>
                <option value="">Selecione</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          </div>

          {/* Dia da semana */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Dia da semana *</label>
            <div className="flex gap-1 flex-wrap">
              {[1,2,3,4,5,6,0].map(d => (
                <button key={d} type="button"
                  onClick={() => setDiaSemana(d === diaSemana ? null : d)}
                  className={[
                    'flex-1 min-w-[40px] py-2 text-sm font-semibold rounded-lg border transition-colors',
                    diaSemana === d
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted border-border',
                  ].join(' ')}>
                  {DIAS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Início *</label>
              <input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} className={sel} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Fim *</label>
              <input type="time" value={horarioFim} onChange={e => setHorarioFim(e.target.value)} className={sel} />
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Data início *</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className={sel} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Data fim *</label>
              <input type="date" value={dataFim}
                min={dataInicio}
                onChange={e => setDataFim(e.target.value)} className={sel} />
            </div>
          </div>

          {/* Sala */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Sala (opcional)</label>
            <input value={sala} onChange={e => setSala(e.target.value)}
              placeholder="Sala Principal"
              className={sel} />
          </div>

          {/* Preview */}
          {(calculando || preview) && (
            <div className={`rounded-lg border p-3 text-sm ${
              preview && preview.total > 0 ? 'bg-green-500/5 border-green-500/30' : 'bg-muted'
            }`}>
              {calculando ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Calculando aulas…
                </div>
              ) : preview && preview.total === 0 ? (
                <p className="text-muted-foreground">Nenhuma aula gerada no período — verifique as datas.</p>
              ) : preview ? (
                <>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    Esta configuração gerará <strong>{preview.total} aula{preview.total !== 1 ? 's' : ''}</strong>
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    De {new Date(dataInicio+'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(dataFim+'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                  {preview.feriados.length > 0 && (
                    <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                      <p className="font-medium">⚠️ {preview.feriados.length} feriado{preview.feriados.length !== 1 ? 's' : ''} sem aula:</p>
                      {preview.feriados.map(f => (
                        <p key={f.data} className="ml-2">
                          {new Date(f.data+'T12:00:00').toLocaleDateString('pt-BR')} — {f.titulo}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={salvando}>Cancelar</Button>
          <Button size="sm" onClick={handleSalvar}
            disabled={salvando || !disciplinaId || !turmaId || diaSemana === null || !dataInicio || !dataFim || (preview?.total ?? 0) === 0}>
            {salvando ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cadastrando…</> : `Cadastrar ${preview?.total ?? ''} aulas`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
