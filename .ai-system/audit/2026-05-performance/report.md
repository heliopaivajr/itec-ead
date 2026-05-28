# Relatório de Auditoria — Performance
**Data:** 2026-05-28
**Agentes:** 13-performance-eng + 14-auditor
**Escopo:** Dashboard — queries, navegação, loading states

---

## Resumo Executivo

Foram encontrados **17 problemas** distribuídos em 4 categorias.
O mais grave é um N+1 estrutural no `useMeusCursos` (até 32 queries por carregamento).
A navegação do `DashboardHome` tem 2 rotas erradas e usa `<a href>` onde deveria usar `<Link>`.

---

## 1. Queries sem LIMIT (DT-03)

| Arquivo | Função | Linha | Tabela | Risco | Máx. realista |
|---|---|---|---|---|---|
| `financeiro.service.ts` | `getMensalidadesByAluno` | 83 | mensalidades | Médio | ~36/aluno (3 anos) |
| `financeiro.service.ts` | `getInadimplentes` | 114 | mensalidades | Alto | ~500 em crescimento |
| `frequencia.service.ts` | `getFrequenciaByDisciplina` | 55 | frequencia | Médio | ~30/turma/disc |
| `frequencia.service.ts` | `getResumoFrequencia` | 86 | frequencia | Baixo | ~30/aluno/disc |
| `frequencia.service.ts` | `getAlunosAbaixoLimite` | 130 | frequencia | Médio | ~30/disciplina |
| `equipe.service.ts` | `getEquipe` | 23 | equipe_itec | Baixo | ~15 membros |
| `avisos.service.ts` | `getAvisos` | 36 | avisos | Baixo/Médio | ~100/semestre |
| `cursos.service.ts` | `getDisciplinas` | 34 | disciplinas | Baixo | ~50 disciplinas |
| `cursos.service.ts` | `getPrerequisitos` | 46 | prerequisitos | Baixo | ~30 prereqs |
| `dashboard.service.ts` | leads/matriculas recentes | 85-96 | múltiplas | Médio | cresce no tempo |

**Status DT-03:** Financeiro e frequência continuam sem LIMIT. Academico.service foi corrigido em Sprint anterior.

---

## 2. N+1 Queries — Crítico 🔴

### `src/hooks/useMeusCursos.ts` — 4N queries ao carregar MeusCursos

```
Para cada disciplina regular do módulo:
  → getResumoFrequencia(alunoId, disc.id)      [1 query]
  → getMateriaisByDisciplina(disc.id, true)     [1 query]
  → verificarPrerequisitos(alunoId, disc.id)    [1-2 queries]
  → getPercentualProgresso(alunoId, disc.id)    [1 query]
```

**Impacto real:** Módulo 1 = 8 disciplinas = **32–40 queries** em paralelo.
`Promise.all` mitiga latência mas satura a connection pool do Supabase Free tier (25 conexões simultâneas).

**Fix proposto:** Consolidar em 2-3 queries com JOIN:
- `frequencia` + `materiais` + `progresso_aluno` em uma query com group by disciplina
- `prerequisitos_v2` em uma query única para todas as disciplinas do aluno

**Estimativa:** 3-4h para refatorar `useMeusCursos` + testes.

---

## 3. Loading States Ausentes

| Arquivo | Problema | Impacto |
|---|---|---|
| `DashboardHome.tsx` | Não tem loading state nem skeleton — renderiza zeros enquanto carrega KPIs | 🟠 UX ruim: KPIs piscam de 0 para valores reais |

**Notas:**
- `MeusCursos.tsx` — OK. Usa hook com `loading` booleano + `<SkeletonCards />`. ✅
- `ProfessorHome.tsx` — OK. Usa `useProfessorDisciplinas` com `loading` + `<Skeleton>`. ✅
- `Perfil.tsx` — OK. Sem fetch inicial (dados chegam pelo contexto). ✅
- `NovaMatricula.tsx` — OK. Tem `salvando` state no submit. ✅

---

## 4. Navegação Errada / Full-Page Reload

### 4a. Rotas erradas no DashboardHome

| Linha | Label | href atual | href correto | Impacto |
|---|---|---|---|---|
| 199 | "Minhas Turmas" (professor) | `/dashboard/turmas` | `/dashboard/professor` | 🔴 404 — rota não existe |
| 203 | "Frequência" (professor) | `/dashboard/turmas` | `/dashboard/professor` | 🔴 404 — rota não existe |
| 240 | "Frequência" (aluno) | `/dashboard/ao-vivo` | `/dashboard/cursos` | 🟠 Rota errada — "Ao Vivo" é ComingSoon |

**Detalhe linha 199/203:** A rota `/dashboard/turmas` renderiza `ComingSoon` (App.tsx:105). O professor clica em "Minhas Turmas" ou "Frequência" e cai na tela de "em breve", em vez de ir para `ProfessorHome`.

### 4b. `<a href>` causando full-page reload

| Linhas | Problema |
|---|---|
| 106, 126, 154, 206, 244 | Cards e links do DashboardHome usam `<a href="…">` para rotas internas — causa reload completo da SPA, perdendo estado e contexto |

**Fix:** Trocar `<a href>` por `<Link to>` do react-router-dom (ou `useNavigate`).

---

## Tabela consolidada de problemas

| # | Arquivo | Problema | Impacto | Prioridade |
|---|---|---|---|---|
| P1 | `DashboardHome.tsx:199,203` | Rota `/dashboard/turmas` não existe para professor | Botões levam a 404/ComingSoon | 🔴 Crítico |
| P2 | `DashboardHome.tsx:240` | Frequência do aluno → `/dashboard/ao-vivo` (ComingSoon) | Link errado | 🔴 Crítico |
| P3 | `useMeusCursos.ts:~100` | N+1: 32–40 queries para carregar MeusCursos | Lento em Free tier | 🟠 Alto |
| P4 | `financeiro.service.ts:114` | `getInadimplentes` sem LIMIT | Cresce com dados reais | 🟠 Alto |
| P5 | `DashboardHome.tsx:106,206,244` | `<a href>` em vez de `<Link>` — full-page reload | SPA perde estado | 🟠 Alto |
| P6 | `DashboardHome.tsx` | Sem loading state nos KPIs — valores piscam de 0 | UX ruim | 🟡 Médio |
| P7 | `financeiro.service.ts:83` | `getMensalidadesByAluno` sem LIMIT | Cresce com tempo | 🟡 Médio |
| P8 | `frequencia.service.ts:55` | `getFrequenciaByDisciplina` sem LIMIT | Cresce por turma | 🟡 Médio |
| P9 | `frequencia.service.ts:130` | `getAlunosAbaixoLimite` sem LIMIT | Cresce por turma | 🟡 Médio |
| P10 | `avisos.service.ts:36` | `getAvisos` sem LIMIT | Cresce no tempo | 🟡 Médio |
| P11 | `dashboard.service.ts:85-96` | Leads/matrículas recentes sem LIMIT explícito | Cresce no tempo | 🟡 Médio |
| P12 | `frequencia.service.ts:86` | `getResumoFrequencia` sem LIMIT | Baixo risco (~30 reg) | 🟢 Baixo |
| P13 | `equipe.service.ts:23` | `getEquipe` sem LIMIT | Baixo risco (~15 reg) | 🟢 Baixo |
| P14 | `cursos.service.ts:34,46` | getDisciplinas/getPrerequisitos sem LIMIT | Baixo risco fixo | 🟢 Baixo |

---

## Prioridade de Correção

### Sprint F2 — DT-03 + Navegação (estimativa: 4–6h)

**1. Rotas erradas (30 min):**
- `DashboardHome.tsx:199,203` → trocar `/dashboard/turmas` por `/dashboard/professor`
- `DashboardHome.tsx:240` → trocar `/dashboard/ao-vivo` por `/dashboard/cursos`

**2. `<a>` → `<Link>` (30 min):**
- Substituir `<a href="…">` por `<Link to="…">` nas linhas 106, 126, 154, 206, 244

**3. Loading state nos KPIs do DashboardHome (1h):**
- Adicionar `isLoading` state + skeleton nas cards de KPI

**4. LIMITs em financeiro + frequencia (2h):**
- `getMensalidadesByAluno`: `.limit(60)` (5 anos de mensalidades)
- `getInadimplentes`: `.limit(200)` + considerar paginação
- `getFrequenciaByDisciplina`: `.limit(60)` (2 anos de aulas semanais)
- `getAlunosAbaixoLimite`: `.limit(60)`
- `getAvisos`: `.limit(50)`
- `dashboard.service` leads/matrículas: `.limit(10)`

**5. Refatorar useMeusCursos — N+1 (3-4h):**
- Consolidar queries de frequência em uma única com `.in('disciplina_id', ids)`
- Consolidar progresso em uma única com `.in('disciplina_id', ids)`
- Manter `Promise.all` apenas para operações independentes de verdade

---

## Estimativa Total

| Categoria | Tempo |
|---|---|
| Rotas erradas (P1, P2) | 30 min |
| `<a>` → `<Link>` (P5) | 30 min |
| Loading KPIs (P6) | 1h |
| LIMITs DT-03 (P7-P14) | 2h |
| Refatorar N+1 (P3) | 3-4h |
| **Total** | **7-8h** |

---

## Impacto no Score

| Dimensão | Atual | Pós-fix | Delta |
|---|---|---|---|
| Performance | 7.5 | **8.5** | +1.0 |
| Qualidade | 7.5 | **8.0** | +0.5 |
| **Média geral** | **8.2** | **~8.5** | **+0.3** |

---

*Auditoria gerada por Agentes 13-performance-eng + 14-auditor — ITEC-EAD*
*Sem modificações em arquivos de produção — apenas análise*
