import { useCallback, useEffect, useState } from 'react';
import { Coins, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  getValoresEfetivos,
  setValoresMatricula,
  type ValoresEfetivos,
} from '@/services/financeiro.service';

// Financeiro Etapa 2b — painel "Valores do aluno" (069).
// Mostra o valor calculado (tabela_precos × qtd) + override editável por
// staff/financeiro. Régua no banco (resolver_valor_efetivo): override ?? tabela.
// Só edita quem passar no gate da função set_valores_matricula (is_staff OR
// is_financeiro) — a prop `editavel` só controla a UI (a RLS é a fronteira real).

interface Props {
  matriculaId: string;
  editavel?: boolean;   // default true; passe false para exibir somente-leitura
  onSaved?: () => void; // 2g — a ficha atualiza o resumo após salvar os valores
}

const brl = (v: number | null) =>
  v === null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ValoresMatriculaPanel({ matriculaId, editavel = true, onSaved }: Props) {
  const { toast } = useToast();
  const [dados, setDados]       = useState<ValoresEfetivos | null>(null);
  const [loading, setLoading]   = useState(true);
  const [salvando, setSalvando] = useState(false);

  // form de override (strings; vazio = sem override → usa a tabela)
  const [tipo, setTipo]         = useState<'disciplinas' | 'familia'>('disciplinas');
  const [ovMat, setOvMat]       = useState('');
  const [ovMens, setOvMens]     = useState('');
  const [obs, setObs]           = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    const d = await getValoresEfetivos(matriculaId);
    setDados(d);
    if (d) {
      setTipo(d.tipo_cobranca);
      setOvMat(d.origem_matricula   === 'override' ? String(d.valor_matricula_ate ?? '')   : '');
      setOvMens(d.origem_mensalidade === 'override' ? String(d.valor_mensalidade_ate ?? '') : '');
    }
    setLoading(false);
  }, [matriculaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async () => {
    const parse = (s: string): number | null => {
      const t = s.trim().replace(',', '.');
      return t === '' ? null : parseFloat(t);
    };
    const vMat  = parse(ovMat);
    const vMens = parse(ovMens);
    if ((vMat !== null && (isNaN(vMat) || vMat < 0)) || (vMens !== null && (isNaN(vMens) || vMens < 0))) {
      toast({ title: 'Valores inválidos', description: 'Deixe em branco para usar a tabela, ou informe um número ≥ 0.', variant: 'destructive' });
      return;
    }

    setSalvando(true);
    const { error } = await setValoresMatricula({
      matriculaId,
      tipoCobranca: tipo,
      valorMatricula: vMat,
      valorMensalidade: vMens,
      observacao: obs.trim() || null,
    });
    setSalvando(false);
    if (error) {
      toast({ title: 'Erro ao salvar valores', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Valores atualizados' });
      carregar();
      onSaved?.();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando valores…
      </div>
    );
  }
  if (!dados) {
    return <p className="text-sm text-muted-foreground py-2">Não foi possível resolver os valores desta matrícula.</p>;
  }

  const semTabela = dados.origem_mensalidade === 'sem_tabela';

  return (
    <div className="space-y-4">
      {/* Resumo calculado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Cobrança</p>
          <p className="font-semibold capitalize">{dados.tipo_cobranca}</p>
        </div>
        <div className="bg-muted/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Disciplinas</p>
          <p className="font-semibold tabular-nums">{dados.qtd_disciplinas}</p>
        </div>
        <div className="bg-muted/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Mensalidade (até dia 10)</p>
          <p className="font-semibold tabular-nums text-[#1F3864] dark:text-primary">{brl(dados.valor_mensalidade_ate)}</p>
          <span className={`text-[10px] font-medium ${dados.origem_mensalidade === 'override' ? 'text-[#BF9000]' : 'text-muted-foreground'}`}>
            {dados.origem_mensalidade === 'override' ? 'negociado' : dados.origem_mensalidade === 'tabela' ? 'da tabela' : 'sem tabela do ano'}
          </span>
        </div>
        <div className="bg-muted/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Taxa matrícula (até 15/01)</p>
          <p className="font-semibold tabular-nums">{brl(dados.valor_matricula_ate)}</p>
          <span className={`text-[10px] font-medium ${dados.origem_matricula === 'override' ? 'text-[#BF9000]' : 'text-muted-foreground'}`}>
            {dados.origem_matricula === 'override' ? 'negociado' : dados.origem_matricula === 'tabela' ? 'da tabela' : 'sem tabela do ano'}
          </span>
        </div>
      </div>

      {semTabela && (
        <p className="text-xs text-amber-500">
          Sem preço cadastrado para {dados.ano} ({dados.tipo_cobranca} · {dados.qtd_disciplinas} disciplina{dados.qtd_disciplinas > 1 ? 's' : ''}).
          Cadastre em Tabela de Preços ou informe um valor negociado abaixo.
        </p>
      )}

      {editavel ? (
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Coins className="h-4 w-4 text-[#BF9000]" /> Ajuste manual (negociação / família / bolsa)
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tabela de cobrança</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as 'disciplinas' | 'familia')}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
              >
                <option value="disciplinas">Disciplinas</option>
                <option value="familia">Família</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mensalidade negociada (R$)</label>
              <Input value={ovMens} onChange={e => setOvMens(e.target.value)} inputMode="decimal"
                placeholder="em branco = tabela" className="bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Taxa matrícula negociada (R$)</label>
              <Input value={ovMat} onChange={e => setOvMat(e.target.value)} inputMode="decimal"
                placeholder="em branco = tabela" className="bg-background" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Justificativa (obrigatória em negociações)</label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
              placeholder="Ex.: esposa do aluno João (família); bolsa parcial 50% aprovada em 20/07"
              className="bg-background" />
          </div>
          <div className="flex justify-end">
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
              Salvar valores
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Valor negociado é fixo (vale até e após o prazo). Deixe em branco para voltar ao preço da tabela.
            A alteração afeta as PRÓXIMAS mensalidades geradas.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Valores gerenciados pela secretaria/financeiro.
        </p>
      )}
    </div>
  );
}
