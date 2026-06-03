# Erros Conhecidos dos Agentes
## ITEC-EAD · Memória Técnica
**Mantido por:** agente-Osabio  
**Última atualização:** 2026-05-29

---

> **Propósito:** Todo erro cometido por um agente deve ser registrado aqui.
> Um erro não registrado é um erro que vai se repetir.
> Um erro registrado é uma lição que protege o projeto.

---

## Como Registrar um Erro

Copie o template abaixo e preencha todos os campos.
Não deixe campos em branco — se não souber, coloque "a investigar".

```markdown
---

## ERR-[número sequencial] — [título curto do erro]

**Data:** [YYYY-MM-DD]
**Agente envolvido:** [qual agente cometeu o erro]
**Tipo de erro:** [prompt fraco | fora do escopo | regra de negócio violada | segurança | performance | documentação | outro]
**Gravidade:** [baixa | média | alta | crítica]

**Descrição:**
[O que aconteceu de forma objetiva]

**Como foi descoberto:**
[Quem identificou e como]

**Causa provável:**
[Por que o agente errou — falta de instrução? prompt ambíguo? skill ausente? fora do escopo?]

**Impacto:**
[O que foi afetado — código, dados, fluxo, usuário]

**Correção aplicada:**
[O que foi feito para corrigir]

**Como evitar no futuro:**
[Instrução específica que deve ser adicionada ao agente]

**Prompt precisa melhorar?** [Sim / Não — se sim, qual parte]
**Skill precisa melhorar?** [Sim / Não — se sim, qual skill]
**Checklist precisa melhorar?** [Sim / Não — se sim, qual checklist]
**Documento precisa melhorar?** [Sim / Não — se sim, qual documento]

**Status:** [aberto | em análise | corrigido | verificado]
**Aprovado pelo Hélio:** [Sim / Não / Não necessário]
```

---

## Registro de Erros

---

## ERR-001 — Agente 20 referenciou coluna inexistente em spec de performance

**Data:** 2026-05-29
**Agente envolvido:** 20-project-manager
**Tipo de erro:** prompt fraco / spec incorreta
**Gravidade:** média

**Descrição:**
O spec do Sprint J especificou `getResumoFrequenciaBatch(turmaId)` com filtro `WHERE turma_id = X`. A tabela `frequencia` não possui coluna `turma_id` (ver migration 011). O erro foi detectado pelo agente implementador antes de causar falha de runtime.

**Como foi descoberto:**
O agente 05 leu a migration 011 antes de implementar e identificou que `turma_id` não existe em `frequencia`.

**Causa provável:**
O Agente 20 inferiu que a tabela teria `turma_id` por analogia com outras tabelas (ex: `notas_aluno`), sem verificar o schema real.

**Impacto:**
Nenhum no código final — o erro foi corrigido preventivamente. Potencial: query SQL com coluna inexistente retornaria erro silencioso do Supabase.

**Correção aplicada:**
Função implementada como `getResumoFrequenciaPorTurma(disciplinaId, alunoIds?)` com filtro correto por `disciplina_id` + `IN (alunoIds)`.

**Como evitar no futuro:**
Agente 20 deve incluir no checklist de spec: "Para tasks com filtro SQL, consultar a migration da tabela e confirmar o nome exato da coluna antes de especificar."

**Prompt precisa melhorar?** Sim — adicionar instrução ao SKILL.md do Agente 20: "Antes de nomear colunas em specs de query, verificar migrations existentes."
**Skill precisa melhorar?** Sim — checklist de spec do Agente 20
**Checklist precisa melhorar?** Sim — adicionar item de validação de schema
**Documento precisa melhorar?** Não

**Status:** corrigido
**Aprovado pelo Hélio:** Não necessário

---

## ERR-002 — WARN-UX-001: LancarNotas não acessível pela UI do professor

**Data:** 2026-05-29
**Agente envolvido:** 06-frontend-engineer
**Tipo de erro:** outro (omissão de navegação)
**Gravidade:** baixa

**Descrição:**
A tela `LancarNotas.tsx` foi criada com rota `/dashboard/professor/notas/:turmaId/:disciplinaId`, mas nenhum link no `ProfessorHome.tsx` ou sidebar aponta para ela. A feature funciona se acessada diretamente pela URL, mas não é descobrível pelo professor na UI atual.

**Como foi descoberto:**
Revisão do Agente 12 (code review) durante checklist final do Sprint J.

**Causa provável:**
`ProfessorHome.tsx` não expõe `turmaId` facilmente para gerar o link correto. O agente priorizou implementar a tela em vez de bloquear o sprint esperando a integração com o componente pai.

**Impacto:**
Feature criada mas inacessível pela UI. Nenhum dado comprometido.

**Correção aplicada:**
Nenhuma ainda — registrado como pendência para Sprint J-ext ou K.

**Como evitar no futuro:**
Ao criar tela com parâmetros de rota obrigatórios, verificar se o componente pai tem acesso a esses parâmetros e criar o link de entrada. Se não tiver, incluir a criação do link como subtask obrigatória no mesmo sprint.

**Prompt precisa melhorar?** Sim — Agente 06 deve incluir no checklist: "A nova tela tem ponto de entrada acessível pela UI atual?"
**Skill precisa melhorar?** Sim — checklist de entrega do Agente 06
**Checklist precisa melhorar?** Sim
**Documento precisa melhorar?** Não

**Status:** corrigido
**Aprovado pelo Hélio:** Não necessário

---

## ERR-SCHEMA-001

**Data:** 2026-05-29
**Sprint:** J
**Agente:** 20-project-manager
**Erro:** Spec referenciou coluna `turma_id` em tabela `frequencia`
      que não existe. Correto: `disciplinaId` + `alunoIds[]`.
**Prevenção:** MELHORIA-001 aplicada no SKILL.md do Agente 20.

---

## ERR-UX-001

**Data:** 2026-05-29
**Sprint:** J
**Agente:** 06-frontend-engineer
**Erro:** `LancarNotas.tsx` entregue sem ponto de entrada na UI.
      Professor não conseguia acessar sem URL manual.
**Prevenção:** MELHORIA-002 aplicada no SKILL.md do Agente 06.

---

## ERR-SUPABASE-001

**Data:** 2026-05-29
**Sprint:** fix-professor-dashboard
**Contexto:** seed de usuários de teste inseridos manualmente em `auth.users`

**Erro:**
`ON CONFLICT (provider, user_id)` falhou com `42P10` porque `auth.identities`
não tem constraint unique nessa combinação. A PK real da tabela é `(id)`.

**Correto:**
```sql
ON CONFLICT (id) DO NOTHING
```

**Lição:**
Antes de usar `ON CONFLICT` em tabelas do schema `auth` do Supabase,
verificar a PK real com:
```sql
SELECT constraint_name, column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'auth' AND table_name = 'identities';
```

**Status:** corrigido

---

## ERR-SUPABASE-002

**Data:** 2026-05-30
**Sprint:** fix-ux-inline-edit
**Contexto:** Seed de usuários de teste com INSERT direto em `auth.users`

**Erro:**
Usuários criados diretamente em `auth.users` sem entrada em `auth.identities`
autenticam no GoTrue mas a sessão é inválida — sem `user_id` resolvível.
Resultado: HTTP 500 / "Database error querying schema" no login.

**Correto:**
Todo INSERT manual em `auth.users` deve ser acompanhado de INSERT em
`auth.identities` com `provider = 'email'` e `identity_data = json_build_object('sub', id::text, 'email', email)`.
Usar sempre o `seed_testes.sql` que já inclui os dois passos.

**Query de diagnóstico:**
```sql
SELECT u.email FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id
WHERE i.id IS NULL;
```

**Status:** corrigido

---

## ERR-SUPABASE-003

**Data:** 2026-05-30
**Sprint:** fix-ux-inline-edit
**Contexto:** Policy RLS com `is_staff()` consultando `profiles` para verificar role

**Erro:**
Função `is_staff()` fazia SELECT em `profiles` para checar role.
Ao fazer UPDATE em `profiles` (ex: trocar role), a policy de UPDATE
chamava `is_staff()` que fazia SELECT em `profiles` — recursão infinita.
Resultado: UPDATE bloqueado silenciosamente, sem erro explícito.

**Correto:**
Criar tabela `user_roles` (sem RLS) como cache de roles para uso em policies.
Policies nunca devem fazer SELECT em `profiles` — usar `user_roles` ou
`auth.jwt() ->> 'role'` para verificar roles em contexto de RLS.
Ver ADR-006 (proposto).

**Status:** identificado — ADR-006 proposto para sprint futuro

---

## ERR-DB-001

**Data:** 2026-05-30
**Sprint:** fix-ux-inline-edit
**Contexto:** InlineStatusSelect com opções que violam CHECK constraint

**Erro:**
Agente 20 especificou options para `matriculas.status` incluindo
`inativa`, `evadida`, `suspensa`. O CHECK constraint da tabela (migration 010)
não incluía esses valores — o `onSave` retornava erro silencioso do Supabase.

**Correto:**
Antes de especificar qualquer dropdown ou InlineStatusSelect com opções
de status, consultar o CHECK constraint da tabela:
```sql
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.matriculas'::regclass
AND contype = 'c';
```
Se os valores necessários não estiverem no CHECK, criar migration primeiro.

**Status:** corrigido — migration 022 aplicada com todos os status

---

## ERR-PLAN-001

**Data:** 2026-05-30
**Sprint:** fix-ux-inline-edit
**Contexto:** Agente 20 ordenou componente base DEPOIS das tarefas que o consomem

**Erro:**
Agente 20 posicionou a criação de `InlineStatusSelect` (Tarefa 1.5)
após as tarefas 1.3 (aluno) e 1.4 (professor) que precisam do componente.
O Hélio identificou e corrigiu a ordem manualmente antes da execução.

**Correto:**
Dependências de criação de componente UI são dependências reais de execução.
O componente base deve sempre preceder as tarefas que o consomem no plano.
Regra: "Se tarefa B usa artefato criado por tarefa A, então A → B no plano."

**Prevenção:** MELHORIA-003 aplicada no SKILL.md do Agente 20.

**Status:** corrigido

---

## ERR-RISK-001

**Data:** 2026-06-01
**Sprint:** fix-menus-dashboard
**Contexto:** `updateRole` em `usuarios.service.ts` faz upsert em `user_roles` após update em `profiles`

**Risco:**
```typescript
await supabase.from('user_roles').upsert({ user_id: userId, role });
// ↑ resultado ignorado — se falhar, user_roles fica dessincronizado de profiles
```
O erro do upsert é descartado silenciosamente. Se `user_roles` for usado por policies RLS como fonte de verdade, o usuário terá permissões erradas até o próximo login ou sync manual.

**Mitigação recomendada:**
```typescript
const { error: upsertErr } = await supabase.from('user_roles').upsert({ user_id: userId, role });
if (upsertErr) {
  // log ou alertar — não bloquear o fluxo, mas registrar
  console.error('user_roles sync failed:', upsertErr.message);
}
```

**Severidade:** Média — só impacta se `user_roles` for usado ativamente em policies. Hoje ADR-006 ainda não foi implementado.
**Status:** identificado — aguarda Sprint de auth para mitigar

---

## ERR-TYPE-001

**Data:** 2026-06-01
**Sprint:** fix-menus-dashboard
**Contexto:** `getRolesPermitidas` retorna `string[]` que pode incluir `'inativo'|'suspenso'|'trancado'`

**Risco:**
O type `UserRole` (em `use-profile.tsx`) não inclui esses valores. Componentes que fazem `user.role === 'inativo'` via TypeScript não terão suporte do compilador para esses casos.

**Correto (futuro):**
Ampliar `UserRole` para incluir os status de aluno inativo:
```typescript
export type UserRole = 'pendente' | 'aluno' | 'professor' | 'administracao' |
  'financeiro' | 'admin' | 'superadmin' | 'inativo' | 'suspenso' | 'trancado';
```
Ou criar um tipo separado `UserStatus` para os estados de matrícula.

**Severidade:** Baixa — aplicação funciona, apenas sem verificação TypeScript nesses casos.
**Status:** registrado — Sprint futuro de tipagem

---

## TODO-SPRINT-L-001 — Upload real de documentos do aluno

**Data:** 2026-06-01
**Contexto:** Tabela `documentos_aluno` existe no banco. Bucket Storage não criado. Decisão de adiar registrada em DECISAO-PRODUTO-001.
**Quando fazer:** Sprint L — após lançamento agosto 2026 e checklist visual em produção.

**O que fazer:**
1. Criar bucket privado `documentos-alunos` no Supabase Storage
2. Adicionar coluna `arquivo_url TEXT` em `documentos_aluno`
3. Signed URLs de 1 hora para download (obrigatório — dados pessoais, LGPD)
4. Botão "Upload" na ficha do aluno (secretaria + admin)
5. Botão "Download" na ficha do aluno (secretaria + admin + superadmin)

**Pré-requisito obrigatório:** checklist visual do Sprint K em produção e validado pela Camila.

**Referência:** `src/services/ficha-aluno.service.ts` → `documentos_aluno` já é lido e exibido.

**Status:** pendente — Sprint L

---

## TODO-SPRINT-L-002 — Ativar RLS em profiles (CRÍTICO antes de agosto 2026)

**Data:** 2026-06-01
**Prioridade:** 🔴 CRÍTICA — deve ser feito antes do lançamento de agosto 2026
**Decisão:** Adiado intencionalmente — risco baixo no ambiente atual (poucos usuários, controlado)
**Referência:** ADR-006 aprovado — SQL completo da migration 028 já documentado

**Risco se não fizer antes de agosto:**
Qualquer aluno pode fazer `supabase.from('profiles').update({role:'admin'}).eq('id', seuId)` diretamente via client, sem passar pelo service layer. CPF e RG de outros alunos acessíveis via SELECT direto.

**Pré-requisitos antes de ativar:**

1. Mapear todos os acessos diretos a `profiles` no código (nenhum pode bypassar o service):
   ```powershell
   Get-ChildItem -Recurse -Include *.ts,*.tsx src |
     Select-String "from\('profiles'\)"
   ```
   Resultado esperado: apenas arquivos de `src/services/` — nunca pages ou components.

2. Garantir que 100% dos acessos passam pelos services (`usuarios.service.ts`, `profile.service.ts`, etc.)

3. Verificar backfill completo de `user_roles` antes de ativar RLS:
   ```sql
   SELECT COUNT(*) FROM public.profiles p
   LEFT JOIN public.user_roles ur ON ur.user_id = p.id
   WHERE ur.user_id IS NULL;
   -- Deve retornar 0
   ```

4. Corrigir ERR-RISK-001 (`user_roles.upsert` sem tratamento de erro em `updateRole`)

5. Testar fluxo completo em staging antes de aplicar em produção

**SQL pronto:** Ver `.ai-system/adr/ADR-006-user-roles-cache-anti-recursao-rls.md` — seção "Implementação"

**Status:** pendente — Sprint L

---

## ERR-INFRA-001

**Data:** 2026-06-01
**Sprint:** K
**Contexto:** Tentativa de usar Supabase CLI para aplicar migrations e reparar histórico

**Erro:**
`failed to parse 20260601_025_exclusao_profiles: invalid version number`
O CLI do Supabase espera formato `YYYYMMDDHHMMSS` (14 dígitos).
Este projeto usa `YYYYMMDD_NNN_descricao` — incompatível.

**Impacto:**
`supabase db push`, `supabase migration repair` e `supabase migration list`
não funcionam corretamente com o formato de migration deste projeto.

**Solução definitiva:**
Migrations aplicadas sempre via **SQL Editor do Supabase** com role `service_role`.
Ver procedimento completo em `supabase/seed/RUNBOOK.md`.

**Status:** registrado — limitação permanente deste projeto

---

## ERR-DEBT-001 — Código morto em Alunos.tsx após substituição por InlineStatusSelect

**Data:** 2026-06-01
**Sprint:** K
**Contexto:** `statusConfig`, `sc` e `StatusIcon` ainda existem em `Alunos.tsx` mas nunca são usados

**Problema:**
Após substituir o `<span>` de status pelo `InlineStatusSelect` (Sprint fix-ux-inline-edit),
o `statusConfig` e as variáveis `sc`/`StatusIcon` ficaram no código como mortos.
Causam hint TS6133 mas não error — passam no build e nos testes.

**Correto:**
Remover `statusConfig`, `sc`, `StatusIcon` e ícones não usados de `Alunos.tsx`.

**Quando fazer:** Sprint L — limpeza de débito técnico (não urgente, não bloqueia).
**Status:** registrado — Sprint L

---

## CORRIGIDO-029 — Policies do calendário usavam `profiles` diretamente

**Data:** 2026-06-02
**Sprint:** L
**Contexto:** Migration 029 (`aulas_recorrentes` + `eventos_calendario`) criou policies que consultavam `public.profiles.role` diretamente para verificar permissão de escrita.

**Problema:**
```sql
-- ❌ ORIGINAL — risco de recursão quando RLS em profiles for ativado
USING (
  EXISTS (SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('administracao', 'admin', 'superadmin'))
)
```
Quando o RLS for ativado em `profiles` (Sprint L), policies de outras tabelas que fazem `SELECT FROM profiles` podem causar recursão silenciosa (ERR-SUPABASE-003 / LICAO-007).

**Correção aplicada no banco:**
Policies reescritas para usar `user_roles` (sem RLS) como fonte de roles:
```sql
-- ✅ CORRIGIDO — usa user_roles (sem RLS, sem recursão)
USING (
  EXISTS (SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role IN ('administracao', 'admin', 'superadmin'))
)
```

**Status:** ✅ Corrigido no banco (2026-06-02)

---

## ERR-EDGE-001 — Race condition na geração de codigo_itec

**Data:** 2026-06-02
**Sprint:** L
**Contexto:** Edge Function `criar-aluno` gera `codigo_itec` via `COUNT + 1`

**Risco:**
Duas requisições simultâneas para o mesmo ano contam o mesmo total → geram o mesmo código → a segunda falha com erro de unique violation na constraint `UNIQUE(codigo_itec)`. O usuário auth é criado mas o perfil não — estado parcialmente corrompido.

**Probabilidade:** Baixa hoje (poucos usuários). Aumenta com volume.

**Mitigação recomendada (Sprint futuro):**
```typescript
// Tratar o erro de unique violation e tentar sequencial +1
if (profileError?.code === '23505') {
  // tentar com COUNT + 2, + 3, até conseguir
}
```

**Status:** documentado — mitigar no Sprint M ou quando volume aumentar

---

## ERR-EDGE-002 — Rollback incompleto se deleteUser falha após profiles.upsert falhar

**Data:** 2026-06-02
**Sprint:** L
**Contexto:** Edge Function `criar-aluno` — passo 6 (profiles.upsert) com rollback

**Risco:**
Se `profiles.upsert` falha, o código tenta `auth.admin.deleteUser` para rollback. Se o `deleteUser` também falhar (timeout, erro de rede), o usuário fica em `auth.users` sem perfil correspondente — estado corrompido que só pode ser corrigido manualmente.

**Detecção:** usuário aparece em `auth.users` mas não em `profiles`. Query de diagnóstico:
```sql
SELECT u.email FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL AND u.email LIKE '%@%';
```

**Status:** documentado — risco baixo, monitorar

---

*Mantido pelo agente-Osabio · ITEC-EAD · 2025*
