import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  Search, Loader2, RefreshCw, FileText, FileSpreadsheet, ArrowRight,
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Lock, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getVisaoGeralFinanceira,
  getKpisFinanceiro,
  type VisaoGeralAluno,
  type KpisFinanceiro,
} from '@/services/financeiro.service';
import { suspenderMatriculaInadimplencia } from '@/services/matriculas.service';
import { VisaoGeralFinanceiraPDF } from '@/components/dashboard/VisaoGeralFinanceiraPDF';
import { exportToExcel } from '@/components/dashboard/relatorios/exporters/excelExporter';

// Financeiro 2e — Visão Geral: lista de TODOS os alunos ativos com situação
// financeiro. Aba padrão do menu Financeiro (diretriz 8.6 prático). PII-free.
// "Ver ficha" / clique no nome → financeiro/aluno/:id (a ficha 2g editável).

const brl = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type FiltroSituacao = 'todos' | 'em_dia' | 'pendente' | 'atrasado';

const SIT_BADGE: Record<string, { txt: string; cls: string; emoji: string }> = {
  em_dia:   { txt: 'Em dia',   emoji: '✅', cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  pendente: { txt: 'Pendente', emoji: '⏳', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  atrasado: { txt: 'Atrasado', emoji: '🔴', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
};

export function VisaoGeralFinanceira() {
  const navigate  = useNavigate();
  const { toast } = useToast();

  const [alunos, setAlunos]   = useState<VisaoGeralAluno[]>([]);
  const [kpis, setKpis]       = useState<KpisFinanceiro | null>(null);
  const [loading, setLoading] = useState(true);

  // filtros (ao vivo)
  const [busca, setBusca]         = useState('');
  const [buscaDeb, setBuscaDeb]   = useState('');
  const [fSituacao, setFSituacao] = useState<FiltroSituacao>('todos');
  const [fTurma, setFTurma]       = useState('todas');
  const [fFaixa, setFFaixa]       = useState<'todas' | 'risco' | 'critico'>('todas'); // E5: 30-89 / 90+

  // E5: suspensão assistida (o Breno revê e suspende — nunca automático)
  const [modalSusp, setModalSusp]   = useState<VisaoGeralAluno | null>(null);
  const [motivoSusp, setMotivoSusp] = useState('');
  const [savingSusp, setSavingSusp] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const [lista, k] = await Promise.all([getVisaoGeralFinanceira(), getKpisFinanceiro()]);
    setAlunos(lista);
    setKpis(k);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // debounce da busca (300ms) — filtros de situação/turma aplicam na hora
  useEffect(() => {
    const t = setTimeout(() => setBuscaDeb(busca.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const turmas = useMemo(
    () => [...new Set(alunos.map(a => a.turma_nome).filter((t): t is string => !!t))].sort(),
    [alunos],
  );

  const filtrados = useMemo(() => alunos.filter(a => {
    if (buscaDeb && !a.nome.toLowerCase().includes(buscaDeb)) return false;
    if (fSituacao !== 'todos' && a.situacao !== fSituacao) return false;
    if (fTurma !== 'todas' && a.turma_nome !== fTurma) return false;
    if (fFaixa === 'risco'   && !(a.maior_atraso_dias >= 30 && a.maior_atraso_dias < 90)) return false;
    if (fFaixa === 'critico' && !(a.maior_atraso_dias >= 90)) return false;
    return true;
  }), [alunos, buscaDeb, fSituacao, fTurma, fFaixa]);

  const emDiaCount = useMemo(() => alunos.filter(a => a.situacao === 'em_dia').length, [alunos]);
  const emRisco    = useMemo(() => alunos.filter(a => a.maior_atraso_dias >= 30 && a.maior_atraso_dias < 90).length, [alunos]);
  const criticos   = useMemo(() => alunos.filter(a => a.maior_atraso_dias >= 90).length, [alunos]);

  const abrirFicha = (id: string) => navigate(`/dashboard/financeiro/aluno/${id}`);

  const confirmarSuspensao = async () => {
    if (!modalSusp) return;
    if (motivoSusp.trim() === '') { toast({ title: 'Motivo é obrigatório', variant: 'destructive' }); return; }
    setSavingSusp(true);
    const { error } = await suspenderMatriculaInadimplencia(modalSusp.matricula_id, motivoSusp.trim());
    setSavingSusp(false);
    if (error) { toast({ title: 'Erro ao suspender', description: error, variant: 'destructive' }); return; }
    toast({ title: 'Matrícula suspensa', description: `${modalSusp.nome} perde o acesso até a reativação.` });
    setModalSusp(null);
    setMotivoSusp('');
    carregar();
  };

  const exportarExcel = () => {
    if (filtrados.length === 0) { toast({ title: 'Nada para exportar', variant: 'destructive' }); return; }
    const rows = filtrados.map(a => ({
      Aluno:        a.nome,
      Turma:        a.turma_nome ?? '—',
      Disciplinas:  a.qtd_disciplinas,
      Mensalidade:  a.valor_mensalidade ?? 0,
      Situação:     SIT_BADGE[a.situacao].txt,
      'Dias atraso': a.maior_atraso_dias,
      'Em aberto':  a.total_devido,
    }));
    exportToExcel(rows, `visao-geral-financeira-${new Date().toISOString().split('T')[0]}`, 'Visão Geral');
    toast({ title: 'Excel gerado', description: `${filtrados.length} aluno(s).` });
  };

  const filtrosPDF = { busca: buscaDeb, situacao: fSituacao, turma: fTurma };

  return (
    <div className="space-y-5">
      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<DollarSign className="h-4 w-4" />} label="A receber (aberto)"
          valor={loading || !kpis ? '—' : brl(kpis.a_receber)} tint="text-[#1F3864] dark:text-primary" />
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Recebido (mês)"
          valor={loading || !kpis ? '—' : brl(kpis.recebido_mes)} tint="text-green-600" />
        <KpiCard icon={<AlertTriangle className="h-4 w-4" />} label="Inadimplentes"
          valor={loading || !kpis ? '—' : String(kpis.inadimplentes)}
          sub={loading || !kpis ? undefined : brl(kpis.valor_atrasado)} tint="text-red-600" />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4" />} label="Em dia"
          valor={loading ? '—' : String(emDiaCount)} tint="text-green-600" />
      </div>

      {/* E5: buckets de risco (clicáveis → filtram por faixa) */}
      {!loading && (emRisco > 0 || criticos > 0) && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFFaixa(f => f === 'risco' ? 'todas' : 'risco')}
            className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${fFaixa === 'risco'
              ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
              : 'border-border text-muted-foreground hover:border-amber-500/40'}`}>
            ⚠️ {emRisco} em risco (30–89 dias)
          </button>
          <button
            onClick={() => setFFaixa(f => f === 'critico' ? 'todas' : 'critico')}
            className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${fFaixa === 'critico'
              ? 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300'
              : 'border-border text-muted-foreground hover:border-red-500/40'}`}>
            🔴 {criticos} críticos (90+ dias — candidatos a suspensão)
          </button>
          {fFaixa !== 'todas' && (
            <button onClick={() => setFFaixa('todas')}
              className="text-sm rounded-full px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground">
              limpar faixa
            </button>
          )}
        </div>
      )}

      {/* Busca + filtros + export */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome…"
            className="pl-9 bg-background" />
        </div>
        <select value={fSituacao} onChange={e => setFSituacao(e.target.value as FiltroSituacao)}
          className="bg-background border border-border rounded-md px-3 py-2 text-sm h-10">
          <option value="todos">Todas as situações</option>
          <option value="em_dia">✅ Em dia</option>
          <option value="pendente">⏳ Pendente</option>
          <option value="atrasado">🔴 Atrasado</option>
        </select>
        <select value={fTurma} onChange={e => setFTurma(e.target.value)}
          className="bg-background border border-border rounded-md px-3 py-2 text-sm h-10 max-w-[12rem]">
          <option value="todas">Todas as turmas</option>
          {turmas.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading} className="border-border text-muted-foreground h-10">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarExcel} disabled={loading || filtrados.length === 0}
            className="border-border h-10">
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Excel
          </Button>
          {!loading && filtrados.length > 0 ? (
            <PDFDownloadLink
              document={<VisaoGeralFinanceiraPDF alunos={filtrados} filtros={filtrosPDF} />}
              fileName={`visao-geral-financeira-${new Date().toISOString().split('T')[0]}.pdf`}
            >
              {({ loading: l }) => (
                <Button variant="outline" size="sm" disabled={l} className="border-border h-10">
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> {l ? 'Gerando…' : 'PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          ) : (
            <Button variant="outline" size="sm" disabled className="border-border h-10">
              <FileText className="h-3.5 w-3.5 mr-1.5" /> PDF
            </Button>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          {alunos.length === 0 ? 'Nenhum aluno com matrícula ativa.' : 'Nenhum aluno para o filtro atual.'}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{filtrados.length} de {alunos.length} aluno(s)</p>
          <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[42rem]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-2.5 font-medium">Aluno</th>
                  <th className="px-3 py-2.5 font-medium">Turma</th>
                  <th className="px-3 py-2.5 font-medium text-center">Disc.</th>
                  <th className="px-3 py-2.5 font-medium text-right">Mensalidade</th>
                  <th className="px-3 py-2.5 font-medium text-center">Situação</th>
                  <th className="px-3 py-2.5 font-medium text-right">Em aberto</th>
                  <th className="px-3 py-2.5 font-medium text-right">Ficha</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(a => {
                  const badge = SIT_BADGE[a.situacao];
                  return (
                    <tr key={a.matricula_id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <button onClick={() => abrirFicha(a.aluno_id)}
                          className="font-medium text-left text-foreground hover:text-primary hover:underline transition-colors">
                          {a.nome}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{a.turma_nome ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums">{a.qtd_disciplinas}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{brl(a.valor_mensalidade)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                          {badge.emoji} {badge.txt}{a.situacao === 'atrasado' ? ` ${a.maior_atraso_dias}d` : ''}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {a.total_devido > 0 ? <span className="text-red-600 font-medium">{brl(a.total_devido)}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        {a.maior_atraso_dias >= 90 && (
                          <Button size="sm" variant="ghost" onClick={() => { setMotivoSusp(`Inadimplência — ${a.maior_atraso_dias} dias de atraso`); setModalSusp(a); }}
                            className="h-8 px-2 text-red-600" title="Suspender por inadimplência (90+)">
                            <Lock className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => abrirFicha(a.aluno_id)}
                          className="h-8 px-2 text-primary" title="Ver ficha financeira">
                          Ver ficha <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de suspensão assistida (E5) — motivo obrigatório */}
      {modalSusp && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-merriweather font-bold text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" /> Suspender matrícula
              </h2>
              <button onClick={() => setModalSusp(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="text-sm bg-muted/20 rounded-lg p-3 space-y-1">
              <p><span className="text-muted-foreground">Aluno:</span> <span className="font-medium">{modalSusp.nome}</span></p>
              <p><span className="text-muted-foreground">Atraso:</span> <span className="font-medium text-red-600">{modalSusp.maior_atraso_dias} dias</span> · em aberto {brl(modalSusp.total_devido)}</p>
              <p className="text-[11px] text-muted-foreground">O aluno perde o acesso até você reativar (na ficha). Os dados são preservados.</p>
            </div>
            <div>
              <label className="text-sm text-foreground">Motivo (obrigatório)</label>
              <Textarea value={motivoSusp} onChange={e => setMotivoSusp(e.target.value)} rows={2} className="mt-1.5 bg-background" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setModalSusp(null)} className="flex-1 border-border text-foreground">Voltar</Button>
              <Button onClick={confirmarSuspensao} disabled={savingSusp} className="flex-1 bg-red-600 hover:bg-red-600/90 text-white">
                {savingSusp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Suspender
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, valor, sub, tint }: {
  icon: React.ReactNode; label: string; valor: string; sub?: string; tint: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">{icon} {label}</p>
      <p className={`text-lg font-bold tabular-nums ${tint}`}>{valor}</p>
      {sub && <p className="text-xs text-muted-foreground tabular-nums">{sub} em atraso</p>}
    </div>
  );
}
