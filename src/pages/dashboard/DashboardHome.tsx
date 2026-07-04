import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Book, UserCheck,
  CalendarDays, ClipboardCheck, FileText, Bell, Users, ClipboardList, AlertTriangle, Award,
  Wallet, Unlink, CheckCircle2,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { getKpis, getLeadsRecentes, getMatriculasRecentes, getLeadsPorCurso } from '@/services/dashboard.service';
import { getTurmasAtivas } from '@/services/turmas.service';
import { getAlunosEmRiscoByTurma, type AlunoEmRiscoTurma } from '@/services/frequencia.service';
import { useAlunoDashboard } from '@/hooks/useAlunoDashboard';
import { useProfessorDashboard } from '@/hooks/useProfessorDashboard';
import { usePendenciasSecretaria } from '@/hooks/usePendenciasSecretaria';
import type { PendenciaBloco, PendenciaItem } from '@/services/dashboard.service';
import type { DashboardContext } from '../Dashboard';

// ─── Admin ───────────────────────────────────────────────────

const COURSE_COLORS: Record<string, string> = {
  'teologia-livre': '#ea384c',
  'seteb': '#3b82f6',
  'ministerial-mulheres': '#a855f7',
};
const COURSE_LABELS: Record<string, string> = {
  'teologia-livre': 'Teologia Livre',
  'seteb': 'SETEB',
  'ministerial-mulheres': 'Ministerial',
  'dfc8eda9-ce75-4869-945a-39c80e4c649b': 'GRAD-TEO — Graduação em Teologia',
};

function KpiSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-14" />
    </div>
  );
}

// ─── Painel de Pendências (Secretaria/Admin) ─────────────────
// Só CONTA e LINKA — as ações (aprovar/validar/lançar) vivem nas telas de destino.

interface PendenciaCfg {
  key: string;
  titulo: string;
  icone: React.ElementType;
  cor: string;        // classe de texto/contagem
  bg: string;         // fundo do ícone
  bloco: PendenciaBloco;
  hrefFor: (it: PendenciaItem) => string;
  ctaHref: string;
  ctaLabel: string;
}

function PendenciaCard({ cfg }: { cfg: PendenciaCfg }) {
  const { bloco } = cfg;
  const primeiros = bloco.itens.slice(0, 4);
  const restantes = bloco.count - primeiros.length;

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
          <cfg.icone className={`h-5 w-5 ${cfg.cor}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-2xl font-bold ${cfg.cor}`}>{bloco.count}</p>
          <p className="text-sm text-muted-foreground -mt-0.5">{cfg.titulo}</p>
        </div>
      </div>

      {bloco.count === 0 ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-500">
          <CheckCircle2 className="h-4 w-4" /> Nenhuma pendência aqui
        </div>
      ) : (
        <div className="mt-4 space-y-1.5 flex-1">
          {primeiros.map((it, i) => (
            <Link key={`${it.aluno_id}-${i}`} to={cfg.hrefFor(it)}
              className="flex items-center justify-between gap-2 text-sm hover:text-primary transition-colors group">
              <span className="truncate text-foreground group-hover:text-primary">{it.nome}</span>
              {it.detalhe && <span className="text-xs text-muted-foreground shrink-0">{it.detalhe}</span>}
            </Link>
          ))}
          <Link to={cfg.ctaHref} className="inline-block pt-1 text-xs text-primary hover:underline">
            {restantes > 0 ? `+${restantes} — ${cfg.ctaLabel}` : cfg.ctaLabel} →
          </Link>
        </div>
      )}
    </div>
  );
}

function PendenciasSection() {
  const { loading, erro, dados } = usePendenciasSecretaria();

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-primary" /> Pendências da Secretaria
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <KpiSkeleton key={i} />)}
        </div>
      ) : erro || !dados ? (
        <div className="bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground">
          Não foi possível carregar as pendências agora. Tente recarregar a página.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { key: 'mat',  titulo: 'Matrículas a aprovar', icone: UserCheck,     cor: 'text-red-400',    bg: 'bg-red-500/10',    bloco: dados.matriculasPendentes, hrefFor: () => '/dashboard/matriculas',          ctaHref: '/dashboard/matriculas', ctaLabel: 'ver matrículas' },
            { key: 'doc',  titulo: 'Documentos a validar', icone: FileText,      cor: 'text-amber-400',  bg: 'bg-amber-500/10',  bloco: dados.documentosPendentes, hrefFor: (it) => `/dashboard/aluno/${it.aluno_id}`, ctaHref: '/dashboard/alunos', ctaLabel: 'ver alunos' },
            { key: 'taxa', titulo: 'Taxas de matrícula',   icone: Wallet,        cor: 'text-orange-400', bg: 'bg-orange-500/10', bloco: dados.taxasPendentes,      hrefFor: (it) => `/dashboard/aluno/${it.aluno_id}`, ctaHref: '/dashboard/alunos', ctaLabel: 'ver alunos' },
            { key: 'vinc', titulo: 'Alunos sem vínculo',   icone: Unlink,        cor: 'text-yellow-400', bg: 'bg-yellow-500/10', bloco: dados.alunosSemVinculo,    hrefFor: (it) => `/dashboard/aluno/${it.aluno_id}`, ctaHref: '/dashboard/alunos', ctaLabel: 'ver alunos' },
          ] as PendenciaCfg[]).map(cfg => <PendenciaCard key={cfg.key} cfg={cfg} />)}
        </div>
      )}
    </div>
  );
}

function AdminView({ name }: { name: string }) {
  const [kpis, setKpis] = useState({ alunos: 0, professores: 0, leads: 0, matriculas: 0 });
  const [leadsPorCurso, setLeadsPorCurso] = useState<{ name: string; value: number; color: string }[]>([]);
  const [ultimosLeads, setUltimosLeads] = useState<any[]>([]);
  const [matriculasRecentes, setMatriculasRecentes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alunosEmRisco, setAlunosEmRisco] = useState<(AlunoEmRiscoTurma & { turma_nome: string })[]>([]);

  useEffect(() => {
    async function carregarDados() {
      const [kpisData, leadsRecentes, matsRecentes, leadsCurso, turmasAtivas] = await Promise.all([
        getKpis(),
        getLeadsRecentes(5),
        getMatriculasRecentes(5),
        getLeadsPorCurso(),
        getTurmasAtivas(),
      ]);

      setKpis(kpisData);
      setUltimosLeads(leadsRecentes);
      setMatriculasRecentes(matsRecentes);
      setLeadsPorCurso(
        leadsCurso.map(({ curso, total }) => ({
          name:  COURSE_LABELS[curso] ?? curso,
          value: total,
          color: COURSE_COLORS[curso] ?? '#6b7280',
        }))
      );
      setIsLoading(false);

      // Carrega alunos em risco em background (não bloqueia o render principal)
      if (turmasAtivas.length > 0) {
        const resultados = await Promise.all(
          turmasAtivas.map(t =>
            getAlunosEmRiscoByTurma(t.id).then(lista =>
              lista.map(a => ({ ...a, turma_nome: t.nome }))
            )
          )
        );
        setAlunosEmRisco(resultados.flat());
      }
    }
    carregarDados();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-1">Controle total da plataforma ITEC — {name}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [1, 2, 3, 4].map(i => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard titulo="Alunos"      valor={kpis.alunos}      icone={GraduationCap} href="/dashboard/usuarios" />
            <KpiCard titulo="Professores" valor={kpis.professores}  icone={BookOpen}      corFundo="bg-green-500/10" />
            <KpiCard titulo="Leads"       valor={kpis.leads}        icone={UserCheck}     href="/dashboard/leads"    corFundo="bg-blue-500/10" />
            <KpiCard titulo="Matrículas"  valor={kpis.matriculas}   icone={ClipboardCheck} href="/dashboard/matriculas" corFundo="bg-purple-500/10" />
          </>
        )}
      </div>

      {/* Pendências da Secretaria */}
      <PendenciasSection />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads por curso */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Leads por Curso</h2>
          {leadsPorCurso.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Nenhum lead ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={leadsPorCurso} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {leadsPorCurso.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Leads']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground mb-4">Acesso Rápido</h2>
          {[
            { icon: Users,         label: 'Gerenciar Usuários',  desc: 'Ver e editar roles',              href: '/dashboard/usuarios' },
            { icon: ClipboardList, label: 'Leads de Cursos',     desc: 'Interessados cadastrados',        href: '/dashboard/leads' },
            { icon: Book,          label: 'Matrículas',          desc: 'Aprovar e gerenciar matrículas',  href: '/dashboard/matriculas' },
            { icon: Bell,          label: 'Avisos',              desc: 'Comunicados para alunos',         href: '/dashboard/avisos' },
          ].map(item => (
            <Link key={item.label} to={item.href}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tabelas recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Últimos leads */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Últimos Leads</h2>
            <Link to="/dashboard/leads" className="text-xs text-primary hover:underline">Ver todos →</Link>
          </div>
          {ultimosLeads.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Nenhum lead ainda.</p>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/20">
                <th className="text-left px-5 py-2 text-muted-foreground font-medium">Nome</th>
                <th className="text-left px-5 py-2 text-muted-foreground font-medium">Curso</th>
                <th className="text-left px-5 py-2 text-muted-foreground font-medium">Data</th>
              </tr></thead>
              <tbody>
                {ultimosLeads.map(l => (
                  <tr key={l.id} className="border-t border-border hover:bg-muted/10">
                    <td className="px-5 py-2.5 font-medium text-foreground">{l.nome}</td>
                    <td className="px-5 py-2.5 text-muted-foreground">{COURSE_LABELS[l.curso_interesse] ?? l.curso_interesse}</td>
                    <td className="px-5 py-2.5 text-muted-foreground">{new Date(l.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Matrículas recentes */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Matrículas Recentes</h2>
            <Link to="/dashboard/matriculas" className="text-xs text-primary hover:underline">Ver todas →</Link>
          </div>
          {matriculasRecentes.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Nenhuma matrícula ainda.</p>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/20">
                <th className="text-left px-5 py-2 text-muted-foreground font-medium">Curso</th>
                <th className="text-left px-5 py-2 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-5 py-2 text-muted-foreground font-medium">Data</th>
              </tr></thead>
              <tbody>
                {matriculasRecentes.map(m => (
                  <tr key={m.id} className="border-t border-border hover:bg-muted/10">
                    <td className="px-5 py-2.5 font-medium text-foreground">{m.curso_label ?? COURSE_LABELS[m.curso_id] ?? m.curso_id ?? '—'}</td>
                    <td className="px-5 py-2.5"><StatusBadge status={m.status ?? 'pendente'} /></td>
                    <td className="px-5 py-2.5 text-muted-foreground">{new Date(m.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Widget: Alunos em Risco */}
      {alunosEmRisco.length > 0 && (
        <div className="bg-card border border-red-500/30 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-red-500/20 bg-red-500/5">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h2 className="text-sm font-semibold text-foreground">Alunos em Risco de Reprovação por Falta</h2>
            <span className="ml-auto shrink-0 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold px-1.5">
              {alunosEmRisco.length}
            </span>
          </div>
          <div className="divide-y">
            {alunosEmRisco.slice(0, 8).map((a, i) => (
              <Link
                key={`${a.aluno_id}-${i}`}
                to={`/dashboard/aluno/${a.aluno_id}`}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {a.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.turma_nome}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-red-400 font-semibold">
                    {a.disciplinas_em_risco[0]?.frequencia_percent}% freq.
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-32">
                    {a.disciplinas_em_risco[0]?.disciplina_nome}
                    {a.disciplinas_em_risco.length > 1 ? ` +${a.disciplinas_em_risco.length - 1}` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          {alunosEmRisco.length > 8 && (
            <p className="px-5 py-2 text-xs text-muted-foreground border-t">
              + {alunosEmRisco.length - 8} aluno{alunosEmRisco.length - 8 !== 1 ? 's' : ''} em risco
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Professor ───────────────────────────────────────────────

function ProfessorView({ profile }: { profile: DashboardContext['profile'] }) {
  const name = profile.full_name;
  const d = useProfessorDashboard(profile.id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Bem-vindo, Prof. {name}</h1>
        <p className="text-muted-foreground mt-1">Área do Professor — Gerencie suas turmas e materiais</p>
      </div>

      {/* KPIs do professor — dados reais (disciplinas ativas via CONTRATO_ATIVO) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {d.loading ? (
          <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
        ) : (
          <>
            <KpiCard titulo="Disciplinas"     valor={d.temDisciplinas ? d.disciplinasAtivas : '—'} icone={BookOpen} href="/dashboard/professor" />
            <KpiCard titulo="Turmas"          valor={d.temDisciplinas ? d.turmas : '—'} icone={Users} corFundo="bg-green-500/10" href="/dashboard/professor" />
            <KpiCard titulo="Alunos"          valor={d.temDisciplinas ? (d.alunos || '—') : '—'} icone={GraduationCap} corFundo="bg-blue-500/10" href="/dashboard/professor" />
            <KpiCard titulo="Notas pendentes" valor={d.temDisciplinas ? d.notasPendentes : '—'} icone={ClipboardList} corFundo="bg-yellow-500/10" href="/dashboard/professor" />
          </>
        )}
      </div>

      {/* Estado vazio honesto — sem vínculo ainda */}
      {!d.loading && !d.temDisciplinas && (
        <div className="bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground opacity-60 shrink-0" />
          Nenhuma disciplina atribuída ainda — a secretaria fará o vínculo.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Users,         label: 'Minhas Disciplinas', desc: 'Acesse suas disciplinas ativas.',        href: '/dashboard/professor' },
          { icon: BookOpen,      label: 'Materiais de Aula',  desc: 'Faça upload de apostilas e slides.',    href: '/dashboard/materiais' },
          { icon: ClipboardList, label: 'Avaliações',         desc: 'Crie e gerencie provas e trabalhos.',   href: '/dashboard/avaliacoes' },
          { icon: CalendarDays,  label: 'Agenda',             desc: 'Calendário de aulas e compromissos.',   href: '/dashboard/agenda' },
          { icon: ClipboardCheck,label: 'Frequência',         desc: 'Lance a frequência das suas turmas.',   href: '/dashboard/professor' },
          { icon: Bell,          label: 'Avisos',             desc: 'Crie comunicados para seus alunos.',    href: '/dashboard/avisos' },
        ].map(item => (
          <Link key={item.label} to={item.href}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all block">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{item.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Aluno ───────────────────────────────────────────────────

function AlunoView({ profile }: { profile: DashboardContext['profile'] }) {
  const name = profile.full_name;
  const d = useAlunoDashboard(profile.id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Olá, {name} 👋</h1>
        <p className="text-muted-foreground mt-1">
          Área do Aluno — Instituto Teológico de Educação Cristã
          {d.numeroMatricula && <> · matrícula <span className="font-mono text-foreground">{d.numeroMatricula}</span></>}
        </p>
      </div>

      {/* KPIs do aluno — dados reais (mesmas fontes do Meu Histórico) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {d.loading ? (
          <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
        ) : (
          <>
            <KpiCard titulo="Cursos Ativos" valor={d.temMatricula ? d.cursosAtivos : '—'} icone={Book} href="/dashboard/cursos" />
            <KpiCard titulo="Frequência"    valor={d.freqMedia != null ? `${d.freqMedia}%` : '—'} icone={ClipboardCheck} corFundo="bg-green-500/10" href="/dashboard/meu-historico" />
            <KpiCard titulo="Média Geral"   valor={d.mediaGeral != null ? d.mediaGeral.toFixed(1) : '—'} icone={GraduationCap} corFundo="bg-blue-500/10" href="/dashboard/meu-historico" />
            <KpiCard titulo="Avisos"        valor="—" icone={Bell} corFundo="bg-yellow-500/10" href="/dashboard/avisos" />
          </>
        )}
      </div>

      {/* Progresso no curso — créditos aprovados ÷ total (mesma fonte do Meu Histórico) */}
      {!d.loading && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Progresso no curso</span>
            {d.cursoNome && <span className="text-xs text-muted-foreground">· {d.cursoNome}</span>}
            {d.moduloAtual && <span className="text-xs text-muted-foreground">· módulo atual: <span className="text-foreground">{d.moduloAtual}</span></span>}
            {d.temDados && <span className="ml-auto text-sm font-bold text-primary">{d.pctProgresso}%</span>}
          </div>
          {d.temDados ? (
            <>
              <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${d.pctProgresso}%` }} />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span><strong className="text-foreground">{d.creditosAprov}</strong> de {d.creditosTotal} créditos concluídos</span>
                <span><strong className="text-foreground">{Math.max(d.creditosTotal - d.creditosAprov, 0)}</strong> restantes</span>
                {d.mediaGeral != null && <span>Média geral: <strong className="text-foreground">{d.mediaGeral.toFixed(1)}</strong></span>}
                <Link to="/dashboard/meu-historico" className="text-primary hover:underline ml-auto">Ver histórico completo →</Link>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Seu progresso aparecerá conforme as disciplinas forem lançadas pela secretaria.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Book,          label: 'Meus Cursos',  desc: 'Acompanhe seu progresso acadêmico.',        href: '/dashboard/cursos' },
          { icon: GraduationCap, label: 'Meu Histórico',desc: 'Notas, situação e progresso por módulo.',   href: '/dashboard/meu-historico' },
          { icon: CalendarDays,  label: 'Eventos',      desc: 'Calendário acadêmico e próximas aulas.',    href: '/dashboard/eventos' },
          { icon: FileText,      label: 'Documentos',   desc: 'Certificados e histórico acadêmico.',       href: '/dashboard/documentos' },
          { icon: ClipboardCheck,label: 'Frequência',   desc: 'Seu histórico de presença por disciplina.', href: '/dashboard/cursos' },
          { icon: Bell,          label: 'Avisos',       desc: 'Comunicados da secretaria e professores.',  href: '/dashboard/avisos' },
          { icon: BookOpen,      label: 'Materiais',    desc: 'Apostilas e materiais de aula.',            href: '/dashboard/materiais' },
        ].map(item => (
          <Link key={item.label} to={item.href}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all block">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{item.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <p className="text-sm italic text-foreground/80">"A sabedoria é a coisa principal; adquire pois a sabedoria."</p>
        <p className="text-xs text-primary mt-1">Provérbios 4:7</p>
      </div>
    </div>
  );
}

// ─── Export ──────────────────────────────────────────────────

export default function DashboardHome() {
  const { profile } = useOutletContext<DashboardContext>();
  const { role, full_name } = profile;

  if (role === 'superadmin' || role === 'admin' || role === 'administracao') return <AdminView name={full_name} />;
  if (role === 'professor') return <ProfessorView profile={profile} />;
  return <AlunoView profile={profile} />;
}
