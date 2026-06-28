import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown, ChevronRight, Loader2, Plus, Edit2, Power, Hash, Check,
} from 'lucide-react';
import {
  getCursoAtivo, getModulosByCurso, getDisciplinasByModulo,
  type Modulo, type Disciplina,
} from '@/services/academico.service';
import {
  listarLancamentos, lancarDisciplinaRetroativa, editarLancamento,
  removerLancamento, gerarNumeroMatricula, statusFromNota,
  type LancamentoItem, type StatusDisciplina,
} from '@/services/matricula-academica.service';
import { calcularStatus } from '@/services/notas.service';
import { getProfessores, type Professor } from '@/services/professor.service';

const STATUS_LABEL: Record<StatusDisciplina, string> = {
  cursando: 'Cursando', aprovado: 'Aprovado', recuperacao: 'Em recuperação', reprovado: 'Reprovado',
  reprovado_falta: 'Rep. Falta', convalidado: 'Convalidado', trancado: 'Removido',
};
const STATUS_COLOR: Record<StatusDisciplina, string> = {
  cursando:        'bg-muted text-muted-foreground border-border',
  aprovado:        'bg-green-500/15 text-green-400 border-green-500/30',
  recuperacao:     'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  reprovado:       'bg-red-500/15 text-red-400 border-red-500/30',
  reprovado_falta: 'bg-red-500/15 text-red-400 border-red-500/30',
  convalidado:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
  trancado:        'bg-slate-500/15 text-slate-400 border-slate-500/30',
};
// Override manual NÃO inclui 'convalidado' (G2: convalidação vive na tela Convalidacoes)
// nem 'trancado' (use Remover). O badge 'Convalidado' ainda é EXIBIDO quando vier do banco.
const STATUS_OPTIONS: StatusDisciplina[] = ['cursando', 'aprovado', 'recuperacao', 'reprovado', 'reprovado_falta'];

function StatusBadge({ status }: { status: StatusDisciplina }) {
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

interface ModuloComDisc extends Modulo { disciplinas: Disciplina[] }

interface FormState {
  disciplinaId: string;
  disciplinaLabel: string;
  lancamentoId?: string;
  professorId: string;
  nota: string;
  faltas: string;
  frequencia: string;
  observacao: string;
  override: StatusDisciplina | 'auto';
}

interface Props {
  matricula: { id: string; numero_matricula?: string | null } | null;
  requesterId: string;
}

export default function LancamentoRetroativo({ matricula, requesterId }: Props) {
  const [loading, setLoading] = useState(true);
  const [modulos, setModulos] = useState<ModuloComDisc[]>([]);
  const [lancamentos, setLancamentos] = useState<Map<string, LancamentoItem>>(new Map());
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [numero, setNumero] = useState<string | null>(matricula?.numero_matricula ?? null);
  const [gerandoNumero, setGerandoNumero] = useState(false);
  const [aberto, setAberto] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6]));
  const [form, setForm] = useState<FormState | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const load = async () => {
    if (!matricula) { setLoading(false); return; }
    setLoading(true);
    const curso = await getCursoAtivo();
    if (!curso) { setModulos([]); setLoading(false); return; }

    const [mods, lancs, profs] = await Promise.all([
      getModulosByCurso(curso.id),
      listarLancamentos(matricula.id),
      getProfessores(1, 100, '', true),
    ]);

    const comDisc: ModuloComDisc[] = await Promise.all(
      mods.map(async m => ({ ...m, disciplinas: await getDisciplinasByModulo(m.id) }))
    );
    setModulos(comDisc);
    setLancamentos(new Map(lancs.map(l => [l.disciplina_id, l])));
    setProfessores(profs.data);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [matricula?.id]);

  const gerarNumero = async () => {
    if (!matricula) return;
    setGerandoNumero(true);
    const { numero: n, error } = await gerarNumeroMatricula(matricula.id);
    setGerandoNumero(false);
    if (error) { window.alert('Erro ao gerar número: ' + error); return; }
    setNumero(n);
  };

  const toggle = (ordem: number) => setAberto(prev => {
    const next = new Set(prev);
    next.has(ordem) ? next.delete(ordem) : next.add(ordem);
    return next;
  });

  const abrirNovo = (d: Disciplina) => setForm({
    disciplinaId: d.id, disciplinaLabel: `${d.codigo} — ${d.nome}`,
    professorId: '', nota: '', faltas: '', frequencia: '', observacao: '', override: 'auto',
  });

  const abrirEdicao = (d: Disciplina, l: LancamentoItem) => setForm({
    disciplinaId: d.id, disciplinaLabel: `${d.codigo} — ${d.nome}`, lancamentoId: l.id,
    professorId: l.professor_id ?? '',
    nota: l.nota?.toString() ?? '',
    faltas: l.faltas?.toString() ?? '',
    frequencia: l.frequencia_percentual?.toString() ?? '',
    observacao: l.observacao ?? '',
    override: 'auto',
  });

  // Status calculado em tempo real no modal
  const previewStatus: StatusDisciplina = (() => {
    if (!form) return 'cursando';
    if (form.override !== 'auto') return form.override;
    const nota = form.nota === '' ? null : Number(form.nota);
    const freq = form.frequencia === '' ? 100 : Number(form.frequencia);
    return statusFromNota(calcularStatus(nota, freq));
  })();

  const salvar = async () => {
    if (!form || !matricula) return;
    setErro('');
    const nota = form.nota === '' ? null : Number(form.nota);
    if (nota !== null && (nota < 0 || nota > 10)) { setErro('Nota deve estar entre 0 e 10.'); return; }
    const freq = form.frequencia === '' ? null : Number(form.frequencia);
    const faltas = form.faltas === '' ? null : Number(form.faltas);
    const statusOverride = form.override === 'auto' ? undefined : form.override;

    setSalvando(true);
    const res = form.lancamentoId
      ? await editarLancamento(form.lancamentoId, {
          professorId: form.professorId || null, nota, faltas, frequencia: freq,
          observacao: form.observacao || null, statusOverride,
        })
      : await lancarDisciplinaRetroativa({
          matriculaId: matricula.id, disciplinaId: form.disciplinaId,
          professorId: form.professorId || null, nota, faltas, frequencia: freq,
          observacao: form.observacao || null, aprovadoPor: requesterId, statusOverride,
        });
    setSalvando(false);
    if (res.error) { setErro(res.error); return; }
    setForm(null);
    load();
  };

  const remover = async (l: LancamentoItem) => {
    if (!window.confirm('Remover este lançamento? (soft delete — o registro vira "Removido", sem apagar do banco)')) return;
    const { error } = await removerLancamento(l.id);
    if (error) { window.alert('Erro ao remover: ' + error); return; }
    load();
  };

  if (!matricula) {
    return <p className="text-sm text-muted-foreground">Aluno sem matrícula — não é possível lançar disciplinas.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Nº da matrícula */}
      <div className="flex items-center justify-between gap-3 bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">Nº da matrícula:</span>
          {numero
            ? <span className="font-mono font-semibold text-primary">{numero}</span>
            : <span className="text-sm text-muted-foreground italic">não gerado</span>}
        </div>
        {!numero && (
          <Button size="sm" onClick={gerarNumero} disabled={gerandoNumero}
            className="bg-primary text-primary-foreground hover:bg-primary/90">
            {gerandoNumero ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Hash className="h-3.5 w-3.5 mr-1.5" />}
            Gerar nº da matrícula
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando grade...
        </div>
      ) : (
        <div className="space-y-3">
          {modulos.map(m => {
            const isOpen = aberto.has(m.ordem);
            return (
              <div key={m.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button onClick={() => toggle(m.ordem)}
                  className="w-full flex items-center gap-2 px-5 py-3 hover:bg-muted/20 transition-colors text-left">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-semibold text-foreground text-sm">{m.ordem}º — {m.nome}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{m.disciplinas.length} cadeiras</span>
                </button>
                {isOpen && (
                  <div className="border-t border-border divide-y divide-border/50">
                    {m.disciplinas.map(d => {
                      const l = lancamentos.get(d.id);
                      return (
                        <div key={d.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/10 group">
                          <span className="font-mono text-xs text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20 shrink-0 min-w-[64px] text-center">{d.codigo}</span>
                          <span className="text-sm text-foreground flex-1 truncate">{d.nome}</span>
                          {l ? (
                            <div className="flex items-center gap-2 shrink-0">
                              {l.nota !== null && l.nota !== undefined && <span className="text-xs text-muted-foreground">{Number(l.nota).toFixed(1)}</span>}
                              {l.frequencia_percentual !== null && l.frequencia_percentual !== undefined && <span className="text-[10px] text-muted-foreground">{l.frequencia_percentual}%</span>}
                              <StatusBadge status={l.status} />
                              <button onClick={() => abrirEdicao(d, l)} title="Editar" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              {l.status !== 'trancado' && (
                                <button onClick={() => remover(l)} title="Remover" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                                  <Power className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => abrirNovo(d)}
                              className="h-7 text-xs border-border text-foreground hover:text-primary shrink-0">
                              <Plus className="h-3 w-3 mr-1" /> Lançar
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal lançar/editar */}
      {form && (
        <Dialog open onOpenChange={() => setForm(null)}>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-merriweather text-foreground">
                {form.lancamentoId ? 'Editar lançamento' : 'Lançar disciplina'}
                <span className="ml-2 text-sm font-mono text-primary font-normal">{form.disciplinaLabel}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Professor</Label>
                <Select value={form.professorId || 'none'} onValueChange={v => setForm(f => f && ({ ...f, professorId: v === 'none' ? '' : v }))}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-56">
                    <SelectItem value="none">— sem professor —</SelectItem>
                    {professores.map(p => <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground">Nota (0–10)</Label>
                  <Input type="number" min={0} max={10} step="0.1" value={form.nota}
                    onChange={e => setForm(f => f && ({ ...f, nota: e.target.value }))}
                    className="bg-background border-border text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground">Faltas</Label>
                  <Input type="number" min={0} value={form.faltas}
                    onChange={e => setForm(f => f && ({ ...f, faltas: e.target.value }))}
                    className="bg-background border-border text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground">Frequência %</Label>
                  <Input type="number" min={0} max={100} value={form.frequencia}
                    onChange={e => setForm(f => f && ({ ...f, frequencia: e.target.value }))}
                    className="bg-background border-border text-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Observação</Label>
                <Textarea value={form.observacao} onChange={e => setForm(f => f && ({ ...f, observacao: e.target.value }))}
                  className="bg-background border-border text-foreground min-h-[60px]" />
              </div>

              {/* Status calculado + override */}
              <div className="flex items-center gap-3 bg-background/40 border border-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status calculado:</span>
                  <StatusBadge status={previewStatus} />
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Override</Label>
                  <Select value={form.override} onValueChange={v => setForm(f => f && ({ ...f, override: v as StatusDisciplina | 'auto' }))}>
                    <SelectTrigger className="bg-background border-border text-foreground text-xs h-8 w-40"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="auto">Automático</SelectItem>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {erro && <p className="text-xs text-red-400">{erro}</p>}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setForm(null)} className="text-muted-foreground">Cancelar</Button>
              <Button onClick={salvar} disabled={salvando} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                {form.lancamentoId ? 'Salvar' : 'Lançar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
