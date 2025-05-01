
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
      <h1 className="text-2xl font-merriweather font-bold mb-6 text-itec-bloodRed">Dashboard</h1>
      <p>Bem-vindo à plataforma EAD do Instituto de Teologia Cristã.</p>
      <p className="mt-4">Utilize o menu lateral para navegar pelos recursos disponíveis.</p>
    </div>
  );
};

const Dashboard = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gray-900 text-gray-100">
        <AppSidebar />
        <SidebarInset>
          <div className="flex-1 overflow-auto bg-gray-900">
            <header className="border-b border-gray-800 bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-gray-800/60">
              <div className="h-14 flex items-center px-4 gap-4">
                <SidebarTrigger />
                <div className="flex-1" />
                <Button variant="outline" size="sm" className="bg-transparent border-gray-700 hover:bg-gray-700">
                  <Bell className="h-4 w-4 mr-2 text-itec-bloodRed" />
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
      className="border-r border-gray-800 bg-black"
    >
      <SidebarHeader className="p-2 border-b border-gray-800">
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center border border-itec-bloodRed animate-glow">
            <span className="text-itec-bloodRed font-merriweather font-bold text-xl">I</span>
          </div>
          <span className="ml-3 font-merriweather font-bold text-white text-xl hidden sm:block">
            ITEC <span className="text-itec-bloodRed">EAD</span>
          </span>
        </div>
        <div className="flex justify-center mt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-itec-bloodRed hover:text-itec-bloodRed/80 hover:bg-gray-900"
          >
            Palavra do Dia
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2 bg-gray-900">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton 
                tooltip={item.tooltip} 
                className="text-gray-300 hover:bg-gray-800 hover:text-itec-bloodRed data-[active=true]:bg-gray-800 data-[active=true]:text-itec-bloodRed group"
              >
                <item.icon className="group-hover:text-itec-bloodRed transition-colors" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-gray-800 bg-black">
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-itec-bloodRed text-itec-bloodRed hover:bg-gray-900 hover:text-itec-bloodRed"
          >
            Modo Foco de Estudos
          </Button>
        </div>
        <div className="mt-2 p-2 rounded bg-gray-900 text-sm text-center text-gray-300">
          <p className="italic">"A sabedoria é a coisa principal; adquire pois a sabedoria."</p>
          <p className="text-xs mt-1 text-itec-bloodRed">Provérbios 4:7</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default Dashboard;
