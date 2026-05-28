# Relatório de Auditoria de Entrada — ITEC EAD
**Auditor:** Agente 14 — Chief Technical Inspector
**Data:** 2026-05-25
**Stack:** React 18 + TypeScript + Vite 6.4.2 + Tailwind + Shadcn UI + Supabase
**Deploy:** Vercel → itecedu.com / itec-ead.vercel.app
**Protocolo:** 9 etapas completas | Nenhum arquivo modificado

---

## ETAPA 1 — Inventário Estrutural

### Distribuição dos 106 arquivos

| Categoria | Qtd | Status geral |
|---|---|---|
| `src/components/ui/` (Shadcn) | 49 | ✅ gerados — muitos não usados |
| `src/pages/dashboard/` | 9 | 🟡 básico / 🔲 placeholder |
| `src/pages/` (públicas) | 14 | ✅/🟡 |
| `src/components/` (LP) | 15 | ✅ |
| `src/hooks/` | 4 | ✅ |
| `src/lib/` | 4 | ✅ |
| `src/data/` | 2 | ✅ hardcoded |
| `src/config/` | 1 | ✅ |

### Status por arquivo relevante

| Arquivo | Status | Observação |
|---|---|---|
| `Hero.tsx` | ✅ | Vídeo bg, animações, card matrícula |
| `Hero.backup.tsx` | 🟡 | Arquivo backup — pode ser deletado |
| `VideoReel.tsx` | ✅ | 5 vídeos, controle via refs |
| `Navbar.tsx` | ✅ | Desktop + mobile espelhados pós-auditoria |
| `Footer.tsx` | ✅ | Contatos corretos, YouTube removido |
| `CallToAction.tsx` | ✅ | CTA → /reservar-vaga |
| `Dashboard.tsx` | 🟡 | 226 linhas, monolítico |
| `DashboardHome.tsx` | 🟡 | KPIs hardcoded, queries sem TanStack |
| `Usuarios.tsx` | 🟡 | select('*') sem paginação |
| `Leads.tsx` | 🟡 | select('*') sem paginação |
| `CursosAdmin.tsx` | 🟡 | Acessa `disciplinas` e `prerequisitos_disciplinas` — tabelas não documentadas no PRD |
| `MeusCursos.tsx` | 🔲 | Dados mocados, sem conexão real |
| `Blog.tsx` | 🔲 | 6 artigos hardcoded fictícios |
| `Comunidade.tsx` | 🔲 | 6 cards "em breve" |
| `Professores.tsx` | 🟡 | 6 docentes hardcoded (fictícios) |
| `Privacidade.tsx` | ✅ | 9 seções LGPD reais |
| `ReservarVaga.tsx` | ✅ | Formulário + LGPD + Supabase |
| `env.ts` | ✅ | Ponto central de env vars |

---

## ETAPA 2 — Análise Arquitetural

### Diagrama atual

```
Browser
  └── React Router (App.tsx)
        ├── Public Pages → Supabase direto nas páginas
        └── Dashboard (/dashboard)
              └── ProtectedRoute (verifica session, não verifica role)
                    └── Dashboard.tsx (layout + menuByRole)
                          └── Outlet → páginas com queries Supabase inline
```

### Violações identificadas

**🟠 V1 — Sem camada de serviço**
Todas as queries Supabase estão inline em `useEffect` + `useState` dentro das páginas. Qualquer mudança de schema exige tocar N páginas. Exemplo: `Usuarios.tsx`, `Leads.tsx`, `Matriculas.tsx`, `DashboardHome.tsx`, `CursosAdmin.tsx`.

**🟠 V2 — TanStack Query instalado e ignorado**
`QueryClient` criado em `App.tsx`, mas nenhuma página usa `useQuery`/`useMutation`. Toda a busca de dados é feita com `useEffect` manual — sem cache, sem refetch automático, sem deduplicação de requests.

**🟡 V3 — `ProtectedRoute` verifica sessão mas não role**
```tsx
if (!session) return <Navigate to="/login" replace />;
return children; // ← qualquer sessão válida entra no dashboard
```
Um usuário com role `pendente` que tenha uma sessão válida acessa o dashboard. A verificação de role acontece apenas visualmente (menuByRole), não na rota.

**🟡 V4 — `Dashboard.tsx` com 226 linhas faz trabalho demais**
Tipos exportados + helpers de role + objeto `menuByRole` (5 roles × 10 items) + layout sidebar + header. Difícil de testar e manter.

**🟡 V5 — `CursosAdmin.tsx` acessa tabelas não documentadas**
Queries para `disciplinas` e `prerequisitos_disciplinas` — tabelas que não estão no PRD nem têm migrations conhecidas. Inconsistência entre código e documentação.

**🟢 V6 — `Hero.backup.tsx` commitado no repositório**
Arquivo de backup de versão anterior. Não é importado em lugar algum.

---

## ETAPA 3 — Segurança

### a) RLS nas tabelas

| Tabela | RLS | Migrations aplicadas | Status |
|---|---|---|---|
| `profiles` | ✅ | `.prd/02_profiles_rls.sql` | ✅ Completo + proteção de escalonamento |
| `leads_cursos` | ✅ | `20260525_001` | ✅ INSERT anon, SELECT/UPDATE/DELETE staff |
| `matriculas` | ✅ | `20260525_002` | ✅ Aluno vê as suas, staff gerencia |
| `avisos` | ✅ | `20260525_003` | ✅ Role corrigido + UPDATE adicionado |
| `disciplinas` | ⚠️ | Não documentada | RLS desconhecido |
| `prerequisitos_disciplinas` | ⚠️ | Não documentada | RLS desconhecido |

### b) Fluxo de roles pós-Google OAuth

```
Google OAuth → Supabase Auth → trigger handle_new_user()
  → INSERT profiles (role = 'pendente')
  → useProfile() lê o role do banco
  → EXCETO: se email === VITE_SUPERADMIN_EMAIL → role = 'superadmin' (hardcoded em use-profile.tsx)
```

**Problema:** `ProtectedRoute` não bloqueia `pendente`. Um aluno com role `pendente` entra no dashboard e vê o menu de aluno (via `menuByRole`), mas não tem dados para exibir. Não é exploração de segurança grave, mas é UX ruim e não cumpre a spec do PRD (role `pendente` deveria ver apenas "sala de espera").

### c) Security headers no vercel.json

| Header | Valor | Status |
|---|---|---|
| X-Content-Type-Options | nosniff | ✅ |
| X-Frame-Options | DENY | ✅ |
| Strict-Transport-Security | max-age=63072000 | ✅ |
| CSP | configurado | ⚠️ `img-src` aponta para `lovable.dev` — domínio desatualizado |
| Referrer-Policy | strict-origin-when-cross-origin | ✅ |
| Permissions-Policy | camera, mic, geo bloqueados | ✅ |
| COOP | same-origin-allow-popups | ✅ |

### d) Variáveis de ambiente

| Variável | Prefixo | Status |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ VITE_ | Correto (exposta ao browser intencionalmente) |
| `VITE_SUPABASE_ANON_KEY` | ✅ VITE_ | Correto (anon key é pública por design) |
| `VITE_SUPERADMIN_EMAIL` | ✅ VITE_ | ⚠️ Exposta ao browser — qualquer usuário pode inspecionar e ver o e-mail do superadmin via DevTools |
| `VITE_SITE_URL` | ✅ VITE_ | OK |

**Atenção:** `VITE_SUPERADMIN_EMAIL` sendo `VITE_` significa que vai no bundle e é legível no browser. Não é um vazamento de credencial (o e-mail é público), mas é uma informação desnecessariamente exposta. A verificação deveria ser feita server-side (Supabase RLS ou Edge Function), não no cliente.

### e) ProtectedRoute verifica role?

**Não.** Verifica apenas `session !== null`. Qualquer usuário autenticado — incluindo `pendente` — entra em `/dashboard`.

---

## ETAPA 4 — Performance

### a) Bundle chunks (manualChunks)

| Chunk | Conteúdo | Tamanho estimado (gzip) |
|---|---|---|
| `react-vendor` | react, react-dom, react-router-dom | ~8 KB |
| `query-vendor` | @tanstack/react-query | ~9 KB |
| `ui-vendor` | 9 componentes Radix | ~80 KB |
| `index` (main) | app code + supabase | ~92 KB |
| `DashboardHome` | maior chunk de página | ~106 KB |

**Observação:** `DashboardHome` chunk grande (106KB gzip) — consolida lógica de KPIs admin + professor + aluno. Candidato a divisão por role.

### b) Vídeos em `public/videos/`

17MB de vídeos MP4 commitados no repositório e servidos pelo **Vercel CDN** (não por um servidor de vídeo especializado). Para o volume atual (instituição pequena) é aceitável. Sem streaming adaptativo. O `hero-bg.mp4` (1.7MB) carrega na LCP — sem impacto significativo pela pequena duração.

### c) Imagens com dimensões explícitas

| Imagem | width/height | Status |
|---|---|---|
| Logo Navbar | `width={32} height={32}` | ✅ |
| Logo Hero | `width={140} height={80}` | ✅ |
| Logo PageFallback | sem dimensões | ⚠️ pequeno CLS |
| og-image.png | servida, não renderizada no HTML | ✅ |

---

## ETAPA 5 — Testes

**Cobertura: 0%** — Nenhum framework de teste configurado. Zero arquivos `.test.tsx` ou `.spec.tsx`.

### Prioridade para primeiros testes

| # | Arquivo | O que testar | Impacto |
|---|---|---|---|
| 1 | `src/hooks/use-profile.tsx` | Override superadmin por e-mail, fallback sem profile | Crítico |
| 2 | `src/pages/Dashboard.tsx` | `isSuperAdmin`, `isAdministracao`, `isProfessor` | Alto |
| 3 | `src/lib/saveLead.ts` | Fallback para localStorage quando Supabase falha | Alto |
| 4 | `src/pages/ReservarVaga.tsx` | Validação LGPD, campos required, submit flow | Médio |
| 5 | `src/config/env.ts` | Variáveis carregadas corretamente | Médio |

---

## ETAPA 6 — Débito Técnico

### a) Componentes placeholder / "em breve" visíveis ao usuário

| Arquivo | Conteúdo | Impacto |
|---|---|---|
| `Comunidade.tsx` | 6 cards com badge "Em breve" | Visível ao público |
| `Blog.tsx` | 6 artigos fictícios (nomes de professores inventados) | Credibilidade |
| `Professores.tsx` | 6 docentes com dados fictícios | Credibilidade |
| `MeusCursos.tsx` | Dados mocados no dashboard | Funcionalidade |
| `ComingSoon.tsx` | 8 rotas do dashboard | Esperado — placeholder legítimo |

### b) Dados hardcoded que deveriam vir do banco

| Dado | Arquivo | Sprint para migrar |
|---|---|---|
| 3 cursos (nome, horário, preço) | `src/data/courses.ts` | Sprint 3 |
| Disciplinas do curso | `src/data/disciplinas.ts` | Sprint 3 |
| 6 docentes | `Professores.tsx` | Sprint 3 |
| 6 artigos do blog | `Blog.tsx` | Sprint 4 |
| 3 depoimentos | `Testimonials.tsx` | Quando disponível |

### c) Magic strings (roles)

Roles como `'aluno'`, `'admin'`, `'superadmin'` aparecem em 8+ arquivos como strings literais. O type `UserRole` existe em `use-profile.tsx` mas não é usado como enum/const em todos os pontos de comparação. `DashboardHome.tsx:280` compara diretamente com string literal em vez de usar os helpers de `Dashboard.tsx`.

### d) Console.log no código

- `src/pages/NotFound.tsx:10` — `console.error(...)` — aceitável (página de erro)
- `src/lib/saveLead.ts` — `console.warn` condicional — aceitável (warning explícito)
- Zero `console.log` desnecessários ✅

---

## ETAPA 7 — Documentação

| Item | Status | Observação |
|---|---|---|
| `README.md` | ✅ Atualizado | Setup, stack, estrutura, pnpm warning |
| `CLAUDE.md` | ✅ Criado | Arquitetura, comandos, armadilhas |
| `.env.example` | ✅ Completo | 4 variáveis documentadas |
| `.prd/prd.md` | ✅ Atualizado | Checklist completo, bugs conhecidos |
| Schema do banco | 🟡 Parcial | Tabelas listadas no PRD, sem colunas/tipos |
| ADRs | 🔴 Ausentes | Nenhuma decisão arquitetural formal |
| API / contratos Supabase | 🔴 Ausente | `disciplinas` e `prerequisitos_disciplinas` sem documentação |
| Migrations ordenadas | ✅ | `supabase/migrations/` com 6 arquivos + rollbacks |

---

## ETAPA 8 — Scorecard

| Dimensão | Score | Status | Justificativa |
|---|---|---|---|
| Arquitetura | 5/10 | 🟠 | SPA funcional; sem camada de serviço; TanStack ignorado; ProtectedRoute incompleto |
| Segurança | 7/10 | 🟡 | RLS nas 4 tabelas principais; CSP desatualizado; VITE_SUPERADMIN_EMAIL exposto no bundle; `pendente` entra no dashboard |
| Qualidade de Código | 6/10 | 🟡 | Zero console.log; magic strings; erros Supabase descartados silenciosamente; componentes grandes |
| Performance | 7/10 | 🟡 | Code splitting ✅; chunks corretos; vídeos no CDN Vercel; DashboardHome chunk pesado |
| Testes | 0/10 | 🔴 | Zero cobertura — nenhum framework configurado |
| Documentação | 8/10 | 🟢 | README, CLAUDE.md e PRD excelentes; falta schema detalhado e ADRs |
| **MÉDIA GERAL** | **5.5/10** | 🟠 RISCO | Plataforma funcional mas com débitos de segurança, arquitetura e testes |

---

## ETAPA 9 — Plano de Remediação Priorizado

### 🔴 CRÍTICO — resolver antes de qualquer novo desenvolvimento

| # | Ação | Arquivo | Esforço |
|---|---|---|---|
| R1 | `ProtectedRoute` deve bloquear role `pendente` — redirecionar para `/aguardando-aprovacao` | App.tsx | 1h |
| R2 | Corrigir `img-src` no CSP do `vercel.json` — remover `lovable.dev`, adicionar `itecedu.com` | vercel.json | 10 min |
| R3 | Documentar tabelas `disciplinas` e `prerequisitos_disciplinas` — criar migration ou remover as queries | CursosAdmin.tsx | 2h |
| R4 | `VITE_SUPERADMIN_EMAIL` não deveria estar no bundle — mover verificação para Supabase RLS ou Edge Function | use-profile.tsx | 2-4h |

### 🟠 ALTO — resolver no próximo sprint

| # | Ação | Arquivo | Esforço |
|---|---|---|---|
| A1 | Configurar Vitest + Testing Library — cobrir `use-profile`, `saveLead`, helpers de role | Setup | 1 dia |
| A2 | Adicionar paginação em `Usuarios.tsx` e `Leads.tsx` (select sem limit) | 2 arquivos | 2-3h |
| A3 | Migrar pelo menos 1 página para TanStack Query como padrão para as próximas | DashboardHome | 2-4h |
| A4 | Tratar erros retornados pelas queries Supabase (silenciosamente descartados) | múltiplos | 2h |
| A5 | Criar página `/aguardando-aprovacao` para role `pendente` | Nova página | 1h |
| A6 | Deletar `Hero.backup.tsx` | git rm | 5 min |

### 🟡 MÉDIO — roadmap trimestral (Sprint 3+)

| # | Ação | Benefício |
|---|---|---|
| M1 | Migrar cursos/docentes de hardcoded para Supabase (`cursos`, `modulos` tables) | Dados reais gerenciáveis |
| M2 | `DashboardHome` dividido por role em arquivos separados | Manutenibilidade |
| M3 | Habilitar `"strict": true` no tsconfig | Qualidade de tipos |
| M4 | Remover 20+ componentes Shadcn não utilizados | Bundle menor |
| M5 | Substituir `import React from 'react'` desnecessário (8 arquivos) | Limpeza |
| M6 | ADRs para decisões tomadas (pnpm, Supabase, não-SSR) | Rastreabilidade |
| M7 | Meta tags por subpágina com react-helmet ou similar | SEO de subpáginas |
| M8 | `VITE_SUPERADMIN_EMAIL` → verificação server-side | Segurança |

---

## Contexto de evolução vs auditoria anterior (2026-05-25)

| Item | Antes | Agora | Delta |
|---|---|---|---|
| RLS tabelas | ⚠️ incompleto | ✅ 4 tabelas | +++ |
| E-mail superadmin hardcoded | 🔴 no código | 🟡 em env var (ainda no bundle) | + |
| CVE Vite | 🔴 5.4.21 | ✅ 6.4.2 | +++ |
| LP score | 6.5/10 | 8.5/10 | ++ |
| Rotas 404 | C1+C2 quebrados | ✅ corrigidos | ++ |
| Testes | 0% | 0% | = |
| Arquitetura | 5/10 | 5/10 | = |

---

*Agente 14 — Auditoria de entrada completa (9 etapas)*
*Nenhum arquivo modificado*
*Próxima ação recomendada: R1 (ProtectedRoute) + R2 (CSP) — rápidos e críticos*
