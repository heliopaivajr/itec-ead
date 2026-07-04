import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, AlertTriangle, CheckCircle2,
  FileText, ClipboardList, RefreshCw, Star, PlusCircle, Clock, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useProfessorDisciplinas } from '@/hooks/useProfessorDisciplinas';
import {
  criarSolicitacao, getSolicitacoesByProfessor,
  type SolicitacaoDisciplina,
} from '@/services/solicitacoes.service';
import { getAllDisciplinas } from '@/services/academico.service';
import type { DashboardContext } from '../Dashboard';
import type { Disciplina } from '@/services/academico.service';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pendente:  { label: 'Aguardando aprovação', className: 'bg-yellow-500/20 text-yellow-600 border-yellow-400/30' },
  aprovada:  { label: 'Aprovada',             className: 'bg-green-500/20 text-green-600 border-green-400/30' },
  recusada:  { label: 'Recusada',             className: 'bg-red-500/20 text-red-600 border-red-400/30' },
  encerrada: { label: 'Encerrada',            className: 'bg-gray-500/20 text-gray-500 border-gray-400/30' },
};

export default function ProfessorHome() {
  const { profile } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();
  const { professor, disciplinas, loading, error } = useProfessorDisciplinas(profile.id);

  const [solicitacoes, setSolicitacoes]     = useState<SolicitacaoDisciplina[]>([]);
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<Disciplina[]>([]);
  const [selectedDisc, setSelectedDisc]     = useState('');
  const [observacao, setObservacao]         = useState('');
  const [salvando, setSalvando]             = useState(false);
  const [solError, setSolError]             = useState<string | null>(null);

  // Carrega solicitações do professor
  useEffect(() => {
    if (!professor) return;
    getSolicitacoesByProfessor(professor.id).then(setSolicitacoes);
  }, [professor]);

  // Ao abrir dialog: carrega disciplinas disponíveis
  useEffect(() => {
    if (!dialogOpen) return;
    getAllDisciplinas().then(all => {
      const jaVinculadas = new Set(disciplinas.map(d => d.disciplina.id));
      const jaSolicitadas = new Set(
        solicitacoes.filter(s => s.status === 'pendente' || s.status === 'aprovada').map(s => s.disciplina_id)
      );
      setDisciplinasDisponiveis(all.filter(d => !jaVinculadas.has(d.id) && !jaSolicitadas.has(d.id)));
    });
  }, [dialogOpen, disciplinas, solicitacoes]);

  const handleSolicitar = async () => {
    if (!professor || !selectedDisc) return;
    setSalvando(true);
    setSolError(null);
    const { error: err } = await criarSolicitacao(professor.id, selectedDisc, null, observacao || undefined);
    setSalvando(false);
    if (err) { setSolError(err); return; }
    setDialogOpen(false);
    setSelectedDisc('');
    setObservacao('');
    getSolicitacoesByProfessor(professor.id).then(setSolicitacoes);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error === 'cadastro-incompleto') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 opacity-80" />
        <div>
          <p className="font-semibold text-foreground">Cadastro de professor incompleto</p>
          <p className="text-sm text-muted-foreground mt-1">
            Seu perfil de professor ainda não foi criado pela secretaria.<br />
            Entre em contato com a administração para regularizar seu cadastro.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive opacity-60" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  const nome = professor?.nome_completo ?? profile.full_name ?? 'Professor';
  const totalEmRisco = disciplinas.reduce((s, d) => s + d.alunos_em_risco, 0);

  const PREFIXOS = ['Prof. ', 'Profa. ', 'Professor ', 'Professora ', 'Dr. ', 'Pastor '];
  const nomeExibicao = PREFIXOS.some(p => nome.trim().startsWith(p))
    ? nome.trim()
    : `Prof. ${nome.trim()}`;
  const solicitacoesPendentes = solicitacoes.filter(s => s.status === 'pendente');
  // Vínculos ativos ainda não assinados (formalidade paralela — não bloqueia nada).
  const contratosParaAssinar = disciplinas.filter(d => d.contrato.status !== 'assinado');

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-primary">
            Olá, {nomeExibicao.split(' ').slice(0, 2).join(' ')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {disciplinas.length} disciplina{disciplinas.length !== 1 ? 's' : ''} ativa{disciplinas.length !== 1 ? 's' : ''}
            {totalEmRisco > 0 && ` · ${totalEmRisco} aluno${totalEmRisco > 1 ? 's' : ''} em risco de frequência`}
          </p>
        </div>
        {professor && (
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" /> Solicitar Disciplina
          </Button>
        )}
      </div>

      {/* Aviso de solicitações pendentes */}
      {solicitacoesPendentes.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
          <Clock className="h-4 w-4 shrink-0" />
          {solicitacoesPendentes.length} solicitação{solicitacoesPendentes.length > 1 ? 'ões' : ''} aguardando aprovação da secretaria.
        </div>
      )}

      {/* Aviso de assinatura pendente — formalidade, NÃO bloqueia o trabalho */}
      {contratosParaAssinar.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 flex items-start sm:items-center justify-between gap-3 flex-wrap text-sm text-blue-700 dark:text-blue-300">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {contratosParaAssinar.length} contrato{contratosParaAssinar.length > 1 ? 's' : ''} pendente{contratosParaAssinar.length > 1 ? 's' : ''} de assinatura — baixe, assine e entregue à secretaria.
              <span className="text-blue-600/70 dark:text-blue-300/70"> (não impede você de trabalhar)</span>
            </span>
          </div>
          <Button
            size="sm" variant="outline"
            className="border-blue-400/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 shrink-0"
            onClick={() => navigate(`/dashboard/professor/contrato/${contratosParaAssinar[0].contrato.id}`)}
          >
            <FileText className="h-4 w-4 mr-1.5" /> Baixar contrato
          </Button>
        </div>
      )}

      {/* Sem disciplinas */}
      {disciplinas.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-foreground">Nenhuma disciplina ativa</p>
          <p className="text-sm mt-1">Use o botão "Solicitar Disciplina" para pedir acesso a uma disciplina.</p>
        </div>
      )}

      {/* Cards por disciplina */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disciplinas.map(({ contrato, disciplina, alunos_em_risco, manual_disponivel, turma_id }) => (
          <div key={contrato.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all">
            {/* Header */}
            <div className="bg-primary/5 border-b border-border p-4">
              <p className="text-xs font-mono text-primary font-semibold">{disciplina.codigo}</p>
              <h3 className="font-semibold text-foreground text-sm mt-0.5">{disciplina.nome}</h3>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {disciplina.carga_horaria_presencial + disciplina.carga_horaria_ead}h total
                </span>
                {alunos_em_risco > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-yellow-500">
                    <AlertTriangle className="h-3 w-3" />
                    {alunos_em_risco} em risco
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Turma ok
                  </span>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="p-4 space-y-2">
              <Button
                size="sm"
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
                onClick={() => navigate(`/dashboard/professor/frequencia/${disciplina.id}`)}
              >
                <ClipboardList className="h-4 w-4 mr-2" /> Lançar Frequência
              </Button>
              <Button
                size="sm"
                className="w-full"
                variant="secondary"
                disabled={!turma_id}
                title={!turma_id ? 'Nenhuma turma vinculada a esta disciplina' : undefined}
                onClick={() => turma_id && navigate(`/dashboard/professor/notas/${turma_id}/${disciplina.id}`)}
              >
                <Star className="h-4 w-4 mr-2" /> Lançar Notas
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-foreground/70 hover:text-primary"
                  onClick={() => navigate(`/dashboard/professor/turma/${disciplina.id}`)}
                >
                  <Users className="h-4 w-4 mr-1.5" /> Ver Turma
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-foreground/70 hover:text-primary"
                  onClick={() => navigate(`/dashboard/professor/contrato/${contrato.id}`)}
                  disabled={!manual_disponivel && contrato.status === 'pendente'}
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  {manual_disponivel ? 'Manual ✓' : 'Contrato'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Histórico de solicitações */}
      {solicitacoes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Minhas Solicitações
          </h2>
          <div className="space-y-2">
            {solicitacoes.map(s => {
              const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.pendente;
              return (
                <div key={s.id} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                  <span className="text-foreground/70 truncate">{s.disciplina_id}</span>
                  <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog — Solicitar Disciplina */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Nova Disciplina</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Disciplina
              </label>
              <select
                value={selectedDisc}
                onChange={e => setSelectedDisc(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione uma disciplina...</option>
                {disciplinasDisponiveis.map(d => (
                  <option key={d.id} value={d.id}>{d.codigo} — {d.nome}</option>
                ))}
              </select>
              {disciplinasDisponiveis.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Todas as disciplinas disponíveis já estão vinculadas ou solicitadas.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Observação (opcional)
              </label>
              <Textarea
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                placeholder="Ex.: Tenho disponibilidade às terças e quintas..."
                rows={3}
              />
            </div>

            {solError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                {solError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSolicitar} disabled={!selectedDisc || salvando}>
              {salvando ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
