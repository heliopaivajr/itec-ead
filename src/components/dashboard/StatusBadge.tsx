import React from 'react';
import { STATUS_MATRICULA } from '@/constants/statusMatricula';

type Status = 'ativo' | 'pendente' | 'trancado' | 'concluido' | 'reprovado' | string;

// Vocabulário legado (masculino) — status de professor/disciplina, etc.
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
  // Prioriza o vocabulário FEMININO de matrícula (R3.2 Leva 2a); cai no legado.
  const matricula = STATUS_MATRICULA[status as keyof typeof STATUS_MATRICULA];
  const cls = matricula?.cor ?? config[status] ?? 'bg-muted text-muted-foreground border-border';
  const texto = customLabel ?? matricula?.label ?? label[status] ?? status;
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {texto}
    </span>
  );
}
