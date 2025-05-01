
import React from 'react';
import { 
  Book, User, Users, MessageSquare, Tv, CalendarDays, 
  FileText, CreditCard, HelpCircle, Bell, Settings
} from 'lucide-react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarMenu, 
  SidebarMenuItem,
  SidebarMenuButton, 
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

// Dashboard content placeholder
const DashboardContent = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-merriweather font-bold mb-6">Dashboard</h1>
      <p>Bem-vindo à plataforma EAD do Instituto de Teologia Cristã.</p>
      <p className="mt-4">Utilize o menu lateral para navegar pelos recursos disponíveis.</p>
    </div>
  );
};

const Dashboard = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="flex-1 overflow-auto">
            <header className="border-b border-gray-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="h-14 flex items-center px-4 gap-4">
                <SidebarTrigger />
                <div className="flex-1" />
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
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

// App Sidebar Component
const AppSidebar = () => {
  const menuItems = [
    { icon: Book, label: 'Dashboard', tooltip: 'Visão geral do progresso e próximos eventos' },
    { icon: Book, label: 'Cursos', tooltip: 'Lista dos cursos matriculados e materiais' },
    { icon: User, label: 'Professores', tooltip: 'Perfil dos docentes e agendamento' },
    { icon: Users, label: 'Comunidade', tooltip: 'Fóruns, grupos de oração e chats' },
    { icon: Tv, label: 'Ao Vivo', tooltip: 'Transmissões em tempo real' },
    { icon: CalendarDays, label: 'Eventos', tooltip: 'Webinários e calendário acadêmico' },
    { icon: FileText, label: 'Documentos', tooltip: 'Certificados e históricos' },
    { icon: CreditCard, label: 'Pagamentos', tooltip: 'Boletos e status financeiro' },
    { icon: HelpCircle, label: 'Suporte', tooltip: 'Central de ajuda e suporte pastoral' },
    { icon: Bell, label: 'Notificações', tooltip: 'Atualizações em tempo real' },
    { icon: Settings, label: 'Configurações', tooltip: 'Perfil e preferências' },
  ];

  return (
    <Sidebar 
      variant="sidebar" 
      collapsible="icon" 
      className="border-r border-gray-800 bg-itec-darkGray"
    >
      <SidebarHeader className="p-2 border-b border-gray-800">
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-itec-blue flex items-center justify-center border border-itec-gold">
            <span className="text-white font-merriweather font-bold text-xl">I</span>
          </div>
          <span className="ml-3 font-merriweather font-bold text-white text-xl hidden sm:block">
            ITEC EAD
          </span>
        </div>
        <div className="flex justify-center mt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-itec-gold hover:text-itec-gold/80 hover:bg-gray-800"
          >
            Palavra do Dia
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton 
                tooltip={item.tooltip} 
                className="text-gray-300 hover:bg-gray-800 hover:text-itec-gold data-[active=true]:bg-gray-800 data-[active=true]:text-itec-gold group"
              >
                <item.icon className="group-hover:text-itec-gold transition-colors" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-gray-800">
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-itec-gold text-itec-gold hover:bg-gray-800 hover:text-itec-gold"
          >
            Modo Foco de Estudos
          </Button>
        </div>
        <div className="mt-2 p-2 rounded bg-gray-800 text-sm text-center text-gray-300">
          <p className="italic">"A sabedoria é a coisa principal; adquire pois a sabedoria."</p>
          <p className="text-xs mt-1 text-itec-gold">Provérbios 4:7</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default Dashboard;
