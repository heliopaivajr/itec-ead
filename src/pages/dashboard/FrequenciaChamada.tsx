import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { ClipboardCheck, Loader2, Printer, Plus, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getTurmasAtivas, getDisciplinasDaTurma, type Turma, type DisciplinaTurma } from '@/services/turmas.service';
import { getConsolidadoTurma, type ConsolidadoAluno } from '@/services/notas.service';
import {
  getFrequenciaByDisciplina, lancarFrequencia, type RegistroFrequencia,
} from '@/services/frequencia.service';
import type { DashboardContext } from '../Dashboard';

// Frequência/Chamada — tela dedicada de TELA CHEIA (menu direto, staff + professor).
// Planilha alunos × datas de aula, editável inline (P/F). Escrita no BRUTO
// (lancarFrequencia → frequencia; upsert cria a linha da data); faltas/% READ do
// consolidado (trigger 065). NUNCA escreve total no consolidado (LICAO-042/043).
// Parte 1: só 2 estados (presente/falta). Meia-presença (FP) fica p/ a Parte 2 (migração+trigger).

export default function FrequenciaChamada() {
  const params = useParams<{ turmaId?: string; disciplinaId?: string }>();
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();

  const [turmas, setTurmas]       = useState<Turma[]>([]);
  const [turmaId, setTurmaId]     = useState(params.turmaId ?? '');
  const [disciplinas, setDisciplinas] = useState<DisciplinaTurma[]>([]);
  const [disciplinaId, setDisciplinaId] = useState(params.disciplinaId ?? '');

  const [rows, setRows]           = useState<ConsolidadoAluno[]>([]);
  const [registros, setRegistros] = useState<RegistroFrequencia[]>([]);
  const [datasExtra, setDatasExtra] = useState<string[]>([]);
  const [novaData, setNovaData]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [busca, setBusca]         = useState('');

  useEffect(() => { getTurmasAtivas().then(setTurmas); }, []);

  useEffect(() => {
    if (!turmaId) { setDisciplinas([]); return; }
    getDisciplinasDaTurma(turmaId).then(setDisciplinas);
  }, [turmaId]);

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
    setLoading(false);
  }, [turmaId, disciplinaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const datas = useMemo(() => {
    const s = new Set<string>(registros.map(r => r.data_aula));
    datasExtra.forEach(d => s.add(d));
    return [...s].sort();
  }, [registros, datasExtra]);

  const presenca = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const r of registros) m.set(`${r.aluno_id}|${r.data_aula}`, r.presente);
    return m;
  }, [registros]);

  const faltasDoAluno = useCallback((alunoId: string) =>
    registros.filter(r => r.aluno_id === alunoId && r.presente === false).length,
  [registros]);

  const alunos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? rows.filter(r => r.nome.toLowerCase().includes(q)) : rows;
  }, [rows, busca]);

  const adicionarData = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData)) { toast({ title: 'Escolha uma data válida', variant: 'destructive' }); return; }
    if (datas.includes(novaData)) { toast({ title: 'Essa data já está na grade' }); return; }
    setDatasExtra(prev => [...prev, novaData]);
    setNovaData('');
  };

  const togglePresenca = async (alunoId: string, data: string) => {
    const atual = presenca.get(`${alunoId}|${data}`);
    const novo = atual === undefined ? false : !atual;   // 1º clique = FALTA; alterna depois
    setSavingCell(`${alunoId}|${data}`);
    const { error } = await lancarFrequencia([{
      disciplina_id: disciplinaId, aluno_id: alunoId, professor_id: profile.id,
      data_aula: data, presente: novo, justificada: false, documento_url: null, observacao: null,
    }]);
    if (error) { setSavingCell(null); toast({ title: 'Erro ao salvar chamada', description: error, variant: 'destructive' }); return; }
    const [regs, cons] = await Promise.all([getFrequenciaByDisciplina(disciplinaId), getConsolidadoTurma(turmaId, disciplinaId)]);
    setRegistros(regs);
    setRows(cons);
    setSavingCell(null);
  };

  const turmaSel = turmas.find(t => t.id === turmaId);
  const discSel  = disciplinas.find(d => d.id === disciplinaId);
  const pronto   = turmaId && disciplinaId;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Barra superior fixa */}
      <div className="border-b border-border bg-card/95 backdrop-blur px-4 py-3 flex items-end gap-3 flex-wrap sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-2 mr-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-[#1F3864] dark:text-primary whitespace-nowrap">Frequência / Chamada</h1>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground block">Turma</label>
          <select value={turmaId} onChange={e => { setTurmaId(e.target.value); setDisciplinaId(''); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm h-9 min-w-[10rem]">
            <option value="">Selecione…</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.codigo} — {t.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground block">Disciplina</label>
          <select value={disciplinaId} onChange={e => setDisciplinaId(e.target.value)} disabled={!turmaId}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm h-9 min-w-[10rem] disabled:opacity-50">
            <option value="">{turmaId ? 'Selecione…' : 'Escolha a turma'}</option>
            {disciplinas.map(d => <option key={d.id} value={d.id}>{d.codigo ? `${d.codigo} — ` : ''}{d.nome}</option>)}
          </select>
        </div>
        {pronto && (
          <>
            <div className="relative">
              <label className="text-[11px] text-muted-foreground block">Buscar aluno</label>
              <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="nome…" className="bg-background h-9 w-40" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block">Nova chamada</label>
              <div className="flex gap-1.5">
                <Input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} className="bg-background h-9 w-40" />
                <Button variant="outline" onClick={adicionarData} className="border-border h-9"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.print()} className="border-border h-9 ml-auto self-end">
              <Printer className="h-4 w-4 mr-1.5" /> Imprimir
            </Button>
          </>
        )}
      </div>

      {/* Planilha */}
      <div className="flex-1 p-4">
        {!pronto ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Escolha a turma e a disciplina para lançar a chamada.
          </div>
        ) : loading ? (
          <div className="space-y-2">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : rows.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum aluno matriculado nesta turma.</div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              {discSel?.nome} · {turmaSel?.codigo} — {alunos.length} aluno(s) · {datas.length} chamada(s).
              Clique numa célula: 1º clique marca <strong>falta</strong>, próximo alterna. ✅ presente · ❌ falta · · não marcado.
            </p>
            {datas.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                Nenhuma chamada lançada. Use “Nova chamada” na barra acima para criar a primeira data.
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-auto max-h-[calc(100vh-11rem)]">
                <table className="text-sm border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="text-xs text-muted-foreground bg-card border-b border-border">
                      <th className="px-4 py-2.5 font-medium text-left sticky left-0 bg-card z-20 min-w-[13rem]">Aluno</th>
                      {datas.map(d => (
                        <th key={d} className="px-2 py-2.5 font-medium text-center whitespace-nowrap min-w-[3.5rem]">
                          {new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap bg-card">Faltas</th>
                      <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap bg-card">Freq.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.map(r => (
                      <tr key={r.aluno_id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2 text-foreground sticky left-0 bg-card z-10 whitespace-nowrap">
                          {r.nome}
                          {r.frequencia < 75 && <AlertTriangle className="inline h-3.5 w-3.5 ml-1.5 text-amber-500" />}
                        </td>
                        {datas.map(d => {
                          const key = `${r.aluno_id}|${d}`;
                          const val = presenca.get(key);
                          const saving = savingCell === key;
                          return (
                            <td key={d} className="px-2 py-1.5 text-center">
                              <button onClick={() => togglePresenca(r.aluno_id, d)} disabled={saving}
                                title={val === undefined ? 'Não marcado — clique para marcar falta' : val ? 'Presente' : 'Falta'}
                                className={`h-7 w-7 rounded-md inline-flex items-center justify-center transition-colors ${
                                  val === true ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                  : val === false ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'}`}>
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : val === true ? <Check className="h-3.5 w-3.5" /> : val === false ? <X className="h-3.5 w-3.5" /> : '·'}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center tabular-nums font-semibold text-foreground">{faltasDoAluno(r.aluno_id)}</td>
                        <td className={`px-3 py-2 text-center tabular-nums ${r.frequencia < 75 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>{r.frequencia}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">
              A chamada é gravada na fonte (frequencia); faltas e % (situação/histórico do aluno) são recalculados pelo sistema após cada marcação.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
