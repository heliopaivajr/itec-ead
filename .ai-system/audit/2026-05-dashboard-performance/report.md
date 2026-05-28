# Auditoria de Performance — Dashboards ITEC-EAD
**Data:** 2026-05-28
**Agentes:** 13-performance-eng + 14-auditor
**Escopo:** 17 páginas de dashboard + services relacionados

---

## Resumo Executivo

| Prioridade | Qtd | Páginas |
|---|---|---|
| 🔴 Crítico | 3 | FichaAluno, LancarFrequencia, VerTurma |
| 🟠 Alto | 3 | Convalidacoes, GestaoTurmas, EquipeITEC |
| 🟡 Médio | 2 | Financeiro (gerarMensalidadesMes), ProfessoresAdmin |
| 🟢 Baixo | 0 | — |

**Boas notícias:** 13 de 17 páginas têm loading states adequados (Skeleton/Loader2), paginação com debounce 300ms implementada nas listagens principais, e nenhum `<a href>` encontrado — todas navegações usam `<Link>` ou `<Navigate>`.

---

## Tabela Completa

| Página | Role | N+1 | Sem LIMIT | Loading | Rotas | Viola Arq. | Status |
|--------|------|-----|-----------|---------|-------|-----------|--------|
| Matriculas | secretaria | ✅ OK | ✅ OK (pag.) | ✅ Skeleton | ✅ OK | ✅ OK | ✅ OK |
| NovaMatricula | secretaria | ✅ OK | ✅ OK | ✅ OK | ✅ OK | ✅ OK | ✅ OK |
| Financeiro | secretaria | ✅ OK | ✅ OK (limit 200) | ✅ Skeleton | ✅ OK | ✅ OK | ✅ OK |
| Convalidacoes | secretaria | ✅ OK | ⚠️ Possível | ✅ Skeleton | ✅ OK | ⚠️ Direto no banco | 🟠 Alto |
| Leads | secretaria | ✅ OK | ✅ OK (pag.) | ✅ Skeleton | ✅ OK | ✅ OK | ✅ OK |
| ProfessorHome | professor | ✅ OK | ✅ OK | ✅ OK | ✅ OK | ✅ OK | ✅ OK |
| MeusContratos | professor | ✅ OK | ✅ OK | ✅ OK | ✅ OK | ✅ OK | ✅ OK |
| ContratoForm | professor | ✅ OK | ✅ OK | ✅ OK | ✅ OK | ✅ OK | ✅ OK |
| LancarFrequencia | professor | 🔴 N+1 | ✅ OK | ✅ Skeleton | ✅ OK | ✅ OK | 🔴 Crítico |
| VerTurma | professor | 🔴 N+1 | ✅ OK | ✅ Skeleton | ✅ OK | ✅ OK | 🔴 Crítico |
| PainelAdmin | admin | ✅ OK | ✅ OK | ✅ Skeleton | ✅ OK | ✅ OK | ✅ OK |
| Usuarios | admin | ✅ OK | ✅ OK (pag.) | ✅ Skeleton | ✅ OK | ✅ OK | ✅ OK |
| CursosAdmin | admin | ✅ OK | ✅ OK | ✅ Loader2 | ✅ OK | ✅ OK | ✅ OK |
| GestaoTurmas | admin | ✅ OK | ⚠️ getTurmas sem LIMIT | ✅ Loader2 | ✅ OK | ✅ OK | 🟠 Alto |
| FichaAluno | admin/secretaria | ✅ OK | 🔴 2 queries sem LIMIT | ✅ Loader2 | ✅ OK | 🔴 supabase direto | 🔴 Crítico |
| ProfessoresAdmin | admin | ✅ OK | ✅ OK (pag.) | ✅ Skeleton | ✅ OK | ✅ OK | 🟡 Médio |
| EquipeITEC | admin | ✅ OK | ⚠️ getEquipe sem LIMIT | ✅ Loader2 | ✅ OK | ✅ OK | 🟠 Alto |

---

## Detalhes por Página

### 🔴 FichaAluno.tsx

**Violação de arquitetura — usa `supabase` diretamente:**
```
import { supabase } from '@/lib/supabase'; // linha 9
```
Isso viola a regra absoluta do projeto: `NUNCA supabase.from() em pages/` — deve passar por `src/services/`.

**Queries sem LIMIT:**
- `matriculas` (linha 93-97): sem `.limit()` — aluno com múltiplas rematrículas pode retornar dezenas de rows
- `documentos_aluno` (linha 99-103): sem `.limit()` — sem limite
- `mensalidades` (linha 105-108): **OK** — tem `.limit(24)` ✅

**Fix necessário:** Extrair as 4 queries para `src/services/ficha-aluno.service.ts` (novo) ou para os services existentes, adicionando LIMITs adequados.

---

### 🔴 LancarFrequencia.tsx

**N+1 pattern confirmado (linhas 71-82 aprox.):**
```typescript
// Para cada aluno na turma, faz 1 query individual
await Promise.all(alunos.map(a => getResumoFrequencia(a.id)))
```
Com 20-40 alunos por turma = 20-40 queries separadas. Deveria ser uma única query com `IN (aluno_ids)`.

**Impacto:** Lentidão perceptível ao abrir a página de lançamento de frequência.

---

### 🔴 VerTurma.tsx

**Padrão N+1 idêntico ao LancarFrequencia (linhas 48-60 aprox.):**
```typescript
await Promise.all(alunos.map(a => getResumoFrequencia(a.id)))
```
Mesmo problema — 1 query por aluno ao invés de 1 query por turma.

---

### 🟠 Convalidacoes.tsx

**Viola arquitetura (remanescente documentado):**
Conforme CLAUDE.md: "⚠️ EXCEÇÃO REMANESCENTE: `Convalidacoes.tsx` — 2 lookups por email/código (encapsular — Sprint F)"

**Queries sem LIMIT explícito:**
`getConvalidacoesPorStatus('pendente')` — verificar no `matricula-academica.service.ts` se tem LIMIT.
Convalidações tendem a ser poucas (< 50), então risco baixo a curto prazo.

---

### 🟠 GestaoTurmas.tsx

**getTurmas() sem LIMIT** (`turmas.service.ts` linha 42-44):
```typescript
.from('turmas')
.select('*')
.order('ano', { ascending: false })
// sem .limit()
```
Com 3 turmas atualmente o impacto é zero, mas à medida que o sistema escala (5+ anos = 10+ turmas) isso cresce.
**Fix simples:** adicionar `.limit(50)` no service.

---

### 🟠 EquipeITEC.tsx

**getEquipe() sem LIMIT** (`equipe.service.ts` linha 24):
```typescript
.from('equipe_itec')
.select('*')
.order('nome', { ascending: true })
// sem .limit()
```
Equipe pequena (< 20 membros), risco real baixo. Mas deveria ter `.limit(100)` por boa prática.

---

### 🟡 financeiro.service.ts — gerarMensalidadesMes

**Busca matrículas ativas sem LIMIT (linha 182-185):**
```typescript
.from('matriculas')
.select('id, aluno_id')
.eq('status', 'ativa')
// sem .limit()
```
Esta é uma operação de backoffice (geração em lote), então não é um problema de UX. Mas com 500+ alunos pode sofrer timeout. Adequado para Sprint K/L quando a base crescer.

---

### 🟡 ProfessoresAdmin.tsx — abrirVincular

**getAllDisciplinas() chamada na abertura do modal (linha 73):**
```typescript
const abrirVincular = async (p: Professor) => {
  setDisciplinas(await getAllDisciplinas()); // toda vez que abre o modal
};
```
`getAllDisciplinas` tem `.limit(200)` no service, então não é crítico. Mas poderia ser carregado uma vez no mount. Baixo impacto prático.

---

## Lista Priorizada de Fixes

### 🔴 Sprint imediato (bugs / violações de arquitetura)

| # | Fix | Arquivo(s) | Esforço |
|---|-----|-----------|---------|
| F1 | Criar `ficha-aluno.service.ts` com as 4 queries, adicionar LIMITs | `FichaAluno.tsx` + novo service | 2h |
| F2 | Criar query batch `getResumoFrequenciaBatch(turmaId)` e usar em LancarFrequencia | `frequencia.service.ts` + `LancarFrequencia.tsx` | 3h |
| F3 | Idem para VerTurma | `VerTurma.tsx` | 1h (reaproveitando F2) |

**Total crítico: ~6h**

### 🟠 Sprint próximo (performance preventiva)

| # | Fix | Arquivo(s) | Esforço |
|---|-----|-----------|---------|
| F4 | Adicionar `.limit(50)` em `getTurmas()` | `turmas.service.ts` | 15min |
| F5 | Adicionar `.limit(100)` em `getEquipe()` | `equipe.service.ts` | 15min |
| F6 | Encapsular lookups de `Convalidacoes.tsx` em service (Sprint F pendente) | `Convalidacoes.tsx` + service | 2h |

**Total alto: ~2.5h**

### 🟡 Backlog (sem urgência)

| # | Fix | Arquivo(s) | Esforço |
|---|-----|-----------|---------|
| F7 | Cache de disciplinas no ProfessoresAdmin (useEffect ao invés de onClick) | `ProfessoresAdmin.tsx` | 30min |
| F8 | Adicionar LIMIT em `gerarMensalidadesMes` (preparar para escala) | `financeiro.service.ts` | 30min |

**Total médio: ~1h**

---

## Total Geral de Esforço

| Prioridade | Fixes | Esforço |
|---|---|---|
| 🔴 Crítico | F1, F2, F3 | ~6h |
| 🟠 Alto | F4, F5, F6 | ~2.5h |
| 🟡 Médio | F7, F8 | ~1h |
| **Total** | **8 fixes** | **~9.5h** |

---

## Padrões Positivos Observados

- ✅ Todas as listagens principais (Matriculas, Leads, Usuarios, Professores) têm paginação SERVER-SIDE com debounce 300ms
- ✅ Todas as 17 páginas têm algum loading state (Skeleton ou Loader2)
- ✅ Zero uso de `<a href>` para navegação interna — tudo via React Router
- ✅ `Promise.all` usado corretamente para queries paralelas independentes (ex: `CursosAdmin`, `FichaAluno` com 4 queries simultâneas)
- ✅ `useCallback` + `useRef` nos debounces de search
- ✅ `financeiro.service.ts` — `getInadimplentes` tem `.limit(200)` e agrega em JS (evita N+1 SQL)
- ✅ `getMensalidadesByAluno` tem `.limit(60)` (5 anos × 12 meses — comentado no código)

---

*Relatório gerado por auditoria estática de código — sem execução da aplicação.*
*Próxima auditoria recomendada: pós-Sprint K (quando vídeos forem implementados).*
