import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Coins, Loader2, Save, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getTabelaPrecos, upsertPreco, type PrecoLinha, type TipoPreco } from '@/services/precos.service';
import type { DashboardContext } from '../Dashboard';

// Financeiro Etapa 2a — grade editável de preços (068).
// 2 blocos (Disciplinas / Família) × 4 linhas (1-4 disciplinas) × 4 valores.
// Quem chega aqui já passou no RoleGuard (staff+financeiro); a RLS
// (precos_write_gestao) é a fronteira real da escrita.

const COLUNAS = [
  { key: 'valor_matricula_ate',    label: 'Matrícula até 15/01' },
  { key: 'valor_matricula_apos',   label: 'Matrícula após 15/01' },
  { key: 'valor_mensalidade_ate',  label: 'Mensalidade até dia 10' },
  { key: 'valor_mensalidade_apos', label: 'Mensalidade após dia 10' },
] as const;
type ColKey = typeof COLUNAS[number]['key'];

type LinhaEdit = Record<ColKey, string>;   // inputs como string; valida ao salvar
const chave = (tipo: TipoPreco, qtd: number) => `${tipo}-${qtd}`;

const LINHA_VAZIA: LinhaEdit = {
  valor_matricula_ate: '', valor_matricula_apos: '',
  valor_mensalidade_ate: '', valor_mensalidade_apos: '',
};

export default function TabelaPrecos() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast } = useToast();

  const [ano, setAno]           = useState(2026);
  const [loading, setLoading]   = useState(true);
  const [linhas, setLinhas]     = useState<Record<string, LinhaEdit>>({});
  const [sujas, setSujas]       = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const dados = await getTabelaPrecos(ano);
    const mapa: Record<string, LinhaEdit> = {};
    for (const tipo of ['disciplinas', 'familia'] as TipoPreco[]) {
      for (let q = 1; q <= 4; q++) {
        const l = dados.find(d => d.tipo === tipo && d.qtd_disciplinas === q);
        mapa[chave(tipo, q)] = l
          ? {
              valor_matricula_ate:    String(l.valor_matricula_ate),
              valor_matricula_apos:   String(l.valor_matricula_apos),
              valor_mensalidade_ate:  String(l.valor_mensalidade_ate),
              valor_mensalidade_apos: String(l.valor_mensalidade_apos),
            }
          : { ...LINHA_VAZIA };
      }
    }
    setLinhas(mapa);
    setSujas(new Set());
    setLoading(false);
  }, [ano]);

  useEffect(() => { carregar(); }, [carregar]);

  const editar = (k: string, col: ColKey, v: string) => {
    setLinhas(prev => ({ ...prev, [k]: { ...prev[k], [col]: v } }));
    setSujas(prev => new Set(prev).add(k));
  };

  const salvarLinha = async (tipo: TipoPreco, qtd: number) => {
    const k = chave(tipo, qtd);
    const l = linhas[k];
    const valores = COLUNAS.map(c => parseFloat(l[c.key].replace(',', '.')));
    if (valores.some(v => isNaN(v) || v < 0)) {
      toast({ title: 'Valores inválidos', description: 'Preencha os 4 valores da linha (números ≥ 0).', variant: 'destructive' });
      return;
    }

    setSalvando(k);
    const { error } = await upsertPreco({
      ano, tipo, qtd_disciplinas: qtd,
      valor_matricula_ate:    valores[0],
      valor_matricula_apos:   valores[1],
      valor_mensalidade_ate:  valores[2],
      valor_mensalidade_apos: valores[3],
    }, profile.id);
    setSalvando(null);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error, variant: 'destructive' });
    } else {
      toast({ title: `Preço salvo — ${tipo === 'familia' ? 'Família' : 'Disciplinas'} · ${qtd} disciplina${qtd > 1 ? 's' : ''} · ${ano}` });
      setSujas(prev => { const s = new Set(prev); s.delete(k); return s; });
    }
  };

  const Bloco = ({ tipo, titulo, Icone }: { tipo: TipoPreco; titulo: string; Icone: React.ElementType }) => (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
        <Icone className="h-4 w-4 text-[#BF9000]" />
        <h2 className="font-semibold text-[#1F3864] dark:text-primary">{titulo}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left p-3 font-medium w-32">Disciplinas</th>
              {COLUNAS.map(c => (
                <th key={c.key} className="text-center p-3 font-medium min-w-[130px]">{c.label}</th>
              ))}
              <th className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {[1, 2, 3, 4].map(qtd => {
              const k = chave(tipo, qtd);
              const l = linhas[k] ?? LINHA_VAZIA;
              return (
                <tr key={k} className="hover:bg-muted/10">
                  <td className="p-3 font-semibold text-foreground">{qtd}</td>
                  {COLUNAS.map(c => (
                    <td key={c.key} className="p-2 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <Input
                          value={l[c.key]}
                          onChange={e => editar(k, c.key, e.target.value)}
                          inputMode="decimal"
                          placeholder="0,00"
                          className="w-24 h-8 text-right tabular-nums bg-background"
                        />
                      </div>
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <Button
                      size="sm"
                      variant={sujas.has(k) ? 'default' : 'outline'}
                      disabled={!sujas.has(k) || salvando === k}
                      onClick={() => salvarLinha(tipo, qtd)}
                    >
                      {salvando === k
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <><Save className="h-3.5 w-3.5 mr-1" /> Salvar</>}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-[#1F3864] dark:text-primary">
            Tabela de Preços
          </h1>
          <p className="text-muted-foreground mt-1">
            Valores por quantidade de disciplinas — matrícula (até/após 15/01) e mensalidade (até/após dia 10).
          </p>
        </div>

        {/* Seletor de ano */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1.5">
          <button onClick={() => setAno(a => a - 1)} className="p-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-bold tabular-nums text-[#BF9000] min-w-[3.5rem] text-center">{ano}</span>
          <button onClick={() => setAno(a => a + 1)} className="p-1 text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : (
        <>
          {Object.values(linhas).every(l => COLUNAS.every(c => l[c.key] === '')) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-500">
              Nenhum preço cadastrado para {ano}. Preencha as linhas e salve — ou rode o seed da migração 068 (ano 2026).
            </div>
          )}
          <Bloco tipo="disciplinas" titulo="Tabela Disciplinas" Icone={Coins} />
          <Bloco tipo="familia"     titulo="Tabela Família (2+ membros matriculados)" Icone={Users} />
          <p className="text-xs text-muted-foreground">
            Alterações valem para as PRÓXIMAS gerações de cobrança — mensalidades já geradas não mudam.
            Cada linha registra quem alterou e quando.
          </p>
        </>
      )}
    </div>
  );
}
