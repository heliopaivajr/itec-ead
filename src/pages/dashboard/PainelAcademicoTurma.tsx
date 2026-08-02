import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { GraduationCap, Loader2, Printer, Star, AlertTriangle, CheckCircle2, Check, X, Plus, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getTurmasAtivas, type Turma } from '@/services/turmas.service';
import { getDisciplinasDaTurma, type DisciplinaTurma } from '@/services/turmas.service';
import {
  getConsolidadoTurma, getAvaliacoesByDisciplina, createAvaliacao, lancarNota,
  type ConsolidadoAluno, type Avaliacao,
} from '@/services/notas.service';
import {
  getAlunosEmRiscoByTurma, getFrequenciaByDisciplina, lancarFrequencia,
  type RegistroFrequencia, type TipoPresenca,
} from '@/services/frequencia.service';
import type { DashboardContext } from '../Dashboard';

// Painel Acadêmico da Turma — aba NOTAS (2.13a). Grade por turma+disciplina:
// alunos × [N1, N2] editável inline; média/status/freq READ (do consolidado 065).
// Escrita no BRUTO (lancarNota → notas_aluno), o trigger recalcula matriculas_disciplina
// (LICAO-042/043). lancado_por = auth.uid() (autoria, exigência 059). Staff-only.

type FiltroSit = 'todos' | 'aprovado' | 'recuperacao' | 'reprovado' | 'em_risco';

const STATUS_BADGE: Record<string, { txt: string; cls: string }> = {
  aprovado:        { txt: 'Aprovado',    cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  recuperacao:     { txt: 'Recuperação', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  reprovado_nota:  { txt: 'Rep. Nota',   cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  reprovado_falta: { txt: 'Rep. Falta',  cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  cursando:        { txt: 'Em curso',    cls: 'bg-muted text-muted-foreground' },
};

const num = (n: number | null) => (n === null || n === undefined ? '—' : n.toFixed(1));

export default function PainelAcademicoTurma() {
  const params = useParams<{ turmaId?: string; disciplinaId?: string }>();
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();

  const [turmas, setTurmas]         = useState<Turma[]>([]);
  const [turmaId, setTurmaId]       = useState(params.turmaId ?? '');
  const [disciplinas, setDisciplinas] = useState<DisciplinaTurma[]>([]);
  const [disciplinaId, setDisciplinaId] = useState(params.disciplinaId ?? '');

  const [rows, setRows]         = useState<ConsolidadoAluno[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [emRisco, setEmRisco]   = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(false);
  const [filtro, setFiltro]     = useState<FiltroSit>('todos');

  // edição de célula: alunoId + tipo (N1/N2)
  const [cell, setCell]     = useState<{ aluno: string; tipo: 'N1' | 'N2' } | null>(null);
  const [cellVal, setCellVal] = useState('');
  const [salvando, setSalvando] = useState(false);

  // 2.13b — aba Chamada (frequência aluno × data)
  const [aba, setAba] = useState<'notas' | 'chamada'>('notas');
  const [registros, setRegistros] = useState<RegistroFrequencia[]>([]);
  const [datasExtra, setDatasExtra] = useState<string[]>([]);   // datas novas ainda sem registro
  const [novaData, setNovaData] = useState('');
  const [savingCell, setSavingCell] = useState<string | null>(null);  // "aluno|data"

  useEffect(() => { getTurmasAtivas().then(setTurmas); }, []);

  const carregarDisciplinas = useCallback(async (tid: string) => {
    setDisciplinas(tid ? await getDisciplinasDaTurma(tid) : []);
  }, []);

  useEffect(() => { if (turmaId) carregarDisciplinas(turmaId); }, [turmaId, carregarDisciplinas]);

  const carregarGrade = useCallback(async () => {
    if (!turmaId || !disciplinaId) { setRows([]); return; }
    setLoading(true);
    const [cons, avs, risco] = await Promise.all([
      getConsolidadoTurma(turmaId, disciplinaId),
      getAvaliacoesByDisciplina(disciplinaId, turmaId),
      getAlunosEmRiscoByTurma(turmaId),
    ]);
    setRows(cons);
    setAvaliacoes(avs);
    setEmRisco(new Set(risco.map(r => r.aluno_id)));
    setLoading(false);
  }, [turmaId, disciplinaId]);

  useEffect(() => { carregarGrade(); }, [carregarGrade]);

  // ─── Chamada (2.13b) ──────────────────────────────────────────────────────
  const carregarChamada = useCallback(async () => {
    if (!turmaId || !disciplinaId) { setRegistros([]); return; }
    setRegistros(await getFrequenciaByDisciplina(disciplinaId));
    setDatasExtra([]);
  }, [turmaId, disciplinaId]);

  useEffect(() => { if (aba === 'chamada') carregarChamada(); }, [aba, carregarChamada]);

  // Colunas = datas com chamada já lançada + datas novas adicionadas nesta sessão.
  const datas = useMemo(() => {
    const s = new Set<string>(registros.map(r => r.data_aula));
    datasExtra.forEach(d => s.add(d));
    return [...s].sort();
  }, [registros, datasExtra]);

  // presença[aluno|data] = tipo_presenca (undefined = ainda não marcada nessa data)
  const presenca = useMemo(() => {
    const m = new Map<string, TipoPresenca>();
    for (const r of registros) m.set(`${r.aluno_id}|${r.data_aula}`, r.tipo_presenca ?? (r.presente ? 'presente' : 'falta'));
    return m;
  }, [registros]);

  // faltas ponderadas: falta = 1 · meia = 0,5 (mesma régua do trigger 065)
  const faltasDoAluno = useCallback((alunoId: string) =>
    registros.filter(r => r.aluno_id === alunoId).reduce((s, r) => {
      const t = r.tipo_presenca ?? (r.presente ? 'presente' : 'falta');
      return s + (t === 'falta' ? 1 : t === 'meia' ? 0.5 : 0);
    }, 0),
  [registros]);

  const adicionarData = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData)) { toast({ title: 'Escolha uma data válida', variant: 'destructive' }); return; }
    if (datas.includes(novaData)) { toast({ title: 'Essa data já está na grade' }); return; }
    setDatasExtra(prev => [...prev, novaData]);
    setNovaData('');
  };

  const proximoEstado = (atual: TipoPresenca | undefined): TipoPresenca =>
    atual === undefined ? 'presente' : atual === 'presente' ? 'meia' : atual === 'meia' ? 'falta' : 'presente';

  // Ciclo P→FP→F → lancarFrequencia (BRUTO, upsert cria a linha) → re-lê consolidado.
  const togglePresenca = async (alunoId: string, data: string) => {
    const novo = proximoEstado(presenca.get(`${alunoId}|${data}`));
    setSavingCell(`${alunoId}|${data}`);
    const { error } = await lancarFrequencia([{
      disciplina_id: disciplinaId, aluno_id: alunoId, professor_id: profile.id,
      data_aula: data, tipo_presenca: novo, justificada: false, documento_url: null, observacao: null,
    }]);
    if (error) { setSavingCell(null); toast({ title: 'Erro ao salvar chamada', description: error, variant: 'destructive' }); return; }
    // re-lê o bruto (para a data/aluno) + o consolidado (freq%/faltas recalculados pelo trigger)
    const [regs, cons] = await Promise.all([getFrequenciaByDisciplina(disciplinaId), getConsolidadoTurma(turmaId, disciplinaId)]);
    setRegistros(regs);
    setRows(cons);
    setSavingCell(null);
  };

  // Resolve (ou cria) a avaliação do tipo — mesma lógica do LancarNotas (não duplica regra).
  const ensureAvaliacao = async (tipo: 'N1' | 'N2'): Promise<Avaliacao | null> => {
    const existente = avaliacoes.find(a => a.tipo === tipo);
    if (existente) return existente;
    const { data, error } = await createAvaliacao(disciplinaId, turmaId, tipo, profile.id);
    if (error || !data) { toast({ title: 'Erro ao criar avaliação', description: error ?? '', variant: 'destructive' }); return null; }
    setAvaliacoes(prev => [...prev, data]);
    return data;
  };

  const abrirCelula = (aluno: string, tipo: 'N1' | 'N2', atual: number | null) => {
    setCell({ aluno, tipo });
    setCellVal(atual !== null && atual !== undefined ? String(atual) : '');
  };

  const salvarCelula = async () => {
    if (!cell) return;
    const t = cellVal.trim().replace(',', '.');
    if (t === '') { setCell(null); return; }         // vazio = não altera
    const nota = parseFloat(t);
    if (isNaN(nota) || nota < 0 || nota > 10) { toast({ title: 'Nota inválida (0–10)', variant: 'destructive' }); return; }
    setSalvando(true);
    const av = await ensureAvaliacao(cell.tipo);
    if (!av) { setSalvando(false); return; }
    // BRUTO: lancarNota → notas_aluno; o trigger 065 recalcula o consolidado.
    const { error } = await lancarNota(av.id, cell.aluno, disciplinaId, turmaId, nota, profile.id);
    if (error) { setSalvando(false); toast({ title: 'Erro ao salvar nota', description: error, variant: 'destructive' }); return; }
    // RE-LER o consolidado (média/status/freq já recalculados pelo trigger)
    setRows(await getConsolidadoTurma(turmaId, disciplinaId));
    setSalvando(false);
    setCell(null);
    toast({ title: `${cell.tipo} salva`, description: 'Média e situação recalculadas.' });
  };

  const filtrados = useMemo(() => rows.filter(r => {
    if (filtro === 'todos') return true;
    if (filtro === 'aprovado')   return r.status === 'aprovado';
    if (filtro === 'recuperacao') return r.status === 'recuperacao';
    if (filtro === 'reprovado')  return r.status === 'reprovado_nota' || r.status === 'reprovado_falta';
    if (filtro === 'em_risco')   return emRisco.has(r.aluno_id) || r.frequencia < 75;
    return true;
  }), [rows, filtro, emRisco]);

  const turmaSel = turmas.find(t => t.id === turmaId);
  const discSel  = disciplinas.find(d => d.id === disciplinaId);

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-[12rem]">
          <h1 className="text-2xl font-bold text-[#1F3864] dark:text-primary">Painel Acadêmico da Turma</h1>
          <p className="text-sm text-muted-foreground">Notas por turma + disciplina — edite N1/N2 na célula; média e situação recalculam sozinhas.</p>
        </div>
        {turmaId && disciplinaId && rows.length > 0 && (
          <Button variant="outline" onClick={() => window.print()} className="border-border">
            <Printer className="h-4 w-4 mr-1.5" /> Imprimir
          </Button>
        )}
      </div>

      {/* Seletores + filtro */}
      <div className="bg-card border border-border rounded-xl p-4 grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Turma</label>
          <select value={turmaId} onChange={e => { setTurmaId(e.target.value); setDisciplinaId(''); }}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm h-10">
            <option value="">Selecione…</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.codigo} — {t.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Disciplina (a grade é por disciplina)</label>
          <select value={disciplinaId} onChange={e => setDisciplinaId(e.target.value)} disabled={!turmaId}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm h-10 disabled:opacity-50">
            <option value="">{turmaId ? 'Selecione…' : 'Escolha a turma'}</option>
            {disciplinas.map(d => <option key={d.id} value={d.id}>{d.codigo ? `${d.codigo} — ` : ''}{d.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Situação</label>
          <select value={filtro} onChange={e => setFiltro(e.target.value as FiltroSit)}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm h-10">
            <option value="todos">Todos</option>
            <option value="aprovado">✅ Aprovado</option>
            <option value="recuperacao">⚠️ Recuperação</option>
            <option value="reprovado">🔴 Reprovado</option>
            <option value="em_risco">📉 Em risco (freq &lt; 75%)</option>
          </select>
        </div>
      </div>

      {/* Abas Notas | Chamada */}
      <div className="flex items-center gap-1 bg-muted/40 border border-border rounded-xl p-1 w-fit">
        {([['notas', 'Notas', Star], ['chamada', 'Chamada', ClipboardCheck]] as const).map(([key, label, Ico]) => (
          <button key={key} onClick={() => setAba(key)}
            className={`text-sm px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${aba === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Ico className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Nova chamada (só na aba Chamada) */}
      {aba === 'chamada' && turmaId && disciplinaId && (
        <div className="flex items-end gap-2 flex-wrap bg-muted/20 rounded-lg p-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nova chamada (data da aula)</label>
            <Input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} className="bg-background w-44" />
          </div>
          <Button variant="outline" onClick={adicionarData} className="border-border">
            <Plus className="h-4 w-4 mr-1.5" /> Adicionar coluna
          </Button>
          <p className="text-[11px] text-muted-foreground flex-1 min-w-[12rem]">
            Marque cada aluno como presente/falta na coluna da data. A coluna vira permanente ao marcar o 1º aluno.
          </p>
        </div>
      )}

      {/* Grade */}
      {!turmaId || !disciplinaId ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          Escolha a turma e a disciplina para ver a grade.
        </div>
      ) : loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-11 rounded-lg" />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          {rows.length === 0 ? 'Nenhum aluno matriculado nesta turma.' : 'Nenhum aluno para o filtro atual.'}
        </div>
      ) : aba === 'notas' ? (
        <>
          <p className="text-xs text-muted-foreground">
            {discSel?.nome} · {turmaSel?.codigo} — {filtrados.length} de {rows.length} aluno(s). Clique em N1/N2 para editar (Enter salva).
          </p>
          <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[40rem]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-2.5 font-medium">Aluno</th>
                  <th className="px-3 py-2.5 font-medium text-center w-24">N1</th>
                  <th className="px-3 py-2.5 font-medium text-center w-24">N2</th>
                  <th className="px-3 py-2.5 font-medium text-center">Média</th>
                  <th className="px-3 py-2.5 font-medium text-center">Freq.</th>
                  <th className="px-3 py-2.5 font-medium text-center">Situação</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(r => {
                  const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.cursando;
                  const risco = emRisco.has(r.aluno_id) || r.frequencia < 75;
                  return (
                    <tr key={r.aluno_id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2 text-foreground">
                        {r.nome}
                        {risco && <AlertTriangle className="inline h-3.5 w-3.5 ml-1.5 text-amber-500" />}
                      </td>
                      {(['N1', 'N2'] as const).map(tipo => {
                        const emEd = cell?.aluno === r.aluno_id && cell.tipo === tipo;
                        const valor = tipo === 'N1' ? r.n1 : r.n2;
                        return (
                          <td key={tipo} className="px-3 py-2 text-center">
                            {emEd ? (
                              <Input autoFocus inputMode="decimal" value={cellVal}
                                onChange={e => setCellVal(e.target.value)}
                                onBlur={salvarCelula}
                                onKeyDown={e => { if (e.key === 'Enter') salvarCelula(); if (e.key === 'Escape') setCell(null); }}
                                disabled={salvando}
                                className="h-8 w-16 text-center bg-background mx-auto" />
                            ) : (
                              <button onClick={() => abrirCelula(r.aluno_id, tipo, valor)}
                                className="w-16 h-8 rounded-md hover:bg-primary/10 hover:text-primary transition-colors tabular-nums font-medium">
                                {num(valor)}
                              </button>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center tabular-nums font-semibold text-foreground">{num(r.media)}</td>
                      <td className={`px-3 py-2 text-center tabular-nums ${r.frequencia < 75 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        {r.frequencia}%
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                          {r.status === 'aprovado' && <CheckCircle2 className="h-3 w-3" />}
                          {(r.status === 'recuperacao') && <AlertTriangle className="h-3 w-3" />}
                          {r.status === 'cursando' && <Star className="h-3 w-3" />}
                          {badge.txt}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground">
            A nota é gravada na fonte (notas_aluno) e a média/situação/frequência são recalculadas pelo sistema — os mesmos números aparecem para o aluno e nos relatórios.
          </p>
        </>
      ) : (
        /* ─── Aba CHAMADA: aluno × data ─── */
        <>
          <p className="text-xs text-muted-foreground">
            {discSel?.nome} · {turmaSel?.codigo} — {filtrados.length} aluno(s) · {datas.length} chamada(s). Clique numa célula para ciclar presente → meia (0,5) → falta.
          </p>
          {datas.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              Nenhuma chamada lançada nesta disciplina. Use “Nova chamada” acima para criar a primeira data.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <table className="text-sm border-collapse">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="px-4 py-2.5 font-medium text-left sticky left-0 bg-card z-10 min-w-[12rem]">Aluno</th>
                    {datas.map(d => (
                      <th key={d} className="px-2 py-2.5 font-medium text-center whitespace-nowrap min-w-[3.5rem]">
                        {new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap">Faltas</th>
                    <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap">Freq.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(r => (
                    <tr key={r.aluno_id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2 text-foreground sticky left-0 bg-card z-10">{r.nome}</td>
                      {datas.map(d => {
                        const key = `${r.aluno_id}|${d}`;
                        const val = presenca.get(key);   // 'presente'|'meia'|'falta'|undefined
                        const saving = savingCell === key;
                        return (
                          <td key={d} className="px-2 py-1.5 text-center">
                            <button onClick={() => togglePresenca(r.aluno_id, d)} disabled={saving}
                              title={val === undefined ? 'Não marcado — clique para ciclar' : val === 'presente' ? 'Presente' : val === 'meia' ? 'Meia-presença (0,5)' : 'Falta'}
                              className={`h-7 w-7 rounded-md inline-flex items-center justify-center transition-colors ${
                                val === 'presente' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                : val === 'meia' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : val === 'falta' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-muted/40 text-muted-foreground hover:bg-muted'}`}>
                              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : val === 'presente' ? <Check className="h-3.5 w-3.5" />
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
          <p className="text-[11px] text-muted-foreground">
✓ presente · ◐ meia (0,5) · ✕ falta · · não marcado. A chamada é gravada na fonte (frequencia); faltas (FP = 0,5) e % são recalculados pelo sistema após cada marcação.
          </p>
        </>
      )}
    </div>
  );
}
