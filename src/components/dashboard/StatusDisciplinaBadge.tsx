import type { StatusDisciplina } from '@/services/matricula-academica.service';

// Badge compartilhado para o status de matriculas_disciplina (lançamento + histórico do aluno).
export const STATUS_DISCIPLINA_LABEL: Record<StatusDisciplina, string> = {
  cursando: 'Cursando',
  aprovado: 'Aprovado',
  recuperacao: 'Em recuperação',
  reprovado: 'Reprovado',
  reprovado_falta: 'Rep. Falta',
  convalidado: 'Convalidado',
  trancado: 'Removido',
};

export const STATUS_DISCIPLINA_COLOR: Record<StatusDisciplina, string> = {
  cursando:        'bg-muted text-muted-foreground border-border',
  aprovado:        'bg-green-500/15 text-green-400 border-green-500/30',
  recuperacao:     'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  reprovado:       'bg-red-500/15 text-red-400 border-red-500/30',
  reprovado_falta: 'bg-red-500/15 text-red-400 border-red-500/30',
  convalidado:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
  trancado:        'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function StatusDisciplinaBadge({ status, className = '' }: { status: StatusDisciplina; className?: string }) {
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${STATUS_DISCIPLINA_COLOR[status]} ${className}`}>
      {STATUS_DISCIPLINA_LABEL[status]}
    </span>
  );
}
