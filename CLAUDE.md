# CLAUDE.md — ITEC-EAD
# Lido automaticamente pelo Claude Code

## Projeto
Plataforma EAD do Instituto de Teologia Cristã
Site: https://www.itecedu.com
Dev: Hélio Paiva Jr. (superadmin)

## Comandos

```bash
pnpm dev          # Dev server http://localhost:8080
pnpm build        # Build de produção
pnpm lint         # ESLint
pnpm test:run     # 48 testes (one-shot)
pnpm test         # modo watch
pnpm test:coverage # relatório de cobertura
```

## Stack
- React 18 + TypeScript + Vite + Tailwind CSS + Shadcn UI
- Supabase (Auth + PostgreSQL + Storage + Realtime)
- Vercel (deploy automático via GitHub)
- pnpm (NUNCA usar npm — conflito no lockfile)

## Regras absolutas
- NUNCA usar npm — sempre pnpm
- NUNCA commitar .env ou .env.local
- NUNCA `supabase.from()` direto em `pages/` ou `components/` → sempre usar `src/services/`
- NUNCA magic strings de role — usar `UserRole` de `profile.service`
- RLS obrigatório em toda tabela com dados de usuário
- TypeScript strict — sem `any` implícito

## Arquitetura — Área Pública vs Dashboard

Duas áreas distintas no mesmo React Router:
- **Público** (`/`, `/cursos`, `/sobre`, `/reservar-vaga`, etc.) — sem auth
- **Dashboard** (`/dashboard/*`) — protegido pelo `ProtectedRoute` em `App.tsx`

`ProtectedRoute` verifica sessão + role. Role `pendente` → `/aguardando`. Role desconhecido → `/login`.

## Services existentes (src/services/)

| Service | Responsabilidade |
|---|---|
| `auth.service.ts` | signIn, signOut, reset — erros em PT-BR |
| `profile.service.ts` | getRole (fallback `'pendente'`), getProfile, upsert |
| `leads.service.ts` | createLead + fallback localStorage |
| `avisos.service.ts` | CRUD de avisos + noTable detection |
| `dashboard.service.ts` | KPIs + listas paginadas |
| `cursos.service.ts` | disciplinas + syncPrerequisitos (rollback) |
| `usuarios.service.ts` | perfis admin — getUsuarios, updateRole, updatePerfil |
| `matriculas.service.ts` | getMatriculas paginado, getMinhasMatriculas, updateStatus |

## Roles do sistema
```
pendente → aluno → professor → administracao → admin → superadmin
```
Fallback seguro: `getRole()` retorna `'pendente'` se erro ou perfil não existir.
Role `superadmin` definido diretamente no banco (migration 004) — sem env var.

## Auth e perfil
- `useProfile()` — hook canônico para obter perfil atual
- `heliopaiva@gmail.com` — role superadmin garantido via banco, não hardcoded

## Tema
Três temas: `dark` | `light` | `sepia` — gerenciado pelo `ThemeProvider`.
Usar tokens semânticos Tailwind: `bg-background`, `text-foreground`, `text-primary`, `border-border`.
Cor primária: `#ea384c` (blood red).

## Testes
```bash
pnpm test:run   # deve sempre passar 48/48
```
- Vitest + Testing Library + jsdom
- Mock global do Supabase em `src/test/setup.ts`
- Testes em `src/test/` — services e componentes críticos

## Migrations aplicadas (supabase/migrations/)
- 001 — RLS leads_cursos
- 002 — RLS matriculas
- 003 — RLS avisos fix
- 004 — superadmin role via banco
- 005 — disciplinas + prerequisitos (schema retroativo + seed)
- 006 — índices paginação (6 índices)

## Score auditoria
7.8/10 (pós-Sprint A+B+C) — relatório em `.ai-system/audit/`

## ADRs
- ADR-001: arquitetura geral
- ADR-002: camada de serviços — **IMPLEMENTADO** (8 services)

## Próximo sprint (D)
Schema completo: cursos, módulos, disciplinas, professores,
contratos, matrículas, frequência, financeiro, convalidações.
Ver `.prd/prd.md` para especificação completa.

## .ai-system/ — contexto separado
A pasta `.ai-system/` é um sistema documental independente
que roda no Claude.ai (Projetos), não no Claude Code.
Contém agentes, specs, auditorias e ADRs do projeto.
Não misturar com o código da plataforma web.
