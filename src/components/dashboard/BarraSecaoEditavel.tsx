import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Barra de ação no RODAPÉ DA SEÇÃO (SPEC-16 · RN6 · diretriz 8.10).
// Só aparece quando há alteração pendente — a ficha fica limpa em repouso.

interface BarraSecaoEditavelProps {
  qtd: number;
  salvando: boolean;
  onSalvar: () => void;
  onCancelar: () => void;
}

export function BarraSecaoEditavel({ qtd, salvando, onSalvar, onCancelar }: BarraSecaoEditavelProps) {
  if (qtd === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
      <span className="text-xs text-primary font-medium">
        ● {qtd} {qtd === 1 ? 'alteração pendente' : 'alterações pendentes'}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onCancelar} disabled={salvando} className="border-border">
          Cancelar
        </Button>
        <Button size="sm" onClick={onSalvar} disabled={salvando}>
          {salvando
            ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Salvando…</>
            : <><Save className="h-4 w-4 mr-1.5" /> Salvar</>}
        </Button>
      </div>
    </div>
  );
}

export default BarraSecaoEditavel;
