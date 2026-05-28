# Relatório de Auditoria — Pós-Sprint G+H
**Data:** 2026-05-27
**Auditor:** Agente 14-auditor
**Referência anterior:** 2026-05-26 (Score 7.8/10)
**Score atual:** **8.2/10** 🟢 (+0.4)

---

## Resumo Executivo

Sprint G+H entregou CRUD completo de professores e gestão de equipe ITEC.
A plataforma passou de 14 para 16 services, de 48 para 86 testes (100% passando),
e manteve zero violações de arquitetura na camada de serviços.

---

## Verificações Executadas

### 1. Violações de Arquitetura (`supabase.from` em pages/components)
**Resultado: ZERO violações ✅**

Apenas `supabase.auth` encontrado nos arquivos autorizados:
- `DevSetup.tsx` — setup de desenvolvimento
- `Login.tsx` — autenticação
- `ProtectedRoute.tsx` — verificação de sessão
- `use-profile.tsx` — hook de perfil

### 2. Services — Inventário
**16 services ativos** (eram 14 antes do Sprint G+H):

| Service | Com testes | Sprint |
|---|---|---|
| auth.service.ts | ✅ | Inicial |
| profile.service.ts | ✅ | Inicial |
| leads.service.ts | ✅ | Inicial |
| avisos.service.ts | ✅ | Inicial |
| dashboard.service.ts | ✅ | Inicial |
| cursos.service.ts | ✅ | Inicial |
| usuarios.service.ts | ✅ | A5 |
| matriculas.service.ts | ✅ | D |
| academico.service.ts | ⚠️ | D |
| professor.service.ts | ⚠️ | D+G |
| frequencia.service.ts | ⚠️ | D |
| matricula-academica.service.ts | ⚠️ | D |
| financeiro.service.ts | ⚠️ | D |
| material.service.ts | ⚠️ | D |
| equipe.service.ts | ⚠️ | H (novo) |
| index.ts | — | barrel |

### 3. Testes
```
Test Files  15 passed (15)
Tests       86 passed (86)   ← era 48 antes do Sprint G+H
Duration    15.64s
```
**100% passando ✅**

### 4. Qualidade de Código
- **`: any` implícito:** 2 ocorrências em `dashboard.service.ts` (index signatures `[key: string]: any`) — aceitável para tipagem dinâmica de KPIs
- **`console.log` em produção:** 0 ocorrências ✅

### 5. Performance — Selects Sem LIMIT
Selects possivelmente ilimitados identificados:

| Service | Linha | Tabela | Risco | Máx. realista |
|---|---|---|---|---|
| `financeiro.service.ts` | 54 | mensalidades | Médio | ~500/mês |
| `financeiro.service.ts` | 84 | mensalidades | Médio | ~500/mês |
| `financeiro.service.ts` | 115 | mensalidades | Médio | ~500/mês |
| `frequencia.service.ts` | 56 | frequencia | Médio | ~30/turma/disciplina |
| `frequencia.service.ts` | 87 | frequencia | Baixo | ~30 registros |
| `frequencia.service.ts` | 131 | frequencia | Médio | ~30/turma |
| `material.service.ts` | 49 | progresso_aluno | Baixo | 1 registro |

**Pendentes para Sprint F2 (DT-03).**

---

## Scorecard

| Dimensão | Anterior | Atual | Delta | Justificativa |
|---|---|---|---|---|
| Arquitetura | 8.5 | **9.0** | +0.5 | 16 services, zero violações, barrel limpo |
| Segurança | 9.0 | **9.0** | 0 | RLS em todas as tabelas, sem regressões |
| Qualidade | 7.5 | **7.5** | 0 | 2 `any` aceitáveis, 0 console.log |
| Performance | 7.5 | **7.5** | 0 | Novos services sem LIMIT (DT-03 persiste) |
| Testes | 6.5 | **7.5** | +1.0 | 86/86 passando; 8 services cobertos de 15 |
| Documentação | 8.0 | **8.5** | +0.5 | ADR-003, CLAUDE.md completo, .ai-system no git |
| **Média** | **7.8** | **8.2** | **+0.4** | |

---

## Dívida Técnica Atualizada

| DT | Item | Sprint |
|---|---|---|
| DT-01 | `supabase.from` em `Convalidacoes.tsx` — 2 lookups por email/código | F |
| DT-02 | 7 services sem cobertura de testes (academico, professor, frequencia, matricula-academica, financeiro, material, equipe) | T3 |
| DT-03 | Selects sem LIMIT em financeiro (×3), frequencia (×3), material.progresso (×1) | F2 |

---

## Sprint I — Próximas Prioridades

| Item | Tipo | Impacto |
|---|---|---|
| Migration 018 — tabela `turmas` | Schema | Alto |
| Migration 019 — `turma_id` em matriculas | Schema | Alto |
| Migration 020 — role `financeiro` em profiles | Schema | Médio |
| Ficha completa do aluno | Feature | Alto |
| Dashboard de gestão de turmas | Feature | Alto |
| Cobertura de testes Sprint D (DT-02) | Qualidade | Médio |

---

## Ações Manuais Pendentes no Supabase

- [ ] Aplicar migration 017 (`avatar_url` em profiles)
- [ ] Criar bucket `avatars` (Storage, Public ON)
- [ ] Restaurar role superadmin: `UPDATE profiles SET role='superadmin' WHERE email='heliopaiva@gmail.com'`
- [ ] Seed `equipe_itec` com 8 membros reais

---

*Auditoria gerada por Agente 14-auditor — ITEC-EAD*
*Score referência: 8.2/10 | Meta: 9.0/10*
