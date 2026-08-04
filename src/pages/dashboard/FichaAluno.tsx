import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft, Loader2, User, Phone, Mail, MapPin,
  GraduationCap, FileText, CreditCard, Church, Home, Save, Printer, Camera,
  ChevronDown, ChevronRight, BookOpen, AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  getFichaAluno,
  type PerfilAluno,
  type MatriculaFicha,
  type DocumentoFicha,
  type MensalidadeFicha,
} from '@/services/ficha-aluno.service';
import type { Convalidacao } from '@/services/matricula-academica.service';
import { updatePerfil, type UpdatePerfilPayload } from '@/services/usuarios.service';
import { uploadAvatar } from '@/services/profile.service';
import { getHistoricoAluno, type HistoricoAluno, type StatusHistorico } from '@/services/academico.service';
import {
  getAvaliacoesBatch, createAvaliacao, lancarNota,
  type AvaliacoesPorDisciplina, type TipoNotaEditavel,
} from '@/services/notas.service';
import { aprovarMatricula } from '@/services/matriculas.service';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { DeclaracaoMatriculaPDF } from '@/components/dashboard/DeclaracaoMatriculaPDF';
import { DossieAlunoPDF } from '@/components/dashboard/DossieAlunoPDF';
import { getMensalidadesVw } from '@/services/financeiro.service';
import LancamentoRetroativo from '@/components/dashboard/LancamentoRetroativo';
import { ValoresMatriculaPanel } from '@/components/dashboard/ValoresMatriculaPanel';
import { useToast } from '@/hooks/use-toast';
import { formatDatePtBR } from '@/utils/date';
import { sanitizeDate } from '@/utils/sanitize';
import { InlineField } from '@/components/dashboard/InlineField';
import { BarraSecaoEditavel } from '@/components/dashboard/BarraSecaoEditavel';
import { useSecaoEditavel, type PayloadSecao } from '@/hooks/use-secao-editavel';
import type { DashboardContext } from '../Dashboard';

// ─── Helpers ─────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  ativa:     'bg-green-500/20 text-green-400 border-green-500/30',
  pendente:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  aprovada:  'bg-green-500/20 text-green-400 border-green-500/30',
  cancelada: 'bg-red-500/20 text-red-400 border-red-500/30',
  trancada:  'bg-slate-500/20 text-slate-400 border-slate-500/30',
  pago:      'bg-green-500/20 text-green-400 border-green-500/30',
  atrasado:  'bg-red-500/20 text-red-400 border-red-500/30',
  isento:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  validado:  'bg-green-500/20 text-green-400 border-green-500/30',
  rejeitado: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// Status de convalidação (pendente/aprovado/rejeitado) — R3.4
const CONVALIDACAO_STATUS_COLORS: Record<string, string> = {
  pendente:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  aprovado:  'bg-green-500/20 text-green-400 border-green-500/30',
  rejeitado: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// fmt() = timestamptz (created_at, enviado_em, solicitado_em) — conversão normal.
// ⚠️ Colunas DATE (data_nascimento, data_vencimento, data_pagamento) usam
// formatDatePtBR (utils/date) — `new Date('YYYY-MM-DD')` é meia-noite UTC e
// exibia 1 dia a menos em UTC-3 (BUG 15.1).
function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function moeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Componente principal ─────────────────────────────────────

export default function FichaAluno() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const navigate    = useNavigate();
  const { profile: adminProfile } = useOutletContext<DashboardContext>();

  const [loading,      setLoading]      = useState(true);
  const [perfil,       setPerfil]       = useState<PerfilAluno | null>(null);
  const [matriculas,   setMatriculas]   = useState<MatriculaFicha[]>([]);
  const [documentos,   setDocumentos]   = useState<DocumentoFicha[]>([]);
  const [mensalidades, setMensalidades] = useState<MensalidadeFicha[]>([]);
  const [convalidacoes, setConvalidacoes] = useState<Convalidacao[]>([]);

  const [obsEdit,    setObsEdit]    = useState('');
  const [savingObs,  setSavingObs]  = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [historico,  setHistorico]  = useState<HistoricoAluno | null>(null);
  const [loadingHist, setLoadingHist] = useState(false);
  // P2a — notas inline: ids das avaliações (lancarNota exige avaliacao_id) + turma do histórico
  const [avaliacoes, setAvaliacoes] = useState<AvaliacoesPorDisciplina>(new Map());
  const [turmaHist,  setTurmaHist]  = useState<string | null>(null);
  // RN4: disciplina sem N1/N2 — não grava direto, pede para criar a avaliação
  const [pedidoRN4, setPedidoRN4] = useState<
    { disciplinaId: string; disciplinaNome: string; tipo: TipoNotaEditavel; nota: number; consolidado: boolean } | null
  >(null);
  const [criandoAvaliacao, setCriandoAvaliacao] = useState(false);
  const [aprovandoId, setAprovandoId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ matriculaId: string; turma: string } | null>(null);
  const [gerandoDossie, setGerandoDossie] = useState(false);   // 2i — dossiê nesta ficha
  const { toast } = useToast();

  // 2i: dossiê completo (dados + financeiro + acadêmico) direto da ficha da secretaria.
  // Reusa DossieAlunoPDF; o financeiro vem de vw_mensalidades (status_efetivo + auditoria).
  // Mantém-se PII-FREE (DossieAlunoPDF não recebe CPF/RG), mesmo emitido daqui.
  const gerarDossie = async () => {
    if (!perfil) return;
    setGerandoDossie(true);
    try {
      const matAtiva = matriculas.find(m => m.status === 'ativa' && m.turma_id) ?? matriculas.find(m => m.turma_id) ?? matriculas[0];
      const mensalidadesVw = await getMensalidadesVw(perfil.id);
      const blob = await pdf(
        <DossieAlunoPDF
          aluno={{
            nome: perfil.full_name, codigo_itec: perfil.codigo_itec,
            curso_nome: (matAtiva?.turma as { cursos?: { nome?: string } } | undefined)?.cursos?.nome ?? null,
            turma_nome: matAtiva?.turma?.nome ?? matAtiva?.turma?.codigo ?? null,
            email: perfil.email, telefone: perfil.telefone,
            matricula_status: matAtiva?.status ?? null,
            motivo_suspensao: (matAtiva as { motivo_suspensao?: string | null } | undefined)?.motivo_suspensao ?? null,
            data_suspensao: (matAtiva as { data_suspensao?: string | null } | undefined)?.data_suspensao ?? null,
          }}
          mensalidades={mensalidadesVw}
          historico={historico}
          emitidoPor={adminProfile.full_name ?? 'Secretaria ITEC'}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dossie-${perfil.full_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[gerarDossie]', e);
      toast({ title: 'Erro ao gerar o dossiê', variant: 'destructive' });
    } finally {
      setGerandoDossie(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !perfil) return;
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use JPG, PNG ou WebP.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Tamanho máximo: 2MB.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const { url, error } = await uploadAvatar(perfil.id, file);
    setUploading(false);
    if (error) {
      toast({ title: 'Erro ao salvar foto', description: error, variant: 'destructive' });
      return;
    }
    setPerfil(prev => prev ? { ...prev, avatar_url: url } : prev);
    toast({ title: 'Foto atualizada com sucesso!' });
  };

  useEffect(() => {
    if (!alunoId) return;
    load(alunoId);
  }, [alunoId]);

  const load = async (id: string) => {
    setLoading(true);
    const ficha = await getFichaAluno(id);
    setPerfil(ficha.perfil);
    setMatriculas(ficha.matriculas);
    setDocumentos(ficha.documentos);
    setMensalidades(ficha.mensalidades);
    setConvalidacoes(ficha.convalidacoes);
    setObsEdit(ficha.perfil?.observacoes_internas ?? '');
    setLoading(false);

    // Carrega histórico após dados básicos prontos
    if (['superadmin', 'admin', 'administracao', 'professor'].includes(adminProfile.role)) {
      const matriculaAtiva = ficha.matriculas.find(m => m.status === 'ativa' && m.turma_id)
        ?? ficha.matriculas.find(m => m.turma_id);
      if (matriculaAtiva?.turma_id) {
        setLoadingHist(true);
        setTurmaHist(matriculaAtiva.turma_id);
        const hist = await getHistoricoAluno(id, matriculaAtiva.turma_id);
        setHistorico(hist);
        await carregarAvaliacoes(matriculaAtiva.turma_id, hist);
        setLoadingHist(false);
      }
    }
  };

  // ─── P2a: notas inline no histórico (LICAO-042 — escreve SÓ no bruto) ────────
  const carregarAvaliacoes = async (turmaId: string, hist: HistoricoAluno | null) => {
    if (!hist) { setAvaliacoes(new Map()); return; }
    const ids = hist.modulos.flatMap(m => m.disciplinas.map(d => d.id));
    setAvaliacoes(await getAvaliacoesBatch(turmaId, ids));
  };

  // Média/Freq/Status são DERIVADOS: quem recalcula é o trigger 065. Depois de
  // gravar no bruto, relemos o histórico para refletir o que o banco decidiu —
  // a ficha NUNCA calcula nem escreve consolidado (LICAO-042/043).
  const recarregarHistorico = async (turmaId: string) => {
    if (!alunoId) return;
    const hist = await getHistoricoAluno(alunoId, turmaId);
    setHistorico(hist);
    await carregarAvaliacoes(turmaId, hist);
  };

  /** Grava a nota no BRUTO (notas_aluno). Lança em caso de erro para o InlineField
   *  manter a célula em edição com o valor digitado (LICAO-027). */
  const persistirNota = async (avaliacaoId: string, disciplinaId: string, nota: number) => {
    if (!alunoId || !turmaHist) throw new Error('Aluno ou turma não identificados');
    const { error } = await lancarNota(avaliacaoId, alunoId, disciplinaId, turmaHist, nota, adminProfile.id);
    if (error) {
      toast({ title: 'Erro ao lançar nota', description: error, variant: 'destructive' });
      throw new Error(error);
    }
    await recarregarHistorico(turmaHist);
    toast({ title: 'Nota lançada', description: 'Média, frequência e situação foram recalculadas pelo sistema.' });
  };

  const salvarNota = async (
    disciplinaId: string, disciplinaNome: string,
    tipo: TipoNotaEditavel, valor: string, consolidado: boolean,
  ) => {
    const nota = Number(valor.replace(',', '.'));
    const avaliacaoId = avaliacoes.get(disciplinaId)?.[tipo];

    // RN4: sem avaliação cadastrada, gravar no bruto faria o trigger zerar a média
    // de um lançamento retroativo. Não grava direto — pede confirmação.
    if (!avaliacaoId) {
      setPedidoRN4({ disciplinaId, disciplinaNome, tipo, nota, consolidado });
      return;
    }
    await persistirNota(avaliacaoId, disciplinaId, nota);
  };

  /** RN4 confirmado: cria a avaliação (peso 1.0, default do banco) e então lança. */
  const confirmarCriarAvaliacao = async () => {
    if (!pedidoRN4 || !turmaHist || !alunoId) return;
    const { disciplinaId, tipo, nota } = pedidoRN4;
    setCriandoAvaliacao(true);

    // A tabela não tem UNIQUE(disciplina,turma,tipo): revalida para não duplicar
    // se a avaliação tiver surgido entre o clique e a confirmação.
    const atuais = await getAvaliacoesBatch(turmaHist, [disciplinaId]);
    let avaliacaoId = atuais.get(disciplinaId)?.[tipo];

    if (!avaliacaoId) {
      const { data, error } = await createAvaliacao(
        disciplinaId, turmaHist, tipo, adminProfile.id, `${tipo} — criada pela ficha do aluno`,
      );
      if (error || !data) {
        setCriandoAvaliacao(false);
        toast({ title: 'Erro ao criar avaliação', description: error ?? 'Falha desconhecida', variant: 'destructive' });
        return;
      }
      avaliacaoId = data.id;
    }

    const { error } = await lancarNota(avaliacaoId, alunoId, disciplinaId, turmaHist, nota, adminProfile.id);
    setCriandoAvaliacao(false);
    if (error) {
      toast({ title: 'Erro ao lançar nota', description: error, variant: 'destructive' });
      return;
    }
    setPedidoRN4(null);
    await recarregarHistorico(turmaHist);
    toast({ title: 'Avaliação criada e nota lançada' });
  };

  const salvarObs = async () => {
    if (!alunoId) return;
    setSavingObs(true);
    await updatePerfil(alunoId, { observacoes_internas: obsEdit });
    setSavingObs(false);
  };

  // ─── P1: edição inline por seção (RN1/RN2/RN6) ──────────────────────────────
  // Só staff edita. RN2: `role` NUNCA entra no payload — o WITH CHECK da policy
  // profiles_update_administracao derrubaria o UPDATE inteiro.
  const podeEditarDados = ['superadmin', 'admin', 'administracao'].includes(adminProfile.role);

  const persistir = async (payload: PayloadSecao) => {
    if (!alunoId) return { error: 'Aluno não identificado' };
    // RN1: data_nascimento normalizada como no updateUsuario.
    const final: PayloadSecao = { ...payload };
    if ('data_nascimento' in final) {
      final.data_nascimento = sanitizeDate(final.data_nascimento ?? undefined);
    }
    // `null` limpa a coluna — o tipo do service só prevê string, daí o cast no limite.
    return updatePerfil(alunoId, final as UpdatePerfilPayload);
  };

  const aplicarNoPerfil = (payload: PayloadSecao) =>
    setPerfil(prev => (prev ? { ...prev, ...(payload as Partial<PerfilAluno>) } : prev));

  const secaoDados = useSecaoEditavel({
    rotulo: 'Dados pessoais', onSalvar: persistir, onSucesso: aplicarNoPerfil,
  });
  const secaoEndereco = useSecaoEditavel({
    rotulo: 'Endereço', onSalvar: persistir, onSucesso: aplicarNoPerfil,
  });
  const secaoMinisterio = useSecaoEditavel({
    rotulo: 'Ministério', onSalvar: persistir, onSucesso: aplicarNoPerfil,
  });

  const podeAprovar     = ['superadmin', 'admin', 'administracao'].includes(adminProfile.role);

  const handleAprovar = async () => {
    if (!confirmDialog || !alunoId) return;
    setAprovandoId(confirmDialog.matriculaId);
    const { error } = await aprovarMatricula(confirmDialog.matriculaId, adminProfile.id);
    setAprovandoId(null);
    setConfirmDialog(null);
    if (error) {
      toast({ title: 'Erro ao aprovar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Matrícula aprovada com sucesso!' });
      setMatriculas(prev => prev.map(m =>
        m.id === confirmDialog.matriculaId ? { ...m, status: 'ativa' } : m
      ));
    }
  };
  const podeVerObs      = ['superadmin', 'admin', 'administracao'].includes(adminProfile.role);
  const podeVerDocs     = ['superadmin', 'admin', 'administracao'].includes(adminProfile.role);
  const podeVerHistorico = ['superadmin', 'admin', 'administracao', 'professor'].includes(adminProfile.role);
  const podeLancar       = ['superadmin', 'admin', 'administracao'].includes(adminProfile.role);
  const podeVerConvalidacoes = ['superadmin', 'admin', 'administracao'].includes(adminProfile.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>Aluno não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const inadimplente = mensalidades.some(m => m.status === 'atrasado');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Ficha do Aluno</h1>
        {/* 2i: dossiê completo (acadêmico + financeiro) — a secretaria gera daqui */}
        <Button variant="outline" size="sm" onClick={gerarDossie} disabled={gerandoDossie}
          className="ml-auto border-border">
          {gerandoDossie ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <FileText className="h-4 w-4 mr-1.5 text-[#BF9000]" />}
          Dossiê completo (PDF)
        </Button>
      </div>

      {/* Dados pessoais */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-start gap-4">
          <label className="cursor-pointer group relative w-16 h-16 block shrink-0">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            {perfil.avatar_url ? (
              <img
                src={perfil.avatar_url}
                alt={perfil.full_name}
                className="h-16 w-16 rounded-full object-cover border"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border">
                {perfil.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {uploading
                ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                : <Camera className="h-5 w-5 text-white" />
              }
            </div>
          </label>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold">{perfil.full_name}</h2>
              {perfil.codigo_itec && (
                <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 text-xs font-mono">
                  Código ITEC: {perfil.codigo_itec}
                </Badge>
              )}
              {inadimplente && (
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                  Inadimplente
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground capitalize">{perfil.role}</p>
            <p className="text-xs text-muted-foreground mt-1">Cadastrado em {fmt(perfil.created_at)}</p>
          </div>
        </div>

        {/* Campos renderizados INCONDICIONALMENTE (P1): vazio vira placeholder clicável. */}
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <CampoInline icon={<User className="h-4 w-4" />} label="Nome completo"
            valor={secaoDados.valorDe('full_name', perfil.full_name)}
            onChange={v => secaoDados.setCampo('full_name', v)} disabled={!podeEditarDados} />
          {/* profiles.email é o e-mail de CONTATO/EXIBIÇÃO. A credencial de login
              vive em auth.users e NÃO é alterada aqui (cicatriz 2d79368 — não
              tocamos em auth). O aviso evita a secretaria achar que trocou o acesso. */}
          <CampoInline icon={<Mail className="h-4 w-4" />} label="E-mail"
            valor={secaoDados.valorDe('email', perfil.email)}
            onChange={v => secaoDados.setCampo('email', v)} disabled={!podeEditarDados}
            hint="E-mail de contato/exibição. NÃO altera o login do aluno." />
          <CampoInline icon={<Phone className="h-4 w-4" />} label="Telefone"
            valor={secaoDados.valorDe('telefone', perfil.telefone)}
            onChange={v => secaoDados.setCampo('telefone', v)} disabled={!podeEditarDados} />
          <CampoInline icon={<FileText className="h-4 w-4" />} label="CPF"
            valor={secaoDados.valorDe('cpf', perfil.cpf)}
            onChange={v => secaoDados.setCampo('cpf', v)} disabled={!podeEditarDados} />
          <CampoInline icon={<FileText className="h-4 w-4" />} label="RG"
            valor={secaoDados.valorDe('rg', perfil.rg)}
            onChange={v => secaoDados.setCampo('rg', v)} disabled={!podeEditarDados} />
          <CampoInline icon={<User className="h-4 w-4" />} label="Nascimento" type="date"
            valor={secaoDados.valorDe('data_nascimento', perfil.data_nascimento)}
            onChange={v => secaoDados.setCampo('data_nascimento', v)} disabled={!podeEditarDados} />
          <CampoInline icon={<User className="h-4 w-4" />} label="Sexo" options={SEXO_OPCOES}
            valor={secaoDados.valorDe('sexo', perfil.sexo)}
            onChange={v => secaoDados.setCampo('sexo', v)} disabled={!podeEditarDados} />
          <div className="sm:col-span-2">
            <CampoInline icon={<MapPin className="h-4 w-4" />} label="Bio"
              valor={secaoDados.valorDe('bio', perfil.bio)}
              onChange={v => secaoDados.setCampo('bio', v)} disabled={!podeEditarDados} />
          </div>
        </div>

        {podeEditarDados && (
          <BarraSecaoEditavel qtd={secaoDados.qtd} salvando={secaoDados.salvando}
            onSalvar={secaoDados.salvar} onCancelar={secaoDados.cancelar} />
        )}
      </div>

      {/* Endereço — seção SEMPRE visível (P1): sem ela não havia como preencher
          um endereço em branco pela ficha. */}
      <Section title="Endereço" icon={<Home className="h-4 w-4" />}>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <CampoInline icon={<MapPin className="h-4 w-4" />} label="Logradouro"
            valor={secaoEndereco.valorDe('endereco', perfil.endereco)}
            onChange={v => secaoEndereco.setCampo('endereco', v)} disabled={!podeEditarDados} />
          <CampoInline icon={<MapPin className="h-4 w-4" />} label="Número"
            valor={secaoEndereco.valorDe('numero', perfil.numero)}
            onChange={v => secaoEndereco.setCampo('numero', v)} disabled={!podeEditarDados} />
          <CampoInline icon={<MapPin className="h-4 w-4" />} label="Complemento"
            valor={secaoEndereco.valorDe('complemento', perfil.complemento)}
            onChange={v => secaoEndereco.setCampo('complemento', v)} disabled={!podeEditarDados} />
          <CampoInline icon={<MapPin className="h-4 w-4" />} label="Bairro"
            valor={secaoEndereco.valorDe('bairro', perfil.bairro)}
            onChange={v => secaoEndereco.setCampo('bairro', v)} disabled={!podeEditarDados} />
          <CampoInline icon={<MapPin className="h-4 w-4" />} label="Cidade"
            valor={secaoEndereco.valorDe('cidade', perfil.cidade)}
            onChange={v => secaoEndereco.setCampo('cidade', v)} disabled={!podeEditarDados} />
          {/* estado é VARCHAR(2) no banco — valida antes de bater na constraint. */}
          <CampoInline icon={<MapPin className="h-4 w-4" />} label="Estado (UF)"
            valor={secaoEndereco.valorDe('estado', perfil.estado)}
            onChange={v => secaoEndereco.setCampo('estado', v.toUpperCase())}
            validate={v => (v.length > 2 ? 'Use a sigla com 2 letras (ex.: PE)' : null)}
            disabled={!podeEditarDados} />
          <CampoInline icon={<MapPin className="h-4 w-4" />} label="CEP"
            valor={secaoEndereco.valorDe('cep', perfil.cep)}
            onChange={v => secaoEndereco.setCampo('cep', v)} disabled={!podeEditarDados} />
        </div>
        {podeEditarDados && (
          <BarraSecaoEditavel qtd={secaoEndereco.qtd} salvando={secaoEndereco.salvando}
            onSalvar={secaoEndereco.salvar} onCancelar={secaoEndereco.cancelar} />
        )}
      </Section>

      {/* Ministério — idem: sempre visível para permitir o preenchimento. */}
      <Section title="Ministério" icon={<Church className="h-4 w-4" />}>
        <CampoInline icon={<Church className="h-4 w-4" />} label="Igreja local"
          valor={secaoMinisterio.valorDe('igreja_local', perfil.igreja_local)}
          onChange={v => secaoMinisterio.setCampo('igreja_local', v)} disabled={!podeEditarDados} />
        {podeEditarDados && (
          <BarraSecaoEditavel qtd={secaoMinisterio.qtd} salvando={secaoMinisterio.salvando}
            onSalvar={secaoMinisterio.salvar} onCancelar={secaoMinisterio.cancelar} />
        )}
      </Section>

      {/* Matrículas */}
      <Section title="Matrículas" icon={<GraduationCap className="h-4 w-4" />}>
        {matriculas.length === 0 ? (
          <Empty text="Nenhuma matrícula registrada." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">Nº Matrícula</th>
                <th className="pb-2 font-medium">Turma</th>
                <th className="pb-2 font-medium">Data</th>
                <th className="pb-2 font-medium">Status</th>
                {podeAprovar && <th className="pb-2 font-medium">Ação</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {matriculas.map(m => (
                <tr key={m.id}>
                  <td className="py-2 font-mono text-xs">
                    {m.numero_matricula
                      ? <span className="text-foreground">{m.numero_matricula}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-2">{m.turma?.codigo ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-2">{fmt(m.created_at)}</td>
                  <td className="py-2">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[m.status] ?? ''}`}>
                      {m.status}
                    </Badge>
                  </td>
                  {podeAprovar && (
                    <td className="py-2">
                      {m.status === 'pendente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2 text-green-400 border-green-500/30 hover:bg-green-500/10"
                          disabled={aprovandoId === m.id}
                          onClick={() => setConfirmDialog({
                            matriculaId: m.id,
                            turma: m.turma?.nome ?? m.turma?.codigo ?? 'turma',
                          })}
                        >
                          Aprovar
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Dialog: confirmar aprovação de matrícula */}
      <Dialog open={!!confirmDialog} onOpenChange={open => { if (!open) setConfirmDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar aprovação</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Aprovar a matrícula de <strong className="text-foreground">{perfil?.full_name}</strong> para{' '}
            <strong className="text-foreground">{confirmDialog?.turma}</strong>?
            O status será atualizado de <em>pendente</em> para <em>ativa</em>.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDialog(null)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAprovar} disabled={!!aprovandoId}>
              {aprovandoId ? 'Aprovando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Histórico Acadêmico */}
      {podeVerHistorico && (
        <Section title="Histórico Acadêmico" icon={<BookOpen className="h-4 w-4" />}>
          {loadingHist ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico…
            </div>
          ) : !historico || historico.modulos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {matriculas.find(m => m.turma_id) ? 'Nenhuma disciplina matriculada.' : 'Aluno sem matrícula ativa.'}
            </p>
          ) : (
            <div className="space-y-3">
              {historico.modulos.map(mod => (
                <ModuloAccordion key={mod.id} modulo={mod}
                  editavel={podeLancar} onSalvarNota={salvarNota} />
              ))}
              {/* Rodapé */}
              <div className="flex flex-wrap gap-4 pt-3 border-t text-sm">
                <span className="text-muted-foreground">
                  Média geral: <strong className="text-foreground">{historico.media_geral?.toFixed(1) ?? '—'}</strong>
                </span>
                <span className="text-green-400">✓ {historico.disciplinas_aprovadas} aprovadas</span>
                <span className="text-red-400">✗ {historico.disciplinas_reprovadas} reprovadas</span>
                <span className="text-muted-foreground">{historico.disciplinas_em_andamento} em andamento</span>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* RN4 — disciplina sem N1/N2: criar a avaliação no ato antes de lançar.
          Sem isso, gravar no bruto faria o trigger 065 recalcular com uma nota só
          e zerar (media=NULL) um lançamento retroativo — perda silenciosa. */}
      <Dialog open={!!pedidoRN4} onOpenChange={o => { if (!o && !criandoAvaliacao) setPedidoRN4(null); }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-merriweather text-foreground">Criar avaliação {pedidoRN4?.tipo}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">{pedidoRN4?.disciplinaNome}</strong> ainda não tem{' '}
              <strong className="text-foreground">{pedidoRN4?.tipo}</strong> cadastrada nesta turma.
              Criar agora para lançar a nota <strong className="text-foreground">{pedidoRN4?.nota.toFixed(1)}</strong>?
            </p>
            {pedidoRN4?.consolidado && (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
                Esta disciplina tem <strong>lançamento retroativo</strong>. A partir de agora a média
                passa a ser calculada pelas notas lançadas (N1 e N2), e não mais pelo valor lançado à mão.
                Lance <strong>as duas notas</strong> para a média voltar a aparecer.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPedidoRN4(null)} disabled={criandoAvaliacao}>
              Cancelar
            </Button>
            <Button size="sm" onClick={confirmarCriarAvaliacao} disabled={criandoAvaliacao}>
              {criandoAvaliacao
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Criando…</>
                : 'Criar e lançar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lançamento Retroativo (R2) */}
      {podeLancar && (
        <Section title="Lançamento Retroativo" icon={<BookOpen className="h-4 w-4" />}>
          <LancamentoRetroativo
            matricula={
              (matriculas.find(m => m.status === 'ativa' && m.turma_id)
                ?? matriculas.find(m => m.turma_id)
                ?? matriculas[0]) ?? null
            }
            requesterId={adminProfile.id}
          />
        </Section>
      )}

      {/* Documentos */}
      <Section title="Documentos" icon={<FileText className="h-4 w-4" />}>
        {documentos.length === 0 ? (
          <Empty text="Nenhum documento registrado." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">Documento</th>
                <th className="pb-2 font-medium">Enviado em</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documentos.map(d => (
                <tr key={d.id}>
                  <td className="py-2">
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noopener noreferrer"
                        className="hover:text-primary underline underline-offset-2">
                        {d.tipo}
                      </a>
                    ) : d.tipo}
                  </td>
                  <td className="py-2">{fmt(d.enviado_em)}</td>
                  <td className="py-2">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[d.status] ?? ''}`}>
                      {d.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">{d.observacao ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Convalidações (staff — leitura; gestão em Convalidacoes.tsx) */}
      {podeVerConvalidacoes && (
        <Section title="Convalidações" icon={<BookOpen className="h-4 w-4" />}>
          <div className="flex justify-end mb-2">
            <Button size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => navigate('/dashboard/convalidacoes')}>
              Gerenciar convalidações
            </Button>
          </div>
          {convalidacoes.length === 0 ? (
            <Empty text="Nenhuma convalidação registrada." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2 font-medium">Disciplina (origem)</th>
                  <th className="pb-2 font-medium">Instituição</th>
                  <th className="pb-2 font-medium">CH</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Docs</th>
                  <th className="pb-2 font-medium">Solicitado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {convalidacoes.map(c => (
                  <tr key={c.id}>
                    <td className="py-2">{c.disciplina_origem || <span className="text-muted-foreground">—</span>}</td>
                    <td className="py-2">{c.instituicao_origem || <span className="text-muted-foreground">—</span>}</td>
                    <td className="py-2">{c.carga_horaria_origem != null ? `${c.carga_horaria_origem}h` : '—'}</td>
                    <td className="py-2">
                      <Badge variant="outline" className={`text-xs ${CONVALIDACAO_STATUS_COLORS[c.status] ?? ''}`}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs">
                      {(c.documentos_url ?? []).length === 0
                        ? <span className="text-muted-foreground">—</span>
                        : (c.documentos_url ?? []).map((u, i) => (
                            <a key={i} href={u} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:underline mr-2">Ver doc{(c.documentos_url ?? []).length > 1 ? ` ${i + 1}` : ''}</a>
                          ))}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">{fmt(c.solicitado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      )}

      {/* Financeiro */}
      <Section title="Financeiro" icon={<CreditCard className="h-4 w-4" />}>
        {/* Etapa 2b: valores efetivos da matrícula (tabela + override) — secretaria edita */}
        {(() => {
          const matFin = matriculas.find(m => m.status === 'ativa') ?? matriculas[0];
          return matFin ? (
            <div className="mb-5">
              <ValoresMatriculaPanel matriculaId={matFin.id} editavel />
            </div>
          ) : null;
        })()}

        {mensalidades.length === 0 ? (
          <Empty text="Nenhuma mensalidade registrada." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">Referência</th>
                <th className="pb-2 font-medium">Valor</th>
                <th className="pb-2 font-medium">Vencimento</th>
                <th className="pb-2 font-medium">Pagamento</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mensalidades.map(m => (
                <tr key={m.id}>
                  <td className="py-2 font-mono text-xs">{m.mes_referencia}</td>
                  <td className="py-2">{moeda(m.valor)}</td>
                  <td className="py-2">{formatDatePtBR(m.data_vencimento)}</td>
                  <td className="py-2">{formatDatePtBR(m.data_pagamento)}</td>
                  <td className="py-2">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[m.status] ?? ''}`}>
                      {m.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Documentos e Impressões — só para secretaria/admin */}
      {podeVerDocs && (
        <Section title="Documentos e Impressões" icon={<Printer className="h-4 w-4" />}>
          <p className="text-xs text-muted-foreground mb-3">Gere e imprima documentos oficiais do aluno.</p>
          <div className="space-y-2">
            {/* Declaração de Matrícula — habilitada */}
            {(() => {
              const matAtiva = matriculas.find(m => m.status === 'ativa' && m.turma_id)
                ?? matriculas.find(m => m.turma_id);
              const turma = matAtiva?.turma;
              const cursoPDF = (turma as any)?.cursos?.nome ?? 'Graduação em Teologia Livre';
              const canPDF = !!matAtiva && !!perfil;

              return canPDF ? (
                <PDFDownloadLink
                  document={
                    <DeclaracaoMatriculaPDF
                      aluno={{ full_name: perfil!.full_name, cpf: perfil!.cpf, codigo_itec: perfil!.codigo_itec }}
                      matricula={{
                        turma_nome: turma?.nome ?? matAtiva?.turma?.codigo ?? '—',
                        curso_nome: cursoPDF,
                        data_inicio: matAtiva.data_inicio ?? turma?.data_inicio,
                      }}
                    />
                  }
                  fileName={`declaracao-matricula-${perfil!.full_name.replace(/\s+/g, '-').toLowerCase()}.pdf`}
                  className="block w-full"
                >
                  {({ loading: pdfLoading }) => (
                    <Button variant="outline" className="w-full justify-between text-left" disabled={pdfLoading}>
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        Declaração de Matrícula
                      </span>
                      <span className="ml-3 shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        {pdfLoading ? 'Gerando…' : 'Baixar PDF'}
                      </span>
                    </Button>
                  )}
                </PDFDownloadLink>
              ) : (
                <div title="Aluno sem matrícula ativa com turma">
                  <Button variant="outline" disabled className="w-full justify-between text-left">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      Declaração de Matrícula
                    </span>
                    <span className="ml-3 shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      Sem matrícula ativa
                    </span>
                  </Button>
                </div>
              );
            })()}

            {/* Demais documentos — Sprint P */}
            {['Boletim de Notas', 'Situação Financeira', 'Certificado de Conclusão', 'Relatório Final do Aluno'].map(doc => (
              <div key={doc} title="Disponível em Sprint P">
                <Button variant="outline" disabled className="w-full justify-between text-left">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {doc}
                  </span>
                  <span className="ml-3 shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                    Em breve
                  </span>
                </Button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Observações internas — só para secretaria/admin */}
      {podeVerObs && (
        <Section title="Observações Internas" icon={<FileText className="h-4 w-4" />}>
          <div className="space-y-3">
            <Textarea
              value={obsEdit}
              onChange={e => setObsEdit(e.target.value)}
              placeholder="Notas internas sobre este aluno…"
              rows={4}
              className="resize-none"
            />
            <Button size="sm" onClick={salvarObs} disabled={savingObs}>
              <Save className="h-4 w-4 mr-2" />
              {savingObs ? 'Salvando…' : 'Salvar observações'}
            </Button>
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────

const STATUS_HIST_CFG: Record<StatusHistorico, { label: string; cls: string }> = {
  aprovado_direto:  { label: 'Aprovado',       cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  recuperacao:      { label: 'Recuperação',     cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  reprovado_nota:   { label: 'Repr. nota',      cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  reprovado_falta:  { label: 'Repr. falta',     cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  convalidado:      { label: 'Convalidado',     cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  em_andamento:     { label: 'Em andamento',    cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  pendente:         { label: 'Pendente',         cls: 'bg-muted text-muted-foreground border-border' },
};

function StatusHistBadge({ status }: { status: StatusHistorico }) {
  const cfg = STATUS_HIST_CFG[status];
  return (
    <Badge variant="outline" className={`text-xs shrink-0 ${cfg.cls}`}>{cfg.label}</Badge>
  );
}

// Validação da nota (0–10, até 1 casa). Vazio é rejeitado de propósito: remover
// nota é exclusão de lançamento, não faz parte do P2a.
function validarNota(v: string): string | null {
  const bruto = v.trim();
  if (bruto === '') return 'Informe uma nota de 0 a 10';
  const n = Number(bruto.replace(',', '.'));
  if (Number.isNaN(n)) return 'Use um número (ex.: 7.5)';
  if (n < 0 || n > 10) return 'A nota deve estar entre 0 e 10';
  if (Math.round(n * 10) !== Math.round(n * 100) / 10) return 'Use no máximo 1 casa decimal';
  return null;
}

/** Célula de nota: read-only para quem não lança; inline para a secretaria. */
function CelulaNota({
  valor, editavel, onSalvar,
}: {
  valor: number | null;
  editavel: boolean;
  onSalvar: (v: string) => Promise<void>;
}) {
  if (!editavel) return <>{valor?.toFixed(1) ?? '—'}</>;
  return (
    <InlineField
      type="number"
      value={valor != null ? String(valor) : ''}
      placeholder="—"
      validate={validarNota}
      onSave={onSalvar}
      label="Nota"
    />
  );
}

function ModuloAccordion({
  modulo, editavel = false, onSalvarNota,
}: {
  modulo: HistoricoAluno['modulos'][0];
  editavel?: boolean;
  onSalvarNota?: (
    disciplinaId: string, disciplinaNome: string,
    tipo: TipoNotaEditavel, valor: string, consolidado: boolean,
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(true);
  const mediaCls = modulo.media_modulo === null ? 'text-muted-foreground'
    : modulo.media_modulo >= 7 ? 'text-green-400'
    : modulo.media_modulo >= 5 ? 'text-yellow-400'
    : 'text-red-400';

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          {modulo.nome}
        </div>
        <span className={`text-xs font-semibold ${mediaCls}`}>
          {modulo.media_modulo !== null ? `Média: ${modulo.media_modulo.toFixed(1)}` : 'Sem notas'}
        </span>
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="px-4 py-2 font-medium">Disciplina</th>
                <th className="px-2 py-2 font-medium text-center">N1</th>
                <th className="px-2 py-2 font-medium text-center">N2</th>
                <th className="px-2 py-2 font-medium text-center">Rec</th>
                <th className="px-2 py-2 font-medium text-center">Média</th>
                <th className="px-2 py-2 font-medium text-center">Freq %</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {modulo.disciplinas.map(d => (
                <tr key={d.id} className="hover:bg-muted/10">
                  <td className="px-4 py-2 font-medium">{d.nome}</td>
                  {/* N1/N2/Rec: BRUTO (notas_aluno) — editáveis. */}
                  <td className="px-2 py-2 text-center">
                    <CelulaNota valor={d.notas.n1} editavel={editavel}
                      onSalvar={v => onSalvarNota!(d.id, d.nome, 'N1', v, !!d.consolidado)} />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <CelulaNota valor={d.notas.n2} editavel={editavel}
                      onSalvar={v => onSalvarNota!(d.id, d.nome, 'N2', v, !!d.consolidado)} />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <CelulaNota valor={d.notas.recuperacao} editavel={editavel}
                      onSalvar={v => onSalvarNota!(d.id, d.nome, 'recuperacao', v, !!d.consolidado)} />
                  </td>
                  {/* Média/Freq/Status: DERIVADOS pelo trigger 065 — sempre read-only. */}
                  <td className="px-2 py-2 text-center font-semibold">{d.notas.media_final?.toFixed(1) ?? '—'}</td>
                  <td className="px-2 py-2 text-center">
                    <span className={d.frequencia.percentual < 75 ? 'text-red-400 font-semibold' : ''}>
                      {d.frequencia.total_aulas > 0 ? `${d.frequencia.percentual}%` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2"><StatusHistBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// profiles.sexo tem CHECK (sexo IN ('masculino','feminino','outro')) — migration 021.
// Os `value` batem EXATAMENTE com o CHECK; texto livre quebraria o insert (ERR-LOGIC-003).
const SEXO_OPCOES = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino',  label: 'Feminino'  },
  { value: 'outro',     label: 'Outro'     },
];

// Versão editável do InfoRow (SPEC-16 P1). Renderiza SEMPRE — mesmo vazio, onde
// mostra "— clique para preencher". Antes os campos eram condicionais
// (`{perfil.cpf && ...}`) e um CPF em branco simplesmente não aparecia,
// tornando impossível preenchê-lo pela ficha.
function CampoInline({
  icon, label, valor, onChange, type, options, disabled, validate, hint,
}: {
  icon: React.ReactNode;
  label: string;
  valor: string;
  onChange: (v: string) => void;
  type?: 'text' | 'number' | 'date';
  options?: { value: string; label: string }[];
  disabled?: boolean;
  validate?: (v: string) => string | null;
  /** Texto de ajuda abaixo do campo — para avisar o que o campo NÃO faz. */
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <InlineField
          value={valor}
          onSave={onChange}
          type={type}
          options={options}
          disabled={disabled}
          validate={validate}
          label={label}
        />
        {hint && <p className="text-[11px] text-muted-foreground/80 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/20">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5 overflow-x-auto">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
