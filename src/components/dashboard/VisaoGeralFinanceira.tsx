import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  Search, Loader2, RefreshCw, FileText, FileSpreadsheet, ArrowRight,
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getVisaoGeralFinanceira,
  getKpisFinanceiro,
  type VisaoGeralAluno,
  type KpisFinanceiro,
} from '@/services/financeiro.service';
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
    return true;
  }), [alunos, buscaDeb, fSituacao, fTurma]);

  const emDiaCount = useMemo(() => alunos.filter(a => a.situacao === 'em_dia').length, [alunos]);

  const abrirFicha = (id: string) => navigate(`/dashboard/financeiro/aluno/${id}`);

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
                      <td className="px-3 py-2.5 text-right">
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
