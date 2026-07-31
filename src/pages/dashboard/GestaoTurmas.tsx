import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Pencil, Trash2, Loader2, RefreshCw, GraduationCap, Printer, ClipboardCheck, CalendarCheck, Star, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { getTurmas, deleteTurma, getAlunosByTurma, atualizarCorTurma, getDisciplinasDaTurma } from '@/services/turmas.service';
import type { Turma, AlunoTurma, DisciplinaTurma } from '@/services/turmas.service';
import { useOutletContext } from 'react-router-dom';
import type { DashboardContext } from '../Dashboard';
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
  const { profile } = useOutletContext<DashboardContext>();
  const [turmas, setTurmas]       = useState<Turma[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<Turma | 'new' | null>(null);
  const [alunosModal, setAlunosModal] = useState<Turma | null>(null);
  const [alunos, setAlunos]       = useState<AlunoTurma[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  // Acompanhamento (C2/E4): porta da secretaria p/ frequência e notas por turma
  const [acompModal, setAcompModal] = useState<Turma | null>(null);
  const [discsTurma, setDiscsTurma] = useState<DisciplinaTurma[]>([]);
  const [loadingDiscs, setLoadingDiscs] = useState(false);

  const load = async () => {
    setLoading(true);
    setTurmas(await getTurmas());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleVerAlunos = async (t: Turma) => {
    setAlunosModal(t);
    setLoadingAlunos(true);
    setAlunos(await getAlunosByTurma(t.id));
    setLoadingAlunos(false);
  };

  const handleAcompanhar = async (t: Turma) => {
    setAcompModal(t);
    setLoadingDiscs(true);
    setDiscsTurma(await getDisciplinasDaTurma(t.id));
    setLoadingDiscs(false);
  };

  const handlePrintAlunos = () => {
    if (!alunosModal) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Lista de Alunos — ${alunosModal.nome}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px}h1{font-size:15px;margin-bottom:2px}
      p{font-size:12px;color:#666;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:7px 10px;font-size:12px;text-align:left}
      th{background:#f5f5f5;font-weight:600}</style>
    </head><body>
      <h1>ITEC — Instituto de Teologia Cristã</h1>
      <p>${alunosModal.nome} · ${alunos.length} aluno${alunos.length !== 1 ? 's' : ''} matriculado${alunos.length !== 1 ? 's' : ''}</p>
      <table><thead><tr><th>#</th><th>Nome</th><th>Cód. ITEC</th><th>Status</th></tr></thead>
      <tbody>${alunos.map((a, i) => `<tr><td>${i + 1}</td><td>${a.full_name}</td><td>${a.codigo_itec ?? '—'}</td><td>${a.status}</td></tr>`).join('')}
      </tbody></table>
    </body></html>`);
    w.document.close();
    w.print();
  };

  const handleCorChange = async (turmaId: string, cor: string) => {
    const { error } = await atualizarCorTurma(turmaId, cor, profile.id);
    if (error) {
      toast({ title: 'Erro ao salvar cor', description: error, variant: 'destructive' });
    } else {
      setTurmas(prev => prev.map(t => t.id === turmaId ? { ...t, cor } : t));
      toast({ title: 'Cor da turma atualizada.' });
    }
  };

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
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {/* Color picker da turma — círculo clicável */}
                  <label
                    title="Cor da turma no calendário"
                    className="cursor-pointer shrink-0 mt-0.5 relative group"
                  >
                    <input
                      type="color"
                      value={t.cor ?? '#22C55E'}
                      onChange={e => handleCorChange(t.id, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      aria-label="Cor da turma"
                    />
                    <span
                      className="block h-5 w-5 rounded-full border-2 border-white ring-1 ring-border group-hover:ring-primary transition-all"
                      style={{ background: t.cor ?? '#22C55E' }}
                    />
                  </label>
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{t.codigo}</p>
                    <h3 className="font-semibold leading-tight mt-0.5 truncate">{t.nome}</h3>
                  </div>
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
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleVerAlunos(t)}>
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Alunos
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleAcompanhar(t)} title="Frequência e notas por disciplina">
                  <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                  Acompanhar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setModal(t)}>
                  <Pencil className="h-3.5 w-3.5" />
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

      {/* Dialog: alunos matriculados */}
      <Dialog open={!!alunosModal} onOpenChange={open => { if (!open) setAlunosModal(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {alunosModal?.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              {loadingAlunos ? 'Carregando…' : `${alunos.length} aluno${alunos.length !== 1 ? 's' : ''} matriculado${alunos.length !== 1 ? 's' : ''}`}
            </p>
            <Button variant="outline" size="sm" onClick={handlePrintAlunos} disabled={loadingAlunos || alunos.length === 0}>
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Imprimir Lista
            </Button>
          </div>

          <div className="overflow-y-auto flex-1">
            {loadingAlunos ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : alunos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum aluno matriculado nesta turma.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Nome</th>
                    <th className="pb-2 font-medium">Cód. ITEC</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {alunos.map((a, i) => (
                    <tr key={a.aluno_id} className="hover:bg-muted/20">
                      <td className="py-2 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="py-2">
                        <Link
                          to={`/dashboard/aluno/${a.aluno_id}`}
                          className="font-medium hover:text-primary hover:underline"
                          onClick={() => setAlunosModal(null)}
                        >
                          {a.full_name}
                        </Link>
                      </td>
                      <td className="py-2 font-mono text-xs text-muted-foreground">{a.codigo_itec ?? '—'}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                          a.status === 'ativa' ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : a.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Acompanhamento (C2/E4) — frequência e notas por disciplina da turma */}
      <Dialog open={!!acompModal} onOpenChange={open => !open && setAcompModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Acompanhamento — {acompModal?.nome}</DialogTitle>
          </DialogHeader>

          {loadingDiscs ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : discsTurma.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma disciplina em andamento nesta turma.</p>
              <p className="text-xs mt-1">Disciplinas aparecem após grade cadastrada ou alunos matriculados nelas.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
              {discsTurma.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/10">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-mono text-[#BF9000] font-semibold">{d.codigo}</p>
                    <p className="font-medium text-sm truncate">{d.nome}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button asChild variant="outline" size="sm" title="Frequência da turma nesta disciplina">
                      <Link to={`/dashboard/professor/turma/${d.id}`} onClick={() => setAcompModal(null)}>
                        <CalendarCheck className="h-3.5 w-3.5 mr-1" /> Frequência
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" title="Painel de notas editável (grade da turma nesta disciplina)">
                      <Link to={`/dashboard/painel-academico/${acompModal?.id}/${d.id}`} onClick={() => setAcompModal(null)}>
                        <Star className="h-3.5 w-3.5 mr-1" /> Notas
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" title="Lançar/corrigir chamada">
                      <Link to={`/dashboard/professor/frequencia/${d.id}`} onClick={() => setAcompModal(null)}>
                        <ClipboardCheck className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <TurmaModal
        turma={modal}
        onClose={() => setModal(null)}
        onSaved={() => { setModal(null); load(); toast({ title: 'Turma salva.' }); }}
      />
    </div>
  );
}
