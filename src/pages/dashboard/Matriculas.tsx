import React, { useEffect, useState, useCallback } from 'react';
import { Check, X, Eye, Loader2, User, Book, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { getMatriculas, updateStatusMatricula } from '@/services/matriculas.service';
import { updateRole } from '@/services/usuarios.service';
import { useToast } from '@/hooks/use-toast';

interface Matricula {
  id: string;
  aluno_id: string;
  curso_id: string;
  status: string;
  observacao?: string;
  created_at: string;
  profile?: { full_name: string; email?: string };
}

const COURSE_LABELS: Record<string, string> = {
  'teologia-livre': 'Teologia Livre',
  'seteb': 'SETEB',
  'ministerial-mulheres': 'Ministerial p/ Mulheres',
};

const TABS = [
  { key: 'pendente',  label: 'Pendentes' },
  { key: 'ativo',     label: 'Ativas' },
  { key: 'trancado',  label: 'Trancadas' },
  { key: 'concluido', label: 'Concluídas' },
];

const LIMIT = 20;

export default function Matriculas() {
  const { toast } = useToast();
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('pendente');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [processing, setProcessing] = useState<string | null>(null);
  const [detalhes, setDetalhes]     = useState<Matricula | null>(null);
  const [obsText, setObsText]       = useState('');

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const load = useCallback(async (tab: string, p: number) => {
    setLoading(true);
    const result = await getMatriculas(tab, LIMIT, p);
    setMatriculas(result.data);
    setTotal(result.total);
    setLoading(false);
  }, []);

  // Recarrega ao mudar tab (reseta página) ou ao mudar página
  useEffect(() => {
    setPage(1);
    load(activeTab, 1);
  }, [activeTab, load]);

  useEffect(() => {
    load(activeTab, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const updateStatus = async (id: string, novoStatus: string, alunoId?: string) => {
    setProcessing(id);
    const { error } = await updateStatusMatricula(id, novoStatus, obsText);

    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      if (novoStatus === 'ativo' && alunoId) {
        const { error: roleError } = await updateRole(alunoId, 'aluno');
        if (roleError) {
          toast({ title: 'Matrícula aprovada, mas erro ao liberar acesso', description: roleError, variant: 'destructive' });
        } else {
          toast({ title: 'Matrícula aprovada — acesso liberado!', description: 'O aluno já pode acessar o dashboard.' });
        }
      } else {
        toast({ title: 'Matrícula recusada', description: 'Status atualizado com sucesso.' });
      }
      setDetalhes(null);
      setObsText('');
      load(activeTab, page);
    }
    setProcessing(null);
  };

  // Filtro de busca client-side sobre a página atual (20 itens)
  const filtered = matriculas.filter(m =>
    m.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.curso_id?.toLowerCase().includes(search.toLowerCase())
  );

  // countByTab só é estimativa quando paginado — mostra total da tab atual
  const countByTab = (tab: string) => tab === activeTab ? total : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Matrículas</h1>
        <p className="text-muted-foreground mt-1">Gerencie e aprove as matrículas dos alunos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 border border-border rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-card border border-border text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {countByTab(tab.key) > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {countByTab(tab.key)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por aluno ou curso..."
          className="pl-9 bg-background border-border text-foreground"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando matrículas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
            <Book className="h-10 w-10 opacity-30" />
            <p>Nenhuma matrícula {activeTab === 'pendente' ? 'pendente' : `com status "${activeTab}"`}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aluno</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Curso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/5'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{m.profile?.full_name ?? 'Desconhecido'}</p>
                          <p className="text-xs text-muted-foreground">{m.profile?.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{COURSE_LABELS[m.curso_id] ?? m.curso_id ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setDetalhes(m); setObsText(m.observacao ?? ''); }}
                          className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-primary/40 hover:text-primary transition-all">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {m.status === 'pendente' && (
                          <>
                            <button
                              onClick={() => updateStatus(m.id, 'ativo', m.aluno_id)}
                              disabled={processing === m.id}
                              className="h-7 w-7 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center hover:bg-green-500/20 transition-all text-green-500">
                              {processing === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => updateStatus(m.id, 'trancado')}
                              disabled={processing === m.id}
                              className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-all text-red-500">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {total > LIMIT && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages} · {total} matrículas nesta tab
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading} className="border-border">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading} className="border-border">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detalhes && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h2 className="text-lg font-merriweather font-bold text-foreground">Detalhes da Matrícula</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Aluno</span>
                <span className="font-medium text-foreground">{detalhes.profile?.full_name ?? '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">E-mail</span>
                <span className="text-foreground">{detalhes.profile?.email ?? '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Curso</span>
                <span className="text-foreground">{COURSE_LABELS[detalhes.curso_id] ?? detalhes.curso_id ?? '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={detalhes.status} />
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Data</span>
                <span className="text-foreground">{new Date(detalhes.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Observação</label>
              <textarea
                value={obsText}
                onChange={e => setObsText(e.target.value)}
                rows={3}
                placeholder="Adicione uma observação opcional..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              {detalhes.status === 'pendente' && (
                <>
                  <Button onClick={() => updateStatus(detalhes.id, 'ativo', detalhes.aluno_id)}
                    disabled={!!processing} className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2">
                    <Check className="h-4 w-4" /> Aprovar
                  </Button>
                  <Button onClick={() => updateStatus(detalhes.id, 'trancado')}
                    disabled={!!processing} variant="destructive" className="flex-1 gap-2">
                    <X className="h-4 w-4" /> Recusar
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setDetalhes(null)}
                className="flex-1 border-border text-foreground">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
