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
  Award, UserCog, BarChart2,
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
const MeuHistorico  = lazy(() => import("./pages/dashboard/MeuHistorico"));
const Matriculas    = lazy(() => import("./pages/dashboard/Matriculas"));
const CursosAdmin        = lazy(() => import("./pages/dashboard/CursosAdmin"));
const Avisos             = lazy(() => import("./pages/dashboard/Avisos"));
const ComingSoon         = lazy(() => import("./pages/dashboard/ComingSoon"));
const NovaMatricula      = lazy(() => import("./pages/dashboard/NovaMatricula"));
const PainelAdmin        = lazy(() => import("./pages/dashboard/PainelAdmin"));
const FinanceiroPage     = lazy(() => import("./pages/dashboard/Financeiro"));
const FichaFinanceiraAluno = lazy(() => import("./pages/dashboard/FichaFinanceiraAluno"));
const MeuFinanceiro        = lazy(() => import("./pages/dashboard/MeuFinanceiro"));
const Convalidacoes      = lazy(() => import("./pages/dashboard/Convalidacoes"));
const ProfessorHome      = lazy(() => import("./pages/dashboard/ProfessorHome"));
const LancarFrequencia   = lazy(() => import("./pages/dashboard/LancarFrequencia"));
const VerTurma           = lazy(() => import("./pages/dashboard/VerTurma"));
const ContratoForm       = lazy(() => import("./pages/dashboard/ContratoForm"));
const MeusContratos      = lazy(() => import("./pages/dashboard/MeusContratos"));
const MateriaisProfessor = lazy(() => import("./pages/dashboard/MateriaisProfessor"));
const MeusAlunos         = lazy(() => import("./pages/dashboard/MeusAlunos"));
const SelecionarDisciplinaProfessor = lazy(() => import("./pages/dashboard/SelecionarDisciplinaProfessor"));
const MinhaFrequencia    = lazy(() => import("./pages/dashboard/MinhaFrequencia"));
const TabelaPrecos       = lazy(() => import("./pages/dashboard/TabelaPrecos"));
const MinhasNotas        = lazy(() => import("./pages/dashboard/MinhasNotas"));
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
const Relatorios              = lazy(() => import("./pages/dashboard/Relatorios"));
const R01_AlunosPorTurma      = lazy(() => import("./components/dashboard/relatorios/R01_AlunosPorTurma"));
const R02_ListaPresenca       = lazy(() => import("./components/dashboard/relatorios/R02_ListaPresenca"));
const R03_DisciplinasPorAluno = lazy(() => import("./components/dashboard/relatorios/R03_DisciplinasPorAluno"));
const R04_SituacaoFinanceira  = lazy(() => import("./components/dashboard/relatorios/R04_SituacaoFinanceira"));
const R05_Inadimplentes       = lazy(() => import("./components/dashboard/relatorios/R05_Inadimplentes"));
const R06_HistoricoAcademico  = lazy(() => import("./components/dashboard/relatorios/R06_HistoricoAcademico"));
const RelatorioEmBreve        = lazy(() => import("./components/dashboard/relatorios/RelatorioEmBreve"));
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import { AuthProvider } from '@/contexts/AuthProvider';

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
          <AuthProvider>
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
              <Route path="meu-historico"     element={<RoleGuard allowedRoles={['aluno','superadmin']}><MeuHistorico /></RoleGuard>} />
              {/* Fase C1 — telas reais do aluno (RLS 061/062 + consolidado 065) */}
              <Route path="minhas-notas"      element={<RoleGuard allowedRoles={['aluno']}><MinhasNotas /></RoleGuard>} />
              <Route path="minha-frequencia"  element={<RoleGuard allowedRoles={['aluno']}><MinhaFrequencia /></RoleGuard>} />
              <Route path="meus-certificados" element={<ComingSoonPage titulo="Meus Certificados" descricao="Baixe e compartilhe seus certificados de conclusão de curso."          previsao="Agosto 2026" icone={Award} />} />
              <Route path="ao-vivo"     element={<ComingSoon title="Ao Vivo" icon={Tv} description="As transmissões ao vivo das aulas estarão disponíveis em breve." />} />
              <Route path="comunidade"  element={<ComingSoon title="Comunidade" icon={Users} description="Fóruns, grupos de oração e mural de avisos em desenvolvimento." />} />
              <Route path="eventos"     element={<ComingSoon title="Eventos" icon={CalendarDays} description="O calendário acadêmico com todos os eventos estará disponível em breve." />} />
              <Route path="documentos"  element={<ComingSoon title="Documentos" icon={FileText} description="Certificados e histórico acadêmico disponíveis após a conclusão dos módulos." />} />
              {/* Financeiro do aluno (2d) — vê o próprio, PIX, envia comprovante */}
              <Route path="pagamentos"  element={<RoleGuard allowedRoles={['aluno','superadmin']}><MeuFinanceiro /></RoleGuard>} />
              <Route path="suporte"     element={<ComingSoon title="Suporte" icon={HelpCircle} description="Central de atendimento pastoral e técnico em desenvolvimento." />} />

              {/* Professor */}
              <Route path="turmas"      element={<ComingSoon title="Minhas Turmas" icon={Users} description="Visualização de turmas, lista de alunos e frequência em desenvolvimento." />} />
              <Route path="materiais"   element={<ComingSoon title="Materiais" icon={BookOpen} description="Upload e gestão de apostilas, slides e materiais de aula em desenvolvimento." />} />
              <Route path="avaliacoes"  element={<ComingSoon title="Avaliações" icon={ClipboardList} description="Criação e gestão de provas e trabalhos em desenvolvimento." />} />
              <Route path="agenda"      element={<ComingSoon title="Agenda" icon={CalendarDays} description="Calendário de aulas e compromissos acadêmicos em desenvolvimento." />} />

              {/* Admin */}
              <Route path="admin"           element={<PainelAdmin />} />

              {/* Admin / Secretaria — rotas protegidas por role */}
              <Route path="relatorios"    element={<RoleGuard allowedRoles={['superadmin','admin','administracao','financeiro']}><Relatorios /></RoleGuard>} />
              <Route path="relatorios/alunos-turma" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><R01_AlunosPorTurma /></RoleGuard>} />
              <Route path="relatorios/lista-presenca" element={<RoleGuard allowedRoles={['superadmin','admin','administracao','professor']}><R02_ListaPresenca /></RoleGuard>} />
              {/* LGPD-01 fase 2 · Mov.2 (R03-B): R03 é aluno-cêntrico cross-matéria, não escopável por disciplina → professor fica de fora (usa ConsolidadoNotas + VerTurma da cadeira). */}
              <Route path="relatorios/disciplinas-aluno" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><R03_DisciplinasPorAluno /></RoleGuard>} />
              <Route path="relatorios/situacao-financeira" element={<RoleGuard allowedRoles={['superadmin','admin','administracao','financeiro']}><R04_SituacaoFinanceira /></RoleGuard>} />
              <Route path="relatorios/inadimplentes" element={<RoleGuard allowedRoles={['superadmin','admin','administracao','financeiro']}><R05_Inadimplentes /></RoleGuard>} />
              <Route path="relatorios/historico-academico" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><R06_HistoricoAcademico /></RoleGuard>} />
              <Route path="calendario"    element={<CalendarioAcademico />} />
              <Route path="nova-matricula" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><NovaMatricula /></RoleGuard>} />
              <Route path="financeiro"    element={<RoleGuard allowedRoles={['superadmin','admin','administracao','financeiro']}><FinanceiroPage /></RoleGuard>} />
              <Route path="financeiro/precos" element={<RoleGuard allowedRoles={['superadmin','admin','administracao','financeiro']}><TabelaPrecos /></RoleGuard>} />
              {/* Ficha Financeira do aluno (2g) — PII-free; staff + financeiro */}
              <Route path="financeiro/aluno/:alunoId" element={<RoleGuard allowedRoles={['superadmin','admin','administracao','financeiro']}><FichaFinanceiraAluno /></RoleGuard>} />
              <Route path="convalidacoes" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><Convalidacoes /></RoleGuard>} />
              <Route path="usuarios"      element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><Usuarios /></RoleGuard>} />
              <Route path="leads"         element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><Leads /></RoleGuard>} />
              {/* financeiro: leitura do funil (067) — ações de aprovação são negadas pela RLS */}
              <Route path="matriculas"    element={<RoleGuard allowedRoles={['superadmin','admin','administracao','financeiro']}><Matriculas /></RoleGuard>} />
              <Route path="cursos-admin"  element={<RoleGuard allowedRoles={['superadmin','admin']}><CursosAdmin /></RoleGuard>} />
              <Route path="avisos"        element={<Avisos />} />
              <Route path="notificacoes"  element={<ComingSoon title="Notificações" icon={Bell} description="Envio de comunicados e avisos para alunos e professores em desenvolvimento." />} />
              <Route path="seguranca"     element={<ComingSoon title="Segurança & LGPD" icon={ShieldAlert} description="Logs de acesso, controle de permissões e conformidade LGPD em desenvolvimento." />} />

              {/* Professor — rotas de lista (sem parâmetros) */}
              <Route path="professor/meus-alunos" element={<RoleGuard allowedRoles={['professor','admin','superadmin','administracao']}><MeusAlunos /></RoleGuard>} />
              <Route path="professor/alunos"     element={<Navigate to="/dashboard/professor/meus-alunos" replace />} />
              <Route path="professor/frequencia" element={<RoleGuard allowedRoles={['professor','admin','superadmin','administracao']}><SelecionarDisciplinaProfessor destino="frequencia" /></RoleGuard>} />
              <Route path="professor/notas"      element={<RoleGuard allowedRoles={['professor','admin','superadmin','administracao']}><SelecionarDisciplinaProfessor destino="notas" /></RoleGuard>} />
              <Route path="professor/materiais"  element={<RoleGuard allowedRoles={['professor','admin','superadmin','administracao']}><MateriaisProfessor /></RoleGuard>} />
              <Route path="professor/avaliacoes" element={<ComingSoonPage titulo="Avaliações"     descricao="Crie e gerencie provas, trabalhos e atividades das suas turmas."      previsao="Agosto 2026" icone={FileText} />} />

              {/* Professor — rotas de ação (com parâmetros). C2/E4: RoleGuard
                  (estavam sem guard — qualquer logado abria a UI); staff incluído
                  (secretaria/coordenação veem e editam — telas compartilhadas). */}
              <Route path="professor"                              element={<ProfessorHome />} />
              <Route path="professor/frequencia/:disciplinaId"              element={<RoleGuard allowedRoles={['professor','admin','superadmin','administracao']}><LancarFrequencia /></RoleGuard>} />
              <Route path="professor/turma/:disciplinaId"                   element={<RoleGuard allowedRoles={['professor','admin','superadmin','administracao']}><VerTurma /></RoleGuard>} />
              <Route path="professor/notas/:turmaId/:disciplinaId"          element={<RoleGuard allowedRoles={['professor','admin','superadmin','administracao']}><LancarNotas /></RoleGuard>} />
              <Route path="professor/consolidado/:turmaId/:disciplinaId"    element={<RoleGuard allowedRoles={['professor','admin','superadmin','administracao']}><ConsolidadoNotas /></RoleGuard>} />
              <Route path="professor/contratos"                             element={<RoleGuard allowedRoles={['professor','admin','superadmin','administracao']}><MeusContratos /></RoleGuard>} />
              <Route path="professor/contrato/:contratoId"        element={<RoleGuard allowedRoles={['professor','admin','superadmin','administracao']}><ContratoForm /></RoleGuard>} />

              {/* Admin — Professores e Equipe */}
              <Route path="professores-admin"          element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><ProfessoresAdmin /></RoleGuard>} />
              <Route path="professor-ficha/:professorId" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><FichaProfessor /></RoleGuard>} />
              <Route path="equipe-itec"                element={<RoleGuard allowedRoles={['superadmin']}><EquipeITEC /></RoleGuard>} />

              {/* Admin — Turmas */}
              <Route path="turmas-admin" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><GestaoTurmas /></RoleGuard>} />
              <Route path="notas/:turmaId/:disciplinaId"                 element={<RoleGuard allowedRoles={['professor','admin','superadmin','administracao']}><ConsolidadoNotas /></RoleGuard>} />

              {/* Secretaria/Admin — Lista e ficha do aluno */}
              {/* financeiro: LISTA de alunos sim; Ficha 360 (aluno/:alunoId) NÃO — PII (decisão Hélio) */}
              <Route path="alunos"         element={<RoleGuard allowedRoles={['superadmin','admin','administracao','financeiro']}><Alunos /></RoleGuard>} />
              {/* LGPD-01 fase 2 · Mov.1: professor NÃO vê Ficha do Aluno (CPF/RG/endereço) nem R06 (CPF). */}
              <Route path="aluno/:alunoId" element={<RoleGuard allowedRoles={['superadmin','admin','administracao']}><FichaAluno /></RoleGuard>} />

              {/* All roles */}
              <Route path="perfil" element={<Perfil />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
