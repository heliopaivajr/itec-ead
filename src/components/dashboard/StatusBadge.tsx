import React from 'react';

type Status = 'ativo' | 'pendente' | 'trancado' | 'concluido' | 'reprovado' | string;

const config: Record<string, string> = {
  ativo:     'bg-green-500/15 text-green-500 border-green-500/25',
  pendente:  'bg-yellow-500/15 text-yellow-500 border-yellow-500/25',
  trancado:  'bg-orange-500/15 text-orange-500 border-orange-500/25',
  concluido: 'bg-blue-500/15 text-blue-500 border-blue-500/25',
  reprovado: 'bg-red-500/15 text-red-500 border-red-500/25',
};

const label: Record<string, string> = {
  ativo: 'Ativo', pendente: 'Pendente', trancado: 'Trancado',
  concluido: 'Concluído', reprovado: 'Reprovado',
};

interface StatusBadgeProps {
  status: Status;
  customLabel?: string;
}

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const cls = config[status] ?? 'bg-muted text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {customLabel ?? label[status] ?? status}
    </span>
  );
}
