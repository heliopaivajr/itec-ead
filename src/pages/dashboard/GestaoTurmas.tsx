import React, { useEffect, useState } from 'react';
import { Users, Plus, Pencil, Trash2, Loader2, RefreshCw, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTurmas, deleteTurma } from '@/services/turmas.service';
import type { Turma } from '@/services/turmas.service';
import { TurmaModal } from '@/components/dashboard/TurmaModal';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  ativa:     'bg-green-500/20 text-green-400 border-green-500/30',
  planejada: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  concluida: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  cancelada: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  ativa:     'Ativa',
  planejada: 'Planejada',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
}

export default function GestaoTurmas() {
  const { toast } = useToast();
  const [turmas, setTurmas]   = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<Turma | 'new' | null>(null);

  const load = async () => {
    setLoading(true);
    setTurmas(await getTurmas());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (t: Turma) => {
    if (!confirm(`Excluir a turma "${t.nome}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await deleteTurma(t.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Turma excluída.' });
      load();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gestão de Turmas</h1>
            <p className="text-sm text-muted-foreground">
              {turmas.length} turma{turmas.length !== 1 ? 's' : ''} cadastrada{turmas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setModal('new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Turma
          </Button>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : turmas.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Nenhuma turma cadastrada.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {turmas.map(t => (
            <div key={t.id} className="bg-card border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{t.codigo}</p>
                  <h3 className="font-semibold leading-tight mt-0.5">{t.nome}</h3>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs ${STATUS_COLORS[t.status]}`}
                >
                  {STATUS_LABELS[t.status]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>Ano: <span className="text-foreground font-medium">{t.ano}/{t.semestre ?? '—'}º sem.</span></span>
                <span>Vagas: <span className="text-foreground font-medium">{t.vagas_total}</span></span>
                <span>Início: <span className="text-foreground">{formatDate(t.data_inicio)}</span></span>
                <span>Fim: <span className="text-foreground">{formatDate(t.data_fim)}</span></span>
              </div>

              {t.observacoes && (
                <p className="text-xs text-muted-foreground border-t pt-2 line-clamp-2">{t.observacoes}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setModal(t)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(t)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TurmaModal
        turma={modal}
        onClose={() => setModal(null)}
        onSaved={() => { setModal(null); load(); toast({ title: 'Turma salva.' }); }}
      />
    </div>
  );
}
