import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./hooks/use-theme-mode";
import {
  Tv, Users, CalendarDays, FileText,
  CreditCard, HelpCircle, ClipboardList, BookOpen,
  Bell, ShieldAlert
} from 'lucide-react';

import Index           from "./pages/Index";
import Dashboard       from "./pages/Dashboard";
import Login           from "./pages/Login";
import RecuperarSenha  from "./pages/RecuperarSenha";
import Cadastro        from "./pages/Cadastro";
import Professores     from "./pages/Professores";
import Cursos          from "./pages/Cursos";
import DevSetup        from "./pages/DevSetup";
import NotFound        from "./pages/NotFound";

import DashboardHome   from "./pages/dashboard/DashboardHome";
import Perfil          from "./pages/dashboard/Perfil";
import Leads           from "./pages/dashboard/Leads";
import Usuarios        from "./pages/dashboard/Usuarios";
import MeusCursos      from "./pages/dashboard/MeusCursos";
import Matriculas      from "./pages/dashboard/Matriculas";
import CursosAdmin     from "./pages/dashboard/CursosAdmin";
import Avisos          from "./pages/dashboard/Avisos";
import ComingSoon      from "./pages/dashboard/ComingSoon";

import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <img src="/logo_itec.png" alt="ITEC" className="h-12 w-auto opacity-60" />
          <span className="text-sm">Validando acesso...</span>
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/"              element={<Index />} />
            <Route path="/login"         element={<Login />} />
            <Route path="/esqueci-senha" element={<RecuperarSenha />} />
            <Route path="/cadastro"      element={<Cadastro />} />
            <Route path="/cursos"        element={<Cursos />} />
            <Route path="/professores"   element={<Professores />} />
            <Route path="/dev-setup"     element={<DevSetup />} />

            {/* Dashboard — nested protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
              <Route index element={<DashboardHome />} />

              {/* Aluno */}
              <Route path="cursos"      element={<MeusCursos />} />
              <Route path="ao-vivo"     element={<ComingSoon title="Ao Vivo" icon={Tv} description="As transmissões ao vivo das aulas estarão disponíveis em breve." />} />
              <Route path="comunidade"  element={<ComingSoon title="Comunidade" icon={Users} description="Fóruns, grupos de oração e mural de avisos em desenvolvimento." />} />
              <Route path="eventos"     element={<ComingSoon title="Eventos" icon={CalendarDays} description="O calendário acadêmico com todos os eventos estará disponível em breve." />} />
              <Route path="documentos"  element={<ComingSoon title="Documentos" icon={FileText} description="Certificados e histórico acadêmico disponíveis após a conclusão dos módulos." />} />
              <Route path="pagamentos"  element={<ComingSoon title="Pagamentos" icon={CreditCard} description="Para informações sobre mensalidades e boletos, entre em contato com a secretaria." />} />
              <Route path="suporte"     element={<ComingSoon title="Suporte" icon={HelpCircle} description="Central de atendimento pastoral e técnico em desenvolvimento." />} />

              {/* Professor */}
              <Route path="turmas"      element={<ComingSoon title="Minhas Turmas" icon={Users} description="Visualização de turmas, lista de alunos e frequência em desenvolvimento." />} />
              <Route path="materiais"   element={<ComingSoon title="Materiais" icon={BookOpen} description="Upload e gestão de apostilas, slides e materiais de aula em desenvolvimento." />} />
              <Route path="avaliacoes"  element={<ComingSoon title="Avaliações" icon={ClipboardList} description="Criação e gestão de provas e trabalhos em desenvolvimento." />} />
              <Route path="agenda"      element={<ComingSoon title="Agenda" icon={CalendarDays} description="Calendário de aulas e compromissos acadêmicos em desenvolvimento." />} />

              {/* Admin / Secretaria */}
              <Route path="usuarios"      element={<Usuarios />} />
              <Route path="leads"         element={<Leads />} />
              <Route path="matriculas"    element={<Matriculas />} />
              <Route path="cursos-admin"  element={<CursosAdmin />} />
              <Route path="financeiro"    element={<ComingSoon title="Financeiro" icon={CreditCard} description="Gestão financeira, mensalidades e relatórios em desenvolvimento." />} />
              <Route path="avisos"        element={<Avisos />} />
              <Route path="notificacoes"  element={<ComingSoon title="Notificações" icon={Bell} description="Envio de comunicados e avisos para alunos e professores em desenvolvimento." />} />
              <Route path="seguranca"     element={<ComingSoon title="Segurança & LGPD" icon={ShieldAlert} description="Logs de acesso, controle de permissões e conformidade LGPD em desenvolvimento." />} />

              {/* All roles */}
              <Route path="perfil" element={<Perfil />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
