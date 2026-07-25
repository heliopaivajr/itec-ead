import { useEffect, useState } from 'react';
import { X, Upload, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  confirmarPagamento,
  uploadComprovante,
  type Mensalidade,
  type FormaPagamento,
} from '@/services/financeiro.service';

// Modal de confirmação de pagamento (2f/073) — compartilhado entre a tela
// Financeiro (fila de inadimplentes) e a Ficha Financeira do aluno (2g).
// Sugere base/multa pela data; forma; comprovante no bucket PRIVADO; idempotente.

interface Props {
  mensalidade: Mensalidade;
  onClose: () => void;
  onSaved: () => void;
}

const FORMAS: { v: FormaPagamento; label: string }[] = [
  { v: 'pix', label: 'PIX' }, { v: 'dinheiro', label: 'Dinheiro' },
  { v: 'boleto', label: 'Boleto' }, { v: 'transferencia', label: 'Transferência' },
];

export function ConfirmarPagamentoModal({ mensalidade, onClose, onSaved }: Props) {
  const { toast }             = useToast();
  const [dataPag, setDataPag] = useState(new Date().toISOString().split('T')[0]);
  const [forma, setForma]     = useState<FormaPagamento>('pix');
  const [file, setFile]       = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const emAtraso = dataPag > mensalidade.data_vencimento;
  const sugerido = emAtraso ? (mensalidade.valor_com_atraso ?? mensalidade.valor) : mensalidade.valor;
  const [valorPago, setValorPago] = useState(String(sugerido.toFixed(2)));
  const [tocado, setTocado] = useState(false);
  useEffect(() => { if (!tocado) setValorPago(String(sugerido.toFixed(2))); }, [sugerido, tocado]);

  const salvar = async () => {
    const v = parseFloat(valorPago.replace(',', '.'));
    if (isNaN(v) || v < 0) { toast({ title: 'Valor pago inválido', variant: 'destructive' }); return; }
    setSalvando(true);

    let comprovantePath: string | null = null;
    if (file) {
      const up = await uploadComprovante(mensalidade.aluno_id, mensalidade.id, file);
      if (up.error) {
        toast({ title: 'Erro no upload do comprovante', description: up.error, variant: 'destructive' });
        setSalvando(false);
        return;
      }
      comprovantePath = up.path;
    }

    const { error } = await confirmarPagamento({
      mensalidadeId: mensalidade.id, valorPago: v, forma, comprovantePath, dataPagamento: dataPag,
    });
    setSalvando(false);
    if (error) {
      toast({ title: 'Erro ao confirmar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Pagamento confirmado!', description: `R$ ${v.toFixed(2)} · ${forma.toUpperCase()}` });
      onSaved();
    }
  };

  const mesLabel = new Date(mensalidade.mes_referencia + 'T12:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-merriweather font-bold text-foreground">Confirmar Pagamento</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="text-sm space-y-1.5 bg-muted/20 rounded-lg p-3">
          <p><span className="text-muted-foreground">Referência:</span> <span className="font-medium text-foreground capitalize">{mesLabel}</span></p>
          <p><span className="text-muted-foreground">Cobrado:</span> <span className="font-medium text-foreground">R$ {mensalidade.valor.toFixed(2)}</span>
            {mensalidade.valor_com_atraso != null && <span className="text-muted-foreground"> · com atraso R$ {mensalidade.valor_com_atraso.toFixed(2)}</span>}</p>
          <p><span className="text-muted-foreground">Vencimento:</span> <span className="text-foreground">{new Date(mensalidade.data_vencimento + 'T12:00').toLocaleDateString('pt-BR')}</span></p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-foreground">Data do pagamento</Label>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input type="date" value={dataPag} onChange={e => setDataPag(e.target.value)}
                  className="bg-background border-border text-foreground" />
              </div>
            </div>
            <div>
              <Label className="text-sm text-foreground">Valor pago (R$)</Label>
              <Input inputMode="decimal" value={valorPago}
                onChange={e => { setValorPago(e.target.value); setTocado(true); }}
                className="mt-1.5 bg-background border-border text-foreground text-right tabular-nums" />
            </div>
          </div>

          {emAtraso && (
            <p className="text-[11px] text-amber-500">Pago após o vencimento — sugerido o valor com atraso. Ajuste se houve acordo.</p>
          )}

          <div>
            <Label className="text-sm text-foreground">Forma</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {FORMAS.map(f => (
                <button key={f.v} type="button" onClick={() => setForma(f.v)}
                  className={`text-xs py-1.5 rounded-md border transition-colors ${forma === f.v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-foreground">Comprovante (opcional)</Label>
            <label className="flex items-center gap-2 mt-1.5 cursor-pointer border border-dashed border-border rounded-lg px-3 py-2 hover:border-primary/40 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">{file ? file.name : 'Selecionar arquivo...'}</span>
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 border-border text-foreground">Cancelar</Button>
          <Button onClick={salvar} disabled={salvando} className="flex-1 bg-primary text-primary-foreground">
            {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar Pagamento
          </Button>
        </div>
      </div>
    </div>
  );
}
