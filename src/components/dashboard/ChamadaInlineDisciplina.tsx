import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, X, Loader2, Plus, ExternalLink, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDatePtBR } from '@/utils/date';
import {
  getFrequenciaByDisciplina, lancarFrequencia,
  type RegistroFrequencia, type TipoPresenca, type LancarRegistro,
} from '@/services/frequencia.service';

// Chamada por DATA de uma disciplina, embutida na linha do Histórico (SPEC-16 P2b).
//
// Por que por data e não "total de faltas": `frequencia` é aluno × data_aula (UNIQUE),
// com data_aula e professor_id NOT NULL. Informar só um total exigiria FABRICAR datas
// inexistentes — aulas fantasma na tela de Chamada e no R02. Aqui gravamos a linha real
// da data, exatamente como o resto do sistema (LICAO-042: bruto → trigger 065 consolida).
//
// Faltas/Freq% NÃO são calculados aqui: quem calcula é o banco. Após salvar, o pai relê
// o histórico (onSalvo) e mostra o que o trigger decidiu.

interface ChamadaInlineDisciplinaProps {
  alunoId: string;
  disciplinaId: string;
  turmaId: string;
  /** profiles.id de quem está lançando (frequencia.professor_id → profiles). */
  registradoPor: string;
  /** Recarrega o histórico no pai depois que o banco consolidou. */
  onSalvo: () => Promise<void> | void;
  /** Atalho para a tela cheia (gera datas em massa). */
  onAbrirFrequencia: () => void;
}

const proximoEstado = (atual: TipoPresenca | undefined): TipoPresenca =>
  atual === undefined ? 'presente' : atual === 'presente' ? 'meia' : atual === 'meia' ? 'falta' : 'presente';

export function ChamadaInlineDisciplina({
  alunoId, disciplinaId, turmaId, registradoPor, onSalvo, onAbrirFrequencia,
}: ChamadaInlineDisciplinaProps) {
  const [registros, setRegistros]   = useState<RegistroFrequencia[]>([]);
  const [datasExtra, setDatasExtra] = useState<string[]>([]);
  const [pendentes, setPendentes]   = useState<Map<string, TipoPresenca>>(new Map());
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [novaData, setNovaData]     = useState('');
  const { toast } = useToast();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setRegistros(await getFrequenciaByDisciplina(disciplinaId, alunoId));
    setPendentes(new Map());
    setDatasExtra([]);
    setCarregando(false);
  }, [disciplinaId, alunoId]);

  useEffect(() => { void carregar(); }, [carregar]);

  const datas = useMemo(() => {
    const s = new Set<string>(registros.map(r => r.data_aula));
    datasExtra.forEach(d => s.add(d));
    return [...s].sort();
  }, [registros, datasExtra]);

  const salvo = useMemo(() => {
    const m = new Map<string, TipoPresenca>();
    for (const r of registros) m.set(r.data_aula, r.tipo_presenca ?? (r.presente ? 'presente' : 'falta'));
    return m;
  }, [registros]);

  const estadoDe = (data: string) => (pendentes.has(data) ? pendentes.get(data) : salvo.get(data));

  const ciclar = (data: string) =>
    setPendentes(prev => new Map(prev).set(data, proximoEstado(estadoDe(data))));

  const adicionarData = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
      toast({ title: 'Escolha uma data válida', variant: 'destructive' });
      return;
    }
    if (datas.includes(novaData)) { toast({ title: 'Essa data já está na chamada' }); return; }
    setDatasExtra(prev => [...prev, novaData]);
    setNovaData('');
  };

  const salvar = async () => {
    if (pendentes.size === 0) return;
    setSalvando(true);
    const lote: LancarRegistro[] = [...pendentes].map(([data_aula, tipo]) => ({
      disciplina_id: disciplinaId, aluno_id: alunoId, professor_id: registradoPor,
      data_aula, tipo_presenca: tipo, justificada: false, documento_url: null, observacao: null,
    }));

    const { error } = await lancarFrequencia(lote);   // 1 upsert, N linhas
    setSalvando(false);

    if (error) {
      // LICAO-027: motivo real na tela e pendências preservadas.
      toast({ title: 'Erro ao salvar a chamada', description: error, variant: 'destructive' });
      return;
    }
    await carregar();
    await onSalvo();
    toast({ title: 'Chamada salva', description: 'Faltas e frequência foram recalculadas pelo sistema.' });
  };

  if (carregando) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando chamada…
      </div>
    );
  }

  return (
    <div className="space-y-2 py-1">
      {datas.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma chamada lançada nesta disciplina. Adicione uma data abaixo ou use a tela
          completa para gerar várias de uma vez.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {datas.map(d => {
            const val  = estadoDe(d);
            const pend = pendentes.has(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => ciclar(d)}
                aria-label={`${formatDatePtBR(d)} — ${val ?? 'não marcado'}`}
                title={val === undefined ? 'Não marcado — clique para ciclar' : val === 'presente' ? 'Presente' : val === 'meia' ? 'Meia-presença (0,5)' : 'Falta'}
                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] transition-colors ${
                  val === 'presente' ? 'border-green-500/40 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : val === 'meia'   ? 'border-amber-500/40 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : val === 'falta'  ? 'border-red-500/40 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                } ${pend ? 'ring-2 ring-primary/60' : ''}`}
              >
                {new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                {val === 'presente' ? <Check className="h-3 w-3" />
                  : val === 'meia'  ? <span className="font-bold">◐</span>
                  : val === 'falta' ? <X className="h-3 w-3" /> : <span>·</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <Input type="date" value={novaData} onChange={e => setNovaData(e.target.value)}
          className="h-7 w-36 bg-background text-xs" aria-label="Nova data de chamada" />
        <Button variant="outline" size="sm" onClick={adicionarData} className="h-7 border-border px-2">
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onAbrirFrequencia}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
          <ExternalLink className="h-3.5 w-3.5 mr-1" /> abrir Frequência completa
        </Button>

        {pendentes.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-primary font-medium">
              ● {pendentes.size} {pendentes.size === 1 ? 'alteração' : 'alterações'}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPendentes(new Map())}
              disabled={salvando} className="h-7 border-border text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={salvar} disabled={salvando} className="h-7 text-xs">
              {salvando
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Salvando…</>
                : <><Save className="h-3.5 w-3.5 mr-1" /> Salvar</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChamadaInlineDisciplina;
