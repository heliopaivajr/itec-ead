import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Wallet, CheckCircle2, AlertTriangle, Copy, Check, Upload, Loader2,
  Paperclip, Clock, CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getMensalidadesVw,
  getConfigFinanceiro,
  uploadComprovante,
  alunoEnviarComprovante,
  getComprovanteUrl,
  type MensalidadeVw,
  type ConfigFinanceiro,
} from '@/services/financeiro.service';
import type { DashboardContext } from '../Dashboard';

// Financeiro 2d — "Meu Financeiro" do ALUNO. Vê as PRÓPRIAS mensalidades (RLS 037 +
// vw_mensalidades invoker), a chave PIX (config_financeiro, 077), e envia comprovante
// (aluno_enviar_comprovante — NÃO confirma; quem confirma é o staff). PII: só o próprio.
// Padrão visual das telas do aluno (Minhas Notas / Frequência — Fase C1).

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

export default function MeuFinanceiro() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();

  const [mensalidades, setMensalidades] = useState<MensalidadeVw[]>([]);
  const [config, setConfig]   = useState<ConfigFinanceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState<string | null>(null); // mensalidade_id em upload
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const carregar = useCallback(async () => {
    setLoading(true);
    const [ms, cfg] = await Promise.all([getMensalidadesVw(profile.id), getConfigFinanceiro()]);
    setMensalidades(ms);
    setConfig(cfg);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const resumo = useMemo(() => {
    let devido = 0, maiorAtraso = 0;
    let proxima: MensalidadeVw | null = null;
    for (const m of mensalidades) {
      if (m.status_efetivo === 'pendente' || m.status_efetivo === 'atrasado') {
        devido += m.valor;
        maiorAtraso = Math.max(maiorAtraso, diasAtraso(m));
        if (m.status_efetivo === 'pendente' && m.data_vencimento >= HOJE) {
          if (!proxima || m.data_vencimento < proxima.data_vencimento) proxima = m;
        }
      }
    }
    return { devido: Math.round(devido * 100) / 100, maiorAtraso, proxima, emDia: maiorAtraso === 0 && devido === 0 };
  }, [mensalidades]);

  const copiarPix = async () => {
    if (!config?.chave_pix) return;
    try {
      await navigator.clipboard.writeText(config.chave_pix);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast({ title: 'Não foi possível copiar', description: config.chave_pix, variant: 'destructive' });
    }
  };

  const escolherArquivo = (mensId: string) => fileRefs.current[mensId]?.click();

  const enviarComprovante = async (m: MensalidadeVw, file: File) => {
    setEnviando(m.id);
    const up = await uploadComprovante(profile.id, m.id, file);
    if (up.error || !up.path) {
      setEnviando(null);
      toast({ title: 'Erro no upload', description: up.error ?? 'Sem caminho', variant: 'destructive' });
      return;
    }
    const { error } = await alunoEnviarComprovante(m.id, up.path);
    setEnviando(null);
    if (error) { toast({ title: 'Erro ao registrar comprovante', description: error, variant: 'destructive' }); return; }
    toast({ title: 'Comprovante enviado!', description: 'Aguarde a confirmação da secretaria.' });
    carregar();
  };

  const verComprovante = async (path: string) => {
    const url = await getComprovanteUrl(path);
    if (url) window.open(url, '_blank');
    else toast({ title: 'Comprovante indisponível', variant: 'destructive' });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-[#1F3864] dark:text-primary">Meu Financeiro</h1>
        <p className="text-muted-foreground mt-1">Suas mensalidades, como pagar e envio de comprovante.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <>
          {/* RESUMO */}
          <div className={`rounded-2xl border p-5 ${resumo.emDia
            ? 'border-green-500/30 bg-green-500/5'
            : resumo.maiorAtraso > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            {resumo.emDia ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-merriweather font-bold text-foreground">Você está em dia 🎉</p>
                  <p className="text-sm text-muted-foreground">Nenhuma mensalidade em aberto.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-8 w-8 shrink-0 ${resumo.maiorAtraso > 0 ? 'text-red-600' : 'text-amber-600'}`} />
                <div className="flex-1">
                  <p className="font-merriweather font-bold text-foreground">
                    Você tem <span className={resumo.maiorAtraso > 0 ? 'text-red-600' : 'text-amber-600'}>{brl(resumo.devido)}</span> em aberto
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {resumo.maiorAtraso > 0 && <>Maior atraso: {resumo.maiorAtraso} dia(s). </>}
                    {resumo.proxima && <>Próxima cobrança: {fmtData(resumo.proxima.data_vencimento)} · {brl(resumo.proxima.valor)}.</>}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* COMO PAGAR (PIX) */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-merriweather font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#BF9000]" /> Como pagar (PIX)
            </h2>
            {config?.chave_pix ? (
              <>
                <div className="flex flex-wrap items-center gap-2 bg-muted/20 rounded-lg p-3">
                  <div className="flex-1 min-w-[12rem]">
                    <p className="text-xs text-muted-foreground">Chave PIX {config.tipo_chave ? `(${config.tipo_chave})` : ''}</p>
                    <p className="font-semibold text-foreground break-all">{config.chave_pix}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={copiarPix} className="border-border">
                    {copiado ? <><Check className="h-4 w-4 mr-1.5 text-green-600" /> Copiado</> : <><Copy className="h-4 w-4 mr-1.5" /> Copiar</>}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  {config.beneficiario && <p><span className="text-foreground font-medium">Beneficiário:</span> {config.beneficiario}{config.cidade ? ` · ${config.cidade}` : ''}</p>}
                  {!resumo.emDia && <p><span className="text-foreground font-medium">Valor em aberto:</span> {brl(resumo.devido)}</p>}
                  {config.instrucoes && <p className="text-xs">{config.instrucoes}</p>}
                  <p className="text-xs text-muted-foreground/70">Boleto — em breve.</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chave PIX ainda não cadastrada. Fale com a secretaria — WhatsApp (81) 99116-1448.
              </p>
            )}
          </div>

          {/* MINHAS MENSALIDADES */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-merriweather font-bold text-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#1F3864] dark:text-primary" /> Minhas mensalidades
            </h2>
            {mensalidades.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhuma mensalidade lançada ainda.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {mensalidades.slice().reverse().map(m => {
                  const aberta   = m.status_efetivo === 'pendente' || m.status_efetivo === 'atrasado';
                  const aguardando = aberta && !!m.comprovante_enviado_em;
                  const atraso   = diasAtraso(m);
                  return (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-medium text-foreground capitalize">{fmtMes(m.mes_referencia)}</p>
                        <p className="text-xs text-muted-foreground">
                          {brl(m.valor)} · vence {fmtData(m.data_vencimento)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* status */}
                        {m.status_efetivo === 'pago' ? (
                          <span className="text-xs font-medium text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Pago</span>
                        ) : m.status_efetivo === 'cancelado' ? (
                          <span className="text-xs text-muted-foreground">Cancelada</span>
                        ) : m.status_efetivo === 'isento' ? (
                          <span className="text-xs font-medium text-blue-500">Isento</span>
                        ) : aguardando ? (
                          <span className="text-xs font-medium text-amber-600 flex items-center gap-1"><Clock className="h-4 w-4" /> Aguardando confirmação</span>
                        ) : m.status_efetivo === 'atrasado' ? (
                          <span className="text-xs font-medium text-red-600">Atrasada {atraso}d</span>
                        ) : (
                          <span className="text-xs font-medium text-amber-600">Pendente</span>
                        )}

                        {/* ações */}
                        {m.status_efetivo === 'pago' && m.comprovante_url && (
                          <Button size="sm" variant="ghost" onClick={() => verComprovante(m.comprovante_url!)}
                            className="h-8 px-2 text-muted-foreground" title="Ver meu comprovante">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        )}
                        {aberta && !aguardando && (
                          <>
                            <input type="file" accept="image/*,.pdf" className="hidden"
                              ref={el => { fileRefs.current[m.id] = el; }}
                              onChange={e => { const f = e.target.files?.[0]; if (f) enviarComprovante(m, f); e.target.value = ''; }} />
                            <Button size="sm" variant="outline" onClick={() => escolherArquivo(m.id)}
                              disabled={enviando === m.id} className="h-8 border-border">
                              {enviando === m.id ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Upload className="h-4 w-4 mr-1.5" />}
                              Enviar comprovante
                            </Button>
                          </>
                        )}
                        {aguardando && m.comprovante_url && (
                          <Button size="sm" variant="ghost" onClick={() => verComprovante(m.comprovante_url!)}
                            className="h-8 px-2 text-muted-foreground" title="Ver meu comprovante enviado">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground pt-1">
              Após enviar o comprovante, a secretaria confirma o pagamento — o status muda para "Pago" quando validado.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
