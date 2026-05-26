# ITEC EAD — Plataforma de Formação Teológica

<p align="center">
  <img src="./public/logo_itec_transparent.png" alt="ITEC Logo" width="120" />
</p>

<p align="center">
  <strong>Instituto de Teologia Cristã</strong><br/>
  Formação teológica de excelência · Modalidade Híbrida (Presencial e Online)<br/>
  Unidade Janga · Paulista-PE · Fundado em 2025
</p>

<p align="center">
  <a href="https://www.itecedu.com">itecedu.com</a> ·
  <a href="https://itec-ead.vercel.app">Staging</a> ·
  <a href="https://instagram.com/itec.teologia">@itec.teologia</a>
</p>

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite 6 |
| Estilização | Tailwind CSS + Shadcn UI (Radix) |
| Backend / Auth / DB | Supabase (PostgreSQL + RLS + Storage) |
| Deploy | Vercel (CD automático via GitHub) |
| Roteamento | React Router DOM v6 |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Testes | Vitest + Testing Library |

---

## Configuração local

### Pré-requisitos
- Node.js >= 18 (LTS)
- pnpm >= 9 (`npm install -g pnpm`)
- Conta no [Supabase](https://supabase.com)

### 1. Clone e instale

```bash
git clone https://github.com/heliopaivajr/itec-ead.git
cd itec-ead
pnpm install
```

> ⚠️ **Use sempre `pnpm`**, não `npm` ou `yarn`. O projeto usa `pnpm-lock.yaml` e instalar com outro gerenciador quebra o lockfile do Vercel.

### 2. Variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais do Supabase:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
VITE_SITE_URL=https://www.itecedu.com
```

> As credenciais ficam em **Supabase Dashboard → Settings → API**.  
> O arquivo `.env` está no `.gitignore` — **nunca commitar**.  
> Nunca use prefixo `VITE_` para dados sensíveis — variáveis VITE_ ficam visíveis no bundle.

### 3. Configure o Supabase

Execute os scripts SQL no **SQL Editor do Supabase Dashboard** (nesta ordem):

```
supabase/migrations/20260525_001_rls_leads_cursos.sql
supabase/migrations/20260525_002_rls_matriculas.sql
supabase/migrations/20260525_003_rls_avisos_fix.sql
supabase/migrations/20260525_004_superadmin_role_db.sql    ← role superadmin no banco
supabase/migrations/20260525_005_disciplinas_schema.sql    ← grade curricular + seed
```

> Para desfazer qualquer migration, use o arquivo `_rollback.sql` correspondente.

### 4. Rode o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse: `http://localhost:8080`

---

## Scripts disponíveis

```bash
pnpm dev              # Servidor de desenvolvimento
pnpm build            # Build de produção
pnpm lint             # ESLint
pnpm test             # Testes em modo watch
pnpm test:run         # Testes (one-shot, para CI)
pnpm test:coverage    # Relatório de cobertura em coverage/
pnpm test:ui          # Interface visual dos testes no browser
```

---

## Estrutura do projeto

```
itec-ead/
├── public/
│   ├── logo_itec_transparent.png   # Logo sem fundo
│   ├── og-image.png                # Imagem OG para WhatsApp/redes (1200×630)
│   └── videos/                     # Vídeos servidos pelo site
│       ├── hero-bg.mp4             # Fundo do Hero
│       └── v01.mp4 → v05.mp4       # Carrossel VideoReel
│
├── src/
│   ├── services/                   # Camada de serviços — toda lógica Supabase
│   │   ├── auth.service.ts         # signIn, signOut, reset (erros em PT-BR)
│   │   ├── profile.service.ts      # getRole, getProfile, upsert
│   │   ├── leads.service.ts        # createLead + fallback localStorage
│   │   ├── avisos.service.ts       # CRUD de avisos
│   │   ├── dashboard.service.ts    # KPIs + listas recentes
│   │   └── cursos.service.ts       # disciplinas + syncPrerequisitos (rollback)
│   │
│   ├── pages/
│   │   ├── Index.tsx               # Landing page
│   │   ├── Login.tsx               # Email + Google OAuth
│   │   ├── Cadastro.tsx
│   │   ├── RecuperarSenha.tsx
│   │   ├── ReservarVaga.tsx        # Formulário de interesse + LGPD
│   │   ├── Privacidade.tsx         # Política de privacidade (LGPD)
│   │   ├── AguardandoAprovacao.tsx # Tela para role 'pendente'
│   │   ├── Cursos.tsx
│   │   ├── Professores.tsx
│   │   ├── Sobre.tsx
│   │   ├── Contato.tsx
│   │   ├── Comunidade.tsx
│   │   ├── Blog.tsx
│   │   ├── DevSetup.tsx            # Só em desenvolvimento (/dev-setup)
│   │   ├── Dashboard.tsx           # Layout base + menuByRole
│   │   └── dashboard/
│   │       ├── DashboardHome.tsx   # KPIs por role (Admin/Prof/Aluno)
│   │       ├── CursosAdmin.tsx     # Grade curricular editável
│   │       ├── Avisos.tsx
│   │       ├── Leads.tsx
│   │       ├── Matriculas.tsx
│   │       ├── Usuarios.tsx
│   │       ├── Perfil.tsx
│   │       ├── MeusCursos.tsx
│   │       └── ComingSoon.tsx
│   │
│   ├── components/
│   │   ├── ProtectedRoute.tsx      # RBAC: bloqueia 'pendente', role inválido
│   │   ├── Hero.tsx                # Hero com vídeo + animações CSS
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── VideoReel.tsx           # Carrossel estilo Netflix
│   │   ├── CallToAction.tsx
│   │   └── ui/                     # Shadcn UI components
│   │
│   ├── test/                       # Testes Vitest + Testing Library
│   │   ├── setup.ts                # Mock global do Supabase
│   │   ├── utils.tsx               # customRender com providers
│   │   ├── components/
│   │   │   └── ProtectedRoute.test.tsx  # 8 cenários de RBAC
│   │   └── pages/
│   │       └── ReservarVaga.test.tsx    # 6 cenários (LGPD, erros, sucesso)
│   │
│   ├── hooks/
│   │   ├── use-profile.tsx         # Lê perfil + role do Supabase
│   │   └── use-theme-mode.ts
│   │
│   ├── config/
│   │   └── env.ts                  # Ponto único de leitura de env vars
│   │
│   ├── data/
│   │   ├── courses.ts              # 3 cursos do ITEC
│   │   └── disciplinas.ts          # Grade curricular (40 disciplinas, fallback local)
│   │
│   └── lib/
│       └── supabase.ts             # Client Supabase
│
├── supabase/
│   └── migrations/                 # Scripts SQL versionados + rollbacks
│
├── .ai-system/                     # Sistema documental (Claude.ai — contexto separado)
│   └── adr/                        # Architecture Decision Records
│
├── .env.example                    # Template de variáveis (commitar ✅)
├── vercel.json                     # Cache + CSP + security headers
├── vite.config.ts                  # manualChunks + aliases + Vitest config
└── CLAUDE.md                       # Guia de arquitetura para Claude Code
```

---

## Arquitetura — camada de serviços

Todo acesso ao Supabase passa por `src/services/`. Componentes e páginas **não importam `supabase` diretamente** — apenas os services o fazem.

```
Componente/Página
      ↓
  src/services/          ← única camada que conhece o Supabase
      ↓
  src/lib/supabase.ts    ← client configurado com env vars
      ↓
  Supabase (PostgreSQL + RLS)
```

---

## Roles do sistema

| Role | Quem | Acesso |
|---|---|---|
| `pendente` | Novo cadastro | Redirecionado para `/aguardando` — sem acesso ao dashboard |
| `aluno` | Aluno aprovado | Área do aluno |
| `professor` | Docente | Turmas, materiais, avisos |
| `administracao` | Secretaria | Leads, matrículas, avisos |
| `admin` | Diretoria | Todos os painéis |
| `superadmin` | Dev (Hélio) | Acesso total + segurança + LGPD |

> O role `superadmin` é definido diretamente no banco (tabela `profiles`) — não há email hardcoded no código.

---

## Cursos oferecidos

| Curso | Duração | Horário | Modalidade |
|---|---|---|---|
| Graduação em Teologia (Teologia Livre) | 3 anos / 6 módulos | Seg, Qua, Sex — 18h45 | Híbrida |
| SETEB | 3 anos | Terças — 19h às 20h | Presencial |
| Ministerial para Mulheres | Anual (7 disciplinas) | Quintas — 19h às 22h | Presencial |

Turma 2026 — início em agosto.

---

## O que está em produção

- ✅ Landing page com vídeo de fundo, animações e carrossel de vídeos
- ✅ Formulário de reserva de vaga com consentimento LGPD
- ✅ Página de Política de Privacidade (LGPD completa)
- ✅ Auth: Email + Google OAuth (Supabase)
- ✅ Dashboard multi-role: Admin, Professor, Aluno
- ✅ Leads, Matrículas, Avisos, Usuários, Grade Curricular
- ✅ ProtectedRoute com RBAC — bloqueia role `pendente`
- ✅ Tema Dark / Light / Sépia
- ✅ CSP configurada (sem domínios de protótipo)
- ✅ Camada de serviços completa (6 services)
- ✅ Testes: Vitest + 15 testes (ProtectedRoute + ReservarVaga)
- ✅ Deploy automático Vercel + domínio itecedu.com

## Próximos passos

- [ ] `usuarios.service` — isolar páginas admin restantes
- [ ] Testes para Login, Dashboard, CursosAdmin
- [ ] E-mail automático ao reservar vaga (Resend)
- [ ] MeusCursos com progresso real
- [ ] Frequência e Notas
- [ ] Certificados digitais com QR Code
- [ ] FAQ na landing page

---

## Contatos

| | |
|---|---|
| Site | https://www.itecedu.com |
| Secretaria | secretaria@itecedu.com |
| Financeiro | financeiro@itecedu.com |
| Coordenação | educacao@itecedu.com |
| WhatsApp | (81) 99116-1448 |
| Instagram | [@itec.teologia](https://instagram.com/itec.teologia) |

---

> Desenvolvido para o **Instituto de Teologia Cristã — ITEC**  
> Unidade Janga · Paulista-PE · itecedu.com
