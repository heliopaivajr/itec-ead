# PRD — Plataforma ITEC EAD

**Última atualização:** 2026-05-26
**Stack:** React 18 + TypeScript + Vite 6 + Tailwind CSS + Shadcn UI + Supabase + Vitest
**Projeto:** `e:/_HELIOJR/ITEC/itec-ead/`
**Deploy:** GitHub → Vercel (Frontend) + Supabase (Backend/Auth/Database)
**Site oficial:** https://www.itecedu.com
**Deploy staging:** https://itec-ead.vercel.app
**Instagram:** @itec.teologia
**Contatos:** secretaria@itecedu.com · financeiro@itecedu.com · educacao@itecedu.com · (81) 99116-1448

---

## 1. Sobre o ITEC e os Cursos

Instituto de Teologia Cristã — Unidade Janga, Paulista-PE. Fundado em 2025 com muita oração.
Missão: formar servos de Deus com excelência acadêmica, profundidade espiritual e comprometimento com a missão da Igreja.

### 1.1 Graduação em Teologia (Teologia Livre)
- **Requisito:** Graduação prévia obrigatória
- **Duração:** 3 anos / 6 módulos / 185 créditos / 40 disciplinas
- **Modalidade:** Híbrida (Presencial e Online)
- **Horário:** Segunda, Quarta e Sexta 18h45–22h00
- **Turma 2026:** Início Agosto 2026

### 1.2 SETEB — Seminário de Educação Teológica Básica
- **Requisito:** Aberto a todos os cristãos
- **Duração:** 3 anos (Ano 1: Teologia Básica · Ano 2: AT · Ano 3: NT)
- **Modalidade:** Presencial
- **Horário:** Terças-feiras 19h00–20h00 (1h/semana)

### 1.3 Curso Ministerial para Mulheres
- **Requisito:** Exclusivo para mulheres
- **Duração:** Anual (7 disciplinas)
- **Horário:** Quintas-feiras 19h00–22h00
- **Disciplinas 2026:** A Mulher e a Bíblia (AT/NT), A Vida Cristã, As Emoções, A Missão, A Família, A Pregação

---

## 2. Visão Geral das Funcionalidades

1. **Landing Page Pública** — Apresentação institucional, captação de leads, reserva de vaga
2. **Gestão Acadêmica** — Dashboards para Alunos, Professores e Admin
3. **Plataforma EAD** — Vídeo-aulas, materiais, progresso, notas, frequência
4. **Comunicação** — Avisos, notificações, comunidade
5. **Certificação Digital** — PDF com QR Code e validação online
6. **Financeiro** — Mensalidades, relatórios, integração com gateway

---

## 3. Banco de Dados — Tabelas (Supabase)

| Tabela | Status | Descrição |
|---|---|---|
| `profiles` | ✅ + RLS | Perfis com role — RLS completo |
| `leads_cursos` | ✅ + RLS | Leads capturados + formulário reserva de vaga |
| `matriculas` | ✅ + RLS | Vínculo Aluno ↔ Curso/Módulo |
| `avisos` | ✅ + RLS | Mural de avisos e comunicados |
| `disciplinas` | ✅ + RLS + seed | Grade curricular (40 disciplinas, 6 módulos) |
| `prerequisitos_disciplinas` | ✅ + RLS + seed | Pré-requisitos com tipo (formal/recomendado/corequisito) |
| `cursos` | 🔲 | Cursos da plataforma |
| `modulos` | 🔲 | Módulos por curso |
| `aulas` | 🔲 | Aulas por módulo |
| `progresso_aluno` | 🔲 | Progresso por aula |
| `frequencia` | 🔲 | Controle de presenças |
| `avaliacoes` | 🔲 | Provas e trabalhos |
| `notas` | 🔲 | Resultados dos alunos |
| `materiais` | 🔲 | PDFs, slides, vídeos por aula |
| `certificados` | 🔲 | Certificados com hash antifraude |
| `eventos_academicos` | 🔲 | Calendário acadêmico |
| `mensalidades` | 🔲 | Mensalidades e pagamentos |
| `notificacoes` | 🔲 | Notificações in-app |
| `audit_log` | 🔲 | Logs de segurança (superadmin) |

---

## 4. Roles do Sistema

| Role | Quem | Acesso |
|---|---|---|
| `pendente` | Novo cadastro | Redirecionado para `/aguardando` — sem acesso ao dashboard |
| `aluno` | Aluno aprovado | Área do aluno |
| `professor` | Docente | Turmas, materiais, avisos |
| `administracao` | Secretaria | Leads, matrículas, avisos |
| `admin` | Diretoria | Todos os painéis |
| `superadmin` | Hélio (dev) | Acesso total, LGPD, auditoria |

> Role `superadmin` definido diretamente no banco — não há email hardcoded no código.

---

## 5. CHECKLIST COMPLETO — LANDING PAGE E SITE PÚBLICO

### ✅ Concluído

#### Estrutura e Deploy
- [x] Projeto React + Vite 6 + TypeScript + Tailwind + Shadcn UI
- [x] Deploy automático GitHub → Vercel
- [x] Domínio `itecedu.com` apontando para Vercel
- [x] `.env` com variáveis do Supabase (URL + anon key)
- [x] `.env` no `.gitignore` + `.env.example` como template
- [x] Variáveis configuradas no painel Vercel
- [x] `vercel.json` com cache headers + 8 security headers (CSP, HSTS, X-Frame, etc.)
- [x] CSP sem `lovable.dev` nem `cdn.gpteng.co` — Supabase Storage + Google OAuth corretos
- [x] Code splitting com `React.lazy()` em todas as páginas exceto Index
- [x] Vite `manualChunks` (react-vendor, query-vendor, ui-vendor)
- [x] OG image customizada ITEC (1200×630) para WhatsApp/redes sociais

#### Navbar
- [x] Logo ITEC transparente (fundo branco removido via sharp)
- [x] Logo clicável → `/`
- [x] Menu: Cursos, Professores, Sobre (dropdown: Nossa Missão + Contato), Comunidade, Blog
- [x] ThemeSwitcher (Dark / Light / Sépia)
- [x] Menu mobile responsivo com aria-label + aria-expanded
- [x] Botão Entrar → `/login`

#### Hero
- [x] Vídeo de fundo `hero-bg.mp4` com `object-fit: cover` em loop
- [x] Animações cinematográficas escalonadas (logo → título → subtítulo → botão → tagline → card)
- [x] Botão de áudio (mudo por padrão)
- [x] Card "Matrículas Abertas" → `/reservar-vaga` (ano 2026, início Agosto)
- [x] Tagline: *"Onde a Palavra de Deus encontra a sua vocação."*

#### Seções da Landing Page
- [x] **Features** — 6 diferenciais do ITEC
- [x] **CoursePreview** — 3 cursos (SETEB: Terças, modalidade Híbrida)
- [x] **VideoReel** — Carrossel estilo Netflix com 5 vídeos (autoplay, onEnded, som, progresso)
- [x] **Testimonials**
- [x] **CallToAction** — formulário Google + WhatsApp + Instagram
- [x] **Footer** — contatos corretos, Instagram destaque @itec.teologia

#### Páginas Públicas
- [x] `/` — Landing Page
- [x] `/cursos` — 3 cursos
- [x] `/professores` — 6 docentes com bio e disciplinas
- [x] `/sobre` — Nossa Missão, Visão, Valores
- [x] `/contato` — Formulário + WhatsApp + Instagram
- [x] `/comunidade` — Em breve
- [x] `/blog` — 6 artigos teológicos
- [x] `/reservar-vaga` — Formulário LGPD + envio ao Supabase
- [x] `/privacidade` — Política de privacidade completa (LGPD, 9 seções)
- [x] `/aguardando` — Tela para role `pendente` com botão logout

#### Rotas e Redirects
- [x] `/docentes` → redirect para `/professores` (Navigate)

#### SEO
- [x] `<html lang="pt-BR">`
- [x] Meta description correta (híbrida, não "100% online")
- [x] OG tags completas apontando para `itecedu.com`
- [x] `robots.txt`

#### Segurança
- [x] **R1** — ProtectedRoute bloqueia role `pendente` → `/aguardando`
- [x] **R2** — CSP atualizada (lovable.dev e cdn.gpteng.co removidos)
- [x] **R3** — Migrations SQL para `disciplinas` e `prerequisitos_disciplinas` com RLS
- [x] **R4** — `VITE_SUPERADMIN_EMAIL` removido do bundle; role via banco

---

### 🔲 Pendente — Landing Page

- [ ] FAQ (perguntas frequentes dos candidatos)
- [ ] Depoimentos com fotos reais dos alunos
- [ ] Integração `/reservar-vaga` com envio de e-mail real (Resend/SendGrid)
- [ ] Favicon PNG moderno (192/512px para PWA)
- [ ] Meta tags por subpágina (`react-helmet`)
- [ ] Verificar handle Twitter/X `@itec_br`
- [ ] Página `/termos` — termos de uso
- [ ] Rota `/validar/:codigo` para certificados

---

## 6. CHECKLIST — ÁREA INTERNA (DASHBOARD)

### ✅ Concluído

- [x] Layout base (Sidebar por role, SidebarProvider, SidebarInset)
- [x] Menu diferente por role (aluno, professor, administracao, admin, superadmin)
- [x] Botão "Página Inicial" na sidebar e no header
- [x] ThemeSwitcher no header
- [x] **ProtectedRoute com RBAC** — verifica session + role; bloqueia `pendente` e roles desconhecidos
- [x] `DashboardHome` com KPIs por role (Admin com dados reais, Prof/Aluno estáticos)
- [x] `Perfil` — edição de dados
- [x] `Leads` — tabela com filtro e export CSV
- [x] `Usuarios` — gestão de usuários e roles
- [x] `Matriculas` — aprovação/recusa
- [x] `CursosAdmin` — grade curricular com accordion por módulo, edição via modal, pré-requisitos
- [x] `Avisos` — mural com modal de criação, fixar no topo, expiração
- [x] `ComingSoon` — placeholder para módulos futuros

### 🔲 Pendente — Área Interna

#### Próximo (curto prazo)
- [ ] `MeusCursos` — conectar com dados reais (tabelas `cursos`, `modulos`, `aulas`)
- [ ] SQL: criar tabelas `cursos`, `modulos`, `aulas`, `progresso_aluno`
- [ ] `usuarios.service.ts` — isolar Leads, Matriculas, Usuarios, Perfil, MeusCursos
- [ ] Paginação em `Usuarios.tsx` e `Leads.tsx` (SELECT sem LIMIT em produção)
- [ ] Testes para Login, DashboardHome, CursosAdmin

#### Sprint 4 — Módulos Acadêmicos
- [ ] `Frequencia.tsx` — view aluno + lançamento professor
- [ ] `Notas.tsx` — tabela aluno + formulário professor
- [ ] `Materiais.tsx` — upload para Supabase Storage
- [ ] `NotificacoesDropdown` — badge no header
- [ ] SQL: `frequencia`, `avaliacoes`, `notas`, `materiais`

#### Sprint 5 — Calendário, Financeiro e Certificados
- [ ] `Calendario.tsx` — react-big-calendar
- [ ] `Certificados.tsx` — PDF + QR Code + validação pública `/validar/:codigo`
- [ ] `Financeiro.tsx` — mensalidades e relatórios
- [ ] SQL: `certificados`, `eventos_academicos`, `mensalidades`

#### Sprint 6 — Pós-lançamento
- [ ] Chat/Comunidade em tempo real (Supabase Realtime)
- [ ] PWA + notificações push
- [ ] Relatórios exportáveis (PDF/Excel)
- [ ] Gateway de pagamento (Asaas/Stripe) — PIX/Cartão/Boleto
- [ ] LGPD: anonimização + portabilidade de dados
- [ ] `audit_log` — logs de acesso (superadmin)
- [ ] App mobile (React Native / Expo) — futuro

---

## 7. ARQUITETURA — CAMADA DE SERVIÇOS

Toda lógica Supabase passa por `src/services/`. Componentes e páginas **não importam `supabase` diretamente**.

| Service | Funções | Status |
|---|---|---|
| `auth.service.ts` | signIn, signInWithGoogle, signUpWithEmail, signOut, resetPassword, getSession | ✅ |
| `profile.service.ts` | getRole (fallback 'pendente'), getProfile, upsertProfile | ✅ |
| `leads.service.ts` | createLead (+ fallback localStorage), getLeadsCount | ✅ |
| `avisos.service.ts` | getAvisos, createAviso, deleteAviso | ✅ |
| `dashboard.service.ts` | getKpis, getLeadsRecentes, getMatriculasRecentes, getLeadsPorCurso | ✅ |
| `cursos.service.ts` | getDisciplinas, getPrerequisitos, updateDisciplina, syncPrerequisitos (rollback) | ✅ |
| `usuarios.service.ts` | — | 🔲 próximo sprint |

**Pendente:** `ProtectedRoute.tsx` e `use-profile.tsx` ainda usam `supabase.auth.getSession` e `onAuthStateChange` diretamente — migrar para `auth.service` no próximo sprint.

---

## 8. TESTES

| Arquivo | Testes | Cenários |
|---|---|---|
| `test/sanity.test.ts` | 1 | Ambiente Vitest funcionando |
| `test/components/ProtectedRoute.test.tsx` | 8 | Sem sessão, pendente, aluno, professor, administracao, admin, superadmin, role desconhecido |
| `test/pages/ReservarVaga.test.tsx` | 6 | Campos vazios, LGPD bloqueio, email inválido, submit válido, sucesso, erro Supabase |
| **Total** | **15/15** | |

**Cobertura pendente:** Login, Dashboard, CursosAdmin, páginas admin.

---

## 9. DECISÕES TÉCNICAS (ADRs)

| ADR | Decisão | Status |
|---|---|---|
| ADR-001 | Arquitetura geral (React + Supabase + Vercel) | Vigente |
| ADR-002 | Camada de serviços (`src/services/`) | **IMPLEMENTADO** 2026-05-26 |

Arquivos em `.ai-system/adr/`.

---

## 10. BUGS CONHECIDOS / LIÇÕES APRENDIDAS

| Issue | Causa | Solução |
|---|---|---|
| Vercel build falhou (`ERR_PNPM_OUTDATED_LOCKFILE`) | sharp instalado via `npm` em projeto `pnpm` | Remover sharp + `pnpm install` |
| Vídeos paravam no meio | `useEffect` em VideoCard resetava `currentTime=0` ao scroll | Reescrever com refs no componente pai |
| Logo quebrada no Hero | Path `/lovable-uploads/...` incorreto | Corrigir para `/logo_itec_transparent.png` |
| OG image mostrava Lovable no WhatsApp | `og:image` apontava para `lovable.dev` | Gerar og-image.png ITEC + apontar para `itecedu.com` |
| `.env` estava no repositório | Nunca adicionado ao `.gitignore` | `git rm --cached .env` |
| `CREATE POLICY IF NOT EXISTS` gerou erro no Supabase | Sintaxe não existe no PostgreSQL | Usar `DROP POLICY IF EXISTS` + `CREATE POLICY` |

---

## 11. PRÓXIMOS PASSOS (em ordem de prioridade)

1. **`usuarios.service.ts`** — isolar Leads, Matriculas, Usuarios, Perfil, MeusCursos (5 páginas admin ainda com Supabase direto)
2. **Paginação** em `Leads.tsx` e `Usuarios.tsx` — SELECT sem LIMIT pode ser lento em produção
3. **E-mail automático** ao reservar vaga → secretaria@itecedu.com (Resend)
4. **SQL Sprint 4** — tabelas `cursos`, `modulos`, `aulas`, `progresso_aluno`
5. **MeusCursos** — conectar com dados reais do Supabase
6. **Testes** — Login, DashboardHome, CursosAdmin
7. **Certificados** — PDF + QR Code + rota pública de validação

---

*ADRs: `.ai-system/adr/`*
*Auditoria pós-sprint: `.ai-system/audit/2026-05-sprint-pos/report.md` (score: 7.4/10)*
*Histórico: `.prd/_archive/`*
