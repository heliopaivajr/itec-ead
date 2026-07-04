# STACK.md — Stack Técnica ITEC-EAD
# Atualizado: 2026-07-04

## Stack (resumo)
**React 18 + TypeScript + Vite + Tailwind CSS + Supabase + Vercel.**
Repositório local: `E:\_HELIOJR\ITEC\itec-ead`. Aplicação web SPA (não é WordPress/LMS).

## Frontend
- React 18
- TypeScript (strict)
- Vite 6.x (CVE corrigido)
- Tailwind CSS
- Shadcn UI
- React Router DOM
- Recharts (gráficos)

## Backend / Banco
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- RLS obrigatório em todas as tabelas de usuário
- Migrations versionadas em supabase/migrations/

## Deploy
- Vercel (CD automático via GitHub)
- Domínio: itecedu.com
- Staging: itec-ead.vercel.app
- vercel.json com 8 headers de segurança (CSP atualizado)

## Gerenciador de pacotes
- pnpm (OBRIGATÓRIO — nunca npm)

## Testes
- Vitest + @testing-library/react + jsdom
- **86 testes passando** (atualizado pós-Sprint F2)
- src/test/setup.ts com mock global do Supabase (fluent builder)

## Variáveis de ambiente
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_SITE_URL
- NUNCA usar prefixo VITE_ para dados sensíveis de admin

## Services — 14 total

### Com testes ✅ (8)
`auth` · `profile` · `leads` · `avisos`
`dashboard` · `cursos` · `usuarios` · `matriculas`

### Sem testes — Sprint T3 pendente ⚠️ (6)
`academico` · `professor` · `frequencia`
`matricula-academica` · `financeiro` · `material`

## Estrutura de pastas relevante
```
src/
├── services/          ← 14 services (zero supabase.from em pages)
├── hooks/
│   ├── useMeusCursos.ts          ← aluno: disciplinas + frequência
│   └── useProfessorDisciplinas.ts ← professor: contratos + risco
├── pages/
│   ├── dashboard/
│   │   ├── MeusCursos.tsx        ← aluno
│   │   ├── ProfessorHome.tsx     ← professor
│   │   ├── LancarFrequencia.tsx  ← professor
│   │   ├── VerTurma.tsx          ← professor
│   │   ├── ContratoForm.tsx      ← professor
│   │   ├── NovaMatricula.tsx     ← secretaria ⚠️ DT-01
│   │   ├── Financeiro.tsx        ← secretaria
│   │   └── Convalidacoes.tsx     ← secretaria ⚠️ DT-01
│   └── [páginas LP]
├── components/
│   ├── ProtectedRoute.tsx
│   └── dashboard/
│       └── AlertaFrequencia.tsx
└── test/              ← Vitest + 48 testes
```

## Migrations aplicadas — 15 total

| # | Arquivo | Conteúdo |
|---|---------|---------|
| 001 | 20260525_001_rls_leads_cursos | RLS leads_cursos |
| 002 | 20260525_002_rls_matriculas | RLS matriculas |
| 003 | 20260525_003_rls_avisos_fix | RLS avisos (role fix) |
| 004 | 20260525_004_superadmin_role_db | Role superadmin via banco |
| 005 | 20260525_005_disciplinas_schema | Disciplinas retroativa + seed |
| 006 | 20260526_006_indices_paginacao | 6 índices paginação |
| 007 | 20260526_007_equipe_itec | equipe_itec + seed 8 membros |
| 008 | 20260526_008_estrutura_academica | cursos, módulos, disciplinas_v2, prereqs, exceções |
| 009 | 20260526_009_professores_contratos | professores + contratos |
| 010 | 20260526_010_matriculas_documentos | ALTER matriculas + documentos + matriculas_disciplina |
| 011 | 20260526_011_frequencia_materiais | frequencia + materiais + progresso_aluno |
| 012 | 20260526_012_financeiro | taxa_matricula + mensalidades |
| 013 | 20260526_013_convalidacoes | convalidacoes |
| 014 | 20260526_014_seed_itec | Teologia: 6 módulos, 40 disciplinas, 22 prereqs |
| 017 | 20260527_017_profiles_avatar | ADD COLUMN avatar_url em profiles |

## Migrations aplicadas — Sprint I

| # | Arquivo | Conteúdo |
|---|---|---|
| 018 | 20260527_018_turmas | Tabela `turmas` + RLS + seed 3 turmas |
| 019 | 20260527_019_matriculas_turma_id | `turma_id UUID` FK em `matriculas` |
| 020 | 20260527_020_role_financeiro | Constraint role inclui `financeiro` |

## Migrations pendentes — Sprint J, K, L

| # | Conteúdo | Sprint |
|---|---|---|
| 021 | `video_url`, `video_tipo`, `video_duracao_min` em `materiais` | K |
| 022 | Tabela `certificados` (emissão + número ITEC-ANO-SEQ) | L |
| 023 | Tabela `verificacao_certificados` (rota pública sem auth) | L |

## Dívida técnica conhecida

| DT | Item | Sprint | Status |
|---|---|---|---|
| DT-01 | `supabase.from` direto em `Convalidacoes.tsx` | F1 | ⚠️ Pendente |
| DT-02 | 6 services Sprint D sem cobertura de testes | T3 | ⚠️ Pendente |
| DT-03 | Services sem LIMIT protetivo | F2 | ✅ Resolvido |

## Score de auditoria — 2026-05-26

| Dimensão | Score |
|---|---|
| Arquitetura | 8.5/10 |
| Segurança | 9.0/10 |
| Qualidade | 7.5/10 |
| Performance | 7.5/10 |
| Testes | 6.5/10 |
| Documentação | 8.0/10 |
| **Média** | **7.8/10** |

Relatório completo: `.ai-system/audit/2026-05-pos-sprint-d/report.md`
