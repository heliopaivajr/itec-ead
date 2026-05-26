import { AlertTriangle, XCircle } from 'lucide-react';

interface AlertaFrequenciaProps {
  percentual: number;
  disciplinaNome: string;
}

export function AlertaFrequencia({ percentual, disciplinaNome }: AlertaFrequenciaProps) {
  if (percentual >= 75) return null;

  if (percentual >= 60) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 mt-2">
        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-yellow-500">Atenção: {percentual}% de frequência</p>
          <p className="text-xs text-muted-foreground">Limite mínimo: 75% — risco de reprovação</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 mt-2">
      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-red-500">URGENTE: {percentual}% de frequência</p>
        <p className="text-xs text-muted-foreground">
          {disciplinaNome} — abaixo do mínimo. Entre em contato com a secretaria.
        </p>
      </div>
    </div>
  );
}
