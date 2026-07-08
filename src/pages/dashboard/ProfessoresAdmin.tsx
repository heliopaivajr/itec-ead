import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  BookOpen, ChevronLeft, ChevronRight, Loader2,
  Plus, Search, Trash2, Pencil, Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getProfessores, updateStatusProfessor, vincularDisciplina,
  getContratosByProfessor, updateStatusContrato, getContratoAssinadoUrl,
} from '@/services/professor.service';
import type { Professor, ContratoProfessor } from '@/services/professor.service';
import { InlineStatusSelect } from '@/components/dashboard/InlineStatusSelect';
import type { StatusOption } from '@/components/dashboard/InlineStatusSelect';
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

const STATUS_PROFESSOR_OPTIONS: StatusOption[] = [
  { value: 'ativo',      label: 'Ativo',      color: 'bg-green-100 text-green-800'   },
  { value: 'aguardando', label: 'Aguardando', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'afastado',   label: 'Afastado',   color: 'bg-orange-100 text-orange-800' },
  { value: 'desligado',  label: 'Desligado',  color: 'bg-gray-100 text-gray-600'     },
];

// Rótulo/cor do status do CONTRATO (vínculo). 'encerrado' = vínculo desativado.
const CONTRATO_STATUS_META: Record<string, { label: string; cor: string }> = {
  pendente:   { label: 'Pendente',   cor: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/25' },
  preenchido: { label: 'Preenchido', cor: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  impresso:   { label: 'Impresso',   cor: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
  assinado:   { label: 'Assinado',   cor: 'bg-green-500/15 text-green-500 border-green-500/25' },
  encerrado:  { label: 'Encerrado',  cor: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25' },
};

export default function ProfessoresAdmin() {
  const { profile } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [debSearch, setDebSearch]     = useState('');
  const [loading, setLoading]         = useState(true);
  const [showInativos, setShowInativos] = useState(false);
  const [confirmDesativar, setConfirmDesativar] = useState<Professor | null>(null);
  const [desativando, setDesativando] = useState(false);

  // Solicitações pendentes
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComDetalhes[]>([]);
  const [processando, setProcessando]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSolicitacoesPendentes().then(data => { if (!cancelled) setSolicitacoes(data); });
    return () => { cancelled = true; };
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
  // Vínculos (contratos) do professor selecionado + ações
  const [vinculos, setVinculos]       = useState<ContratoProfessor[]>([]);
  const [loadingVinculos, setLoadingVinculos] = useState(false);
  const [contratoProc, setContratoProc] = useState<string | null>(null);

  const nomeDisciplina = (id: string) => {
    const d = disciplinas.find(x => x.id === id);
    return d ? `${d.codigo} — ${d.nome}` : id;
  };

  const carregarVinculos = useCallback(async (profId: string) => {
    setLoadingVinculos(true);
    const lista = await getContratosByProfessor(profId);
    setVinculos(lista);
    setLoadingVinculos(false);
  }, []);

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (v: string) => {
    setSearch(v);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setDebSearch(v); setPage(1); }, 300);
  };

  // load — usado por handlers após ações manuais (aprovar, vincular, etc.)
  const load = useCallback(async () => {
    const { data, total: t } = await getProfessores(page, PAGE_SIZE, debSearch, !showInativos);
    setProfessores(data);
    setTotal(t);
  }, [page, debSearch, showInativos]);

  // useEffect com cancellation token — evita loading infinito ao navegar
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProfessores(page, PAGE_SIZE, debSearch, !showInativos).then(({ data, total: t }) => {
      if (!cancelled) {
        setProfessores(data);
        setTotal(t);
        setLoading(false);
      }
    });
    return () => { cancelled = true; setLoading(false); };
  }, [page, debSearch, showInativos]);

  // Carrega disciplinas uma vez no mount — não a cada abertura de modal
  useEffect(() => { getAllDisciplinas().then(setDisciplinas); }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStart  = (page - 1) * PAGE_SIZE + 1;
  const pageEnd    = Math.min(page * PAGE_SIZE, total);

  const handleDesativar = async () => {
    if (!confirmDesativar) return;
    setDesativando(true);
    const { error } = await updateStatusProfessor(confirmDesativar.id, 'desligado');
    setDesativando(false);
    setConfirmDesativar(null);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Professor desativado.', description: `${confirmDesativar.nome_completo} marcado como desligado.` });
      load();
    }
  };

  const abrirVincular = (p: Professor) => {
    setVincularProf(p);
    setDisciplinaId('');
    setVinculos([]);
    carregarVinculos(p.id);
  };

  const handleVincular = async () => {
    if (!vincularProf || !disciplinaId) return;
    setVinculando(true);
    const { error } = await vincularDisciplina(vincularProf.id, disciplinaId, profile.id);
    setVinculando(false);
    if (error) {
      toast({ title: 'Erro ao vincular', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Disciplina vinculada!', description: 'Vínculo ativo — o professor já pode trabalhar. Assinatura é formalidade paralela.' });
      setDisciplinaId('');
      carregarVinculos(vincularProf.id); // mantém o modal aberto e mostra o novo vínculo
    }
  };

  // Formalidade: registra que o professor entregou o contrato assinado. Sem efeito de acesso.
  const handleMarcarAssinado = async (contratoId: string) => {
    if (!vincularProf) return;
    setContratoProc(contratoId);
    const { error } = await updateStatusContrato(contratoId, 'assinado');
    setContratoProc(null);
    if (error) toast({ title: 'Erro', description: error, variant: 'destructive' });
    else { toast({ title: 'Contrato marcado como assinado.' }); carregarVinculos(vincularProf.id); }
  };

  // Baixa o PDF assinado que o professor enviou (bucket contratos-professor, signed URL 1h).
  const handleBaixarPdf = async (pdfPath: string) => {
    const { url, error } = await getContratoAssinadoUrl(pdfPath);
    if (error || !url) { toast({ title: 'Erro ao gerar o link do PDF', description: error ?? undefined, variant: 'destructive' }); return; }
    window.open(url, '_blank', 'noopener');
  };

  // Encerrar vínculo (soft) — remove das disciplinas ativas do professor. Nunca DELETE físico.
  const handleEncerrarVinculo = async (contratoId: string) => {
    if (!vincularProf) return;
    if (!window.confirm('Encerrar este vínculo? O professor deixa de ter esta disciplina ativa (o registro é mantido).')) return;
    setContratoProc(contratoId);
    const { error } = await updateStatusContrato(contratoId, 'encerrado');
    setContratoProc(null);
    if (error) toast({ title: 'Erro', description: error, variant: 'destructive' });
    else { toast({ title: 'Vínculo encerrado.' }); carregarVinculos(vincularProf.id); }
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
          Mostrar desligados
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
                      <button
                        onClick={() => navigate(`/dashboard/professor-ficha/${p.id}`)}
                        className="font-medium text-left hover:text-primary hover:underline transition-colors"
                      >
                        {p.nome_completo}
                      </button>
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
                      <InlineStatusSelect
                        value={p.status ?? (p.ativo ? 'ativo' : 'desligado')}
                        options={STATUS_PROFESSOR_OPTIONS}
                        disabled={!['administracao', 'admin', 'superadmin'].includes(profile.role)}
                        onSave={async (novoStatus) => {
                          const { error } = await updateStatusProfessor(
                            p.id,
                            novoStatus as 'ativo' | 'aguardando' | 'afastado' | 'desligado'
                          );
                          if (error) throw new Error(error);
                          load();
                        }}
                      />
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
                        {['admin', 'superadmin'].includes(profile.role) && p.status !== 'desligado' && (
                          <button
                            onClick={() => setConfirmDesativar(p)}
                            title="Desativar professor"
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Dialog desativar professor */}
      {confirmDesativar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-foreground">Desativar professor?</h2>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{confirmDesativar.nome_completo}</strong> será marcado como desligado.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDesativar(null)}
                disabled={desativando}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDesativar}
                disabled={desativando}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {desativando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
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
              Vínculos de <strong className="text-foreground">{vincularProf.nome_completo}</strong>
            </p>

            {/* Vínculos existentes */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {loadingVinculos ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando vínculos...
                </div>
              ) : vinculos.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Nenhuma disciplina vinculada ainda.</p>
              ) : (
                vinculos.map(c => {
                  const meta = CONTRATO_STATUS_META[c.status] ?? CONTRATO_STATUS_META.pendente;
                  const encerrado = c.status === 'encerrado';
                  return (
                    <div key={c.id} className={`border border-border rounded-lg px-3 py-2 flex items-center justify-between gap-2 ${encerrado ? 'opacity-60' : ''}`}>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{nomeDisciplina(c.disciplina_id)}</p>
                        <span className={`inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded-full border mt-0.5 ${meta.cor}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.pdf_url && (
                          <button
                            onClick={() => handleBaixarPdf(c.pdf_url!)}
                            title="Baixar o PDF assinado enviado pelo professor"
                            className="text-xs px-2 py-1 rounded border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 transition-colors"
                          >
                            PDF
                          </button>
                        )}
                        {!encerrado && c.status !== 'assinado' && (
                          <button
                            onClick={() => handleMarcarAssinado(c.id)}
                            disabled={contratoProc === c.id}
                            title={c.pdf_url
                              ? 'Confirmar o contrato assinado enviado pelo professor'
                              : 'Registrar contrato assinado (formalidade)'}
                            className="text-xs px-2 py-1 rounded border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors"
                          >
                            {contratoProc === c.id ? '...' : 'Assinado'}
                          </button>
                        )}
                        {!encerrado && (
                          <button
                            onClick={() => handleEncerrarVinculo(c.id)}
                            disabled={contratoProc === c.id}
                            title="Encerrar vínculo"
                            className="text-xs px-2 py-1 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            Encerrar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Novo vínculo */}
            <div className="space-y-1.5 border-t border-border pt-3">
              <label className="text-xs font-medium text-muted-foreground">Vincular nova disciplina</label>
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
              <Button variant="outline" onClick={() => setVincularProf(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
