import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  ArrowLeft, Loader2, Coins, CalendarClock, Wallet, MessageCircle, Mail,
  FileText, CheckCircle2, Pencil, Paperclip, Plus, X, Save, RotateCcw, Ban, Info,
  ChevronLeft, ChevronRight, Lock, Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ValoresMatriculaPanel } from '@/components/dashboard/ValoresMatriculaPanel';
import { ConfirmarPagamentoModal } from '@/components/dashboard/ConfirmarPagamentoModal';
import { ExtratoFinanceiroPDF } from '@/components/dashboard/ExtratoFinanceiroPDF';
import {
  getFichaAlunoInfo,
  getMensalidadesVw,
  atualizarMensalidade,
  estornarPagamento,
  cancelarMensalidade,
  setDiaVencimentoPadrao,
  gerarMensalidadesMes,
  getComprovanteUrl,
  getConfigFinanceiro,
  type FichaAlunoInfo,
  type MensalidadeVw,
  type ConfigFinanceiro,
} from '@/services/financeiro.service';
import { suspenderMatriculaInadimplencia, reativarMatricula } from '@/services/matriculas.service';
import { tipoCobrancaSugerido, linkWhatsAppCobranca, linkEmailCobranca } from '@/lib/cobranca';
import type { DashboardContext } from '../Dashboard';

// Financeiro 2g — FICHA FINANCEIRA DO ALUNO. "Cada aluno é uma história": aqui a
// secretaria/financeiro abre UM aluno e vê/edita tudo. PII-FREE (sem CPF/RG/endereço).
// Zona 1: configuração (reusa ValoresMatriculaPanel — 069/072). Zona 2: linha do
// tempo de mensalidades (vw_mensalidades + ações inline). Zona 3: resumo + ações.
// Toda edição persiste na FONTE ÚNICA no banco (LICAO-042). navy #1F3864 / dourado #BF9000.

const brl = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (d: string | null) =>
  d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '—';

const fmtMes = (mesRef: string) =>
  new Date(mesRef + 'T12:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

const HOJE = new Date().toISOString().split('T')[0];

const diasAtraso = (m: MensalidadeVw): number => {
  if (m.status_efetivo !== 'atrasado') return 0;
  const venc = new Date(m.data_vencimento + 'T12:00').getTime();
  const hoje = new Date(HOJE + 'T12:00').getTime();
  return Math.max(0, Math.round((hoje - venc) / 86_400_000));
};

const STATUS_STYLE: Record<string, string> = {
  pago:      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  atrasado:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  pendente:  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  isento:    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  cancelado: 'bg-muted text-muted-foreground',
};

export default function FichaFinanceiraAluno() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const navigate    = useNavigate();
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();

  const [info, setInfo]           = useState<FichaAlunoInfo | null>(null);
  const [mensalidades, setMensalidades] = useState<MensalidadeVw[]>([]);
  const [loading, setLoading]     = useState(true);

  // ações de linha
  const [modalPag, setModalPag]   = useState<MensalidadeVw | null>(null);
  const [editLinha, setEditLinha] = useState<string | null>(null);
  const [editValor, setEditValor] = useState('');
  const [editVenc, setEditVenc]   = useState('');
  const [savingLinha, setSavingLinha] = useState(false);

  // 2h: estorno/cancelamento com motivo obrigatório
  const [modalMotivo, setModalMotivo] = useState<{ tipo: 'estorno' | 'cancelamento'; mens: MensalidadeVw } | null>(null);
  const [motivo, setMotivo]           = useState('');
  const [savingMotivo, setSavingMotivo] = useState(false);

  // E5: suspender/reativar matrícula por inadimplência
  const [modalSuspender, setModalSuspender] = useState(false);
  const [motivoSusp, setMotivoSusp]         = useState('');
  const [savingMatricula, setSavingMatricula] = useState(false);
  // E5.1: sugerir reativação após quitar (dívida zerada + matrícula suspensa)
  const [sugereReativar, setSugereReativar] = useState(false);
  const [config, setConfig]                 = useState<ConfigFinanceiro | null>(null);

  // dia de vencimento padrão do aluno (Zona 1 — persiste em matriculas.dia_vencimento_padrao)
  const [diaPadrao, setDiaPadrao]   = useState('10');
  const [savingDia, setSavingDia]   = useState(false);

  // gerar próximo mês para ESTE aluno
  const [gerarMes, setGerarMes]   = useState('');   // input month YYYY-MM
  const [gerarDia, setGerarDia]   = useState('10');
  const [gerando, setGerando]     = useState(false);

  const carregar = useCallback(async () => {
    if (!alunoId) return;
    setLoading(true);
    const [i, ms, cfg] = await Promise.all([
      getFichaAlunoInfo(alunoId),
      getMensalidadesVw(alunoId),
      getConfigFinanceiro(),
    ]);
    setInfo(i);
    setMensalidades(ms);
    setConfig(cfg);
    // dia de vencimento padrão persistido (074) → edição na Zona 1 + default da geração
    const dia = String(i?.dia_vencimento_padrao ?? 10);
    setDiaPadrao(dia);
    setGerarDia(dia);
    setLoading(false);
  }, [alunoId]);

  useEffect(() => { carregar(); }, [carregar]);

  const recarregarMensalidades = useCallback(async () => {
    if (!alunoId) return;
    setMensalidades(await getMensalidadesVw(alunoId));
  }, [alunoId]);

  const salvarDiaPadrao = async () => {
    if (!info?.matricula_id) { toast({ title: 'Aluno sem matrícula ativa', variant: 'destructive' }); return; }
    const dia = parseInt(diaPadrao, 10);
    if (isNaN(dia) || dia < 1 || dia > 30) {
      toast({ title: 'Dia inválido', description: 'Use 1 a 30 (meses curtos ajustam para o último dia).', variant: 'destructive' });
      return;
    }
    setSavingDia(true);
    const { error } = await setDiaVencimentoPadrao(info.matricula_id, dia);
    setSavingDia(false);
    if (error) { toast({ title: 'Erro ao salvar o dia', description: error, variant: 'destructive' }); return; }
    toast({ title: 'Dia de vencimento atualizado', description: `Vence dia ${dia} — vale para as próximas gerações.` });
    setInfo(prev => prev ? { ...prev, dia_vencimento_padrao: dia } : prev);
    setGerarDia(String(dia));
  };

  // ─── Zona 3: resumo derivado ────────────────────────────────────────────────
  const resumo = useMemo(() => {
    let totalPago = 0, totalDevido = 0, maiorAtraso = 0;
    let proxima: MensalidadeVw | null = null;
    for (const m of mensalidades) {
      if (m.status_efetivo === 'pago') totalPago += (m.valor_pago ?? m.valor);
      if (m.status_efetivo === 'pendente' || m.status_efetivo === 'atrasado') {
        totalDevido += m.valor;
        maiorAtraso = Math.max(maiorAtraso, diasAtraso(m));
        if (m.status_efetivo === 'pendente' && m.data_vencimento >= HOJE) {
          if (!proxima || m.data_vencimento < proxima.data_vencimento) proxima = m;
        }
      }
    }
    return {
      total_pago:        Math.round(totalPago * 100) / 100,
      total_devido:      Math.round(totalDevido * 100) / 100,
      maior_atraso_dias: maiorAtraso,
      proxima,
    };
  }, [mensalidades]);

  // ─── ações inline de linha ──────────────────────────────────────────────────
  const abrirEdicao = (m: MensalidadeVw) => {
    setEditLinha(m.id);
    setEditValor(String(m.valor.toFixed(2)));
    setEditVenc(m.data_vencimento);
  };

  const salvarEdicao = async (m: MensalidadeVw) => {
    const v = parseFloat(editValor.replace(',', '.'));
    if (isNaN(v) || v < 0) { toast({ title: 'Valor inválido', variant: 'destructive' }); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editVenc)) { toast({ title: 'Vencimento inválido', variant: 'destructive' }); return; }
    setSavingLinha(true);
    const patch: { valor?: number; dataVencimento?: string } = {};
    if (v !== m.valor) patch.valor = v;
    if (editVenc !== m.data_vencimento) patch.dataVencimento = editVenc;
    const { error } = await atualizarMensalidade(m.id, patch, profile.id);
    setSavingLinha(false);
    if (error) { toast({ title: 'Não foi possível editar', description: error, variant: 'destructive' }); return; }
    toast({ title: 'Mensalidade atualizada' });
    setEditLinha(null);
    recarregarMensalidades();
  };

  const abrirMotivo = (tipo: 'estorno' | 'cancelamento', mens: MensalidadeVw) => {
    setMotivo('');
    setModalMotivo({ tipo, mens });
  };

  const confirmarMotivo = async () => {
    if (!modalMotivo) return;
    if (motivo.trim() === '') { toast({ title: 'Motivo é obrigatório', variant: 'destructive' }); return; }
    setSavingMotivo(true);
    const { tipo, mens } = modalMotivo;
    const { error } = tipo === 'estorno'
      ? await estornarPagamento(mens.id, motivo.trim())
      : await cancelarMensalidade(mens.id, motivo.trim());
    setSavingMotivo(false);
    if (error) { toast({ title: tipo === 'estorno' ? 'Erro ao estornar' : 'Erro ao cancelar', description: error, variant: 'destructive' }); return; }
    toast({ title: tipo === 'estorno' ? 'Pagamento estornado' : 'Mensalidade cancelada' });
    setModalMotivo(null);
    recarregarMensalidades();
  };

  // E5: suspender/reativar a matrícula (RPCs 078; gate staff+financeiro no banco).
  const confirmarSuspensao = async () => {
    if (!info?.matricula_id) return;
    if (motivoSusp.trim() === '') { toast({ title: 'Motivo é obrigatório', variant: 'destructive' }); return; }
    setSavingMatricula(true);
    const { error } = await suspenderMatriculaInadimplencia(info.matricula_id, motivoSusp.trim());
    setSavingMatricula(false);
    if (error) { toast({ title: 'Erro ao suspender', description: error, variant: 'destructive' }); return; }
    toast({ title: 'Matrícula suspensa', description: 'O aluno perde o acesso até a reativação.' });
    setModalSuspender(false);
    setMotivoSusp('');
    carregar();
  };

  const reativar = async (semConfirmar = false) => {
    if (!info?.matricula_id) return;
    if (!semConfirmar && !window.confirm('Reativar a matrícula e devolver o acesso ao aluno?')) return;
    setSavingMatricula(true);
    const { error } = await reativarMatricula(info.matricula_id);
    setSavingMatricula(false);
    if (error) { toast({ title: 'Erro ao reativar', description: error, variant: 'destructive' }); return; }
    toast({ title: 'Matrícula reativada', description: 'O acesso do aluno foi restaurado.' });
    carregar();
  };

  const verComprovante = async (path: string) => {
    const url = await getComprovanteUrl(path);
    if (url) window.open(url, '_blank');
    else toast({ title: 'Comprovante indisponível', variant: 'destructive' });
  };

  // Navegação de mês por setas (◀ ▶) — mesmo recurso da aba "Gerar Mensalidades",
  // que funciona independente do calendário nativo do type="month".
  const shiftMes = (delta: number) => {
    const mm = /^(\d{4})-(\d{2})$/.exec(gerarMes);
    const base = mm ? new Date(parseInt(mm[1], 10), parseInt(mm[2], 10) - 1, 1) : new Date();
    base.setMonth(base.getMonth() + delta);
    setGerarMes(`${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`);
  };

  const gerarProximoMes = async () => {
    const m = /^(\d{4})-(\d{2})$/.exec(gerarMes);
    if (!m) { toast({ title: 'Selecione o mês', variant: 'destructive' }); return; }
    const dia = parseInt(gerarDia, 10);
    if (isNaN(dia) || dia < 1 || dia > 31) { toast({ title: 'Dia de vencimento inválido (1–31)', variant: 'destructive' }); return; }
    if (!info?.matricula_id) { toast({ title: 'Aluno sem matrícula ativa', variant: 'destructive' }); return; }
    setGerando(true);
    const { resultado, error } = await gerarMensalidadesMes(
      parseInt(m[1], 10), parseInt(m[2], 10), dia, profile.id, [info.matricula_id],
    );
    setGerando(false);
    if (error) { toast({ title: 'Erro ao gerar', description: error, variant: 'destructive' }); return; }
    if (resultado?.geradas) toast({ title: `Mensalidade gerada/reativada para ${fmtMes(m[0] + '-01')}` });
    else if (resultado?.ja_existiam) toast({ title: 'Já existe mensalidade viva nesse mês (nada alterado)' });
    else if (resultado?.sem_preco) toast({ title: 'Sem preço resolvido — verifique a Zona 1', variant: 'destructive' });
    setGerarMes('');
    recarregarMensalidades();
  };

  // Cobrança pronta (F3) — WhatsApp/Email preenchido (não envia). Tom pelo atraso.
  const cobrar = (canal: 'whatsapp' | 'email') => {
    if (!info) return;
    const tipo = tipoCobrancaSugerido(resumo.maior_atraso_dias);
    const dados = { nome: info.nome, telefone: info.telefone, email: info.email, totalDevido: resumo.total_devido, maiorAtrasoDias: resumo.maior_atraso_dias };
    const pix = { chave_pix: config?.chave_pix ?? null, beneficiario: config?.beneficiario ?? null };
    const href = canal === 'whatsapp' ? linkWhatsAppCobranca(tipo, dados, pix) : linkEmailCobranca(tipo, dados, pix);
    if (!href) { toast({ title: canal === 'whatsapp' ? 'Aluno sem telefone cadastrado' : 'Aluno sem e-mail cadastrado', variant: 'destructive' }); return; }
    window.open(href, '_blank');
  };

  // Pós-confirmação de pagamento (F2, decisão A): se a matrícula está suspensa e a
  // dívida ZEROU (sem atrasada nem pendente já vencida), sugere reativar (1 clique).
  const posConfirmacao = async () => {
    setModalPag(null);
    if (!alunoId) return;
    const ms = await getMensalidadesVw(alunoId);
    setMensalidades(ms);
    const aindaDeve = ms.some(m =>
      m.status_efetivo === 'atrasado' ||
      (m.status_efetivo === 'pendente' && m.data_vencimento < HOJE));
    if (info?.matricula_status === 'suspensa' && !aindaDeve) setSugereReativar(true);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-8">
        <Loader2 className="h-5 w-5 animate-spin" /> Carregando ficha financeira…
      </div>
    );
  }
  if (!info) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-muted-foreground">Não foi possível carregar a ficha deste aluno.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Cabeçalho PII-free */}
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-3">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {info.avatar_url
              ? <img src={info.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              : <div className="h-14 w-14 rounded-full bg-[#1F3864] text-white flex items-center justify-center font-bold text-lg">
                  {info.nome.split(' ').slice(0, 2).map(s => s[0]).join('')}
                </div>}
            <div>
              <h1 className="text-xl font-merriweather font-bold text-foreground">{info.nome}</h1>
              <p className="text-sm text-muted-foreground">
                {[info.curso_nome, info.turma_nome, info.codigo_itec].filter(Boolean).join(' · ') || 'Sem turma vinculada'}
              </p>
              <p className="text-xs text-muted-foreground">
                {[info.email, info.telefone].filter(Boolean).join(' · ') || 'Sem contato cadastrado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ───── E5: acesso / suspensão por inadimplência ───── */}
      {(() => {
        const suspensa = info.matricula_status === 'suspensa';
        const podeSuspender = info.matricula_status === 'ativa' && resumo.maior_atraso_dias >= 90;
        if (!suspensa && !podeSuspender) return null;
        return (
          <div className={`rounded-2xl border p-4 flex items-start justify-between gap-3 flex-wrap ${suspensa ? 'border-red-500/40 bg-red-500/5' : 'border-amber-500/40 bg-amber-500/5'}`}>
            <div className="flex items-start gap-3">
              {suspensa ? <Lock className="h-6 w-6 text-red-600 shrink-0" /> : <CalendarClock className="h-6 w-6 text-amber-600 shrink-0" />}
              <div>
                {suspensa ? (
                  <>
                    <p className="font-semibold text-foreground">Matrícula suspensa</p>
                    <p className="text-sm text-muted-foreground">
                      {info.motivo_suspensao ? `Motivo: ${info.motivo_suspensao}. ` : ''}
                      {info.data_suspensao ? `Desde ${fmtData((info.data_suspensao ?? '').slice(0, 10))}. ` : ''}
                      O aluno está sem acesso ao sistema.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-foreground">Aluno crítico — {resumo.maior_atraso_dias} dias de atraso</p>
                    <p className="text-sm text-muted-foreground">Elegível para suspensão por inadimplência (90+ dias).</p>
                  </>
                )}
              </div>
            </div>
            {suspensa ? (
              <Button onClick={() => reativar()} disabled={savingMatricula} size="lg"
                className="bg-green-600 hover:bg-green-600/90 text-white shadow-lg shadow-green-600/20 font-semibold">
                {savingMatricula ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Unlock className="h-5 w-5 mr-2" />}
                Reativar acesso do aluno
              </Button>
            ) : (
              <Button onClick={() => { setMotivoSusp(`Inadimplência — ${resumo.maior_atraso_dias} dias de atraso`); setModalSuspender(true); }}
                disabled={savingMatricula} className="bg-red-600 hover:bg-red-600/90 text-white">
                <Lock className="h-4 w-4 mr-1.5" /> Suspender por inadimplência
              </Button>
            )}
          </div>
        );
      })()}

      {/* ───── ZONA 3 (topo): resumo + ações rápidas ───── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> Total pago</p>
          <p className="text-lg font-bold text-green-600 tabular-nums">{brl(resumo.total_pago)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Coins className="h-3.5 w-3.5" /> Em aberto</p>
          <p className="text-lg font-bold text-[#1F3864] dark:text-primary tabular-nums">{brl(resumo.total_devido)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Maior atraso</p>
          <p className={`text-lg font-bold tabular-nums ${resumo.maior_atraso_dias > 0 ? 'text-red-600' : 'text-foreground'}`}>
            {resumo.maior_atraso_dias} dia{resumo.maior_atraso_dias === 1 ? '' : 's'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Próxima cobrança</p>
          <p className="text-sm font-semibold text-foreground">
            {resumo.proxima ? fmtData(resumo.proxima.data_vencimento) : '—'}
          </p>
          {resumo.proxima && <p className="text-xs text-muted-foreground tabular-nums">{brl(resumo.proxima.valor)}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {resumo.total_devido > 0 && (
          <>
            <Button variant="outline" onClick={() => cobrar('whatsapp')} className="border-border">
              <MessageCircle className="h-4 w-4 mr-1.5 text-green-600" /> Cobrar por WhatsApp
            </Button>
            <Button variant="outline" onClick={() => cobrar('email')} className="border-border">
              <Mail className="h-4 w-4 mr-1.5 text-muted-foreground" /> Cobrar por e-mail
            </Button>
          </>
        )}
        <PDFDownloadLink
          document={
            <ExtratoFinanceiroPDF
              aluno={{
                nome: info.nome, codigo_itec: info.codigo_itec, curso_nome: info.curso_nome,
                turma_nome: info.turma_nome, email: info.email, telefone: info.telefone,
              }}
              mensalidades={mensalidades}
              resumo={{ total_pago: resumo.total_pago, total_devido: resumo.total_devido, maior_atraso_dias: resumo.maior_atraso_dias }}
            />
          }
          fileName={`extrato-financeiro-${info.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`}
        >
          {({ loading: l }) => (
            <Button variant="outline" className="border-border" disabled={l}>
              <FileText className="h-4 w-4 mr-1.5" /> {l ? 'Gerando…' : 'Imprimir extrato'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      {/* ───── ZONA 1: configuração (valores) ───── */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-merriweather font-bold text-foreground flex items-center gap-2">
          <Coins className="h-4 w-4 text-[#BF9000]" /> Configuração de cobrança
        </h2>
        {info.matricula_id ? (
          <>
            <ValoresMatriculaPanel matriculaId={info.matricula_id} editavel onSaved={recarregarMensalidades} />

            {/* Dia de vencimento padrão do aluno (persiste — 074) */}
            <div className="border-t border-border pt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-[#BF9000]" /> Dia de vencimento padrão
                </label>
                <Input inputMode="numeric" value={diaPadrao} onChange={e => setDiaPadrao(e.target.value)}
                  className="bg-background w-24 text-center" placeholder="1–30" />
              </div>
              <Button variant="outline" onClick={salvarDiaPadrao} disabled={savingDia} className="border-border">
                {savingDia ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                Salvar dia
              </Button>
              <p className="text-[11px] text-muted-foreground flex-1 min-w-[12rem]">
                Vale para as PRÓXIMAS gerações deste aluno (1–30; meses curtos ajustam para o último dia).
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Aluno sem matrícula ativa — não há o que configurar.</p>
        )}
      </section>

      {/* ───── ZONA 2: linha do tempo de mensalidades ───── */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-merriweather font-bold text-foreground flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#1F3864] dark:text-primary" /> Linha do tempo de mensalidades
          </h2>
        </div>

        {/* Gerar próximo mês para ESTE aluno */}
        <div className="flex items-end gap-2 flex-wrap bg-muted/20 rounded-lg p-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Mês de referência</label>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => shiftMes(-1)}
                className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                title="Mês anterior">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <Input type="month" value={gerarMes} onChange={e => setGerarMes(e.target.value)}
                className="bg-background border-border text-foreground text-center w-44" />
              <button type="button" onClick={() => shiftMes(1)}
                className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                title="Próximo mês">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dia venc.</label>
            <Input inputMode="numeric" value={gerarDia} onChange={e => setGerarDia(e.target.value)}
              className="bg-background w-20 text-center" />
          </div>
          <Button onClick={gerarProximoMes} disabled={gerando || !info.matricula_id}
            className="bg-[#1F3864] hover:bg-[#1F3864]/90 text-white">
            {gerando ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
            Gerar para este aluno
          </Button>
        </div>

        {mensalidades.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhuma mensalidade gerada para este aluno ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Referência</th>
                  <th className="py-2 pr-3 font-medium text-right">Valor</th>
                  <th className="py-2 pr-3 font-medium text-center">Vencimento</th>
                  <th className="py-2 pr-3 font-medium text-center">Situação</th>
                  <th className="py-2 pr-3 font-medium text-right">Atraso</th>
                  <th className="py-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {mensalidades.map(m => {
                  const emEdicao   = editLinha === m.id;
                  const atraso     = diasAtraso(m);
                  const isPago     = m.status_efetivo === 'pago';
                  const isCancel   = m.status_efetivo === 'cancelado';
                  const isAberto   = m.status_efetivo === 'pendente' || m.status_efetivo === 'atrasado';
                  const selo       = m.data_estorno
                    ? `↩ estornado em ${fmtData((m.data_estorno ?? '').slice(0, 10))}${m.motivo_estorno ? ` — ${m.motivo_estorno}` : ''}`
                    : isCancel && m.motivo_cancelamento
                    ? `cancelado — ${m.motivo_cancelamento}`
                    : null;
                  // 2d: aluno enviou comprovante e ainda está em aberto → aguardando confirmação do staff
                  const aguardandoComp = isAberto && !!m.comprovante_enviado_em;
                  return (
                    <tr key={m.id} className={`border-b border-border/60 last:border-0 ${isCancel ? 'opacity-60' : ''}`}>
                      <td className={`py-2 pr-3 capitalize text-foreground ${isCancel ? 'line-through' : ''}`}>
                        {fmtMes(m.mes_referencia)}
                        {selo && (
                          <span className="block text-[10px] not-italic text-muted-foreground normal-case no-underline flex items-center gap-1 mt-0.5">
                            <Info className="h-3 w-3 shrink-0" /> {selo}
                          </span>
                        )}
                        {aguardandoComp && (
                          <span className="block text-[10px] not-italic text-amber-600 normal-case no-underline flex items-center gap-1 mt-0.5">
                            <Paperclip className="h-3 w-3 shrink-0" /> comprovante recebido — aguardando confirmação
                          </span>
                        )}
                      </td>
                      <td className={`py-2 pr-3 text-right tabular-nums text-foreground ${isCancel ? 'line-through' : ''}`}>
                        {emEdicao
                          ? <Input inputMode="decimal" value={editValor} onChange={e => setEditValor(e.target.value)}
                              className="h-8 w-24 text-right bg-background ml-auto" />
                          : brl(m.valor)}
                      </td>
                      <td className="py-2 pr-3 text-center text-foreground">
                        {emEdicao
                          ? <Input type="date" value={editVenc} onChange={e => setEditVenc(e.target.value)}
                              className="h-8 w-36 bg-background mx-auto" />
                          : fmtData(m.data_vencimento)}
                      </td>
                      <td className="py-2 pr-3 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[m.status_efetivo] ?? ''}`}>
                          {m.status_efetivo}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {atraso > 0 ? <span className="text-red-600">{atraso}d</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        {emEdicao ? (
                          <div className="inline-flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => salvarEdicao(m)} disabled={savingLinha}
                              className="h-8 px-2 text-green-600">
                              {savingLinha ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditLinha(null)} className="h-8 px-2">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="inline-flex gap-1">
                            {/* Aberta: confirmar · editar · cancelar */}
                            {isAberto && (
                              <Button size="sm" variant="ghost" onClick={() => setModalPag(m)}
                                className="h-8 px-2 text-green-600" title="Confirmar pagamento">
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {isAberto && (
                              <Button size="sm" variant="ghost" onClick={() => abrirEdicao(m)}
                                className="h-8 px-2 text-muted-foreground" title="Editar valor/vencimento">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {isAberto && (
                              <Button size="sm" variant="ghost" onClick={() => abrirMotivo('cancelamento', m)}
                                className="h-8 px-2 text-amber-600" title="Cancelar mensalidade">
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                            {/* Paga: estornar */}
                            {isPago && (
                              <Button size="sm" variant="ghost" onClick={() => abrirMotivo('estorno', m)}
                                className="h-8 px-2 text-red-600" title="Estornar pagamento">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {m.comprovante_url && (
                              <Button size="sm" variant="ghost" onClick={() => verComprovante(m.comprovante_url!)}
                                className="h-8 px-2 text-muted-foreground" title="Ver comprovante">
                                <Paperclip className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalPag && (
        <ConfirmarPagamentoModal
          mensalidade={modalPag}
          onClose={() => setModalPag(null)}
          onSaved={posConfirmacao}
        />
      )}

      {/* Modal de motivo (estorno / cancelamento) — motivo obrigatório */}
      {modalMotivo && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-merriweather font-bold text-foreground flex items-center gap-2">
                {modalMotivo.tipo === 'estorno'
                  ? <><RotateCcw className="h-5 w-5 text-red-600" /> Estornar pagamento</>
                  : <><Ban className="h-5 w-5 text-amber-600" /> Cancelar mensalidade</>}
              </h2>
              <button onClick={() => setModalMotivo(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="text-sm bg-muted/20 rounded-lg p-3 space-y-1">
              <p><span className="text-muted-foreground">Referência:</span> <span className="font-medium capitalize">{fmtMes(modalMotivo.mens.mes_referencia)}</span></p>
              <p><span className="text-muted-foreground">Valor:</span> <span className="font-medium">{brl(modalMotivo.mens.valor)}</span></p>
              <p className="text-[11px] text-muted-foreground">
                {modalMotivo.tipo === 'estorno'
                  ? 'Volta para pendente e limpa o pagamento (o comprovante é preservado no histórico). Fica registrado quem estornou e quando.'
                  : 'A mensalidade é anulada (status cancelado) — não é excluída, fica no histórico com o motivo.'}
              </p>
            </div>

            <div>
              <label className="text-sm text-foreground">Motivo (obrigatório)</label>
              <Textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
                placeholder={modalMotivo.tipo === 'estorno'
                  ? 'Ex.: confirmado no aluno errado; valor divergente do comprovante'
                  : 'Ex.: mês gerado em duplicidade; aluno trancou a matrícula'}
                className="mt-1.5 bg-background" />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setModalMotivo(null)} className="flex-1 border-border text-foreground">Voltar</Button>
              <Button onClick={confirmarMotivo} disabled={savingMotivo}
                className={`flex-1 text-white ${modalMotivo.tipo === 'estorno' ? 'bg-red-600 hover:bg-red-600/90' : 'bg-amber-600 hover:bg-amber-600/90'}`}>
                {savingMotivo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {modalMotivo.tipo === 'estorno' ? 'Estornar' : 'Cancelar mensalidade'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suspensão por inadimplência (E5) — motivo obrigatório */}
      {modalSuspender && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-merriweather font-bold text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" /> Suspender matrícula
              </h2>
              <button onClick={() => setModalSuspender(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="text-sm bg-muted/20 rounded-lg p-3 space-y-1">
              <p><span className="text-muted-foreground">Aluno:</span> <span className="font-medium">{info.nome}</span></p>
              <p><span className="text-muted-foreground">Atraso:</span> <span className="font-medium text-red-600">{resumo.maior_atraso_dias} dias</span></p>
              <p className="text-[11px] text-muted-foreground">
                O aluno perde o acesso ao sistema (vai para a tela de "matrícula suspensa") até você reativar. Os dados são preservados.
              </p>
            </div>
            <div>
              <label className="text-sm text-foreground">Motivo (obrigatório)</label>
              <Textarea value={motivoSusp} onChange={e => setMotivoSusp(e.target.value)} rows={2}
                placeholder="Ex.: inadimplência — 92 dias de atraso, sem retorno após contato" className="mt-1.5 bg-background" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setModalSuspender(false)} className="flex-1 border-border text-foreground">Voltar</Button>
              <Button onClick={confirmarSuspensao} disabled={savingMatricula} className="flex-1 bg-red-600 hover:bg-red-600/90 text-white">
                {savingMatricula ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Suspender
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* F2 (decisão A): dívida quitada → sugerir reativação (1 clique de confirmação) */}
      {sugereReativar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-green-500/40 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <h2 className="text-lg font-merriweather font-bold text-foreground">Dívida quitada!</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {info.nome} não tem mais mensalidades em aberto e está com a <strong>matrícula suspensa</strong>.
              Deseja <strong>reativar o acesso</strong> agora?
            </p>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setSugereReativar(false)} className="flex-1 border-border text-foreground">Agora não</Button>
              <Button onClick={async () => { setSugereReativar(false); await reativar(true); }} disabled={savingMatricula}
                className="flex-1 bg-green-600 hover:bg-green-600/90 text-white font-semibold">
                {savingMatricula ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                Reativar acesso
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
