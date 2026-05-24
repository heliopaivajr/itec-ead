# PRD — Plataforma ITEC EAD

**Última atualização:** 2026-05-23
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Shadcn UI + Supabase
**Projeto:** `e:/_HELIOJR/ITEC/itec-ead/`
**Deploy:** GitHub → Vercel (Frontend) + Supabase (Backend/Auth/Database)
**Site oficial:** https://www.itecedu.com
**Deploy staging:** https://itec-ead.vercel.app
**Instagram:** @itec.teologia
**Contatos:** secretaria@itecedu.com · financeiro@itecedu.com · educacao@itecedu.com · (81) 99116-1448

---

## 1. Sobre o ITEC e Os Cursos

Instituto de Teologia Cristã — Unidade Janga, Paulista-PE. Fundado em 2025 com muita oração.
Missão: formar servos de Deus com excelência acadêmica, profundidade espiritual e comprometimento com a missão da Igreja.

### 1.1 Graduação em Teologia (Teologia Livre)
- **Requisito:** Graduação prévia obrigatória
- **Duração:** 3 anos / 6 módulos / 185 créditos
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
| `profiles` | ✅ | Perfis com role (aluno, professor, admin, superadmin) |
| `leads_cursos` | ✅ | Leads capturados no site + formulário de reserva de vaga |
| `matriculas` | ✅ | Vínculo Aluno ↔ Curso/Módulo |
| `avisos` | ✅ | Mural de avisos e comunicados |
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
| `pendente` | Novo cadastro | Só área de espera |
| `aluno` | Aluno aprovado | Área do aluno |
| `professor` | Docente | Lançar notas, frequência, materiais |
| `administracao` | Secretaria | Operacional — matrículas, leads, avisos |
| `admin` | Diretoria | Todos os painéis |
| `superadmin` | Hélio (dev) | Acesso total, LGPD, auditoria |

---

## 5. CHECKLIST COMPLETO — LANDING PAGE E SITE PÚBLICO

### ✅ Concluído

#### Estrutura e Deploy
- [x] Projeto React + Vite + TypeScript + Tailwind + Shadcn UI criado
- [x] Deploy automático GitHub → Vercel configurado
- [x] Domínio `itecedu.com` apontando para Vercel
- [x] `.env` com variáveis do Supabase (URL + anon key)
- [x] `.env` removido do git tracking (`.gitignore` atualizado)
- [x] `.env.example` criado como template
- [x] Variáveis configuradas no painel Vercel (Production + Preview + Development)
- [x] `vercel.json` com cache headers + 8 security headers (CSP, HSTS, X-Frame, etc.)
- [x] Code splitting com `React.lazy()` em todas as páginas exceto Index
- [x] Vite `manualChunks` (react-vendor, query-vendor, ui-vendor)
- [x] OG image customizada ITEC (1200×630) para WhatsApp/redes sociais

#### Navbar
- [x] Logo ITEC transparente (fundo branco removido via sharp)
- [x] Logo na Navbar: círculo vermelho com ícone branco
- [x] Logo clicável → volta para `/`
- [x] Menu: Cursos, Professores, Sobre (dropdown), Comunidade, Blog
- [x] Dropdown "Sobre" com: Nossa Missão, Corpo Docente, Contato
- [x] ThemeSwitcher (Dark / Light / Sépia) com aria-label
- [x] Botão mobile menu com aria-label + aria-expanded
- [x] Menu mobile responsivo
- [x] Botão Entrar → `/login`

#### Hero
- [x] Vídeo de fundo `hero-bg.mp4` com `object-fit: cover` em loop
- [x] Overlay escuro para contraste dos textos
- [x] Animações cinematográficas escalonadas (logo → título → subtítulo → botão → tagline → card)
- [x] Botão de áudio (mudo por padrão, usuário ativa)
- [x] Card "Graduação em Teologia" com dados corretos (Híbrida, Presencial e Online)
- [x] Card "Matrículas Abertas" inclinado canto inferior direito → `/reservar-vaga`
- [x] Card com ano 2026 e "Início Agosto 2026"
- [x] Tagline: *"Onde a Palavra de Deus encontra a sua vocação."*
- [x] Botão "Conheça Nossos Cursos" → `/cursos`
- [x] Hero responsivo (desktop + tablet + mobile)
- [x] Logo branca com drop-shadow sobre o vídeo
- [x] Backup do Hero anterior salvo em `Hero.backup.tsx`

#### Seções da Landing Page
- [x] **Features** — 6 diferenciais do ITEC com ícones e cards
- [x] **CoursePreview** — 3 cursos com horários, modalidade e preço
  - SETEB: Terças-feiras 19h-20h ✅
  - Modalidade Híbrida ✅
- [x] **VideoReel** — Carrossel estilo Netflix com 5 vídeos verticais
  - Autoplay ao entrar na tela (IntersectionObserver)
  - Cada vídeo toca completo antes de avançar (onEnded)
  - Controle de som por card
  - Barra de progresso
  - Botão replay ao terminar
  - Setas de navegação + dots indicadores
- [x] **Testimonials** — Depoimentos de alunos
- [x] **CallToAction** — Seção "Ainda com dúvidas?" com contatos corretos
- [x] **Footer** — Links, contatos, Instagram destaque @itec.teologia

#### Páginas Públicas Criadas
- [x] `/` — Landing Page principal
- [x] `/cursos` — Listagem dos 3 cursos com cards detalhados
- [x] `/professores` — Corpo docente (placeholder)
- [x] `/sobre` — Nossa Missão, Visão, Valores, Linha do Tempo (2025), Stats
- [x] `/docentes` — 6 professores com titulação, bio e disciplinas
- [x] `/contato` — Formulário de contato + WhatsApp + Instagram destaque
- [x] `/comunidade` — Espaços da comunidade (em breve)
- [x] `/blog` — 6 artigos teológicos com categorias e autores
- [x] `/reservar-vaga` — Formulário de reserva com LGPD + envio ao Supabase

#### SEO e Metadados
- [x] `<html lang="pt-BR">`
- [x] Meta description sem "100% online" (modalidade híbrida)
- [x] OG title, description, image, url, site_name, locale
- [x] Twitter card completo
- [x] OG image apontando para `itecedu.com` (não mais lovable.dev)
- [x] `robots.txt`

#### Dados e Contatos (corretos em todo o site)
- [x] secretaria@itecedu.com ✅
- [x] financeiro@itecedu.com ✅
- [x] educacao@itecedu.com ✅
- [x] (81) 99116-1448 WhatsApp ✅
- [x] itecedu.com ✅
- [x] Fundado em 2025 ✅
- [x] SETEB: Terças-feiras (não quintas) ✅
- [x] Modalidade: Híbrida (Presencial e Online) ✅

#### Performance (PageSpeed)
- [x] Google Fonts não-bloqueante (media=print + onload)
- [x] Script gptengineer.js com `defer`
- [x] `width`/`height` explícitos nas imagens (CLS)
- [x] Heading hierarchy corrigida (h1→h2 no Hero card)
- [x] Aria-label no botão mobile menu

---

### 🔄 Em Andamento

- [ ] **Vídeos da seção VideoReel** — testar se avançam corretamente após correção da arquitetura (onEnded com controle direto via refs)
- [ ] **Páginas com conteúdo real** — `/sobre`, `/docentes`, `/blog`, `/comunidade` têm conteúdo de placeholder; precisam ser revisados com dados reais do manual ITEC

---

### 🔲 Pendente — Landing Page

- [ ] FAQ na landing page (perguntas frequentes dos candidatos)
- [ ] Seção de depoimentos com fotos reais dos alunos
- [ ] Página `/matricula` — formulário completo pós-interesse
- [ ] Integração do formulário `/reservar-vaga` com envio de e-mail real (Resend/SendGrid)
- [ ] Atualizar OG image com design mais profissional (1200×630)
- [ ] Favicon PNG moderno (além do .ico atual)
- [ ] PWA (Progressive Web App) — manifest + service worker
- [ ] Mapa/localização na página de contato
- [ ] Página de política de privacidade (`/privacidade`)
- [ ] Página de termos de uso (`/termos`)
- [ ] Rota `/validar/:codigo` para validação pública de certificados

---

## 6. CHECKLIST — ÁREA INTERNA (DASHBOARD)

### ✅ Concluído

- [x] Layout base do Dashboard (Sidebar por role, SidebarProvider, SidebarInset)
- [x] Sidebar com menu diferente por role (aluno, professor, administracao, admin, superadmin)
- [x] Botão "Página Inicial" na sidebar (Home → `/`)
- [x] Botão "Página Inicial" no header do dashboard
- [x] ThemeSwitcher no header
- [x] ProtectedRoute com Supabase Auth
- [x] `DashboardHome` com KPIs por role
- [x] `Perfil` — edição de dados do usuário
- [x] `Leads` — tabela de leads capturados com filtro e export CSV
- [x] `Usuarios` — gestão de usuários
- [x] `Matriculas` — aprovação/recusa de matrículas
- [x] `CursosAdmin` — gestão de cursos (básico)
- [x] `Avisos` — mural de avisos com modal de criação
- [x] `ComingSoon` — página placeholder para módulos futuros

### 🔲 Pendente — Área Interna

#### Sprint 3 (próximos passos imediatos)
- [ ] `MeusCursos` — melhorar com progresso real (barras, módulos, aulas do Supabase)
- [ ] SQL: criar tabelas `cursos`, `modulos`, `aulas`, `progresso_aluno` no Supabase
- [ ] CRUD de Usuários completo com gestão de roles

#### Sprint 4 — Módulos Acadêmicos
- [ ] `Frequencia.tsx` — view aluno (histórico) + lançamento professor
- [ ] `Notas.tsx` — tabela de notas aluno + formulário professor
- [ ] `CursosAdmin` — CRUD completo com módulos reordenáveis drag-and-drop
- [ ] `Materiais.tsx` — upload para Supabase Storage
- [ ] `NotificacoesDropdown` — badge no header + dropdown de não lidas
- [ ] SQL: `frequencia`, `avaliacoes`, `notas`, `materiais`

#### Sprint 5 — Calendário, Financeiro e Certificados
- [ ] `Calendario.tsx` — react-big-calendar com eventos acadêmicos
- [ ] `Certificados.tsx` — geração em PDF + código de validação + QR Code
- [ ] `Financeiro.tsx` — mensalidades, receitas, despesas com Recharts
- [ ] `Pagamentos.tsx` — view aluno das mensalidades
- [ ] SQL: `certificados`, `eventos_academicos`, `mensalidades`

#### Sprint 6 — Pós-lançamento
- [ ] Chat/Comunidade em tempo real (Supabase Realtime)
- [ ] PWA + notificações push
- [ ] Relatórios exportáveis (PDF/Excel)
- [ ] Integração gateway de pagamento (Asaas/Stripe) PIX/Cartão/Boleto
- [ ] Conformidade LGPD completa (anonimização, portabilidade)
- [ ] Auditoria `audit_log`
- [ ] App mobile (React Native / Expo) — futuro

---

## 7. ARQUITETURA DE ARQUIVOS (estado atual)

```
src/
├── pages/
│   ├── Index.tsx                ✅ LP principal
│   ├── Login.tsx                ✅ com Google OAuth + demo buttons
│   ├── Cadastro.tsx             ✅
│   ├── RecuperarSenha.tsx       ✅
│   ├── Cursos.tsx               ✅
│   ├── Professores.tsx          ✅
│   ├── Sobre.tsx                ✅ (conteúdo placeholder)
│   ├── Docentes.tsx             ✅ (conteúdo placeholder)
│   ├── Contato.tsx              ✅
│   ├── Comunidade.tsx           ✅ (conteúdo placeholder)
│   ├── Blog.tsx                 ✅ (conteúdo placeholder)
│   ├── ReservarVaga.tsx         ✅ formulário + LGPD + Supabase
│   ├── NotFound.tsx             ✅
│   ├── DevSetup.tsx             ✅ (apenas dev)
│   ├── Dashboard.tsx            ✅ layout base + menu por role
│   └── dashboard/
│       ├── DashboardHome.tsx    ✅ KPIs por role
│       ├── Perfil.tsx           ✅
│       ├── Leads.tsx            ✅
│       ├── Usuarios.tsx         ✅
│       ├── MeusCursos.tsx       🟡 básico, sem dados reais
│       ├── Matriculas.tsx       ✅
│       ├── CursosAdmin.tsx      🟡 básico
│       ├── Avisos.tsx           ✅
│       └── ComingSoon.tsx       ✅
│
├── components/
│   ├── Hero.tsx                 ✅ vídeo bg + animações
│   ├── Hero.backup.tsx          ✅ backup do hero anterior
│   ├── Navbar.tsx               ✅ logo transparente + menu
│   ├── Footer.tsx               ✅ contatos corretos + Instagram
│   ├── Features.tsx             ✅
│   ├── CoursePreview.tsx        ✅
│   ├── VideoReel.tsx            ✅ Netflix-style 5 vídeos
│   ├── Testimonials.tsx         ✅
│   ├── CallToAction.tsx         ✅
│   ├── ThemeSwitcher.tsx        ✅
│   ├── LeadCaptureModal.tsx     ✅
│   └── ui/                      ✅ Shadcn UI components
│
├── lib/
│   └── supabase.ts              ✅ usa VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
│
├── data/
│   └── courses.ts               ✅ dados dos 3 cursos (horários corretos)
│
└── hooks/
    ├── use-profile.ts           ✅
    └── use-theme-mode.ts        ✅

public/
├── logo_itec_transparent.png   ✅ logo sem fundo branco
├── logo_itec.png               ✅
├── og-image.png                ✅ 1200×630 para WhatsApp
├── og-image.svg                ✅
├── videos/
│   ├── hero-bg.mp4             ✅ vídeo de fundo do hero
│   ├── v01.mp4                 ✅ Matrículas Abertas
│   ├── v02.mp4                 ✅ Testemunho
│   ├── v03.mp4                 ✅ Curso para Mulheres
│   ├── v04.mp4                 ✅ Sala de Aula
│   └── v05.mp4                 ✅ Chamada para Matrícula
└── uploads/
    └── 00c3510e-...png         ✅ logo original (com fundo)
```

---

## 8. DECISÕES TÉCNICAS REGISTRADAS

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework | React + Vite | Ecossistema rico, Shadcn UI, flexibilidade |
| UI | Shadcn UI + Tailwind | Headless, TypeScript-first, acessível |
| Backend | Supabase | Auth + PostgreSQL + Storage integrado |
| Deploy | Vercel | CD automático, domínio custom grátis |
| Gráficos | Recharts | Já instalado, API declarativa JSX |
| Fontes | Merriweather + Open Sans | Identidade teológica (serifa) + leitura |
| Logo | Transparente via sharp | Fundo branco removido pixel a pixel |
| Vídeos | Supabase Storage ou public/ | Arquivos pequenos → public/ direto |
| Env | .env com pnpm | Sharp instalado via npm causou lockfile bug — usar sempre pnpm |

---

## 9. BUGS CONHECIDOS / LIÇÕES APRENDIDAS

| Issue | Causa | Solução aplicada |
|---|---|---|
| Vercel build falhou (`ERR_PNPM_OUTDATED_LOCKFILE`) | sharp instalado via `npm` em projeto que usa `pnpm` | Remover sharp do package.json + `pnpm install` |
| Vídeos paravam no meio | `useEffect` em cada VideoCard com deps `sectionVisible` resetava `currentTime=0` ao scroll | Reescrever com controle direto via refs no componente pai |
| Logo aparecia quebrada no Hero | Path `/lovable-uploads/...` incorreto (pasta é `/uploads/`) | Corrigir para `/logo_itec_transparent.png` |
| OG image mostrava logo do Lovable no WhatsApp | `og:image` apontava para `lovable.dev` | Gerar og-image.png ITEC + apontar para `itecedu.com` |
| `.env` estava no repositório | Nunca foi adicionado ao `.gitignore` | `git rm --cached .env` + adicionar ao `.gitignore` |

---

## 10. PRÓXIMOS PASSOS (em ordem de prioridade)

1. **Testar vídeos** — verificar se o VideoReel com nova arquitetura (refs diretos) está funcionando corretamente em produção
2. **FAQ na LP** — adicionar seção de perguntas frequentes antes do Footer
3. **Conteúdo real** — revisar `/sobre`, `/docentes`, `/blog` com dados reais do manual ITEC 2025
4. **Formulário de e-mail** — conectar `/reservar-vaga` com envio real de e-mail para secretaria@itecedu.com (Resend ou EmailJS)
5. **SQL Sprint 3** — criar tabelas `cursos`, `modulos`, `aulas`, `progresso_aluno` no Supabase
6. **MeusCursos** — conectar com dados reais do Supabase
7. **CRUD Usuários** — completar gestão de roles no Dashboard
8. **Certificados** — layout + geração PDF + validação pública

---

*Referência: `PRD-AREA-INTERNA.md` para especificação detalhada dos módulos internos.*
*Histórico original: `.prd/_archive/PRD_IDEIA_historico.md`*
