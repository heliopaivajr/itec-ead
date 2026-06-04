import { useState } from 'react';
import { Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { EventoCalendario } from '@/services/calendario.service';
import type { Turma } from '@/services/turmas.service';

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

interface ImpressaoModalProps {
  open: boolean;
  eventos: EventoCalendario[];
  turmas: Turma[];
  turmaIdAtual: string;
  mesAtual: number;
  anoAtual: number;
  onClose: () => void;
}

export function ImpressaoModal({
  open, eventos, turmas, turmaIdAtual, mesAtual, anoAtual, onClose,
}: ImpressaoModalProps) {
  const [turmaFiltro,  setTurmaFiltro]  = useState(turmaIdAtual);
  const [dataInicio,   setDataInicio]   = useState('');
  const [dataFim,      setDataFim]      = useState('');
  const [formato,      setFormato]      = useState<'lista' | 'grade'>('lista');

  const handleImprimir = () => {
    // Filtrar eventos com base nas opções escolhidas
    let evsFiltrados = [...eventos];

    if (turmaFiltro) {
      evsFiltrados = evsFiltrados.filter(e =>
        !e.turma_id || e.turma_id === turmaFiltro
      );
    }
    if (dataInicio) evsFiltrados = evsFiltrados.filter(e => e.data >= dataInicio);
    if (dataFim)    evsFiltrados = evsFiltrados.filter(e => e.data <= dataFim);

    evsFiltrados.sort((a, b) => a.data.localeCompare(b.data));

    const turmaNome = turmas.find(t => t.id === turmaFiltro)?.nome ?? 'Todas as turmas';
    const periodo   = dataInicio && dataFim
      ? `${new Date(dataInicio+'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(dataFim+'T12:00:00').toLocaleDateString('pt-BR')}`
      : `${MESES_PT[mesAtual-1]} ${anoAtual}`;

    const w = window.open('', '_blank');
    if (!w) return;

    const conteudo = formato === 'lista'
      ? `<table>
          <thead><tr><th>Data</th><th>Evento</th><th>Horário</th><th>Tipo</th></tr></thead>
          <tbody>${evsFiltrados.map(e => {
            const hora = (!e.dia_inteiro && e.horario_inicio)
              ? `${e.horario_inicio.slice(0,5)}–${(e.horario_fim??'').slice(0,5)}` : 'Dia inteiro';
            return `<tr>
              <td>${new Date(e.data+'T12:00:00').toLocaleDateString('pt-BR')}</td>
              <td>${e.titulo}</td><td>${hora}</td><td>${e.tipo.replace(/_/g,' ')}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>`
      : `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;font-size:10px">
          ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => `<div style="background:#f5f5f5;text-align:center;padding:4px;font-weight:600">${d}</div>`).join('')}
          ${(() => {
            const primeiroMes = dataInicio
              ? new Date(dataInicio+'T12:00:00')
              : new Date(anoAtual, mesAtual-1, 1);
            const leading = primeiroMes.getDay();
            const ultimo  = new Date(primeiroMes.getFullYear(), primeiroMes.getMonth()+1, 0).getDate();
            const cells = [];
            for (let i = 0; i < leading; i++) cells.push('<div></div>');
            for (let d = 1; d <= ultimo; d++) {
              const dateStr = `${primeiroMes.getFullYear()}-${String(primeiroMes.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const dayEvs  = evsFiltrados.filter(e => e.data === dateStr);
              cells.push(`<div style="border:1px solid #ddd;min-height:60px;padding:2px">
                <div style="font-weight:600;font-size:10px">${d}</div>
                ${dayEvs.map(ev => `<div style="background:${ev.cor};color:white;border-radius:2px;padding:1px 3px;margin:1px 0;white-space:nowrap;overflow:hidden;font-size:9px">${ev.titulo}</div>`).join('')}
              </div>`);
            }
            return cells.join('');
          })()}
        </div>`;

    w.document.write(`<!DOCTYPE html><html><head>
      <title>Calendário ITEC — ${periodo}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px}
      h1{font-size:14px;margin-bottom:2px}p{color:#666;margin-bottom:12px;font-size:11px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
      th{background:#f5f5f5;font-weight:600}@media print{body{padding:0}}</style>
    </head><body>
      <h1>ITEC — Instituto de Teologia Cristã</h1>
      <p>${periodo} · ${turmaNome} · ${evsFiltrados.length} evento${evsFiltrados.length !== 1 ? 's' : ''}</p>
      ${conteudo}
    </body></html>`);
    w.document.close();
    w.print();
    onClose();
  };

  const inputCls = 'text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary w-full';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1 block';

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-4 w-4" /> Opções de Impressão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className={labelCls}>Turma</label>
            <select value={turmaFiltro} onChange={e => setTurmaFiltro(e.target.value)} className={inputCls}>
              <option value="">Todas as turmas</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>De</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Até</label>
              <input type="date" value={dataFim} min={dataInicio} onChange={e => setDataFim(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Formato</label>
            <div className="space-y-1.5">
              {[
                { value: 'lista', label: 'Lista de eventos (tabela simples)' },
                { value: 'grade', label: 'Grade mensal (calendário visual)' },
              ].map(f => (
                <label key={f.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="formato"
                    value={f.value}
                    checked={formato === f.value}
                    onChange={() => setFormato(f.value as 'lista' | 'grade')}
                    className="h-3.5 w-3.5"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={handleImprimir}>
            <Printer className="h-4 w-4 mr-1.5" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
