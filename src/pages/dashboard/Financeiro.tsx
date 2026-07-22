import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  DollarSign, AlertTriangle, CheckCircle2, Clock, Loader2,
  RefreshCw, Mail, Upload, X, Calendar, ChevronLeft, ChevronRight,
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
  previewGerarMensalidades,
  setValorMensalidadeOverride,
  type Inadimplente,
  type Mensalidade,
  type PreviewMensalidade,
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

  // Geração de mensalidades (Etapa 2c: preview → confirmar; valor efetivo; idempotente)
  const [mesGerar, setMesGerar]         = useState('');           // input type=month → 'YYYY-MM'
  const [diaVenc, setDiaVenc]           = useState('10');
  const [preview, setPreview]           = useState<PreviewMensalidade[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [gerando, setGerando]           = useState(false);
  // 2c.1: seleção por matrícula. Elegível = !ja_existe && origem !== 'sem_tabela'.
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const anoMes = (): { ano: number; mes: number } | null => {
    const m = /^(\d{4})-(\d{2})$/.exec(mesGerar);
    return m ? { ano: parseInt(m[1], 10), mes: parseInt(m[2], 10) } : null;
  };

  // Validação do dia de vencimento (1-31)
  const diaVencNum    = parseInt(diaVenc, 10);
  const diaVencValido = !isNaN(diaVencNum) && diaVencNum >= 1 && diaVencNum <= 31;

  // Navegação rápida de mês (◀ ▶)
  const shiftMes = (delta: number) => {
    const am = anoMes();
    const base = am ? new Date(am.ano, am.mes - 1, 1) : new Date();
    base.setMonth(base.getMonth() + delta);
    setMesGerar(`${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`);
  };

  const elegivel = (p: PreviewMensalidade) => !p.ja_existe && p.origem !== 'sem_tabela';

  const carregarPreview = useCallback(async (silencioso = false) => {
    const m = /^(\d{4})-(\d{2})$/.exec(mesGerar);
    if (!m) { if (!silencioso) toast({ title: 'Selecione o mês de referência', variant: 'destructive' }); return; }
    setPreviewLoading(true);
    const dados = await previewGerarMensalidades(parseInt(m[1], 10), parseInt(m[2], 10));
    setPreview(dados);
    // Padrão (opção A): todas as ELEGÍVEIS marcadas.
    setSelecionados(new Set(dados.filter(elegivel).map(p => p.matricula_id)));
    setPreviewLoading(false);
  }, [mesGerar, toast]);

  // Preview REATIVO: ao escolher/mudar o mês, atualiza sozinho (debounce 400ms).
  useEffect(() => {
    if (aba !== 'mensalidades') return;
    if (!/^\d{4}-\d{2}$/.test(mesGerar)) { setPreview(null); return; }
    const t = setTimeout(() => carregarPreview(true), 400);
    return () => clearTimeout(t);
  }, [mesGerar, aba, carregarPreview]);

  const toggleUm = (id: string) =>
    setSelecionados(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  // 2c.2: edição inline do valor da mensalidade → grava o override PERMANENTE.
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valorEdit, setValorEdit]   = useState('');
  const [salvandoValor, setSalvandoValor] = useState(false);

  const abrirEdicao = (p: PreviewMensalidade) => {
    setEditandoId(p.matricula_id);
    setValorEdit(p.valor !== null ? String(p.valor) : '');
  };

  const salvarValorInline = async (p: PreviewMensalidade) => {
    const t = valorEdit.trim().replace(',', '.');
    const v = t === '' ? null : parseFloat(t);
    if (v !== null && (isNaN(v) || v < 0)) {
      toast({ title: 'Valor inválido', description: 'Informe um número ≥ 0 (ou vazio para voltar à tabela).', variant: 'destructive' });
      return;
    }
    setSalvandoValor(true);
    const { error } = await setValorMensalidadeOverride(p.matricula_id, v);
    setSalvandoValor(false);
    if (error) {
      toast({ title: 'Erro ao salvar valor', description: error, variant: 'destructive' });
      return;
    }
    toast({ title: `Valor de ${p.nome} atualizado`, description: v === null ? 'Voltou ao preço da tabela.' : `Negociado: R$ ${v.toFixed(2)} (permanente).` });
    setEditandoId(null);
    carregarPreview();  // resolver_valor_efetivo agora traz o override → origem vira 'negociado', total recalcula
  };

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
    const am = anoMes();
    if (!am) { toast({ title: 'Selecione o mês de referência', variant: 'destructive' }); return; }
    const ids = Array.from(selecionados);
    if (ids.length === 0) { toast({ title: 'Selecione ao menos um aluno', variant: 'destructive' }); return; }
    setGerando(true);
    const { resultado, error } = await gerarMensalidadesMes(am.ano, am.mes, parseInt(diaVenc, 10) || 10, profile.id, ids);
    setGerando(false);
    if (error || !resultado) {
      toast({ title: 'Erro ao gerar', description: error ?? 'Sem resultado', variant: 'destructive' });
    } else {
      toast({
        title: `${resultado.geradas} mensalidade(s) gerada(s)`,
        description: `${resultado.ja_existiam} já existiam · ${resultado.sem_preco} sem preço · ref. ${mesGerar}`,
      });
      carregarPreview(); // as geradas viram "já existe" (checkbox desabilita)
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

      {/* Gerar mensalidades — preview → confirmar (valor efetivo, idempotente) */}
      {aba === 'mensalidades' && (() => {
        const elegiveis = (preview ?? []).filter(elegivel);
        const jaExiste  = (preview ?? []).filter(p => p.ja_existe).length;
        const semPreco  = (preview ?? []).filter(p => p.origem === 'sem_tabela').length;
        const selConta  = elegiveis.filter(p => selecionados.has(p.matricula_id));
        const total     = selConta.reduce((s, p) => s + (p.valor ?? 0), 0);
        const todosSel  = elegiveis.length > 0 && selConta.length === elegiveis.length;
        const marcarTodos = (marcar: boolean) =>
          setSelecionados(marcar ? new Set(elegiveis.map(p => p.matricula_id)) : new Set());
        return (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-lg">
              <div>
                <h2 className="font-semibold text-foreground">Gerar mensalidades do mês</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Valor por aluno vem da <strong>Tabela de Preços</strong> (nº de disciplinas × tipo) ou do
                  <strong> valor negociado</strong> da matrícula. Só matrículas ativas. Não duplica nem sobrescreve pagas.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-foreground">Mês de referência</Label>
                  <div className="mt-1.5 flex items-center gap-1">
                    <button type="button" onClick={() => shiftMes(-1)}
                      className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                      title="Mês anterior">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <Input type="month" value={mesGerar}
                      onChange={e => setMesGerar(e.target.value)}
                      className="bg-background border-border text-foreground text-center" />
                    <button type="button" onClick={() => shiftMes(1)}
                      className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                      title="Próximo mês">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-foreground">Dia de vencimento</Label>
                  <Input type="number" min={1} max={31} value={diaVenc}
                    onChange={e => setDiaVenc(e.target.value)}
                    className={`mt-1.5 bg-background text-foreground ${diaVencValido ? 'border-border' : 'border-destructive'}`} />
                  {!diaVencValido && <p className="text-[11px] text-destructive mt-1">Informe um dia entre 1 e 31.</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground flex-1">
                  {previewLoading ? 'Atualizando prévia…' : 'A prévia atualiza sozinha ao mudar o mês.'}
                </p>
                <Button variant="outline" size="sm" onClick={() => carregarPreview()} disabled={previewLoading || !mesGerar}>
                  {previewLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                  Atualizar
                </Button>
              </div>
            </div>

            {preview && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-3xl">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-green-400 font-semibold">
                    {selConta.length} selecionado(s) de {elegiveis.length} elegíveis · R$ {total.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">{jaExiste} já existem</span>
                  {semPreco > 0 && <span className="text-amber-500">{semPreco} sem preço</span>}
                </div>
                <p className="text-[11px] text-muted-foreground -mt-1">
                  💡 Clique no valor "Até dia {diaVenc}" para editar o <strong>valor negociado do aluno</strong> — é permanente (vale para os próximos meses), não só desta geração. Vazio = volta ao preço da tabela.
                </p>

                {preview.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma matrícula ativa.</p>
                ) : (
                  <div className="overflow-x-auto max-h-[50vh]">
                    <table className="w-full text-sm">
                      <thead className="text-muted-foreground border-b sticky top-0 bg-card">
                        <tr className="text-left">
                          <th className="pb-2 pl-1 w-8">
                            <input
                              type="checkbox"
                              checked={todosSel}
                              disabled={elegiveis.length === 0}
                              onChange={e => marcarTodos(e.target.checked)}
                              title={todosSel ? 'Desmarcar todos' : 'Selecionar todos os elegíveis'}
                              className="accent-primary"
                            />
                          </th>
                          <th className="pb-2 font-medium">Aluno</th>
                          <th className="pb-2 font-medium text-center">Disc.</th>
                          <th className="pb-2 font-medium text-right">Até dia {diaVenc}</th>
                          <th className="pb-2 font-medium text-right">Após</th>
                          <th className="pb-2 font-medium text-center">Origem</th>
                          <th className="pb-2 font-medium text-center">Situação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {preview.map(p => {
                          const ok = elegivel(p);
                          return (
                            <tr key={p.matricula_id} className={ok ? '' : 'opacity-50'}>
                              <td className="py-2 pl-1">
                                <input
                                  type="checkbox"
                                  checked={ok && selecionados.has(p.matricula_id)}
                                  disabled={!ok}
                                  onChange={() => toggleUm(p.matricula_id)}
                                  className="accent-primary"
                                  title={ok ? undefined : p.ja_existe ? 'Já existe mensalidade deste mês' : 'Sem preço na tabela'}
                                />
                              </td>
                              <td className="py-2 font-medium">{p.nome}</td>
                              <td className="py-2 text-center tabular-nums">{p.qtd_disciplinas}</td>
                              <td className="py-2 text-right tabular-nums">
                                {editandoId === p.matricula_id ? (
                                  <div className="flex items-center gap-1 justify-end">
                                    <span className="text-xs text-muted-foreground">R$</span>
                                    <Input
                                      autoFocus
                                      value={valorEdit}
                                      onChange={e => setValorEdit(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') salvarValorInline(p); if (e.key === 'Escape') setEditandoId(null); }}
                                      inputMode="decimal"
                                      placeholder="tabela"
                                      className="w-20 h-7 text-right tabular-nums bg-background"
                                    />
                                    <button onClick={() => salvarValorInline(p)} disabled={salvandoValor}
                                      className="text-green-400 hover:text-green-300" title="Salvar (permanente)">
                                      {salvandoValor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    </button>
                                    <button onClick={() => setEditandoId(null)} className="text-muted-foreground hover:text-foreground" title="Cancelar">
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => abrirEdicao(p)}
                                    className="hover:text-primary hover:underline decoration-dotted"
                                    title="Editar o valor negociado do aluno (permanente)"
                                  >
                                    {p.valor !== null ? `R$ ${p.valor.toFixed(2)}` : '—'}
                                  </button>
                                )}
                              </td>
                              <td className="py-2 text-right tabular-nums text-muted-foreground">{p.valor_com_atraso !== null ? `R$ ${p.valor_com_atraso.toFixed(2)}` : '—'}</td>
                              <td className="py-2 text-center">
                                <span className={`text-[11px] px-1.5 py-0.5 rounded ${p.origem === 'override' ? 'bg-amber-500/20 text-amber-400' : p.origem === 'tabela' ? 'bg-blue-500/15 text-blue-400' : 'bg-muted text-muted-foreground'}`}>
                                  {p.origem === 'override' ? 'negociado' : p.origem === 'tabela' ? 'tabela' : 'sem preço'}
                                </span>
                              </td>
                              <td className="py-2 text-center text-xs">
                                {p.ja_existe ? <span className="text-muted-foreground">já existe</span> : p.origem === 'sem_tabela' ? <span className="text-amber-500">bloqueada</span> : <span className="text-green-400">nova</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <Button onClick={gerar} disabled={gerando || selConta.length === 0 || !diaVencValido}
                  className="w-full bg-primary text-primary-foreground">
                  {gerando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                  Confirmar geração de {selConta.length} mensalidade(s)
                </Button>
              </div>
            )}
          </div>
        );
      })()}

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
