import type { StatusMatricula } from '@/services/matriculas.service';
import type { StatusOption } from '@/components/dashboard/InlineStatusSelect';

// Vocabulário ÚNICO dos status de matrícula (FEMININO — CHECK migração 051).
// Fonte compartilhada por Matriculas.tsx, Alunos.tsx, FichaAluno e StatusBadge,
// para evitar rótulos/cores divergentes (o StatusBadge legado usava chaves
// masculinas — ver R3.2 Leva 2a).

export interface StatusMatriculaMeta {
  label: string;
  cor: string; // classes Tailwind (badge escuro, padrão do dashboard)
}

export const STATUS_MATRICULA: Record<StatusMatricula, StatusMatriculaMeta> = {
  pendente:              { label: 'Pendente',              cor: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/25' },
  pre_matricula:         { label: 'Pré-matrícula',         cor: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
  aguardando_documentos: { label: 'Aguardando documentos', cor: 'bg-amber-500/15 text-amber-500 border-amber-500/25' },
  aguardando_pagamento:  { label: 'Aguardando pagamento',  cor: 'bg-orange-500/15 text-orange-500 border-orange-500/25' },
  aguardando_aprovacao:  { label: 'Aguardando aprovação',  cor: 'bg-blue-500/15 text-blue-500 border-blue-500/25' },
  ativa:                 { label: 'Ativa',                 cor: 'bg-green-500/15 text-green-500 border-green-500/25' },
  trancada:              { label: 'Trancada',              cor: 'bg-orange-600/15 text-orange-400 border-orange-600/25' },
  concluida:             { label: 'Concluída',             cor: 'bg-blue-600/15 text-blue-400 border-blue-600/25' },
  inativa:               { label: 'Inativa',               cor: 'bg-gray-500/15 text-gray-400 border-gray-500/25' },
  evadida:               { label: 'Evadida',               cor: 'bg-red-500/15 text-red-400 border-red-500/25' },
  suspensa:              { label: 'Suspensa',              cor: 'bg-red-600/15 text-red-400 border-red-600/25' },
  cancelada:             { label: 'Cancelada',             cor: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25' },
};

// Ordem canônica do funil (para abas e selects).
export const STATUS_MATRICULA_ORDEM: StatusMatricula[] = [
  'pendente', 'pre_matricula', 'aguardando_documentos', 'aguardando_pagamento',
  'aguardando_aprovacao', 'ativa', 'trancada', 'concluida',
  'inativa', 'evadida', 'suspensa', 'cancelada',
];

export function statusMatriculaLabel(status: string): string {
  return STATUS_MATRICULA[status as StatusMatricula]?.label ?? status;
}

// Opções para o InlineStatusSelect (reusa label + cor do mapa único).
export function statusMatriculaOptions(values: StatusMatricula[] = STATUS_MATRICULA_ORDEM): StatusOption[] {
  return values.map(v => ({ value: v, label: STATUS_MATRICULA[v].label, color: STATUS_MATRICULA[v].cor }));
}
