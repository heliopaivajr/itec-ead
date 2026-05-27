import React from 'react';
import { Pin, Clock, Users, BookOpen, Trash2, Pencil } from 'lucide-react';

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string | null;
  autor_id: string;
  role_destino: string;
  curso_id: string | null;
  fixado: boolean;
  criado_em: string;
  expira_em: string | null;
  autor?: { full_name: string; role: string };
  curso?: { nome: string } | null;
}

const DESTINO_LABELS: Record<string, string> = {
  todos:       'Todos',
  alunos:      'Alunos',
  professores: 'Professores',
  admin:       'Administração',
};

const DESTINO_COLORS: Record<string, string> = {
  todos:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  alunos:      'bg-green-500/10 text-green-400 border-green-500/20',
  professores: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  admin:       'bg-primary/10 text-primary border-primary/20',
};

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'agora mesmo';
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  if (d < 7)  return `há ${d} dias`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

interface AvisoCardProps {
  aviso: Aviso;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  onEdit?: (aviso: Aviso) => void;
}

export function AvisoCard({ aviso, canDelete, onDelete, canEdit, onEdit }: AvisoCardProps) {
  const destinoClass = DESTINO_COLORS[aviso.role_destino] ?? DESTINO_COLORS.todos;

  return (
    <div className={`bg-card border rounded-xl p-5 space-y-3 transition-all hover:shadow-md ${aviso.fixado ? 'border-primary/40 shadow-sm shadow-primary/10' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {aviso.fixado && <Pin className="h-4 w-4 text-primary shrink-0" />}
          <h3 className="font-semibold text-foreground leading-snug truncate">{aviso.titulo}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${destinoClass}`}>
            {DESTINO_LABELS[aviso.role_destino] ?? aviso.role_destino}
          </span>
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(aviso)}
              title="Editar aviso"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(aviso.id)}
              title="Excluir aviso"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {aviso.conteudo && (
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{aviso.conteudo}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 flex-wrap">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {aviso.autor?.full_name ?? 'ITEC'}
        </span>
        {aviso.curso && (
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {aviso.curso.nome}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="h-3.5 w-3.5" />
          {tempoRelativo(aviso.criado_em)}
        </span>
      </div>
    </div>
  );
}
