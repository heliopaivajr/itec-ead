import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BookOpen, Clock, ExternalLink,
  ChevronDown, ChevronUp, FileText, BarChart2,
  AlertTriangle, RefreshCw, GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertaFrequencia } from '@/components/dashboard/AlertaFrequencia';
import MateriaisAlunoLista from '@/components/dashboard/MateriaisAlunoLista';
import { useMeusCursos } from '@/hooks/useMeusCursos';
import type { DashboardContext } from '../Dashboard';
import type { DisciplinaComProgresso } from '@/hooks/useMeusCursos';

// ─── Barra de progresso inline ─────────────────────────────
function ProgressBar({ value, color = 'bg-primary' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// ─── Cor da frequência ─────────────────────────────────────
function freqColor(pct: number) {
  if (pct >= 75) return 'text-green-400';
  if (pct >= 60) return 'text-yellow-400';
  return 'text-red-400';
}
function freqBarColor(pct: number) {
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

const NOTA_STATUS_LABEL: Record<string, string> = {
  aprovado: 'Aprovado',
  recuperacao: 'Recuperação',
  reprovado_nota: 'Rep. Nota',
  reprovado_falta: 'Rep. Falta',
  cursando: 'Em curso',
};

const NOTA_STATUS_COLOR: Record<string, string> = {
  aprovado: 'text-green-400 bg-green-500/10 border-green-500/30',
  recuperacao: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  reprovado_nota: 'text-red-400 bg-red-500/10 border-red-500/30',
  reprovado_falta: 'text-red-400 bg-red-500/10 border-red-500/30',
  cursando: 'text-muted-foreground bg-muted border-border',
};

// ─── Card de uma disciplina ────────────────────────────────
function CardDisciplina({ item }: { item: DisciplinaComProgresso }) {
  const { disciplina, matricula, frequencia, percentual_materiais, materiais_count, notas } = item;
  const pct = frequencia?.percentual_presenca ?? 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-all">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border p-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-primary font-semibold">{disciplina.codigo}</p>
          <h3 className="font-semibold text-foreground text-sm leading-snug mt-0.5">{disciplina.nome}</h3>
        </div>
        {matricula ? (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
            matricula.status === 'aprovado'   ? 'bg-green-500/15 text-green-400 border-green-500/30' :
            matricula.status === 'reprovado'  ? 'bg-red-500/15 text-red-400 border-red-500/30' :
            matricula.status === 'cursando'   ? 'bg-primary/15 text-primary border-primary/30' :
            'bg-muted text-muted-foreground border-border'
          }`}>
            {matricula.status}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5 shrink-0">
            não matriculado
          </span>
        )}
      </div>

      {/* Progresso */}
      <div className="p-4 space-y-3">
        {/* Frequência */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <BarChart2 className="h-3 w-3" /> Frequência
            </span>
            <span className={`font-semibold ${frequencia ? freqColor(pct) : 'text-muted-foreground'}`}>
              {frequencia ? `${pct}%` : '—'}
            </span>
          </div>
          {frequencia && <ProgressBar value={pct} color={freqBarColor(pct)} />}
        </div>

        {/* Materiais */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> Materiais
            </span>
            <span className="text-muted-foreground font-medium">
              {materiais_count > 0 ? `${percentual_materiais}% · ${materiais_count} arquivos` : 'Nenhum disponível'}
            </span>
          </div>
          {materiais_count > 0 && <ProgressBar value={percentual_materiais} />}
        </div>

        {/* Notas */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <GraduationCap className="h-3 w-3" /> Notas
            </span>
            {notas ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${NOTA_STATUS_COLOR[notas.status]}`}>
                {NOTA_STATUS_LABEL[notas.status]}
              </span>
            ) : (
              <span className="text-muted-foreground">— Aguardando lançamento</span>
            )}
          </div>
          {notas && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>N1: <strong className="text-foreground">{notas.n1 !== null ? notas.n1.toFixed(1) : '—'}</strong></span>
              <span>N2: <strong className="text-foreground">{notas.n2 !== null ? notas.n2.toFixed(1) : '—'}</strong></span>
              <span>Média: <strong className={notas.media !== null ? (notas.media >= 7 ? 'text-green-400' : notas.media >= 5 ? 'text-yellow-400' : 'text-red-400') : 'text-foreground'}>
                {notas.media !== null ? notas.media.toFixed(1) : '—'}
              </strong></span>
              {notas.recuperacao !== null && (
                <span>Rec: <strong className="text-foreground">{notas.recuperacao.toFixed(1)}</strong></span>
              )}
            </div>
          )}
        </div>

        {/* Alerta de frequência */}
        {frequencia && <AlertaFrequencia percentual={pct} disciplinaNome={disciplina.nome} />}

        {/* Pré-requisitos pendentes */}
        {!item.prereqs_ok && item.prereqs_faltam.length > 0 && (
          <div className="text-xs text-yellow-500 flex items-start gap-1.5 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-2.5 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Pré-req. pendentes: {item.prereqs_faltam.map(d => d.codigo).join(', ')}
            </span>
          </div>
        )}

        {/* Carga horária */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <Clock className="h-3 w-3" />
          <span>{disciplina.carga_horaria_presencial}h presencial · {disciplina.carga_horaria_ead}h EAD</span>
        </div>

        {/* Materiais para download (substitui o link de manual legado) */}
        <MateriaisAlunoLista disciplinaId={disciplina.id} />
      </div>
    </div>
  );
}

// ─── Skeletons ─────────────────────────────────────────────
function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────
export default function MeusCursos() {
  const { profile } = useOutletContext<DashboardContext>();
  const { curso, modulo_atual, disciplinas, eletivas, loading, error } = useMeusCursos(profile.id);
  const [historicoAberto, setHistoricoAberto] = useState(false);

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <SkeletonCards />
      </div>
    );
  }

  // ── Erro ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive opacity-60" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  // ── Sem matrícula ─────────────────────────────────────────
  if (!curso || disciplinas.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Você não está matriculado em nenhuma disciplina</p>
            <p className="text-sm text-muted-foreground mt-1">
              Entre em contato com a secretaria para confirmar sua matrícula.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="https://wa.me/5581991161448"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              WhatsApp Secretaria <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="/cursos"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Ver cursos disponíveis
            </a>
          </div>
        </div>
      </div>
    );
  }

  const totalHoras = disciplinas.reduce(
    (s, d) => s + d.disciplina.carga_horaria_presencial + d.disciplina.carga_horaria_ead,
    0
  );
  const emAlerta = disciplinas.filter(
    d => d.frequencia && d.frequencia.percentual_presenca < 75
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Meus Cursos</h1>
        <p className="text-muted-foreground mt-1">Acompanhe suas disciplinas e progresso acadêmico</p>
      </div>

      {/* Banner do módulo atual */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            {curso.nome}
          </p>
          <h2 className="text-lg font-merriweather font-bold text-foreground">
            {modulo_atual?.nome ?? 'Módulo não identificado'}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {modulo_atual?.periodo} · {disciplinas.length} disciplinas · {totalHoras}h
          </p>
        </div>
        {emAlerta > 0 && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
            <span className="text-yellow-500 font-medium">{emAlerta} disciplina{emAlerta > 1 ? 's' : ''} com frequência baixa</span>
          </div>
        )}
      </div>

      {/* Disciplinas regulares */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Disciplinas do módulo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disciplinas.map(item => (
            <CardDisciplina key={item.disciplina.id} item={item} />
          ))}
        </div>
      </div>

      {/* Eletivas disponíveis */}
      {eletivas.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Eletivas disponíveis neste módulo
          </h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {eletivas.map((e, i) => (
              <div
                key={e.id}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div>
                  <span className="font-mono text-xs text-primary mr-2">{e.codigo}</span>
                  <span className="text-foreground">{e.nome}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {e.carga_horaria_presencial + e.carga_horaria_ead}h · {e.creditos} créditos
                </span>
              </div>
            ))}
            <div className="px-4 py-3 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Você tem direito a 5 eletivas gratuitas (Hebraico I obrigatória). Fale com a secretaria para se matricular.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Histórico — accordion simples */}
      <div>
        <button
          onClick={() => setHistoricoAberto(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          {historicoAberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Histórico de disciplinas concluídas
        </button>
        {historicoAberto && (
          <div className="mt-3 bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground text-center">
            Histórico disponível após a conclusão do primeiro módulo.
          </div>
        )}
      </div>
    </div>
  );
}
