import React from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Book, CalendarDays, FileText, Users,
  BookOpen, ClipboardList, GraduationCap, UserCheck, Bell
} from 'lucide-react';
import type { DashboardContext } from '../Dashboard';

// ─── Aluno ───────────────────────────────────────────────────

function AlunoView({ name }: { name: string }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Olá, {name} 👋</h1>
        <p className="text-muted-foreground mt-1">Área do Aluno — Instituto Teológico de Educação Cristã</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Book, label: 'Cursos em Andamento', desc: 'Você não possui cursos em andamento.', action: 'Ver cursos', href: '/cursos' },
          { icon: CalendarDays, label: 'Próximos Eventos', desc: 'Nenhum evento agendado.' },
          { icon: FileText, label: 'Documentos', desc: 'Certificados e histórico acadêmico.' },
        ].map(item => (
          <div key={item.label} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all futuristic-card">
            <div className="flex items-center gap-2 mb-3">
              <item.icon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{item.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
            {item.href && (
              <a href={item.href} className="mt-3 inline-block text-xs text-primary hover:underline">{item.action} →</a>
            )}
          </div>
        ))}
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <p className="text-sm italic text-foreground/80">"A sabedoria é a coisa principal; adquire pois a sabedoria."</p>
        <p className="text-xs text-primary mt-1">Provérbios 4:7</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Minhas Turmas', desc: 'Nenhuma turma ativa.' },
          { icon: BookOpen, label: 'Materiais de Aula', desc: 'Faça upload de apostilas e slides.' },
          { icon: ClipboardList, label: 'Avaliações', desc: 'Crie e gerencie provas e trabalhos.' },
        ].map(item => (
          <div key={item.label} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all futuristic-card">
            <div className="flex items-center gap-2 mb-3">
              <item.icon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{item.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin ───────────────────────────────────────────────────

function AdminView({ name }: { name: string }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Painel Admin</h1>
        <p className="text-muted-foreground mt-1">Controle total da plataforma ITEC — {name}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: GraduationCap, label: 'Alunos',      value: '—', desc: 'Total de alunos cadastrados' },
          { icon: BookOpen,      label: 'Professores', value: '—', desc: 'Professores ativos' },
          { icon: Book,          label: 'Cursos',      value: '3', desc: 'Cursos disponíveis' },
          { icon: UserCheck,     label: 'Leads',       value: '—', desc: 'Interessados cadastrados' },
        ].map(item => (
          <div key={item.label} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all futuristic-card">
            <div className="flex items-center gap-2 mb-1">
              <item.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: Users,         label: 'Gerenciar Usuários',  desc: 'Alunos, professores e admins — ver perfis, editar roles.', href: '/dashboard/usuarios' },
          { icon: ClipboardList, label: 'Leads de Cursos',     desc: 'Interessados que baixaram a grade curricular.',             href: '/dashboard/leads' },
          { icon: FileText,      label: 'Matrículas',          desc: 'Aprovar e gerenciar matrículas ativas.',                    href: '/dashboard/matriculas' },
          { icon: Bell,          label: 'Notificações',        desc: 'Enviar comunicados para alunos e professores.',             href: '/dashboard/notificacoes' },
        ].map(item => (
          <a key={item.label} href={item.href} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all cursor-pointer futuristic-card block">
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

// ─── Export ──────────────────────────────────────────────────

export default function DashboardHome() {
  const { profile } = useOutletContext<DashboardContext>();
  const { role, full_name } = profile;

  if (role === 'admin')     return <AdminView     name={full_name} />;
  if (role === 'professor') return <ProfessorView name={full_name} />;
  return <AlunoView name={full_name} />;
}
