import { lazy, Suspense } from 'react';
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

import Index from "./pages/Index";

const Dashboard      = lazy(() => import("./pages/Dashboard"));
const Login          = lazy(() => import("./pages/Login"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const Cadastro       = lazy(() => import("./pages/Cadastro"));
const Professores    = lazy(() => import("./pages/Professores"));
const Cursos         = lazy(() => import("./pages/Cursos"));
const Sobre          = lazy(() => import("./pages/Sobre"));
const Contato        = lazy(() => import("./pages/Contato"));
const Comunidade     = lazy(() => import("./pages/Comunidade"));
const Blog           = lazy(() => import("./pages/Blog"));
const ReservarVaga   = lazy(() => import("./pages/ReservarVaga"));
const Privacidade    = lazy(() => import("./pages/Privacidade"));
const DevSetup              = lazy(() => import("./pages/DevSetup"));
const NotFound              = lazy(() => import("./pages/NotFound"));
const AguardandoAprovacao   = lazy(() => import("./pages/AguardandoAprovacao"));

const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const Perfil        = lazy(() => import("./pages/dashboard/Perfil"));
const Leads         = lazy(() => import("./pages/dashboard/Leads"));
const Usuarios      = lazy(() => import("./pages/dashboard/Usuarios"));
const MeusCursos    = lazy(() => import("./pages/dashboard/MeusCursos"));
const Matriculas    = lazy(() => import("./pages/dashboard/Matriculas"));
const CursosAdmin        = lazy(() => import("./pages/dashboard/CursosAdmin"));
const Avisos             = lazy(() => import("./pages/dashboard/Avisos"));
const ComingSoon         = lazy(() => import("./pages/dashboard/ComingSoon"));
const NovaMatricula      = lazy(() => import("./pages/dashboard/NovaMatricula"));
const PainelAdmin        = lazy(() => import("./pages/dashboard/PainelAdmin"));
const FinanceiroPage     = lazy(() => import("./pages/dashboard/Financeiro"));
const Convalidacoes      = lazy(() => import("./pages/dashboard/Convalidacoes"));
const ProfessorHome      = lazy(() => import("./pages/dashboard/ProfessorHome"));
const LancarFrequencia   = lazy(() => import("./pages/dashboard/LancarFrequencia"));
const VerTurma           = lazy(() => import("./pages/dashboard/VerTurma"));
const ContratoForm       = lazy(() => import("./pages/dashboard/ContratoForm"));
const MeusContratos      = lazy(() => import("./pages/dashboard/MeusContratos"));
const ProfessoresAdmin   = lazy(() => import("./pages/dashboard/ProfessoresAdmin"));
const EquipeITEC         = lazy(() => import("./pages/dashboard/EquipeITEC"));
const GestaoTurmas       = lazy(() => import("./pages/dashboard/GestaoTurmas"));
const FichaAluno         = lazy(() => import("./pages/dashboard/FichaAluno"));
const Alunos             = lazy(() => import("./pages/dashboard/Alunos"));
import ProtectedRoute from '@/components/ProtectedRoute';

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
      <img src="/logo_itec.png" alt="ITEC" width={48} height={48} className="opacity-60" />
      <span className="text-sm">Carregando...</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/"              element={<Index />} />
            <Route path="/login"         element={<Login />} />
            <Route path="/esqueci-senha" element={<RecuperarSenha />} />
            <Route path="/cadastro"      element={<Cadastro />} />
            <Route path="/cursos"        element={<Cursos />} />
            <Route path="/professores"   element={<Professores />} />
            <Route path="/sobre"         element={<Sobre />} />
            <Route path="/docentes"      element={<Navigate to="/professores" replace />} />
            <Route path="/contato"       element={<Contato />} />
            <Route path="/comunidade"    element={<Comunidade />} />
            <Route path="/blog"          element={<Blog />} />
            <Route path="/reservar-vaga" element={<ReservarVaga />} />
            <Route path="/privacidade"   element={<Privacidade />} />
            <Route path="/dev-setup"     element={<DevSetup />} />
            <Route path="/aguardando"    element={<AguardandoAprovacao />} />

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

              {/* Admin */}
              <Route path="admin"           element={<PainelAdmin />} />

              {/* Admin / Secretaria */}
              <Route path="nova-matricula"  element={<NovaMatricula />} />
              <Route path="financeiro"      element={<FinanceiroPage />} />
              <Route path="convalidacoes"   element={<Convalidacoes />} />
              <Route path="usuarios"        element={<Usuarios />} />
              <Route path="leads"         element={<Leads />} />
              <Route path="matriculas"    element={<Matriculas />} />
              <Route path="cursos-admin"  element={<CursosAdmin />} />
              <Route path="financeiro"    element={<ComingSoon title="Financeiro" icon={CreditCard} description="Gestão financeira, mensalidades e relatórios em desenvolvimento." />} />
              <Route path="avisos"        element={<Avisos />} />
              <Route path="notificacoes"  element={<ComingSoon title="Notificações" icon={Bell} description="Envio de comunicados e avisos para alunos e professores em desenvolvimento." />} />
              <Route path="seguranca"     element={<ComingSoon title="Segurança & LGPD" icon={ShieldAlert} description="Logs de acesso, controle de permissões e conformidade LGPD em desenvolvimento." />} />

              {/* Professor */}
              <Route path="professor"                              element={<ProfessorHome />} />
              <Route path="professor/frequencia/:disciplinaId"    element={<LancarFrequencia />} />
              <Route path="professor/turma/:disciplinaId"         element={<VerTurma />} />
              <Route path="professor/contratos"                    element={<MeusContratos />} />
              <Route path="professor/contrato/:contratoId"        element={<ContratoForm />} />

              {/* Admin — Professores e Equipe */}
              <Route path="professores-admin" element={<ProfessoresAdmin />} />
              <Route path="equipe-itec"       element={<EquipeITEC />} />

              {/* Admin — Turmas */}
              <Route path="turmas-admin"      element={<GestaoTurmas />} />

              {/* Secretaria/Admin — Lista e ficha do aluno */}
              <Route path="alunos"            element={<Alunos />} />
              <Route path="aluno/:alunoId"    element={<FichaAluno />} />

              {/* All roles */}
              <Route path="perfil" element={<Perfil />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
