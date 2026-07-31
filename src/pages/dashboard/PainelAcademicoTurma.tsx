import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { GraduationCap, Loader2, Printer, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import { getAlunosEmRiscoByTurma } from '@/services/frequencia.service';
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

      {/* Grade */}
      {!turmaId || !disciplinaId ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          Escolha a turma e a disciplina para ver a grade de notas.
        </div>
      ) : loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-11 rounded-lg" />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          {rows.length === 0 ? 'Nenhum aluno matriculado nesta turma.' : 'Nenhum aluno para o filtro atual.'}
        </div>
      ) : (
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
      )}
    </div>
  );
}
