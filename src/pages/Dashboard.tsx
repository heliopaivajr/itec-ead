import React, { useEffect } from 'react';
import {
  Book, User, Users, Tv, CalendarDays,
  FileText, CreditCard, HelpCircle, Bell,
  Settings, ShieldAlert, BookOpen, LayoutDashboard,
  LogOut, GraduationCap, ClipboardList, UserCheck
} from 'lucide-react';
import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset,
  SidebarGroup, SidebarGroupLabel
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/use-profile';
import type { Profile } from '@/hooks/use-profile';
import { supabase } from '@/lib/supabase';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

// ─── Context type exported for sub-pages ─────────────────────
export type DashboardContext = { profile: Profile };

// ─── Menu items per role ──────────────────────────────────────

const menuByRole = {
  aluno: [
    { icon: LayoutDashboard, label: 'Dashboard',      href: '/dashboard',              tooltip: 'Visão geral',             end: true },
    { icon: Book,             label: 'Meus Cursos',   href: '/dashboard/cursos',        tooltip: 'Cursos matriculados' },
    { icon: Tv,               label: 'Ao Vivo',       href: '/dashboard/ao-vivo',       tooltip: 'Transmissões ao vivo' },
    { icon: Users,            label: 'Comunidade',    href: '/dashboard/comunidade',    tooltip: 'Fóruns e grupos' },
    { icon: CalendarDays,     label: 'Eventos',       href: '/dashboard/eventos',       tooltip: 'Calendário acadêmico' },
    { icon: FileText,         label: 'Documentos',    href: '/dashboard/documentos',    tooltip: 'Certificados e histórico' },
    { icon: CreditCard,       label: 'Pagamentos',    href: '/dashboard/pagamentos',    tooltip: 'Boletos e financeiro' },
    { icon: HelpCircle,       label: 'Suporte',       href: '/dashboard/suporte',       tooltip: 'Central de ajuda' },
    { icon: Settings,         label: 'Configurações', href: '/dashboard/perfil',        tooltip: 'Perfil e preferências' },
  ],
  professor: [
    { icon: LayoutDashboard, label: 'Dashboard',        href: '/dashboard',                tooltip: 'Visão geral',         end: true },
    { icon: Users,            label: 'Minhas Turmas',   href: '/dashboard/turmas',          tooltip: 'Turmas e alunos' },
    { icon: BookOpen,         label: 'Materiais',       href: '/dashboard/materiais',       tooltip: 'Apostilas e slides' },
    { icon: ClipboardList,    label: 'Avaliações',      href: '/dashboard/avaliacoes',      tooltip: 'Provas e trabalhos' },
    { icon: CalendarDays,     label: 'Agenda',          href: '/dashboard/agenda',          tooltip: 'Calendário de aulas' },
    { icon: Bell,             label: 'Notificações',    href: '/dashboard/notificacoes',    tooltip: 'Avisos e mensagens' },
    { icon: Settings,         label: 'Configurações',   href: '/dashboard/perfil',          tooltip: 'Perfil e preferências' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard',      href: '/dashboard',                tooltip: 'Painel geral',               end: true },
    { icon: Users,            label: 'Usuários',       href: '/dashboard/usuarios',        tooltip: 'Alunos e professores' },
    { icon: Book,             label: 'Cursos',         href: '/dashboard/cursos-admin',    tooltip: 'Gerenciar cursos' },
    { icon: UserCheck,        label: 'Matrículas',     href: '/dashboard/matriculas',      tooltip: 'Aprovar matrículas' },
    { icon: ClipboardList,    label: 'Leads',          href: '/dashboard/leads',           tooltip: 'Interessados cadastrados' },
    { icon: FileText,         label: 'Documentos',     href: '/dashboard/documentos',      tooltip: 'Certificados e histórico' },
    { icon: Bell,             label: 'Notificações',   href: '/dashboard/notificacoes',    tooltip: 'Enviar comunicados' },
    { icon: ShieldAlert,      label: 'Configurações',  href: '/dashboard/perfil',          tooltip: 'Config. da plataforma' },
  ],
};

const roleLabel: Record<string, string> = {
  aluno: 'Aluno', professor: 'Professor', admin: 'Administrador',
};

// ─── Dashboard Layout ─────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();

  useEffect(() => {
    if (!loading && !profile) navigate('/login');
  }, [profile, loading, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading || !profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
        <img src="/logo_itec.png" alt="ITEC" className="h-12 w-auto opacity-60" />
        <span className="text-sm">Carregando painel...</span>
      </div>
    </div>
  );

  const role = profile.role as keyof typeof menuByRole;
  const menuItems = menuByRole[role] ?? menuByRole.aluno;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background text-foreground">

        {/* Sidebar */}
        <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border bg-sidebar">
          <SidebarHeader className="p-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-primary animate-glow shrink-0">
                <img src="/logo_itec.png" alt="ITEC" className="h-7 w-7 object-contain" />
              </div>
              <div className="hidden sm:block overflow-hidden">
                <p className="font-merriweather font-bold text-sidebar-foreground text-sm leading-tight">ITEC EAD</p>
                <p className="text-xs text-primary truncate">{roleLabel[role]}</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-2 bg-sidebar">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-widest px-2 py-1">
                Menu
              </SidebarGroupLabel>
              <SidebarMenu>
                {menuItems.map(item => (
                  <SidebarMenuItem key={item.label}>
                    <NavLink to={item.href} end={item.end} className="contents">
                      {({ isActive }) => (
                        <SidebarMenuButton
                          tooltip={item.tooltip}
                          isActive={isActive}
                          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary data-[active=true]:bg-sidebar-accent data-[active=true]:text-primary group"
                        >
                          <item.icon className="group-hover:text-primary transition-colors" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border bg-sidebar space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="overflow-hidden hidden sm:block">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}
              className="w-full text-muted-foreground hover:text-primary hover:bg-sidebar-accent gap-2 justify-start">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:block">Sair</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main content */}
        <SidebarInset>
          <div className="flex-1 overflow-auto bg-background">
            <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-10">
              <div className="h-14 flex items-center px-4 gap-4">
                <SidebarTrigger />
                <div className="flex-1" />
                <ThemeSwitcher />
                <Button variant="outline" size="sm" className="border-border text-foreground/70 hover:text-primary">
                  <Bell className="h-4 w-4 mr-2 text-primary" /> Notificações
                </Button>
              </div>
            </header>

            {/* Sub-pages rendered here */}
            <Outlet context={{ profile } satisfies DashboardContext} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
