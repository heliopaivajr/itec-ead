import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Book, UserCheck,
  CalendarDays, ClipboardCheck, FileText, Bell, Users, ClipboardList
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { supabase } from '@/lib/supabase';
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
};

function AdminView({ name }: { name: string }) {
  const [kpis, setKpis] = useState({ alunos: 0, professores: 0, leads: 0, matriculas: 0 });
  const [leadsPorCurso, setLeadsPorCurso] = useState<{ name: string; value: number; color: string }[]>([]);
  const [ultimosLeads, setUltimosLeads] = useState<any[]>([]);
  const [matriculasRecentes, setMatriculasRecentes] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('role', { count: 'exact' }).eq('role', 'aluno'),
      supabase.from('profiles').select('role', { count: 'exact' }).eq('role', 'professor'),
      supabase.from('leads_cursos').select('*', { count: 'exact' }),
      supabase.from('matriculas').select('*', { count: 'exact' }),
    ]).then(([alunos, profs, leads, mats]) => {
      setKpis({
        alunos: alunos.count ?? 0,
        professores: profs.count ?? 0,
        leads: leads.count ?? 0,
        matriculas: mats.count ?? 0,
      });
    });

    supabase.from('leads_cursos').select('curso_interesse').then(({ data }) => {
      if (!data) return;
      const counts: Record<string, number> = {};
      data.forEach(r => { counts[r.curso_interesse] = (counts[r.curso_interesse] ?? 0) + 1; });
      setLeadsPorCurso(
        Object.entries(counts).map(([key, val]) => ({
          name: COURSE_LABELS[key] ?? key,
          value: val,
          color: COURSE_COLORS[key] ?? '#6b7280',
        }))
      );
    });

    supabase.from('leads_cursos').select('*').order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setUltimosLeads(data ?? []));

    supabase.from('matriculas').select('*').order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setMatriculasRecentes(data ?? []));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-1">Controle total da plataforma ITEC — {name}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard titulo="Alunos" valor={kpis.alunos}        icone={GraduationCap} href="/dashboard/usuarios" />
        <KpiCard titulo="Professores" valor={kpis.professores} icone={BookOpen}     corFundo="bg-green-500/10" />
        <KpiCard titulo="Leads" valor={kpis.leads}          icone={UserCheck}      href="/dashboard/leads"    corFundo="bg-blue-500/10" />
        <KpiCard titulo="Matrículas" valor={kpis.matriculas} icone={ClipboardCheck} href="/dashboard/matriculas" corFundo="bg-purple-500/10" />
      </div>

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
            { icon: Bell,          label: 'Notificações',        desc: 'Comunicados para alunos',         href: '/dashboard/notificacoes' },
          ].map(item => (
            <a key={item.label} href={item.href}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Tabelas recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Últimos leads */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Últimos Leads</h2>
            <a href="/dashboard/leads" className="text-xs text-primary hover:underline">Ver todos →</a>
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
            <a href="/dashboard/matriculas" className="text-xs text-primary hover:underline">Ver todas →</a>
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
                    <td className="px-5 py-2.5 font-medium text-foreground">{COURSE_LABELS[m.curso_id] ?? m.curso_id ?? '—'}</td>
                    <td className="px-5 py-2.5"><StatusBadge status={m.status ?? 'pendente'} /></td>
                    <td className="px-5 py-2.5 text-muted-foreground">{new Date(m.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Professor ───────────────────────────────────────────────

function ProfessorView({ name }: { name: string }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Bem-vindo, Prof. {name}</h1>
        <p className="text-muted-foreground mt-1">Área do Professor — Gerencie suas turmas e materiais</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard titulo="Turmas Ativas" valor="—" icone={Users} />
        <KpiCard titulo="Alunos" valor="—" icone={GraduationCap} corFundo="bg-green-500/10" />
        <KpiCard titulo="Aulas esta semana" valor="—" icone={CalendarDays} corFundo="bg-blue-500/10" />
        <KpiCard titulo="Avaliações pendentes" valor="—" icone={ClipboardList} corFundo="bg-yellow-500/10" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Users,         label: 'Minhas Turmas',    desc: 'Nenhuma turma ativa.',                       href: '/dashboard/turmas' },
          { icon: BookOpen,      label: 'Materiais de Aula', desc: 'Faça upload de apostilas e slides.',         href: '/dashboard/materiais' },
          { icon: ClipboardList, label: 'Avaliações',        desc: 'Crie e gerencie provas e trabalhos.',        href: '/dashboard/avaliacoes' },
          { icon: CalendarDays,  label: 'Agenda',            desc: 'Calendário de aulas e compromissos.',        href: '/dashboard/agenda' },
          { icon: ClipboardCheck,label: 'Frequência',        desc: 'Lance a frequência das suas turmas.',       href: '/dashboard/turmas' },
          { icon: Bell,          label: 'Avisos',            desc: 'Crie comunicados para seus alunos.',        href: '/dashboard/notificacoes' },
        ].map(item => (
          <a key={item.label} href={item.href}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all block">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{item.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Aluno ───────────────────────────────────────────────────

function AlunoView({ name }: { name: string }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Olá, {name} 👋</h1>
        <p className="text-muted-foreground mt-1">Área do Aluno — Instituto Teológico de Educação Cristã</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard titulo="Cursos Ativos" valor="—" icone={Book} />
        <KpiCard titulo="Frequência" valor="—" icone={ClipboardCheck} corFundo="bg-green-500/10" />
        <KpiCard titulo="Média Geral" valor="—" icone={GraduationCap} corFundo="bg-blue-500/10" />
        <KpiCard titulo="Avisos" valor="—" icone={Bell} corFundo="bg-yellow-500/10" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Book,          label: 'Meus Cursos',  desc: 'Acompanhe seu progresso acadêmico.',        href: '/dashboard/cursos' },
          { icon: CalendarDays,  label: 'Eventos',      desc: 'Calendário acadêmico e próximas aulas.',    href: '/dashboard/eventos' },
          { icon: FileText,      label: 'Documentos',   desc: 'Certificados e histórico acadêmico.',       href: '/dashboard/documentos' },
          { icon: ClipboardCheck,label: 'Frequência',   desc: 'Seu histórico de presença por disciplina.', href: '/dashboard/ao-vivo' },
          { icon: Bell,          label: 'Avisos',       desc: 'Comunicados da secretaria e professores.',  href: '/dashboard/comunidade' },
          { icon: BookOpen,      label: 'Materiais',    desc: 'Apostilas e materiais de aula.',            href: '/dashboard/ao-vivo' },
        ].map(item => (
          <a key={item.label} href={item.href}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all block">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{item.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </a>
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

  if (role === 'superadmin' || role === 'admin' || role === 'secretaria') return <AdminView name={full_name} />;
  if (role === 'professor') return <ProfessorView name={full_name} />;
  return <AlunoView name={full_name} />;
}
