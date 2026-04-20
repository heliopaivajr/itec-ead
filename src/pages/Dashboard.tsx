import React, { useEffect, useState } from 'react';
import {
  Book, User, Users, MessageSquare, Tv, CalendarDays,
  FileText, CreditCard, HelpCircle, Bell, Settings
} from 'lucide-react';
import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const DashboardContent = () => {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { /* invalid */ }
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-merriweather font-bold mb-6 text-primary">Dashboard</h1>

      {user && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-card">
          <h2 className="text-xl font-semibold flex items-center text-foreground">
            <User className="mr-2 text-primary" />
            Bem-vindo, <span className="ml-1 text-primary">{user.email}</span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            Tipo de conta: <span className="capitalize font-medium text-foreground">{user.role}</span>
          </p>
        </div>
      )}

      <p className="mt-4 text-foreground">Bem-vindo à plataforma EAD do Instituto de Teologia Cristã.</p>
      <p className="mt-2 text-muted-foreground">Utilize o menu lateral para navegar pelos recursos disponíveis.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-border rounded-lg p-4 bg-card hover:bg-accent/30 transition-all futuristic-card">
          <h3 className="text-lg font-semibold flex items-center text-primary">
            <Book className="mr-2" /> Cursos em Andamento
          </h3>
          <p className="mt-2 text-muted-foreground">Você não possui cursos em andamento.</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card hover:bg-accent/30 transition-all futuristic-card">
          <h3 className="text-lg font-semibold flex items-center text-primary">
            <CalendarDays className="mr-2" /> Próximos Eventos
          </h3>
          <p className="mt-2 text-muted-foreground">Não há eventos agendados.</p>
        </div>
      </div>
    </div>
  );
};

const AppSidebar = () => {
  const menuItems = [
    { icon: Book,        label: 'Dashboard',      tooltip: 'Visão geral do progresso e próximos eventos' },
    { icon: Book,        label: 'Cursos',          tooltip: 'Lista dos cursos matriculados e materiais' },
    { icon: User,        label: 'Professores',     tooltip: 'Perfil dos docentes e agendamento' },
    { icon: Users,       label: 'Comunidade',      tooltip: 'Fóruns, grupos de oração e chats' },
    { icon: Tv,          label: 'Ao Vivo',         tooltip: 'Transmissões em tempo real' },
    { icon: CalendarDays,label: 'Eventos',         tooltip: 'Webinários e calendário acadêmico' },
    { icon: FileText,    label: 'Documentos',      tooltip: 'Certificados e históricos' },
    { icon: CreditCard,  label: 'Pagamentos',      tooltip: 'Boletos e status financeiro' },
    { icon: HelpCircle,  label: 'Suporte',         tooltip: 'Central de ajuda e suporte pastoral' },
    { icon: Bell,        label: 'Notificações',    tooltip: 'Atualizações em tempo real' },
    { icon: Settings,    label: 'Configurações',   tooltip: 'Perfil e preferências' },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-2 border-b border-border">
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center border border-primary animate-glow">
            <span className="text-primary font-merriweather font-bold text-xl">I</span>
          </div>
          <span className="ml-3 font-merriweather font-bold text-sidebar-foreground text-xl hidden sm:block">
            ITEC <span className="text-primary">EAD</span>
          </span>
        </div>
        <div className="flex justify-center mt-2">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-sidebar-accent">
            Palavra do Dia
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 bg-sidebar">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                tooltip={item.tooltip}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary data-[active=true]:bg-sidebar-accent data-[active=true]:text-primary group"
              >
                <item.icon className="group-hover:text-primary transition-colors" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border bg-sidebar">
        <div className="flex justify-center">
          <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-sidebar-accent">
            Modo Foco de Estudos
          </Button>
        </div>
        <div className="mt-2 p-2 rounded bg-sidebar-accent text-sm text-center text-sidebar-foreground">
          <p className="italic">"A sabedoria é a coisa principal; adquire pois a sabedoria."</p>
          <p className="text-xs mt-1 text-primary">Provérbios 4:7</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('user')) navigate('/login');
  }, [navigate]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset>
          <div className="flex-1 overflow-auto bg-background">
            <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="h-14 flex items-center px-4 gap-4">
                <SidebarTrigger />
                <div className="flex-1" />
                <Button variant="outline" size="sm" className="border-border text-foreground/70 hover:text-primary">
                  <Bell className="h-4 w-4 mr-2 text-primary" />
                  Notificações
                </Button>
              </div>
            </header>
            <DashboardContent />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
