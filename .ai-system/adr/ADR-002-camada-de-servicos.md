# ADR-002 — Proposta de Camada de Serviços ITEC-EAD

**Status:** IMPLEMENTADO  
**Data:** 2026-05-25  
**Data de implementação:** 2026-05-26  
**Services criados:** 6/6  
**Pendências documentadas:**
- `usuarios.service` — Leads.tsx, Matriculas.tsx, Usuarios.tsx, Perfil.tsx, MeusCursos.tsx
- `auth.service` estender: `getSession` + `onAuthStateChange` (ProtectedRoute.tsx e use-profile.tsx — sprint futuro)


**Autor:** Agente 01 — Arquiteto  
**Contexto:** Diagnóstico A1 da auditoria de entrada (score 5.5/10)

---

## Problema

Chamadas ao Supabase e lógica de negócio estão acopladas diretamente
nos componentes React. Isso torna o código:

- **Intestável** — mocks de Supabase precisam replicar cadeias de 4+ métodos em cada teste
- **Duplicado** — `leads_cursos.insert` aparece em `ReservarVaga.tsx` E `saveLead.ts`
- **Frágil** — trocar o backend exige varrer todos os componentes
- **Difícil de auditar** — regras de negócio (lgpd_aceite, interesse='candidato') invisíveis

---

## Inventário Completo de Chamadas Supabase

### Arquivos de Produção (12)

| Arquivo | Tabela(s) | Operações | Lógica de Negócio? | Prioridade |
|---|---|---|---|---|
| `src/lib/saveLead.ts` | `leads_cursos` | INSERT | Fallback localStorage se erro | **ALTA** |
| `src/pages/ReservarVaga.tsx` | `leads_cursos` | INSERT | LGPD, interesse='candidato' | **ALTA** |
| `src/pages/dashboard/DashboardHome.tsx` | `profiles`, `leads_cursos`, `matriculas` | SELECT x6 | KPIs + agregação por curso | **ALTA** |
| `src/pages/dashboard/CursosAdmin.tsx` | `disciplinas`, `prerequisitos_disciplinas` | SELECT, UPDATE, DELETE, INSERT | Delete+re-insert de pré-requisitos | **ALTA** |
| `src/pages/dashboard/Avisos.tsx` | `avisos` | SELECT, DELETE | Filtro de role_destino | **MÉDIA** |
| `src/components/avisos/NovoAvisoModal.tsx` | `avisos` | INSERT | Campos autor_id, criado_em | **MÉDIA** |
| `src/components/ProtectedRoute.tsx` | `profiles` | SELECT | Leitura de role para RBAC | **MÉDIA** |
| `src/hooks/use-profile.tsx` | `profiles` | SELECT | Fallback se profile não existe | **MÉDIA** |
| `src/pages/Login.tsx` | — | auth.signInWithPassword, signInWithOAuth, signOut | Mapeamento de erro, localStorage | **MÉDIA** |
| `src/pages/Cadastro.tsx` | — | auth.signInWithOAuth, auth.signUp | — | **BAIXA** |
| `src/pages/RecuperarSenha.tsx` | — | auth.resetPasswordForEmail | — | **BAIXA** |
| `src/pages/Dashboard.tsx` | — | auth.signOut | localStorage.removeItem | **BAIXA** |
| `src/pages/AguardandoAprovacao.tsx` | — | auth.getSession, auth.signOut | Redirect condicional | **BAIXA** |
| `src/pages/DevSetup.tsx` | `profiles` | auth.signUp + profiles.upsert | Loop, delay, múltiplos usuários | **BAIXA** (dev only) |

> **Duplicação detectada:** `leads_cursos.insert` existe em DOIS lugares:
> `ReservarVaga.tsx` (campos completos) e `saveLead.ts` (campos simplificados + fallback localStorage).
> A função `saveLead.ts` não é chamada por `ReservarVaga.tsx` — são implementações paralelas e inconsistentes.

---

## Estrutura de Services Proposta

```
src/services/
├── auth.service.ts        — autenticação e gestão de sessão
├── profile.service.ts     — perfil do usuário e roles
├── leads.service.ts       — captura e consulta de leads
├── avisos.service.ts      — avisos e comunicados
├── cursos.service.ts      — disciplinas e pré-requisitos
└── dashboard.service.ts   — KPIs e dados agregados do dashboard
```

### Detalhamento por Service

#### `auth.service.ts` — P (Pequeno)
Funções:
- `signInWithPassword(email, password)` → traduz erros para PT-BR
- `signInWithOAuth(provider)` → configura redirectTo
- `signOut()` → limpa localStorage + sessão
- `resetPasswordForEmail(email)` → configura redirectTo
- `getSession()` → wrapper simples

Consome: `Login.tsx`, `Cadastro.tsx`, `RecuperarSenha.tsx`, `Dashboard.tsx`, `AguardandoAprovacao.tsx`, `ProtectedRoute.tsx`

#### `profile.service.ts` — P (Pequeno)
Funções:
- `getProfile(userId)` → SELECT profiles WHERE id = userId
- `upsertProfile(userId, data)` → usado pelo DevSetup
- `getRole(userId)` → SELECT role only (usado pelo ProtectedRoute)

Consome: `ProtectedRoute.tsx`, `use-profile.tsx`, `DevSetup.tsx`

#### `leads.service.ts` — M (Médio)
Funções:
- `createLead(data)` → INSERT com lgpd_aceite, interesse, fallback localStorage
- `getLeads(filters?)` → SELECT com paginação futura
- `getLeadsCounts()` → COUNT para KPIs

Consome: `ReservarVaga.tsx`, `saveLead.ts` (unificar), `DashboardHome.tsx`

> ⚠️ **Unifica** `saveLead.ts` e `ReservarVaga.tsx` — elimina duplicação

#### `avisos.service.ts` — P (Pequeno)
Funções:
- `getAvisos()` → SELECT com join autor:profiles
- `createAviso(data)` → INSERT com autor_id, criado_em
- `deleteAviso(id)` → DELETE

Consome: `Avisos.tsx`, `NovoAvisoModal.tsx`

#### `cursos.service.ts` — G (Grande)
Funções:
- `getDisciplinas()` → SELECT ordered by modulo, nome
- `getPrerequisitos()` → SELECT all
- `updateDisciplina(codigo, data)` → UPDATE
- `syncPrerequisitos(disciplinaCodigo, prereqs)` → DELETE+INSERT atômico

Consome: `CursosAdmin.tsx`

> ⚠️ **Risco:** o padrão delete-all + re-insert de pré-requisitos é uma transação lógica.
> Precisa de tratamento de erro cuidadoso na extração.

#### `dashboard.service.ts` — M (Médio)
Funções:
- `getKpis()` → Promise.all dos 4 COUNTs
- `getLeadsPorCurso()` → SELECT + agregação em JS
- `getUltimosLeads(limit?)` → SELECT ordered + limit
- `getMatriculasRecentes(limit?)` → SELECT ordered + limit

Consome: `DashboardHome.tsx`

---

## Ordem de Extração Recomendada (menor risco primeiro)

| # | Service | Justificativa | Esforço | Risco |
|---|---|---|---|---|
| 1 | `auth.service.ts` | Chamadas simples, sem estado, bem definidas. Testes existem (ProtectedRoute). | 2h | 🟢 Baixo |
| 2 | `profile.service.ts` | Usado em poucas telas, sem lógica complexa. | 1h | 🟢 Baixo |
| 3 | `avisos.service.ts` | CRUD simples. NovoAvisoModal já é isolado. | 1h | 🟢 Baixo |
| 4 | `leads.service.ts` | Unifica duplicação ReservarVaga + saveLead. Lógica de LGPD e fallback. | 3h | 🟡 Médio |
| 5 | `dashboard.service.ts` | Agregações em JS precisam de cuidado na extração. | 2h | 🟡 Médio |
| 6 | `cursos.service.ts` | Delete+re-insert de pré-requisitos é transação lógica. Maior atenção. | 3h | 🟠 Médio-Alto |

**Total estimado: ~12h de trabalho**

---

## Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| `syncPrerequisitos` falha no re-insert após o delete | Baixa | Alto — dados perdidos | Envolver em try/catch com rollback manual; adicionar teste |
| `getLeadsPorCurso` tem agregação em JS — mover para service pode quebrar se os dados mudarem de formato | Média | Médio | Manter agregação em JS no service, não mover para SQL ainda |
| `use-profile.tsx` tem lógica de fallback de role — extração prematura pode quebrar ProtectedRoute | Média | Alto — bypass de segurança | Extrair `profile.service.ts` antes e retestar ProtectedRoute |
| Testes existentes (ReservarVaga, ProtectedRoute) precisam ser atualizados para mockar o service em vez de `supabase.from` diretamente | Certo | Baixo — apenas refactor de mock | Atualizar testes na mesma PR do service |

---

## Padrão de Interface Proposto

Cada service exporta funções puras async que retornam `{ data, error }` — mesmo contrato do Supabase, sem expor o cliente:

```typescript
// Exemplo: leads.service.ts
export interface LeadPayload {
  nome: string;
  email: string;
  telefone: string;
  cidade?: string;
  curso_interesse: string;
  como_conheceu?: string;
  mensagem?: string;
}

export async function createLead(payload: LeadPayload): Promise<{ error: string | null }> {
  const { error } = await supabase.from('leads_cursos').insert({
    ...payload,
    interesse: 'candidato',
    lgpd_aceite: true,
  });
  if (error) {
    // fallback localStorage
    ...
    return { error: error.message };
  }
  return { error: null };
}
```

Vantagem: componentes não precisam saber que o backend é Supabase.
Futuro: trocar Supabase por outra API sem tocar em nenhum componente React.

---

## Decisão

Esta ADR está em status **PROPOSTA**. Nenhum arquivo de código foi modificado.

Para aprovar: revisar a ordem de extração e confirmar se algum service deve ser
priorizado ou adiado com base no roadmap atual do produto.

Para implementar: criar um SDD por service, seguindo a ordem acima,
com commits isolados e testes atualizados em cada PR.

---

*ADR-002 — gerado pelo Agente 01 (Arquiteto) — 2026-05-25*  
*Nenhum arquivo de código foi modificado nesta análise*
