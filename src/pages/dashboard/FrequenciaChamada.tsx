import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { ClipboardCheck, Loader2, Printer, Plus, Check, X, AlertTriangle, Save, CalendarPlus, ChevronDown, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getTurmasAtivas, getDisciplinasDaTurma, getModulosCurso,
  type Turma, type DisciplinaTurma, type ModuloInfo,
} from '@/services/turmas.service';
import { getConsolidadoTurma, type ConsolidadoAluno } from '@/services/notas.service';
import {
  getFrequenciaByDisciplina, lancarFrequencia,
  type RegistroFrequencia, type TipoPresenca, type LancarRegistro,
} from '@/services/frequencia.service';
import type { DashboardContext } from '../Dashboard';

// Frequência/Chamada — TELA CHEIA (staff + professor). Planilha alunos × datas.
// Escrita no BRUTO (lancarFrequencia → frequencia); faltas/% READ do consolidado
// (trigger 065). NUNCA escreve total no consolidado (LICAO-042/043).
//
// v2 (feat/frequencia-flex — Fase 1+2):
//  • Filtros em cascata: Turma → Módulo (Todos/1..6) → Disciplina → busca de Aluno.
//    O filtro de módulo desembaralha as 36 disciplinas (080/081) → ~6 por módulo.
//  • Retroativo em massa: gerar várias datas (dias da semana × período) de uma vez;
//    marcar coluna (uma data) / linha (um aluno) inteira; célula cicla P→FP→F.
//  • Estado LOCAL pendente (Map) — clicar/marcar em massa NÃO vai ao servidor.
//    "Salvar" faz 1 UPSERT EM LOTE de todas as pendências (não N round-trips).
//    Refresh cirúrgico: recarrega só os registros da disciplina + consolidado.

const DIAS = [
  { n: 1, label: 'Seg' }, { n: 2, label: 'Ter' }, { n: 3, label: 'Qua' },
  { n: 4, label: 'Qui' }, { n: 5, label: 'Sex' }, { n: 6, label: 'Sáb' },
];

const fmtBR = (d: string) => new Date(d + 'T12:00').toLocaleDateString('pt-BR');
const peso = (t: TipoPresenca) => (t === 'falta' ? 1 : t === 'meia' ? 0.5 : 0);

export default function FrequenciaChamada() {
  const params = useParams<{ turmaId?: string; disciplinaId?: string }>();
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();

  const [turmas, setTurmas]             = useState<Turma[]>([]);
  const [turmaId, setTurmaId]           = useState(params.turmaId ?? '');
  const [disciplinas, setDisciplinas]   = useState<DisciplinaTurma[]>([]);
  const [moduloFiltro, setModuloFiltro] = useState<string>(''); // '' = Todos | '1'..'6'
  const [disciplinaId, setDisciplinaId] = useState(params.disciplinaId ?? '');
  const [modulos, setModulos]           = useState<ModuloInfo[]>([]);

  const [rows, setRows]           = useState<ConsolidadoAluno[]>([]);
  const [registros, setRegistros] = useState<RegistroFrequencia[]>([]);
  const [datasExtra, setDatasExtra] = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [salvando, setSalvando]   = useState(false);
  const [busca, setBusca]         = useState('');

  // Estado LOCAL pendente: `${aluno}|${data}` → novo tipo (só as células alteradas).
  const [pendentes, setPendentes] = useState<Map<string, TipoPresenca>>(new Map());

  // Gerador de datas
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [genInicio, setGenInicio]   = useState('');
  const [genFim, setGenFim]         = useState('');
  const [novaData, setNovaData]     = useState('');

  // Mini-menu de marcação em massa (coluna/linha)
  const [massMenu, setMassMenu] = useState<{ tipo: 'col' | 'row'; id: string } | null>(null);

  useEffect(() => { getTurmasAtivas().then(setTurmas); }, []);
  useEffect(() => { getModulosCurso().then(setModulos); }, []);

  useEffect(() => {
    if (!turmaId) { setDisciplinas([]); return; }
    getDisciplinasDaTurma(turmaId).then(setDisciplinas);
  }, [turmaId]);

  // Disciplinas visíveis conforme o módulo escolhido (desembaralha as 36).
  const disciplinasFiltradas = useMemo(() => {
    if (!moduloFiltro) return disciplinas;
    const ord = Number(moduloFiltro);
    return disciplinas.filter(d => d.modulo_ordem === ord);
  }, [disciplinas, moduloFiltro]);

  // Se a disciplina selecionada sair do filtro de módulo, limpa a seleção.
  useEffect(() => {
    if (disciplinaId && !disciplinasFiltradas.some(d => d.id === disciplinaId)) {
      setDisciplinaId('');
    }
  }, [disciplinasFiltradas, disciplinaId]);

  const carregar = useCallback(async () => {
    if (!turmaId || !disciplinaId) { setRows([]); setRegistros([]); return; }
    setLoading(true);
    const [cons, regs] = await Promise.all([
      getConsolidadoTurma(turmaId, disciplinaId),
      getFrequenciaByDisciplina(disciplinaId),
    ]);
    setRows(cons);
    setRegistros(regs);
    setDatasExtra([]);
    setPendentes(new Map());
    setLoading(false);
  }, [turmaId, disciplinaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const datas = useMemo(() => {
    const s = new Set<string>(registros.map(r => r.data_aula));
    datasExtra.forEach(d => s.add(d));
    return [...s].sort();
  }, [registros, datasExtra]);

  // Estado salvo (servidor) por célula
  const salvo = useMemo(() => {
    const m = new Map<string, TipoPresenca>();
    for (const r of registros) m.set(`${r.aluno_id}|${r.data_aula}`, r.tipo_presenca ?? (r.presente ? 'presente' : 'falta'));
    return m;
  }, [registros]);

  // Estado EFETIVO da célula = pendente (se houver) senão salvo
  const estadoCelula = useCallback((alunoId: string, data: string): TipoPresenca | undefined => {
    const key = `${alunoId}|${data}`;
    return pendentes.has(key) ? pendentes.get(key) : salvo.get(key);
  }, [pendentes, salvo]);

  // Faltas ponderadas do consolidado (servidor) — atualiza após salvar. Ponderação
  // no banco (trigger 065); aqui só leitura do que já foi gravado.
  const faltasDoAluno = useCallback((alunoId: string) =>
    registros.filter(r => r.aluno_id === alunoId).reduce((s, r) =>
      s + peso(r.tipo_presenca ?? (r.presente ? 'presente' : 'falta')), 0),
  [registros]);

  const alunos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? rows.filter(r => r.nome.toLowerCase().includes(q)) : rows;
  }, [rows, busca]);

  // ── Ciclo dos 3 estados: (—) → presente → meia → falta → presente … ──────────
  const proximoEstado = (atual: TipoPresenca | undefined): TipoPresenca =>
    atual === undefined ? 'presente' : atual === 'presente' ? 'meia' : atual === 'meia' ? 'falta' : 'presente';

  const ciclarCelula = (alunoId: string, data: string) => {
    const key = `${alunoId}|${data}`;
    const novo = proximoEstado(estadoCelula(alunoId, data));
    setPendentes(prev => new Map(prev).set(key, novo));
  };

  // ── Marcação em massa (coluna = 1 data p/ todos filtrados; linha = 1 aluno) ───
  const aplicarMassa = (alvo: { tipo: 'col' | 'row'; id: string }, estado: TipoPresenca) => {
    setPendentes(prev => {
      const next = new Map(prev);
      if (alvo.tipo === 'col') {
        for (const a of alunos) next.set(`${a.aluno_id}|${alvo.id}`, estado);
      } else {
        for (const d of datas) next.set(`${alvo.id}|${d}`, estado);
      }
      return next;
    });
    setMassMenu(null);
  };

  // ── Gerar datas em massa (dias da semana × período) ──────────────────────────
  const toggleDia = (n: number) =>
    setDiasSemana(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);

  const gerarDatas = () => {
    if (diasSemana.length === 0) { toast({ title: 'Escolha ao menos um dia da semana', variant: 'destructive' }); return; }
    if (!genInicio || !genFim)   { toast({ title: 'Escolha início e fim do período', variant: 'destructive' }); return; }
    if (genFim < genInicio)      { toast({ title: 'O fim deve ser depois do início', variant: 'destructive' }); return; }
    const novas: string[] = [];
    const cur = new Date(genInicio + 'T12:00');
    const lim = new Date(genFim + 'T12:00');
    let guard = 0;
    while (cur <= lim && guard++ < 500) {
      if (diasSemana.includes(cur.getDay())) novas.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    const existentes = new Set(datas);
    const add = novas.filter(d => !existentes.has(d));
    if (add.length === 0) { toast({ title: 'Essas datas já estão na grade' }); return; }
    setDatasExtra(prev => [...new Set([...prev, ...add])]);
    toast({ title: `${add.length} data(s) adicionada(s) à grade` });
  };

  const adicionarDataUnica = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData)) { toast({ title: 'Escolha uma data válida', variant: 'destructive' }); return; }
    if (datas.includes(novaData)) { toast({ title: 'Essa data já está na grade' }); return; }
    setDatasExtra(prev => [...prev, novaData]);
    setNovaData('');
  };

  // ── Salvar em LOTE (1 upsert) + refresh cirúrgico ────────────────────────────
  const salvar = async () => {
    if (pendentes.size === 0 || !disciplinaId) return;
    setSalvando(true);
    const lote: LancarRegistro[] = [];
    for (const [key, tipo] of pendentes) {
      const [aluno_id, data_aula] = key.split('|');
      lote.push({
        disciplina_id: disciplinaId, aluno_id, professor_id: profile.id,
        data_aula, tipo_presenca: tipo, justificada: false, documento_url: null, observacao: null,
      });
    }
    const { error } = await lancarFrequencia(lote);   // ← 1 requisição, N linhas
    if (error) { setSalvando(false); toast({ title: 'Erro ao salvar chamada', description: error, variant: 'destructive' }); return; }
    // Refresh cirúrgico: só a disciplina (registros + consolidado), não a turma inteira.
    const [regs, cons] = await Promise.all([
      getFrequenciaByDisciplina(disciplinaId),
      getConsolidadoTurma(turmaId, disciplinaId),
    ]);
    setRegistros(regs);
    setRows(cons);
    setPendentes(new Map());
    setSalvando(false);
    toast({ title: 'Chamada salva!', description: `${lote.length} marcação(ões) gravada(s) em lote.` });
  };

  const turmaSel = turmas.find(t => t.id === turmaId);
  const discSel  = disciplinas.find(d => d.id === disciplinaId);
  const moduloAtual = discSel?.modulo_ordem != null ? modulos.find(m => m.ordem === discSel.modulo_ordem) : undefined;
  const pronto   = turmaId && disciplinaId;
  const nPend    = pendentes.size;

  // Prefill do gerador com as datas do módulo ao escolher a disciplina.
  useEffect(() => {
    if (moduloAtual) {
      setGenInicio(prev => prev || moduloAtual.data_inicio);
      setGenFim(prev => prev || (moduloAtual.data_fim ?? ''));
    }
  }, [moduloAtual]);

  const estadoBtnClasse = (val: TipoPresenca | undefined, pend: boolean) =>
    `h-7 w-7 rounded-md inline-flex items-center justify-center transition-colors ${
      val === 'presente' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      : val === 'meia' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
      : val === 'falta' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      : 'bg-muted/40 text-muted-foreground hover:bg-muted'
    } ${pend ? 'ring-2 ring-primary/60' : ''}`;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Barra superior — filtros em cascata */}
      <div className="border-b border-border bg-card/95 backdrop-blur px-4 py-3 flex items-end gap-3 flex-wrap sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-2 mr-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-[#1F3864] dark:text-primary whitespace-nowrap">Frequência / Chamada</h1>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground block">Turma</label>
          <select value={turmaId} onChange={e => { setTurmaId(e.target.value); setDisciplinaId(''); setModuloFiltro(''); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm h-9 min-w-[10rem]">
            <option value="">Selecione…</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.codigo} — {t.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground block">Módulo</label>
          <select value={moduloFiltro} onChange={e => setModuloFiltro(e.target.value)} disabled={!turmaId}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm h-9 min-w-[7rem] disabled:opacity-50">
            <option value="">Todos</option>
            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>Módulo {n}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground block">Disciplina</label>
          <select value={disciplinaId} onChange={e => setDisciplinaId(e.target.value)} disabled={!turmaId}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm h-9 min-w-[13rem] disabled:opacity-50">
            <option value="">{turmaId ? `Selecione… (${disciplinasFiltradas.length})` : 'Escolha a turma'}</option>
            {disciplinasFiltradas.map(d => (
              <option key={d.id} value={d.id}>
                {d.modulo_ordem ? `M${d.modulo_ordem} · ` : ''}{d.codigo ? `${d.codigo} — ` : ''}{d.nome}
              </option>
            ))}
          </select>
        </div>
        {pronto && (
          <>
            <div>
              <label className="text-[11px] text-muted-foreground block">Buscar aluno</label>
              <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="nome…" className="bg-background h-9 w-40" />
            </div>
            <Button variant="outline" onClick={() => window.print()} className="border-border h-9 ml-auto self-end">
              <Printer className="h-4 w-4 mr-1.5" /> Imprimir
            </Button>
          </>
        )}
      </div>

      {/* Barra de retroativo — gerar datas em massa */}
      {pronto && (
        <div className="border-b border-border bg-muted/20 px-4 py-2.5 flex items-end gap-3 flex-wrap print:hidden">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Gerar datas — dias da semana</label>
            <div className="flex gap-1">
              {DIAS.map(d => (
                <button key={d.n} onClick={() => toggleDia(d.n)}
                  className={`h-8 w-9 rounded-md text-xs font-medium border transition-colors ${
                    diasSemana.includes(d.n)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block">De</label>
            <Input type="date" value={genInicio} onChange={e => setGenInicio(e.target.value)} className="bg-background h-9 w-40" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block">Até</label>
            <Input type="date" value={genFim} onChange={e => setGenFim(e.target.value)} className="bg-background h-9 w-40" />
          </div>
          <Button variant="outline" onClick={gerarDatas} className="border-border h-9">
            <CalendarPlus className="h-4 w-4 mr-1.5" /> Gerar
          </Button>
          {moduloAtual?.data_fim && (
            <span className="text-[11px] text-muted-foreground self-center">
              Módulo {moduloAtual.ordem} vai até <strong>{fmtBR(moduloAtual.data_fim)}</strong>
            </span>
          )}
          <div className="ml-auto flex items-end gap-1.5">
            <div>
              <label className="text-[11px] text-muted-foreground block">Data única</label>
              <Input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} className="bg-background h-9 w-40" />
            </div>
            <Button variant="outline" onClick={adicionarDataUnica} className="border-border h-9"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Planilha */}
      <div className="flex-1 p-4">
        {!pronto ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Escolha a turma, o módulo e a disciplina para lançar a chamada.
          </div>
        ) : loading ? (
          <div className="space-y-2">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : rows.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum aluno matriculado nesta disciplina.</div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <p className="text-xs text-muted-foreground">
                {discSel?.nome} · {turmaSel?.codigo} — {alunos.length} aluno(s) · {datas.length} chamada(s).
                Legenda: <span className="text-green-600 font-medium">✓ presente</span> ·
                <span className="text-amber-600 font-medium"> ◐ meia (0,5)</span> ·
                <span className="text-red-600 font-medium"> ✕ falta</span> · · não marcado.
                Use <ChevronDown className="inline h-3 w-3" /> (coluna) e <CheckCheck className="inline h-3 w-3" /> (linha) para marcar em massa.
              </p>
              <div className="flex items-center gap-2 print:hidden">
                {nPend > 0 && <span className="text-xs text-primary font-medium">{nPend} alteração(ões) pendente(s)</span>}
                <Button size="sm" onClick={salvar} disabled={nPend === 0 || salvando}
                  className="bg-primary text-primary-foreground hover:bg-primary/80 h-9">
                  {salvando
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Salvando…</>
                    : <><Save className="h-4 w-4 mr-1.5" /> Salvar chamada</>}
                </Button>
              </div>
            </div>

            {datas.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                Nenhuma chamada na grade. Use “Gerar datas” ou “Data única” acima para criar as colunas.
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-auto max-h-[calc(100vh-14rem)]">
                <table className="text-sm border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="text-xs text-muted-foreground bg-card border-b border-border">
                      <th className="px-4 py-2 font-medium text-left sticky left-0 bg-card z-20 min-w-[14rem]">Aluno</th>
                      {datas.map(d => (
                        <th key={d} className="px-2 py-2 font-medium text-center whitespace-nowrap min-w-[3.5rem]">
                          <div className="flex flex-col items-center gap-0.5">
                            <span>{new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                            <button onClick={() => setMassMenu(massMenu?.tipo === 'col' && massMenu.id === d ? null : { tipo: 'col', id: d })}
                              title="Marcar a coluna toda" className="text-muted-foreground hover:text-primary">
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-2 font-medium text-center whitespace-nowrap bg-card">Faltas</th>
                      <th className="px-3 py-2 font-medium text-center whitespace-nowrap bg-card">Freq.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.map(r => (
                      <tr key={r.aluno_id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2 text-foreground sticky left-0 bg-card z-10 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setMassMenu(massMenu?.tipo === 'row' && massMenu.id === r.aluno_id ? null : { tipo: 'row', id: r.aluno_id })}
                              title="Marcar a linha toda" className="text-muted-foreground hover:text-primary">
                              <CheckCheck className="h-4 w-4" />
                            </button>
                            <span>{r.nome}</span>
                            {r.frequencia < 75 && <AlertTriangle className="inline h-3.5 w-3.5 text-amber-500" />}
                          </div>
                        </td>
                        {datas.map(d => {
                          const key = `${r.aluno_id}|${d}`;
                          const val = estadoCelula(r.aluno_id, d);
                          const pend = pendentes.has(key);
                          return (
                            <td key={d} className="px-2 py-1.5 text-center">
                              <button onClick={() => ciclarCelula(r.aluno_id, d)}
                                title={val === undefined ? 'Não marcado — clique para ciclar' : val === 'presente' ? 'Presente' : val === 'meia' ? 'Meia-presença (0,5)' : 'Falta'}
                                className={estadoBtnClasse(val, pend)}>
                                {val === 'presente' ? <Check className="h-3.5 w-3.5" />
                                  : val === 'meia' ? <span className="text-xs font-bold">◐</span>
                                  : val === 'falta' ? <X className="h-3.5 w-3.5" /> : '·'}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center tabular-nums font-semibold text-foreground">{faltasDoAluno(r.aluno_id).toLocaleString('pt-BR')}</td>
                        <td className={`px-3 py-2 text-center tabular-nums ${r.frequencia < 75 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>{r.frequencia}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">
              As marcações ficam <strong>pendentes</strong> (só na tela) até “Salvar chamada”, que grava tudo de uma vez.
              Faltas e Freq.% são recalculados pelo sistema (consolidado) após salvar.
            </p>
          </>
        )}
      </div>

      {/* Mini-menu de marcação em massa (coluna/linha) */}
      {massMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMassMenu(null)} />
          <div className="fixed z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-xl shadow-lg p-3 print:hidden">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              {massMenu.tipo === 'col'
                ? `Marcar ${fmtBR(massMenu.id)} para ${alunos.length} aluno(s)`
                : `Marcar todas as ${datas.length} data(s) deste aluno`}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => aplicarMassa(massMenu, 'presente')}
                className="bg-green-600 hover:bg-green-700 text-white"><Check className="h-4 w-4 mr-1" /> Presente</Button>
              <Button size="sm" onClick={() => aplicarMassa(massMenu, 'meia')}
                className="bg-amber-500 hover:bg-amber-600 text-white">◐ Meia</Button>
              <Button size="sm" onClick={() => aplicarMassa(massMenu, 'falta')}
                className="bg-red-600 hover:bg-red-700 text-white"><X className="h-4 w-4 mr-1" /> Falta</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
