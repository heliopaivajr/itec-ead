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
  Bell, ShieldAlert,
  ClipboardCheck, FolderOpen, Star, CalendarCheck, Award, UserCog, BarChart2,
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
const FichaProfessor     = lazy(() => import("./pages/dashboard/FichaProfessor"));
const Alunos             = lazy(() => import("./pages/dashboard/Alunos"));
const LancarNotas        = lazy(() => import("./pages/dashboard/LancarNotas"));
const ComingSoonPage     = lazy(() => import("./pages/dashboard/ComingSoonPage"));
const ConsolidadoNotas   = lazy(() => import("./pages/dashboard/ConsolidadoNotas"));
const CalendarioAcademico = lazy(() => import("./pages/dashboard/CalendarioAcademico"));
const Relatorios         = lazy(() => import("./pages/dashboard/Relatorios"));
const R01_AlunosPorTurma = lazy(() => import("./components/dashboard/relatorios/R01_AlunosPorTurma"));
const RelatorioEmBreve   = lazy(() => import("./components/dashboard/relatorios/RelatorioEmBreve"));
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';

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
              <Route path="cursos"            element={<MeusCursos />} />
              <Route path="minhas-notas"      element={<ComingSoonPage titulo="Minhas Notas"      descricao="Acompanhe suas notas por disciplina e avaliação em tempo real."        previsao="Agosto 2026" icone={Star} />} />
              <Route path="minha-frequencia"  element={<ComingSoonPage titulo="Minha Frequência"  descricao="Veja seu histórico de presença e o percentual por disciplina."         previsao="Agosto 2026" icone={CalendarCheck} />} />
              <Route path="meus-certificados" element={<ComingSoonPage titulo="Meus Certificados" descricao="Baixe e compartilhe seus certificados de conclusão de curso."          previsao="Agosto 2026" icone={Award} />} />
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

              {/* Admin / Secretaria — rotas protegidas por role */}
              <Route path="relatorios"    element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><Relatorios /></RoleGuard>} />
              <Route path="relatorios/alunos-turma" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><R01_AlunosPorTurma /></RoleGuard>} />
              <Route path="relatorios/lista-presenca" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><RelatorioEmBreve codigo="R02" titulo="Lista de Presença" descricao="Controle de presença por disciplina e período" /></RoleGuard>} />
              <Route path="relatorios/disciplinas-aluno" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><RelatorioEmBreve codigo="R03" titulo="Disciplinas por Aluno" descricao="Disciplinas cursadas, em andamento e pendentes" /></RoleGuard>} />
              <Route path="relatorios/situacao-financeira" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><RelatorioEmBreve codigo="R04" titulo="Situação Financeira" descricao="Status de pagamento e mensalidades dos alunos" /></RoleGuard>} />
              <Route path="relatorios/inadimplentes" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><RelatorioEmBreve codigo="R05" titulo="Alunos Inadimplentes" descricao="Listagem de alunos com pagamentos em atraso" /></RoleGuard>} />
              <Route path="relatorios/historico-academico" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><RelatorioEmBreve codigo="R06" titulo="Histórico Acadêmico" descricao="Histórico completo individual do aluno" /></RoleGuard>} />
              <Route path="calendario"    element={<CalendarioAcademico />} />
              <Route path="nova-matricula" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><NovaMatricula /></RoleGuard>} />
              <Route path="financeiro"    element={<RoleGuard allowedRoles={['superadmin','admin','administracao','financeiro']}><FinanceiroPage /></RoleGuard>} />
              <Route path="convalidacoes" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><Convalidacoes /></RoleGuard>} />
              <Route path="usuarios"      element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><Usuarios /></RoleGuard>} />
              <Route path="leads"         element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><Leads /></RoleGuard>} />
              <Route path="matriculas"    element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><Matriculas /></RoleGuard>} />
              <Route path="cursos-admin"  element={<RoleGuard allowedRoles={['superadmin','admin']}><CursosAdmin /></RoleGuard>} />
              <Route path="avisos"        element={<Avisos />} />
              <Route path="notificacoes"  element={<ComingSoon title="Notificações" icon={Bell} description="Envio de comunicados e avisos para alunos e professores em desenvolvimento." />} />
              <Route path="seguranca"     element={<ComingSoon title="Segurança & LGPD" icon={ShieldAlert} description="Logs de acesso, controle de permissões e conformidade LGPD em desenvolvimento." />} />

              {/* Professor — rotas de lista (sem parâmetros) */}
              <Route path="professor/alunos"     element={<ComingSoonPage titulo="Meus Alunos"    descricao="Veja a lista de alunos das suas turmas e acesse as fichas individuais." previsao="Agosto 2026" icone={Users} />} />
              <Route path="professor/frequencia" element={<ComingSoonPage titulo="Frequência"     descricao="Lance a presença dos alunos por aula de forma rápida."                previsao="Agosto 2026" icone={ClipboardCheck} />} />
              <Route path="professor/notas"      element={<ComingSoonPage titulo="Notas"          descricao="Registre e gerencie as avaliações e notas por disciplina."            previsao="Agosto 2026" icone={BookOpen} />} />
              <Route path="professor/materiais"  element={<ComingSoonPage titulo="Materiais de Aula" descricao="Faça upload de apostilas, slides e PDFs para seus alunos."        previsao="Agosto 2026" icone={FolderOpen} />} />
              <Route path="professor/avaliacoes" element={<ComingSoonPage titulo="Avaliações"     descricao="Crie e gerencie provas, trabalhos e atividades das suas turmas."      previsao="Agosto 2026" icone={FileText} />} />

              {/* Professor — rotas de ação (com parâmetros) */}
              <Route path="professor"                              element={<ProfessorHome />} />
              <Route path="professor/frequencia/:disciplinaId"              element={<LancarFrequencia />} />
              <Route path="professor/turma/:disciplinaId"                   element={<VerTurma />} />
              <Route path="professor/notas/:turmaId/:disciplinaId"          element={<LancarNotas />} />
              <Route path="professor/consolidado/:turmaId/:disciplinaId"    element={<ConsolidadoNotas />} />
              <Route path="professor/contratos"                             element={<MeusContratos />} />
              <Route path="professor/contrato/:contratoId"        element={<ContratoForm />} />

              {/* Admin — Professores e Equipe */}
              <Route path="professores-admin"          element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><ProfessoresAdmin /></RoleGuard>} />
              <Route path="professor-ficha/:professorId" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><FichaProfessor /></RoleGuard>} />
              <Route path="equipe-itec"                element={<RoleGuard allowedRoles={['superadmin']}><EquipeITEC /></RoleGuard>} />

              {/* Admin — Turmas */}
              <Route path="turmas-admin" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><GestaoTurmas /></RoleGuard>} />
              <Route path="notas/:turmaId/:disciplinaId"                 element={<ConsolidadoNotas />} />

              {/* Secretaria/Admin — Lista e ficha do aluno */}
              <Route path="alunos"         element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><Alunos /></RoleGuard>} />
              <Route path="aluno/:alunoId" element={<RoleGuard allowedRoles={['superadmin','admin','administracao','professor']}><FichaAluno /></RoleGuard>} />

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
