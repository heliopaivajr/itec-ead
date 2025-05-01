
import React, { useEffect, useState } from 'react';
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
import { useNavigate } from 'react-router-dom';

// Dashboard content with user information
const DashboardContent = () => {
  const [user, setUser] = useState<{ email: string, role: string } | null>(null);

  useEffect(() => {
    // Get user information from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Invalid user data
      }
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-merriweather font-bold mb-6 text-itec-bloodRed">Dashboard</h1>
      
      {user && (
        <div className="mb-6 p-4 border border-gray-800 rounded-lg bg-black/50">
          <h2 className="text-xl font-semibold flex items-center">
            <User className="mr-2 text-itec-bloodRed" />
            Bem-vindo, <span className="ml-1 text-itec-bloodRed">{user.email}</span>
          </h2>
          <p className="mt-2">Tipo de conta: <span className="capitalize font-medium">{user.role}</span></p>
        </div>
      )}
      
      <p className="mt-4">Bem-vindo à plataforma EAD do Instituto de Teologia Cristã.</p>
      <p className="mt-4">Utilize o menu lateral para navegar pelos recursos disponíveis.</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-800 rounded-lg p-4 bg-black/30 hover:bg-black/50 transition-all futuristic-card">
          <h3 className="text-lg font-semibold flex items-center text-itec-bloodRed">
            <Book className="mr-2" /> Cursos em Andamento
          </h3>
          <p className="mt-2 text-gray-300">Você não possui cursos em andamento.</p>
        </div>
        
        <div className="border border-gray-800 rounded-lg p-4 bg-black/30 hover:bg-black/50 transition-all futuristic-card">
          <h3 className="text-lg font-semibold flex items-center text-itec-bloodRed">
            <CalendarDays className="mr-2" /> Próximos Eventos
          </h3>
          <p className="mt-2 text-gray-300">Não há eventos agendados.</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is authenticated
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    }
  }, [navigate]);

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
