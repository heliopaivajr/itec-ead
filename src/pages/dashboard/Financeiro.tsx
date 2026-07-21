import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  DollarSign, AlertTriangle, CheckCircle2, Clock, Loader2,
  RefreshCw, Mail, Upload, X, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getInadimplentes,
  getMensalidadesByAluno,
  registrarPagamentoMensalidade,
  gerarMensalidadesMes,
  type Inadimplente,
  type Mensalidade,
} from '@/services/financeiro.service';
import { supabase } from '@/lib/supabase';
import type { DashboardContext } from '../Dashboard';

type Aba = 'inadimplentes' | 'mensalidades';

// ─── Modal Pagamento ──────────────────────────────────────────
interface ModalPagamentoProps {
  mensalidade: Mensalidade;
  onClose: () => void;
  onSaved: () => void;
  registradoPor: string;
}

function ModalPagamento({ mensalidade, onClose, onSaved, registradoPor }: ModalPagamentoProps) {
  const { toast }      = useToast();
  const [dataPag, setDataPag] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile]       = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    let url = '';

    if (file) {
      const path = `comprovantes/${mensalidade.aluno_id}_${mensalidade.mes_referencia}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('comprovantes-pagamento').upload(path, file, { upsert: true });
      if (upErr) {
        toast({ title: 'Erro no upload', description: upErr.message, variant: 'destructive' });
        setSalvando(false);
        return;
      }
      const { data } = supabase.storage.from('comprovantes-pagamento').getPublicUrl(path);
      url = data.publicUrl;
    }

    const { error } = await registrarPagamentoMensalidade(mensalidade.id, dataPag, url, registradoPor);
    setSalvando(false);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Pagamento registrado!' });
      onSaved();
    }
  };

  const mesLabel = new Date(mensalidade.mes_referencia + 'T12:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-merriweather font-bold text-foreground">Registrar Pagamento</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="text-sm space-y-2 bg-muted/20 rounded-lg p-3">
          <p><span className="text-muted-foreground">Referência:</span> <span className="font-medium text-foreground capitalize">{mesLabel}</span></p>
          <p><span className="text-muted-foreground">Valor:</span> <span className="font-medium text-foreground">R$ {mensalidade.valor.toFixed(2)}</span></p>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-sm text-foreground">Data do pagamento</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={dataPag} onChange={e => setDataPag(e.target.value)}
                className="bg-background border-border text-foreground" />
            </div>
          </div>

          <div>
            <Label className="text-sm text-foreground">Comprovante (opcional)</Label>
            <label className="flex items-center gap-2 mt-1.5 cursor-pointer border border-dashed border-border rounded-lg px-3 py-2 hover:border-primary/40 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{file ? file.name : 'Selecionar arquivo...'}</span>
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 border-border text-foreground">Cancelar</Button>
          <Button onClick={salvar} disabled={salvando} className="flex-1 bg-primary text-primary-foreground">
            {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar Pagamento
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────
export default function Financeiro() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();

  const [aba, setAba]                     = useState<Aba>('inadimplentes');
  const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>([]);
  const [loading, setLoading]             = useState(true);
  const [modalMens, setModalMens]         = useState<Mensalidade | null>(null);
  const [alunoMensalidades, setAlunoMensalidades] = useState<Record<string, Mensalidade[]>>({});
  const [expandido, setExpandido]         = useState<string | null>(null);

  const handleEnviarEmail = (aluno: Inadimplente) => {
    const assunto = encodeURIComponent('ITEC-EAD — Mensalidade em atraso');
    const corpo = encodeURIComponent(
      `Olá, ${aluno.nome}!\n\n` +
      `Identificamos ${aluno.mensalidades_atrasadas} ` +
      `mensalidade${aluno.mensalidades_atrasadas > 1 ? 's' : ''} em atraso ` +
      `totalizando R$ ${aluno.valor_total.toFixed(2)}.\n\n` +
      `Por favor, entre em contato com a secretaria para regularizar sua situação:\n` +
      `secretaria@itecedu.com\n` +
      `WhatsApp: (81) 99116-1448\n\n` +
      `Atenciosamente,\n` +
      `Secretaria ITEC-EAD`
    );
    window.open(`mailto:${aluno.email}?subject=${assunto}&body=${corpo}`, '_blank');
  };

  // Geração de mensalidades
  const [mesGerar, setMesGerar]         = useState('');
  const [valorGerar, setValorGerar]     = useState('');
  const [vencGerar, setVencGerar]       = useState('');
  const [gerando, setGerando]           = useState(false);

  const carregarInadimplentes = useCallback(async () => {
    setLoading(true);
    setInadimplentes(await getInadimplentes());
    setLoading(false);
  }, []);

  useEffect(() => { carregarInadimplentes(); }, [carregarInadimplentes]);

  const expandirAluno = async (alunoId: string) => {
    if (expandido === alunoId) { setExpandido(null); return; }
    setExpandido(alunoId);
    if (!alunoMensalidades[alunoId]) {
      const mens = await getMensalidadesByAluno(alunoId);
      setAlunoMensalidades(prev => ({ ...prev, [alunoId]: mens }));
    }
  };

  const gerar = async () => {
    if (!mesGerar || !valorGerar || !vencGerar) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setGerando(true);
    const { geradas, error } = await gerarMensalidadesMes(
      mesGerar + '-01', parseFloat(valorGerar), vencGerar, profile.id
    );
    setGerando(false);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: `${geradas} mensalidades geradas!`, description: `Referência: ${mesGerar}` });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-primary">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Controle de mensalidades e inadimplência</p>
        </div>
        {/* Etapa 2a: porta da Tabela de Preços p/ staff (o financeiro também tem no menu) */}
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/financeiro/precos">
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Tabela de Preços
          </Link>
        </Button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-muted/40 border border-border rounded-xl p-1 w-fit">
        {([
          ['inadimplentes', 'Inadimplentes'],
          ['mensalidades',  'Gerar Mensalidades'],
        ] as [Aba, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setAba(key)}
            className={`text-sm px-4 py-2 rounded-lg transition-colors ${
              aba === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Inadimplentes */}
      {aba === 'inadimplentes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? '...' : `${inadimplentes.length} aluno${inadimplentes.length !== 1 ? 's' : ''} em atraso`}
            </p>
            <Button variant="outline" size="sm" onClick={carregarInadimplentes} disabled={loading}
              className="border-border text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : inadimplentes.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3 opacity-70" />
              <p className="font-semibold text-foreground">Nenhum inadimplente</p>
              <p className="text-sm text-muted-foreground mt-1">Todos os alunos estão em dia.</p>
            </div>
          ) : (
            inadimplentes.map(aluno => (
              <div key={aluno.aluno_id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-start justify-between p-4">
                  <div>
                    <p className="font-semibold text-foreground">{aluno.nome}</p>
                    <p className="text-sm text-red-400 flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {aluno.mensalidades_atrasadas} mensalidade{aluno.mensalidades_atrasadas > 1 ? 's' : ''} atrasada{aluno.mensalidades_atrasadas > 1 ? 's' : ''} · R$ {aluno.valor_total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => expandirAluno(aluno.aluno_id)}
                      className="border-border text-muted-foreground text-xs">
                      {expandido === aluno.aluno_id ? 'Fechar' : 'Ver mensalidades'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-primary text-xs"
                      onClick={() => handleEnviarEmail(aluno)}
                      disabled={!aluno.email}
                      title={aluno.email
                        ? 'Abre seu cliente de e-mail com mensagem pré-preenchida'
                        : 'E-mail não cadastrado'}
                    >
                      <Mail className="h-3.5 w-3.5 mr-1" /> E-mail
                    </Button>
                  </div>
                </div>

                {/* Detalhes das mensalidades */}
                {expandido === aluno.aluno_id && (
                  <div className="border-t border-border divide-y divide-border/50 bg-muted/10">
                    {(alunoMensalidades[aluno.aluno_id] ?? [])
                      .filter(m => m.status === 'atrasado' || m.status === 'pendente')
                      .map(m => (
                        <div key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <div>
                            <span className="text-foreground font-medium capitalize">
                              {new Date(m.mes_referencia + 'T12:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                            <span className="ml-2 text-muted-foreground">R$ {m.valor.toFixed(2)}</span>
                          </div>
                          <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/80"
                            onClick={() => setModalMens(m)}>
                            <DollarSign className="h-3 w-3 mr-1" /> Registrar
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Gerar mensalidades */}
      {aba === 'mensalidades' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-5 max-w-md">
          <h2 className="font-semibold text-foreground">Gerar mensalidades do mês</h2>
          <p className="text-sm text-muted-foreground">
            Gera mensalidades para todos os alunos com matrícula ativa.
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-foreground">Mês de referência</Label>
              <Input type="month" value={mesGerar} onChange={e => setMesGerar(e.target.value)}
                className="mt-1.5 bg-background border-border text-foreground" />
            </div>
            <div>
              <Label className="text-sm text-foreground">Valor (R$)</Label>
              <Input type="number" step="0.01" placeholder="Ex: 200.00" value={valorGerar}
                onChange={e => setValorGerar(e.target.value)}
                className="mt-1.5 bg-background border-border text-foreground" />
            </div>
            <div>
              <Label className="text-sm text-foreground">Data de vencimento</Label>
              <Input type="date" value={vencGerar} onChange={e => setVencGerar(e.target.value)}
                className="mt-1.5 bg-background border-border text-foreground" />
            </div>
          </div>
          <Button onClick={gerar} disabled={gerando} className="w-full bg-primary text-primary-foreground">
            {gerando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
            Gerar mensalidades
          </Button>
        </div>
      )}

      {/* Modal pagamento */}
      {modalMens && (
        <ModalPagamento
          mensalidade={modalMens}
          registradoPor={profile.id}
          onClose={() => setModalMens(null)}
          onSaved={() => { setModalMens(null); carregarInadimplentes(); }}
        />
      )}
    </div>
  );
}
