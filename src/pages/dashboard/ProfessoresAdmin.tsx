import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BookOpen, ChevronLeft, ChevronRight, Loader2,
  Plus, Search, UserX, Pencil, Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProfessores, desativarProfessor, vincularDisciplina } from '@/services/professor.service';
import type { Professor } from '@/services/professor.service';
import { getAllDisciplinas } from '@/services/academico.service';
import type { Disciplina } from '@/services/academico.service';
import {
  getSolicitacoesPendentes, aprovarSolicitacao, recusarSolicitacao,
  type SolicitacaoComDetalhes,
} from '@/services/solicitacoes.service';
import { Badge } from '@/components/ui/badge';
import { ProfessorModal } from '@/components/dashboard/ProfessorModal';
import { useToast } from '@/hooks/use-toast';
import type { DashboardContext } from '../Dashboard';

const PAGE_SIZE = 20;

export default function ProfessoresAdmin() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast } = useToast();

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [debSearch, setDebSearch]     = useState('');
  const [loading, setLoading]         = useState(true);
  const [showInativos, setShowInativos] = useState(false);

  // Solicitações pendentes
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComDetalhes[]>([]);
  const [processando, setProcessando]   = useState<string | null>(null);

  useEffect(() => {
    getSolicitacoesPendentes().then(setSolicitacoes);
  }, []);

  const handleAprovar = async (id: string) => {
    setProcessando(id);
    const { error } = await aprovarSolicitacao(id, profile.id);
    setProcessando(null);
    if (error) {
      toast({ title: 'Erro ao aprovar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Solicitação aprovada!', description: 'Contrato pendente criado para o professor.' });
      getSolicitacoesPendentes().then(setSolicitacoes);
      load();
    }
  };

  const handleRecusar = async (id: string) => {
    const motivo = prompt('Motivo da recusa (opcional):') ?? undefined;
    setProcessando(id);
    const { error } = await recusarSolicitacao(id, profile.id, motivo);
    setProcessando(null);
    if (error) {
      toast({ title: 'Erro ao recusar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Solicitação recusada.' });
      getSolicitacoesPendentes().then(setSolicitacoes);
    }
  };

  // Modais
  const [modalProf, setModalProf]     = useState<Professor | 'new' | null>(null);
  const [vincularProf, setVincularProf] = useState<Professor | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinaId, setDisciplinaId] = useState('');
  const [vinculando, setVinculando]   = useState(false);

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (v: string) => {
    setSearch(v);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setDebSearch(v); setPage(1); }, 300);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, total: t } = await getProfessores(page, PAGE_SIZE, debSearch, !showInativos);
    setProfessores(data);
    setTotal(t);
    setLoading(false);
  }, [page, debSearch, showInativos]);

  useEffect(() => { load(); }, [load]);

  // Carrega disciplinas uma vez no mount — não a cada abertura de modal
  useEffect(() => { getAllDisciplinas().then(setDisciplinas); }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStart  = (page - 1) * PAGE_SIZE + 1;
  const pageEnd    = Math.min(page * PAGE_SIZE, total);

  const handleDesativar = async (p: Professor) => {
    if (!confirm(`Desativar ${p.nome_completo}?`)) return;
    const { error } = await desativarProfessor(p.id);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Professor desativado.' });
      load();
    }
  };

  const abrirVincular = (p: Professor) => {
    setVincularProf(p);
    setDisciplinaId('');
  };

  const handleVincular = async () => {
    if (!vincularProf || !disciplinaId) return;
    setVinculando(true);
    const { error } = await vincularDisciplina(vincularProf.id, disciplinaId, profile.id);
    setVinculando(false);
    if (error) {
      toast({ title: 'Erro ao vincular', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Disciplina vinculada!', description: 'Contrato pendente criado.' });
      setVincularProf(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-primary">Professores</h1>
          <p className="text-muted-foreground mt-1">Cadastro e gestão do corpo docente do ITEC</p>
        </div>
        <Button onClick={() => setModalProf('new')} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Novo Professor
        </Button>
      </div>

      {/* Solicitações Pendentes */}
      {solicitacoes.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Solicitações de Disciplina Pendentes ({solicitacoes.length})
          </h2>
          <div className="space-y-2">
            {solicitacoes.map(s => (
              <div key={s.id} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.professor_nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.disciplina_codigo} — {s.disciplina_nome}
                    {s.turma_codigo && ` · Turma ${s.turma_codigo}`}
                  </p>
                  {s.observacao && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">"{s.observacao}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-600 border-yellow-400/30 text-xs">
                    Pendente
                  </Badge>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                    disabled={processando === s.id}
                    onClick={() => handleAprovar(s.id)}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
                    disabled={processando === s.id}
                    onClick={() => handleRecusar(s.id)}
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Busca + filtro */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="pl-9 bg-background border-border"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInativos}
            onChange={e => { setShowInativos(e.target.checked); setPage(1); }}
            className="rounded"
          />
          Mostrar inativos
        </label>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando professores...
          </div>
        ) : professores.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
            <BookOpen className="h-10 w-10 opacity-30" />
            <p>{debSearch ? 'Nenhum resultado.' : 'Nenhum professor cadastrado.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Professor', 'Contato', 'Formação', 'Igreja', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {professores.map((p, i) => (
                  <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 !== 0 ? 'bg-muted/5' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{p.nome_completo}</p>
                      <p className="text-xs text-muted-foreground">{p.cpf}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{p.email}</p>
                      <p className="text-xs text-muted-foreground">{p.telefone ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.formacao ?? '—'}
                      {p.titulacao && <><br /><span className="text-primary/70">{p.titulacao}</span></>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.igreja_local ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${p.ativo ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModalProf(p)}
                          title="Editar"
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => abrirVincular(p)}
                          title="Vincular disciplina"
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-400 transition-colors"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </button>
                        {p.ativo && (
                          <button
                            onClick={() => handleDesativar(p)}
                            title="Desativar"
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors"
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </button>
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
      {total > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Exibindo {pageStart}–{pageEnd} de {total} professor{total !== 1 ? 'es' : ''}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="h-7 px-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">Página {page} de {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading} className="h-7 px-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal criar/editar professor */}
      {modalProf !== null && (
        <ProfessorModal
          professor={modalProf === 'new' ? undefined : modalProf}
          onClose={() => setModalProf(null)}
          onSaved={() => { setModalProf(null); load(); }}
        />
      )}

      {/* Modal vincular disciplina */}
      {vincularProf && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Vincular Disciplina</h2>
              <button onClick={() => setVincularProf(null)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <span className="text-sm">✕</span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Vinculando: <strong className="text-foreground">{vincularProf.nome_completo}</strong>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Disciplina</label>
              <select
                value={disciplinaId}
                onChange={e => setDisciplinaId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecione a disciplina...</option>
                {disciplinas.map(d => (
                  <option key={d.id} value={d.id}>{d.codigo} — {d.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleVincular} disabled={!disciplinaId || vinculando} className="flex-1">
                {vinculando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Vincular e criar contrato
              </Button>
              <Button variant="outline" onClick={() => setVincularProf(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
