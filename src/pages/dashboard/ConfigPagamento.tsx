import { useCallback, useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Loader2, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getConfigFinanceiro,
  upsertConfigFinanceiro,
  PLACEHOLDER_PIX,
  type ConfigFinanceiro,
} from '@/services/financeiro.service';
import type { DashboardContext } from '../Dashboard';

// Financeiro — edição da config PIX (077). Quem chega aqui passou no RoleGuard
// (staff+financeiro); a RLS config_financeiro_write é a fronteira real da escrita.
// A tela "Meu Financeiro" do aluno lê desta config.

const TIPOS = [
  { v: 'email',     label: 'E-mail' },
  { v: 'cpf',       label: 'CPF' },
  { v: 'cnpj',      label: 'CNPJ' },
  { v: 'telefone',  label: 'Telefone' },
  { v: 'aleatoria', label: 'Aleatória' },
];

const VAZIO: ConfigFinanceiro = {
  chave_pix: '', tipo_chave: 'email', beneficiario: '', cidade: '', instrucoes: '',
};

export default function ConfigPagamento() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();

  const [form, setForm]       = useState<ConfigFinanceiro>(VAZIO);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const cfg = await getConfigFinanceiro();
    if (cfg) setForm({
      chave_pix:    cfg.chave_pix ?? '',
      tipo_chave:   cfg.tipo_chave ?? 'email',
      beneficiario: cfg.beneficiario ?? '',
      cidade:       cfg.cidade ?? '',
      instrucoes:   cfg.instrucoes ?? '',
    });
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const set = (k: keyof ConfigFinanceiro, v: string) => setForm(p => ({ ...p, [k]: v }));

  const placeholderAtivo = !form.chave_pix || form.chave_pix.trim() === '' || form.chave_pix.trim() === PLACEHOLDER_PIX;

  const salvar = async () => {
    if (!form.chave_pix || form.chave_pix.trim() === '' || form.chave_pix.trim() === PLACEHOLDER_PIX) {
      toast({ title: 'Informe a chave PIX real', description: 'Os alunos precisam dela para pagar.', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    const { error } = await upsertConfigFinanceiro(form, profile.id);
    setSalvando(false);
    if (error) { toast({ title: 'Erro ao salvar', description: error, variant: 'destructive' }); return; }
    toast({ title: 'Configuração de pagamento salva', description: 'Os alunos já veem a chave em "Meu Financeiro".' });
    carregar();
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <Link to="/dashboard/financeiro" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-3">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Financeiro
        </Link>
        <h1 className="text-2xl font-merriweather font-bold text-[#1F3864] dark:text-primary flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-[#BF9000]" /> Configurações de Pagamento
        </h1>
        <p className="text-muted-foreground mt-1">Chave PIX exibida ao aluno na tela "Meu Financeiro". Boleto — em breve.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          {placeholderAtivo && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-300">
                A chave PIX ainda não está configurada — os alunos não conseguem pagar. Preencha e salve.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Chave PIX</label>
              <Input value={form.chave_pix ?? ''} onChange={e => set('chave_pix', e.target.value)}
                placeholder="ex.: financeiro@itecedu.com" className="bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo da chave</label>
              <select value={form.tipo_chave ?? 'email'} onChange={e => set('tipo_chave', e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm h-10">
                {TIPOS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Beneficiário</label>
              <Input value={form.beneficiario ?? ''} onChange={e => set('beneficiario', e.target.value)}
                placeholder="Instituto de Teologia Cristã" className="bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
              <Input value={form.cidade ?? ''} onChange={e => set('cidade', e.target.value)}
                placeholder="Paulista/PE" className="bg-background" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Instruções ao aluno (opcional)</label>
            <Textarea value={form.instrucoes ?? ''} onChange={e => set('instrucoes', e.target.value)} rows={2}
              placeholder="Ex.: envie o comprovante pelo sistema após o PIX. Dúvidas: WhatsApp (81) 99116-1448."
              className="bg-background" />
          </div>

          <div className="flex justify-end">
            <Button onClick={salvar} disabled={salvando} className="bg-[#1F3864] hover:bg-[#1F3864]/90 text-white">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
              Salvar configuração
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            A escrita é limitada à secretaria/financeiro (RLS). Após salvar, a chave aparece para os alunos imediatamente.
          </p>
        </div>
      )}
    </div>
  );
}
