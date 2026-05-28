# Relatório de Auditoria de Entrada
**Projeto:** ITEC EAD — Plataforma de Formação Teológica
**Auditor:** Agente 14 — Chief Technical Inspector
**Data:** 2026-05-25
**Tipo:** Auditoria de entrada (diagnóstico completo)
**Versão do protocolo:** 1.0

> Nenhum arquivo foi modificado. Este é um relatório de diagnóstico puro.
> Aguardar aprovação humana antes de qualquer ação de remediação.

---

## ETAPA 1 — Inventário Estrutural

### Tecnologias e Versões

| Camada | Tecnologia | Versão | Observação |
|---|---|---|---|
| Runtime | Node.js | ≥18 LTS | OK |
| Frontend | React | ^18.3.1 | OK — versão atual |
| Language | TypeScript | ^5.5.3 | OK |
| Bundler | Vite | ^5.4.1 | ⚠️ CVE presente (ver Etapa 3) |
| Estilização | Tailwind CSS | ^3.4.11 | OK |
| UI Components | Shadcn UI / Radix | variadas ^1.x | OK |
| Backend / Auth | Supabase JS | ^2.104.0 | OK — versão recente |
| Roteamento | React Router DOM | ^6.26.2 | OK |
| Estado servidor | TanStack Query | ^5.56.2 | Instalado mas **pouco usado** |
| Formulários | React Hook Form + Zod | ^7.53 + ^3.23 | OK |
| Gráficos | Recharts | ^2.12.7 | OK |
| Package Manager | pnpm | ^9.x | OK — lockfile correto |
| Deploy | Vercel | — | OK — CD automático |

### Tamanho da Codebase

| Métrica | Valor |
|---|---|
| Arquivos `src/` rastreados | 105 |
| Total de linhas (src/) | ~12.116 |
| Componentes de UI (Shadcn) | 49 |
| Páginas | 17 (públicas) + 9 (dashboard) |
| Hooks customizados | 4 |
| Arquivos de teste | **0** |

### Padrão Arquitetural Identificado

React SPA com roteamento client-side. Padrão emergente (não formalmente definido):
- `src/pages/` — views com lógica de estado e chamadas Supabase inline
- `src/components/` — UI reutilizável e componentes de seção
- `src/lib/` — utilitários e cliente Supabase
- `src/data/` — dados estáticos dos cursos
- `src/hooks/` — 4 hooks, apenas `use-profile` e `use-theme-mode` têm lógica real

---

## ETAPA 2 — Análise Arquitetural

### Diagrama da Arquitetura Atual

```
┌─────────────────────────────────────────────────────┐
│  Browser                                            │
│  ┌────────────────────────────────────────────┐     │
│  │  React Router (App.tsx)                    │     │
│  │  ┌──────────────┐  ┌───────────────────┐  │     │
│  │  │ Public Pages │  │ Dashboard (/dash)  │  │     │
│  │  │ (marketing)  │  │ ProtectedRoute     │  │     │
│  │  └──────┬───────┘  └────────┬──────────┘  │     │
│  │         │                  │              │     │
│  │         └────────┬─────────┘              │     │
│  │                  ▼                        │     │
│  │          [Supabase JS client]             │     │
│  └──────────────────┼────────────────────────┘     │
└─────────────────────┼───────────────────────────────┘
                      │ HTTP / WS
             ┌────────▼────────┐
             │    Supabase     │
             │  PostgreSQL     │
             │  Auth (JWT)     │
             │  RLS Policies   │
             └─────────────────┘
```

### Violações Arquiteturais Identificadas

**🟠 V1 — Lógica de negócio nos componentes de página**
Consultas Supabase, validações e regras de role estão diretamente em `useEffect` e handlers nas páginas (ex: `Usuarios.tsx`, `Leads.tsx`, `Matriculas.tsx`). Não há camada de serviço/repositório.
Impacto: dificulta reutilização, testes e manutenção conforme o projeto cresce.

**🟡 V2 — TanStack Query instalado mas subutilizado**
`@tanstack/react-query` está nas dependências e o `QueryClient` é criado em `App.tsx`, mas quase nenhuma página usa `useQuery`/`useMutation`. A maioria usa `useEffect + useState` manual para buscar dados, sem cache, sem refetch automático, sem loading states padronizados.

**🟡 V3 — `select('*')` em tabelas com crescimento esperado**
`Usuarios.tsx` busca TODOS os perfis com `select('*')` sem paginação. Quando a base crescer (centenas de alunos), isso busca todos de uma vez. Mesmo padrão em `Leads.tsx` e `CursosAdmin.tsx`.

**🟡 V4 — Duplicação do cliente Supabase importado diretamente em páginas**
O import `import { supabase } from '@/lib/supabase'` está em 10+ arquivos de página com chamadas diretas. Nenhuma abstração de repositório. Mudanças de schema ou autenticação exigem alterar N arquivos.

**🟢 V5 — `Hero.backup.tsx` commitado no repositório**
Arquivo de backup de componente anterior rastreado no git (`src/components/Hero.backup.tsx`). Não é código morto intencional — é um backup que deveria ser deletado ou movido para um branch/stash.

---

## ETAPA 3 — Análise de Segurança

### 🔴 S1 — E-mail do superadmin hardcoded no código-fonte

**Arquivo:** `src/hooks/use-profile.tsx:16` e `src/pages/Login.tsx:76`
```typescript
const SUPERADMIN_EMAIL = 'heliopaiva@gmail.com';
```
O e-mail pessoal do dono está hardcoded e commitado no repositório público (ou semi-público). Qualquer pessoa com acesso ao repo sabe qual e-mail tem acesso total ao sistema.
**Risco:** exposição de PII + surface de ataque para engenharia social + se o e-mail mudar, o sistema quebra.
**Remediação:** mover para `VITE_SUPERADMIN_EMAIL` no `.env` / Vercel env vars.

### 🟠 S2 — CVE em Vite (dev dependency)

**Pacote:** `vite ^5.4.1` → vulnerável ≤6.4.1 (GHSA-4w7w-66w2-5vf9)
**Severidade:** Moderada — Path Traversal em `.map` handling nas deps otimizadas.
Afeta o servidor de desenvolvimento local, não produção (Vercel serve o build estático). Risco reduzido mas deve ser atualizado.
**Remediação:** `pnpm update vite`.

### 🟠 S3 — RLS não confirmado em `leads_cursos` e `matriculas`

O SQL de RLS commitado (`02_profiles_rls.sql`) cobre apenas a tabela `profiles`. Não há evidência de políticas RLS para `leads_cursos`, `matriculas` ou `avisos`.
**Risco:** usuário autenticado (aluno) pode potencialmente ler todos os leads e matrículas de outros alunos via API Supabase direta se RLS não estiver ativo.
**Remediação:** verificar e aplicar RLS em todas as tabelas ativas.

### 🟡 S4 — `select('*')` em `profiles` sem filtro de colunas sensíveis

`Usuarios.tsx` busca `select('*')` da tabela `profiles`. Se a tabela tiver colunas sensíveis futuras (CPF, endereço, dados de pagamento), elas serão retornadas desnecessariamente.
**Remediação:** usar colunas explícitas.

### 🟢 S5 — `.env` corretamente no `.gitignore`

Arquivo `.env` removido do tracking com `git rm --cached`. `.env.example` commitado corretamente. ✅

### 🟢 S6 — Security headers configurados no `vercel.json`

8 headers de segurança presentes: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `CSP`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `X-XSS-Protection`. ✅

### 🟢 S7 — Proteção contra escalonamento de privileges no banco

Trigger `protect_profile_role()` impede que usuários alterem sua própria role via API. ✅

---

## ETAPA 4 — Qualidade de Código

### 🟠 Q1 — `CoursePdfTemplate.tsx` com 383 linhas — componente monolítico

O maior arquivo do projeto. Gera HTML/CSS de PDF inteiro em uma única função `buildPdfHtml()`. Impossível testar, difícil de manter. Mistura dados, lógica de formatação e template.

### 🟡 Q2 — `Dashboard.tsx` com 226 linhas

Concentra: tipos exportados, helpers de role, objeto `menuByRole` com 5 roles × ~10 items, componente de layout com sidebar, header, e outlet. Fazendo trabalho demais.

### 🟡 Q3 — `error: any` em catch blocks (6 ocorrências)

```typescript
catch (error: any) {  // Cadastro.tsx, Login.tsx, RecuperarSenha.tsx
  toast({ description: err.message })
}
```
`error: any` perde a tipagem. O padrão correto seria `catch (error) { if (error instanceof Error) ... }`.
Baixa severidade — não causa bugs, mas é anti-pattern TypeScript.

### 🟡 Q4 — Ausência de feedback de erro nas queries Supabase do Dashboard

Vários `const { data } = await supabase.from(...)` sem tratar o `error` retornado. Se a query falhar (ex: RLS bloquear, network error), a UI mostra estado vazio sem aviso ao usuário.
```typescript
// Usuarios.tsx:44 — error descartado silenciosamente
const { data } = await supabase.from('profiles').select('*')...
setUsers(data ?? []);
```

### 🟡 Q5 — `VideoReel.tsx` com 302 linhas — lógica complexa de vídeo

Componente de carrossel de vídeos com controle direto de refs. Foi reescrito múltiplas vezes (histórico no git). Funcional, mas denso. A lógica `playVideo()` com iteração de refs pode ser extraída para um hook `useVideoCarousel`.

### 🟢 Q6 — TypeScript `strict: false` no tsconfig

O projeto desabilita `strict`, `strictNullChecks`, `noImplicitAny` e `noUnusedLocals`. Reduz a segurança de tipos mas é uma escolha de projeto válida para velocidade de desenvolvimento inicial. Importante endurecer antes de escalar a equipe.

### 🟢 Q7 — Zero `console.log` em produção

Apenas 1 `console.error` em `NotFound.tsx` (aceitável) e `console.warn` condicionado em `saveLead.ts`. Sem `console.log` desnecessário. ✅

---

## ETAPA 5 — Performance

### 🟠 P1 — Queries sem paginação em tabelas que vão crescer

| Arquivo | Query | Problema |
|---|---|---|
| `Usuarios.tsx:44` | `profiles` sem `.limit()` | Busca todos os usuários |
| `Leads.tsx:42` | `leads_cursos` sem `.limit()` | Busca todos os leads |
| `CursosAdmin.tsx:331` | `disciplinas` sem `.limit()` | OK por agora (lista finita), mas sem proteção |

Com centenas de alunos e leads, isso vai degradar progressivamente.

### 🟡 P2 — 49 componentes Shadcn UI instalados, muitos não utilizados

A geração inicial do projeto (Lovable) instalou todos os componentes Shadcn. Muitos não são usados no código atual (ex: `calendar`, `context-menu`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `resizable`, `slider`). Cada um importa código Radix correspondente.
O `manualChunks` em `vite.config.ts` mitiga parcialmente, mas bundles de UI ainda carregam código não-usado.

### 🟡 P3 — Vídeos públicos em `public/videos/` (~17MB) servidos sem CDN

Os 6 vídeos MP4 (~17MB total) estão no repositório e servidos diretamente pelo Vercel. Sem streaming adaptativo, sem CDN especializado para vídeo. Para o volume atual (site de instituição pequena) é aceitável, mas não escala.

### 🟢 P4 — Code splitting implementado corretamente

Todas as páginas exceto `Index` são `React.lazy()`. Vite `manualChunks` separa `react-vendor`, `query-vendor`, `ui-vendor`. ✅

### 🟢 P5 — Google Fonts não-bloqueante

Fontes carregadas com `media="print" onload="this.media='all'"`. ✅

### 🟢 P6 — Script de terceiro (`gptengineer.js`) com `defer`

Não bloqueia o parse HTML. ✅

---

## ETAPA 6 — Cobertura de Testes

### Mapa de cobertura

| Camada | Arquivos | Testes | Cobertura |
|---|---|---|---|
| Hooks (`use-profile`, `use-theme`) | 2 | 0 | 0% |
| Lib (`saveLead`, `supabase`, `utils`) | 4 | 0 | 0% |
| Componentes de UI | 49 | 0 | 0% |
| Páginas públicas | 17 | 0 | 0% |
| Dashboard pages | 9 | 0 | 0% |
| **TOTAL** | **105** | **0** | **0%** |

**Cobertura geral: 0%**

Nenhum framework de teste está configurado. Não há `vitest`, `jest`, `@testing-library/react`, nem arquivos `.test.tsx` ou `.spec.tsx`.

Regras de negócio críticas sem teste:
- Lógica de role (`isSuperAdmin`, `isAdministracao`) em `Dashboard.tsx`
- Override de superadmin por e-mail em `use-profile.tsx`
- Aprovação/recusa de matrículas em `Matriculas.tsx`
- Inserção de lead com fallback para localStorage em `saveLead.ts`

---

## ETAPA 7 — Documentação

| Item | Status | Observação |
|---|---|---|
| `README.md` | ✅ Atualizado | Completo — setup, stack, estrutura, pnpm warning |
| `CLAUDE.md` | ✅ Criado | Arquitetura, comandos, regras para Claude Code |
| `.env.example` | ✅ Existe | Template com 3 variáveis documentadas |
| `.prd/prd.md` | ✅ Atualizado | Checklist completo com bugs conhecidos e próximos passos |
| API documentada | 🔴 Não existe | Não há documentação de contratos Supabase / tabelas |
| ADRs | 🔴 Não existem | Decisões arquiteturais nos commits mas sem ADR formal |
| Guia de contribuição | 🟡 Ausente | Não há `CONTRIBUTING.md` — OK para projeto de 1 dev |
| Schema do banco documentado | 🟡 Parcial | `.prd/prd.md` lista tabelas mas sem colunas/tipos |
| Variáveis de ambiente | ✅ Documentadas | `.env.example` + `README.md` |

---

## ETAPA 8 — Scorecard Final

| Dimensão | Score | Status | Justificativa |
|---|---|---|---|
| Arquitetura | 5/10 | 🟠 RISCO | SPA funcional mas sem separação de camadas; lógica de negócio direto nas páginas; TanStack Query instalado e ignorado |
| Segurança | 6/10 | 🟡 ATENÇÃO | E-mail superadmin hardcoded é o item mais crítico; RLS não confirmado em todas as tabelas; headers HTTP excelentes |
| Qualidade de Código | 6/10 | 🟡 ATENÇÃO | Zero `console.log`, poucos `any`, mas erros Supabase descartados silenciosamente e componentes grandes |
| Performance | 7/10 | 🟡 ATENÇÃO | Code splitting e fontes corretos; queries sem paginação são bomba-relógio; 49 componentes UI instalados vs usados |
| Testes | 0/10 | 🔴 CRÍTICO | Cobertura 0%. Nenhum framework configurado. Regras de negócio críticas sem qualquer proteção automatizada |
| Documentação | 8/10 | 🟢 SAUDÁVEL | README, CLAUDE.md e PRD excelentes para a fase atual; falta schema do banco e ADRs |
| **MÉDIA GERAL** | **5.3/10** | 🟠 RISCO | Plataforma funcional e entregável, mas com débitos que crescem conforme o projeto escala |

---

## ETAPA 9 — Plano de Remediação Priorizado

### 🔴 SPRINT DE EMERGÊNCIA (resolver em < 1 semana)

**E1 — Mover e-mail superadmin para variável de ambiente**
- Arquivo: `src/hooks/use-profile.tsx:16` + `src/pages/Login.tsx:76`
- Ação: criar `VITE_SUPERADMIN_EMAIL` no `.env` + Vercel env vars
- Impacto: elimina exposição de PII no código-fonte
- Esforço: 30 min

**E2 — Verificar e aplicar RLS em `leads_cursos`, `matriculas`, `avisos`**
- Ação: no Supabase Dashboard, confirmar que RLS está habilitado + políticas existem para cada tabela
- Impacto: impede acesso cruzado de dados entre usuários
- Esforço: 1-2h (verificação + SQL)

---

### 🟠 SPRINT 1-2 (resolver em < 1 mês)

**M1 — Atualizar Vite para corrigir CVE**
```bash
pnpm update vite
```
- Impacto: elimina vulnerabilidade de path traversal no dev server
- Esforço: 15 min + teste de build

**M2 — Adicionar paginação nas queries sem limite**
- Arquivos: `Usuarios.tsx`, `Leads.tsx`, `CursosAdmin.tsx`
- Ação: adicionar `.range(0, 49)` ou `.limit(50)` + UI de paginação
- Impacto: evita degradação quando base crescer
- Esforço: 2-4h

**M3 — Tratar erros retornados pelas queries Supabase**
- Impacto: usuários veem mensagem de erro em vez de tela vazia silenciosa
- Esforço: 2h — adicionar `if (error) toast(...)` nos pontos identificados

**M4 — Remover `Hero.backup.tsx` do repositório**
```bash
git rm src/components/Hero.backup.tsx
```
- Esforço: 5 min

---

### 🟡 ROADMAP TÉCNICO (resolver em < 3 meses)

**R1 — Configurar Vitest + Testing Library**
- Prioridade máxima desta categoria — 0% de cobertura é insustentável
- Começar com: `use-profile.tsx` (lógica de role), `saveLead.ts` (fallback localStorage), `Dashboard.tsx` (helpers de role)
- Esforço: 1 dia de setup + testes iniciais

**R2 — Migrar queries de páginas para hooks/serviços**
- Extrair `useUsers()`, `useLeads()`, `useMatriculas()` usando TanStack Query
- Elimina `useEffect + useState` manual, adiciona cache e refetch automático
- Esforço: 1-2 semanas (fazer gradualmente por módulo)

**R3 — Endurecer TypeScript**
- Habilitar `"strict": true` e `"strictNullChecks": true` no tsconfig
- Corrigir os erros que aparecerem
- Esforço: 1-2 dias

**R4 — Auditar e remover componentes Shadcn não utilizados**
- Verificar quais dos 49 componentes são importados em algum lugar
- Remover os não usados para reduzir bundle
- Esforço: 2-3h

---

### 🟢 BACKLOG (quando houver oportunidade)

**B1 — Adicionar ADRs para decisões já tomadas**
- Documentar: por que pnpm; por que não SSR; por que Supabase e não Firebase; por que `select('*')` temporariamente aceito
- Template disponível em `.ai-system/templates/adr-template.md`

**B2 — Documentar schema completo do banco**
- Adicionar ao `.prd/prd.md` as colunas e tipos de cada tabela ativa

**B3 — Extrair `VideoReel` playback logic para hook**
- `useVideoCarousel(videoRefs, activeIdx)` tornaria o componente mais testável

**B4 — Substituir `error: any` por tipagem correta**
```typescript
// De:
catch (error: any) { toast({ description: error.message }) }
// Para:
catch (error) { toast({ description: error instanceof Error ? error.message : 'Erro desconhecido' }) }
```

---

## Resumo Executivo

O projeto está **funcional e entregável** para a fase atual (plataforma pública + dashboard básico para uma instituição pequena). A landing page está bem construída, o deploy é sólido e a documentação surpreende positivamente para o estágio do projeto.

Os três riscos mais importantes que precisam de ação imediata:

1. **E-mail do superadmin hardcoded** — resolve em 30 minutos, elimina exposição de PII
2. **RLS não confirmado em todas as tabelas** — risco de vazamento de dados entre usuários
3. **Zero testes** — qualquer refatoração futura é cega; configurar Vitest é investimento essencial antes de crescer o time ou a complexidade

O projeto está pronto para crescer, mas precisa dessas fundações de segurança e qualidade antes de implementar os módulos acadêmicos complexos (frequência, notas, certificados) planejados no PRD.

---

*Relatório gerado pelo Agente 14 — Auditor de Codebase*
*Nenhum arquivo foi modificado durante esta auditoria*
*Próximo passo: aguardar aprovação do responsável (Pr. Hélio Paiva) para iniciar remediações*
