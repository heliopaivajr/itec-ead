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

**↓ REBAIXADO (auditoria 2026-07-05, report-B):** a premissa estava errada. `user_roles`
**não é tabela — é VIEW** sobre `profiles` (migração 032, criada como projeção sem RLS
para evitar recursão — ADR-006). Consequência: o `upsert()` roda contra uma view **sem
PK/unique constraint**, então o `ON CONFLICT` implícito **falha sempre** (42P10) — não
é uma falha ocasional a mitigar, é permanente. Mas dessincronização é **impossível**:
a view é uma projeção 1:1 de `profiles.role`, que já é atualizado (com tratamento de
erro) na linha anterior de cada caller. Não há estado de cache para dessincronizar.

**Reclassificação:** de "risco médio de permissões erradas" para **código morto
inofensivo** — 3 upserts redundantes que sempre falham e são engolidos (silenciosos,
mas sem efeito, porque não há nada para sincronizar):
- `src/services/matriculas.service.ts:187` (`aplicarAcesso`)
- `src/services/usuarios.service.ts:206` (`updateRole`)
- `supabase/functions/criar-aluno/index.ts:158` (roda como `service_role`)

**Severidade:** Baixa (era Média/P1). **Remediação real = SEC-02** (remover as 3 linhas
mortas) — fica no backlog de limpeza, não bloqueia lançamento.

O risco de segurança de fato associado a `user_roles` era outro, mais grave: ver **SEC-01**
abaixo (grants indevidos na view permitindo escalação de privilégio) — **✅ RESOLVIDO**.

**Status:** ✅ reclassificado (não é mais risco de RLS) — SEC-02 (limpeza de código) aberto no backlog

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

---

## PADRAO-001 — Cast de joins aninhados do Supabase: usar `as unknown as X[]`

**Data:** 2026-06-03
**Contexto:** Padrão recorrente desde Sprint D — presente em 8+ services
**Não é um erro:** É um workaround necessário e estabelecido para os tipos do Supabase PostgREST

**Problema:** O TypeScript infere joins aninhados como `{ campo: TipoJoin[] }` (array) em vez de `TipoJoin | null`. Qualquer cast direto como `data as MinhaInterface[]` falha com TS2352 porque os tipos não se sobrepõem.

**Padrão correto estabelecido no projeto:**
```typescript
// ✅ CORRETO — via unknown como intermediário
const rows = (data ?? []) as unknown as MinhaInterface[];

// ✅ CORRETO — com verificação de array para join singular
const perfil = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;

// ❌ ERRADO — as any direto (sem rastreabilidade de tipo)
const rows = (data ?? []) as any[];
```

**Onde já está aplicado:**
- `ficha-aluno.service.ts` — MatriculaFicha (turma join)
- `frequencia.service.ts` — MatriculaRow, MatDiscRow
- `academico.service.ts` — DiscRow, getHistoricoAluno
- `turmas.service.ts` — AlunoTurma (profiles join)
- `notas.service.ts` — getConsolidadoTurma, getNotasBatchByAluno

**Regra:** Todo novo service com join aninhado → usar `as unknown as X[]`, nunca `as any`. Se o Agente 12 (code-reviewer) encontrar `as any` em um service, marcar como "Melhoria Importante" e propor troca pelo padrão.

**Status:** padrão estabelecido — não é erro

---

---

## ERR-SEED-001 — Seed de testes não insere em user_roles

**Data:** 2026-06-04
**Sprint:** Identificado no ciclo pós-Sprint N
**Contexto:** `supabase/seed/seed_testes.sql` cria 15 usuários (5 prof + 10 aluno) mas não insere em `user_roles`

**Problema:**
Quando o RLS em `profiles` for ativado (Sprint RLS), as policies das tabelas que dependem de `user_roles` para checar roles vão falhar para todos os usuários de teste — silenciosamente (sem erro explícito, apenas dados vazios ou acesso negado).

**Correto:**
Adicionar ao final do seed:
```sql
INSERT INTO public.user_roles (user_id, role) VALUES
  (u_prof1,'professor'),(u_prof2,'professor'),(u_prof3,'professor'),
  (u_prof4,'professor'),(u_prof5,'professor'),
  (u_aluno1,'aluno'),(u_aluno2,'aluno'),(u_aluno3,'aluno'),
  (u_aluno4,'aluno'),(u_aluno5,'aluno'),(u_aluno6,'aluno'),
  (u_aluno7,'aluno'),(u_aluno8,'aluno'),(u_aluno9,'aluno'),
  (u_aluno10,'aluno')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
```

**Quando fazer:** No início do Sprint RLS, antes de ativar RLS em `profiles`.

**Status:** identificado — Sprint RLS

---

## ERR-RLS-002 — Conta secretaria@itecedu.com pode não ter user_roles

**Data:** 2026-06-04
**Sprint:** Identificado no ciclo pós-Sprint N
**Contexto:** A conta `secretaria@itecedu.com` foi criada via SQL pelo agente-Osabio. O INSERT em `user_roles` estava incluído no SQL fornecido, mas pode não ter sido executado se Hélio rodou apenas parte do bloco.

**Diagnóstico:**
```sql
SELECT p.email, ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE p.email = 'secretaria@itecedu.com';
-- Se ur.role for NULL → user_roles está faltando
```

**Correto (se user_roles estiver faltando):**
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'administracao' FROM public.profiles WHERE email = 'secretaria@itecedu.com'
ON CONFLICT (user_id) DO NOTHING;
```

**Quando fazer:** Verificar antes do Sprint RLS. Sintoma atual: `criarEvento()` retorna "Erro ao verificar permissão" ao criar eventos como secretaria.

**Status:** identificado — verificar antes do Sprint RLS

---

## BUG-RLS-001 — Join aninhado com RLS em ambas tabelas retorna vazio sem erro

**Data:** 2026-06-06
**Sprint:** RLS Segurança
**Agente envolvido:** Supabase/PostgREST (limitação da plataforma, não do agente)
**Tipo de erro:** segurança + performance
**Gravidade:** alta

**Descrição:**
Query `.select('*, matriculas(id, status, created_at)')` em `getAlunos()` retornava array vazio quando RLS estava ativo em AMBAS as tabelas (`profiles` e `matriculas`). SQL Editor direto retornava 1 aluno ✅, mas UI mostrava "Nenhum aluno cadastrado" ❌.

**Como foi descoberto:**
Hélio reportou que a página `/dashboard/alunos` estava vazia após ativar RLS, mas SQL Editor com service_role mostrava dados. Agente 12 diagnosticou via log de erro no service.

**Causa provável:**
Supabase/PostgREST tem limitação conhecida: joins aninhados + RLS ativo em AMBAS as tabelas podem falhar silenciosamente. Policy de cada tabela isoladamente funcionava, mas o join combinado falhava sem erro explícito.

**Impacto:**
Página `/dashboard/alunos` completamente vazia após migrations 033 e 035. Feature crítica quebrada em produção.

**Correção aplicada:**
Refatorar `getAlunos()` para usar queries separadas + merge manual:
```typescript
// Query 1: buscar profiles
const { data: profiles } = await supabase.from('profiles').select('*').in('role', ['aluno', 'pendente']);
// Query 2: buscar matriculas separadamente
const { data: matriculas } = await supabase.from('matriculas').select('*').in('aluno_id', profileIds);
// Merge manual no service
```

**Como evitar no futuro:**
Ao ativar RLS em uma tabela que é usada em joins aninhados: (1) verificar se a outra tabela também tem RLS; (2) se sim, preferir queries separadas; (3) testar na UI real antes de deploy.

**Prompt precisa melhorar?** Sim — Agente 04 deve incluir checklist: "Se migration ativa RLS, verificar todos os services que fazem join com essa tabela e testar."
**Skill precisa melhorar?** Sim — Agente 05 deve documentar padrão de queries separadas quando ambas tabelas têm RLS.
**Checklist precisa melhorar?** Sim
**Documento precisa melhorar?** Sim — adicionar em CLAUDE.md: "Joins aninhados + RLS = queries separadas"

**Status:** corrigido
**Aprovado pelo Hélio:** Sim

---

## BUG-RLS-002 — Erro de RLS silenciado no service sem log

**Data:** 2026-06-06
**Sprint:** RLS Segurança
**Agente envolvido:** 05-backend-engineer (código legado de sprints anteriores)
**Tipo de erro:** documentação + debugging
**Gravidade:** média

**Descrição:**
`getAlunos()` fazia fallback silencioso: `if (error) return { data: [], total: 0 }` sem logar o erro. Quando RLS bloqueou a query, componente não tinha como saber — apenas recebia array vazio. Hélio achou que era bug de lógica, não erro de RLS.

**Como foi descoberto:**
Agente 12 diagnosticou durante investigação do BUG-RLS-001. Sugeriu adicionar log antes do fallback.

**Causa provável:**
Código escrito antes do Sprint RLS não previa que errors relacionados a RLS precisariam de diagnóstico visual. Padrão de "silenciar erro + fallback" era aceitável para erros de rede, mas não para RLS.

**Impacto:**
Diagnóstico de BUG-RLS-001 levou ~30 minutos a mais porque o erro não aparecia no Console do DevTools.

**Correção aplicada:**
```typescript
const { data, count, error } = await query;
if (error) {
  console.error('[getAlunos] RLS error:', error);  // ← ADICIONADO
  return { data: [], total: 0 };
}
```

**Como evitar no futuro:**
NUNCA fazer `if (error) return fallback` sem `console.error(contexto, error)` antes. Todo service deve logar erros de query mesmo que tenha fallback.

**Prompt precisa melhorar?** Sim — Agente 05 deve incluir no checklist: "Todo fallback de error deve logar o erro antes."
**Skill precisa melhorar?** Sim — padrão de error handling
**Checklist precisa melhorar?** Sim
**Documento precisa melhorar?** Não

**Status:** corrigido
**Aprovado pelo Hélio:** Não necessário

---

## BUG-UI-001 — Rota /dashboard/alunos/:id não registrada no React Router

**Data:** 2026-06-06
**Sprint:** RLS Segurança (identificado durante teste manual)
**Agente envolvido:** 06-frontend-engineer (código legado de Sprint M)
**Tipo de erro:** outro (omissão de rota)
**Gravidade:** média

**Descrição:**
Componente `FichaAluno.tsx` existe e funciona, mas a rota `/dashboard/alunos/:id` não foi registrada no React Router. Clique no botão "Ver Ficha" na lista de alunos retorna 404.

**Como foi descoberto:**
Hélio testou manualmente a tela de Alunos após aplicar RLS. Tentou clicar em "Ver Ficha" e recebeu 404.

**Causa provável:**
`FichaAluno.tsx` foi criado no Sprint M como parte da migração do sistema, mas a rota não foi adicionada em `src/routes.tsx` ou no arquivo de rotas correspondente. Possível esquecimento durante merge ou implementação parcial.

**Impacto:**
Feature "Ver Ficha" completamente inacessível pela UI. Usuários não conseguem ver detalhes do aluno.

**Correção aplicada:**
Nenhuma ainda — registrado como pendência para próximo sprint (não faz parte do Sprint RLS).

**Como evitar no futuro:**
Ao criar novo componente de página: (1) criar componente; (2) registrar rota; (3) testar navegação ANTES do commit. Componente sem rota = feature invisível.

**Prompt precisa melhorar?** Sim — Agente 06 deve incluir: "Componente de página criado? Registrar rota imediatamente."
**Skill precisa melhorar?** Sim — checklist de entrega
**Checklist precisa melhorar?** Sim
**Documento precisa melhorar?** Não

**Status:** identificado — pendente para próximo sprint
**Aprovado pelo Hélio:** Não necessário (será tratado posteriormente)

---

## BUG-ACAD-001 — verificarPrerequisitos ignorava excecoes_prerequisito

**Data:** 2026-06-11
**Sprint:** sprint-relatorios-r02-r03-r06 (identificado durante revisão)
**Agente envolvido:** 05-backend-engineer
**Tipo de erro:** regra de negócio violada
**Gravidade:** alta

**Descrição:**
`verificarPrerequisitos` e `verificarPrerequisitosBatch` em `matricula-academica.service.ts` verificavam apenas `prerequisitos_v2` para bloquear matrícula, ignorando completamente a tabela `excecoes_prerequisito`. Alunos com exceção aprovada pela coordenação eram incorretamente bloqueados de se matricular.

**Como foi descoberto:**
Revisão pós-sprint identificou que nenhum dos dois métodos consultava `excecoes_prerequisito`.

**Causa provável:**
Tabela `excecoes_prerequisito` criada na migration 008, mas a lógica dos services foi implementada em sprint posterior sem cruzar com a tabela de exceções.

**Impacto:**
Alunos com exceção legítima (aprovada pela coordenação) impedidos de matricular-se em disciplinas. Erro de negócio grave — secretaria não conseguia efetivar matrícula mesmo com documento de exceção em mãos.

**Correção aplicada:**
Ambos os métodos corrigidos para consultar `excecoes_prerequisito` antes de bloquear: se existir exceção ativa para o aluno + disciplina, o pré-requisito é considerado cumprido.

**Como evitar no futuro:**
Ao implementar qualquer lógica de validação que tenha tabela de exceção correspondente no schema, sempre incluir a consulta à tabela de exceção no mesmo método. Verificar migrations de tabelas relacionadas antes de implementar.

**Prompt precisa melhorar?** Sim — spec deve listar TODAS as tabelas envolvidas na regra de negócio, incluindo exceções.
**Skill precisa melhorar?** Sim — Agente 05 deve incluir: "Para validações com tabela de exceção, sempre consultar ambas."
**Checklist precisa melhorar?** Sim
**Documento precisa melhorar?** Não

**Status:** corrigido
**Aprovado pelo Hélio:** Sim

---

## ERR-RLS-003 — Calendário entregue sem policies INSERT/UPDATE/DELETE

**Data:** 2026-06-11
**Sprint:** Calendário RLS (identificado em revisão)
**Agente envolvido:** 04-db-architect
**Tipo de erro:** segurança
**Gravidade:** alta

**Descrição:**
A tabela `eventos_calendario` foi entregue com apenas a policy SELECT corretamente configurada. As policies INSERT, UPDATE e DELETE estavam ausentes. Usuários com role `administracao`, `admin` e `superadmin` não conseguiam criar, editar ou excluir eventos, apesar de terem acesso visual à interface.

**Como foi descoberto:**
Revisão pós-sprint de RLS confirmou ausência via `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'eventos_calendario'`.

**Causa provável:**
Migration de calendário focou na estrutura da tabela e na policy de leitura, sem completar o ciclo de policies de escrita.

**Impacto:**
Secretaria (administracao) e admin sem capacidade de gerenciar o calendário acadêmico. Feature entregue parcialmente.

**Correção aplicada:**
Migration complementar com policies INSERT/UPDATE/DELETE usando `user_roles` como fonte de roles (padrão anti-recursão — LICAO-007/025).

**Como evitar no futuro:**
Checklist obrigatório ao criar RLS em tabela editável: SELECT + INSERT + UPDATE + DELETE. Tabela com apenas SELECT é tabela read-only — documentar isso explicitamente se for intencional.

**Status:** corrigido
**Aprovado pelo Hélio:** Sim

---

## ERR-RLS-004 — Agente assumiu nomes de policies sem verificar no banco

**Data:** 2026-06-11
**Sprint:** sprint-rls-completo (migration 037)
**Agente envolvido:** 04-db-architect / 11-security-auditor
**Tipo de erro:** prompt fraco / spec incorreta
**Gravidade:** média

**Descrição:**
Ao propor DROP de policies antigas em `taxa_matricula`, o agente inferiu os nomes das policies com base nas convenções do projeto. O nome real no banco era `taxa_aluno_ve_propria` — diferente do nome assumido. O `DROP POLICY` falhou com "policy not found". A migration precisou ser corrigida antes de ser executada.

**Como foi descoberto:**
Hélio executou a migration no SQL Editor e recebeu erro. Consultou `pg_policies` e identificou o nome correto.

**Causa provável:**
Agente leu migrations para inferir nomes, mas policies podem ter sido criadas com nomes diferentes dos inferidos, ou alteradas manualmente. Apenas o banco sabe o nome real.

**Impacto:**
Migration travada até correção manual. Sem impacto em dados — o erro ocorreu antes de qualquer mudança.

**Correção aplicada:**
Workflow corrigido: consultar `SELECT policyname FROM pg_policies WHERE tablename = 'X'` antes de qualquer `DROP POLICY`. Usar o nome exato retornado.

**Como evitar no futuro:**
NUNCA inferir nomes de policies — sempre verificar no banco via `pg_policies`. O Supabase MCP read-only permite essa verificação sem risco.

**Prompt precisa melhorar?** Sim — migrations com DROP POLICY devem incluir etapa de verificação prévia.
**Skill precisa melhorar?** Sim — Agente 04 deve incluir verificação de `pg_policies` como passo obrigatório antes de DROP.
**Checklist precisa melhorar?** Sim
**Documento precisa melhorar?** Não

**Status:** corrigido
**Aprovado pelo Hélio:** Sim

---

## ACHADOS DO BLOCO 0 (Plano Mestre v2.1 — diagnóstico 2026-06-19)

> Estado real dos dados confirmado no fechamento do Bloco 0. Fonte: `.ai-system/memory/PLANO-MESTRE-v2_1.md` §2.
> Volumetria: cursos 1 · turmas 3 (TEO-2025-1=24, TEO-2026-1=7, TEO-2026-2=0) · modulos 6 · disciplinas_v2 46 · disciplinas(legada) 46 · prerequisitos 24 · professores 10 (8 ativos) · matriculas 31 (ativa 28/trancada 2/evadida 1).

---

## ERR-DATA-F1 — `matriculas_disciplina` = 0 linhas (31 alunos "ativo sem disciplina")

**Data:** 2026-06-19
**Tipo de erro:** dados ausentes / dívida de migração de dados
**Gravidade:** alta
**Descrição:** Há 31 matrículas (28 ativas) mas a tabela `matriculas_disciplina` está vazia — nenhum aluno tem cadeira/nota/falta registrada.
**Impacto:** Histórico acadêmico, dashboards e relatórios ficam vazios para todos os alunos atuais.
**Correção planejada:** Sprint **R2 (Lançamento Retroativo)** — secretaria encaixa aluno×cadeira com nota, faltas, situação, professor e observação (dados 2025).
**Status:** aberto — endereçado em R2

---

## ERR-DATA-F2 — `contratos_professor` = 0 e `solicitacoes_disciplina` = 0 (nenhum professor vinculado)

**Data:** 2026-06-19
**Tipo de erro:** dados ausentes
**Gravidade:** média
**Descrição:** Apesar de 10 professores cadastrados (8 ativos), não há contratos nem solicitações professor↔disciplina↔turma. Nenhum docente está vinculado a cadeira/turma.
**Impacto:** Não é possível atribuir notas/frequência por professor; reforça a decisão da migration 037 §2 (restrição de professor por contrato) estar ADIADA.
**Correção planejada:** Vincular professores na entrada retroativa (R2).
**Status:** aberto — endereçado em R2

---

## ERR-DATA-F3 — `notas_aluno` sem policy RLS (deny-all); `avaliacoes` só SELECT

**Data:** 2026-06-19
**Tipo de erro:** segurança / RLS incompleta
**Gravidade:** alta
**Descrição:** `notas_aluno` tem RLS ativo mas **sem policies** → deny-all (ninguém lê/escreve via API). `avaliacoes` só tem policy de SELECT.
**Impacto:** Lançamento e leitura de notas pela UI não funcionam até criar policies (aluno vê as próprias; professor as da sua disciplina; staff tudo).
**Correção planejada:** Sprint **R3** — criar policies de `notas_aluno` (aluno/professor/staff) seguindo LICAO-026 (query separada + merge, nunca join aninhado).

**✅ RESOLVIDO (R3.0 — 2026-06-30):** A premissa estava **errada**. `notas_aluno` **NÃO** era deny-all — as policies já existiam desde a **migração 023** (2026-05-29) e foram reescritas na **031** (2026-06-03, via `user_roles` p/ evitar recursão, ADR-006). RLS confirmada ligada por query (`rls_ligada=true`). Policies vigentes:
- **SELECT:** `aluno_id = auth.uid()` OU staff (`admin/superadmin/administracao/professor`).
- **INSERT/UPDATE:** `auth.uid() = lancado_por` OU `admin/superadmin` → professor lança/edita as **próprias**.
- **DELETE:** só `superadmin`.

`LancarNotas.tsx`/`ConsolidadoNotas.tsx` **funcionam** hoje (não falham silenciosamente). Refinamento de granularidade (professor só das suas cadeiras via `contratos_professor`) registrado no IDEAS-BACKLOG — mesmo tema da migração 037 §2 adiada (depende de F2: contratos populados).
**Status:** ✅ resolvido (era falso-positivo do diagnóstico do Bloco 0). `avaliacoes` (só SELECT) segue como item à parte.

---

## ERR-DATA-F4 — `matriculas` sem policy "aluno vê a própria" (só `is_staff()`)

**Data:** 2026-06-19
**Tipo de erro:** segurança / RLS incompleta
**Gravidade:** média
**Descrição:** `matriculas` só permite acesso via `is_staff()`. O aluno não consegue ver a própria matrícula.
**Impacto:** Portal do aluno (Ficha 360 / dashboard) não exibe a matrícula do próprio usuário.
**Correção planejada:** Sprint **R3** — adicionar policy "aluno vê própria matrícula" (`aluno_id = auth.uid()`).
**Status:** aberto — endereçado em R3

---

## ERR-DATA-F5 — `matriculas.curso_id` é TEXT sem FK

**Data:** 2026-06-19
**Tipo de erro:** dívida técnica / integridade referencial
**Gravidade:** baixa
**Descrição:** `matriculas.curso_id` é `TEXT` sem foreign key para `cursos` (dívida técnica #5). O vínculo correto de turma usa `turma_id`.
**Impacto:** Risco de inconsistência de curso; sem integridade referencial garantida.
**Correção planejada:** Dívida técnica futura (não bloqueante para os sprints R0–R4).
**Status:** aberto — backlog técnico

---

## ERR-DATA-F6 — `disciplinas_v2.codigo` ≠ Manual (a legada é que bate com o Manual)

**Data:** 2026-06-19
**Tipo de erro:** divergência de dados / reconciliação
**Gravidade:** alta
**Descrição:** Os códigos em `disciplinas_v2` divergem do Manual ITEC; a tabela **legada** `disciplinas` é a que contém os códigos do Manual. Além disso, `prerequisitos_disciplinas` referencia a legada, não `disciplinas_v2`.
**Impacto:** Pré-requisitos não resolvem em `disciplinas_v2`; divergência de código entre sistema e documento oficial.
**Correção planejada:** Sprint **R0 (Reconciliação)** — padronizar `disciplinas_v2.codigo` = Manual, re-apontar 24 pré-req para v2, depreciar legada. Ver LICAO-037.
**Status:** aberto — endereçado em R0 (próximo)

---

## ERR-LEGADO-001 — Trigger recursivo `trg_sync_user_roles`

**Data registrada:** 2026-06-19 (erro histórico)
**Tipo de erro:** banco / recursão de trigger
**Gravidade:** alta
**Descrição:** Trigger `trg_sync_user_roles` entrou em recursão ao sincronizar `profiles` ↔ `user_roles` (a escrita disparada pela própria sincronização re-disparava o trigger).
**Como evitar no futuro:** Triggers de sincronização devem ter guarda anti-recursão (ex.: checar se o valor mudou de fato / `pg_trigger_depth()` / flag de sessão) antes de re-escrever. Relacionado a ADR-006 (cache de user_roles anti-recursão RLS) e LICAO-007.
**Status:** registrado (histórico) — verificar estado real no banco antes de qualquer mexida em `user_roles`/`profiles`.

---

## ERR-LEGADO-002 — Embed ambíguo PGRST201 (relacionamento múltiplo no PostgREST)

**Data registrada:** 2026-06-19 (erro histórico)
**Tipo de erro:** Supabase/PostgREST — query
**Gravidade:** média
**Descrição:** PostgREST retornou **PGRST201** ("more than one relationship was found") ao fazer embed/join: há mais de uma FK possível entre as tabelas, e o embed ficou ambíguo.
**Como evitar no futuro:** Desambiguar o embed nomeando a FK explicitamente (`...select('*, profiles!matriculas_aluno_id_fkey(...)')`). Quando ambas as tabelas têm RLS, preferir **query separada + merge** (LICAO-026) em vez de embed. Manter `as unknown as X[]` como padrão de tipagem do join (PADRAO-001).
**Status:** registrado (histórico)

---

## ERR-LEGADO-003 — Enum/CHECK de status com gênero misturado (feminino × masculino)

**Data registrada:** 2026-06-19 (erro histórico)
**Tipo de erro:** regra de negócio / consistência de schema
**Gravidade:** média
**Descrição:** Confusão recorrente entre gênero dos valores de status: `matriculas.status` é **feminino** (`ativa`, `trancada`...) enquanto `matriculas_disciplina.status` usa masculino (`cursando`, `aprovado`, `reprovado`, `convalidado`...). Specs assumiram o gênero errado.
**Como evitar no futuro:** Conferir o CHECK real de CADA tabela antes de especificar valores (LICAO-035 / D1). `matriculas` = feminino; `matriculas_disciplina` = masculino. Expansões de status são sempre **aditivas**.
**Status:** registrado (histórico) — trava de D1

---

## ERR-DEBT-002 — `cursos.service.ts` ainda usa a tabela LEGADA `disciplinas` (migrar na R0.5)

> ⚠️ Solicitado como "ERR-DEBT-001", mas esse ID já está em uso (código morto em Alunos.tsx). Registrado como **ERR-DEBT-002**.

**Data:** 2026-06-20
**Sprint:** R0 (Reconciliação) — débito empurrado para R0.5 (Opção B)
**Tipo de erro:** dívida técnica / divergência de fonte da verdade
**Gravidade:** média (alta após a migração 047 rodar)

**Descrição:**
A migração `20260619_047_r0_reconciliacao_prerequisitos.sql` reconcilia o **banco** (`prerequisitos_disciplinas` passa a apontar para `disciplinas_v2` com códigos v2 compactos, ex.: `B1ATG`). Mas o **código-fonte** continua acoplado à tabela legada e aos códigos-hífen:
- [src/services/cursos.service.ts:34](src/services/cursos.service.ts#L34) `getDisciplinas()` → `from('disciplinas')` (LEGADA)
- [src/services/cursos.service.ts:59](src/services/cursos.service.ts#L59) `updateDisciplina()` → `from('disciplinas').update().eq('codigo', ...)` (LEGADA)
- [src/data/disciplinas.ts](src/data/disciplinas.ts) — matriz seed + 24 pré-req com **códigos-hífen** (`B1-ANT01`), **usada em RUNTIME**:
  - [CursosAdmin.tsx:338-339](src/pages/dashboard/CursosAdmin.tsx#L338) fallback `localDisciplinas`/`localPrerequisitos` quando a tabela retorna 0 linhas
  - [CursosAdmin.tsx:87](src/pages/dashboard/CursosAdmin.tsx#L87) `disciplinaByCode()` em `PrereqChip` (sempre)

**Impacto / risco pós-migração 047:**
Depois que a migração rodar, `prerequisitos_disciplinas` terá códigos v2 (`B1ATG`), enquanto `CursosAdmin` lê disciplinas da legada/local com códigos-hífen (`B1-ANT01`). `disciplinaByCode(v2)` contra o array local hífen → `undefined` (cores/labels de pré-req podem degradar). Não quebra o build (vite/esbuild não faz type-check), mas é divergência visual/lógica.

**Decisão (Opção A — fechamento mínimo seguro):**
NÃO migrar `cursos.service.ts` agora. A tabela legada `disciplinas` permanece intacta (a migração 047 **não a deleta**), então a leitura atual continua funcionando e os testes de `cursos.service.test.ts` seguem passando (6/6 ✅).

**Como evitar/quitar no futuro (Opção B — R0.5):**
Migrar `getDisciplinas`/`updateDisciplina` para `disciplinas_v2`; substituir/remover `src/data/disciplinas.ts` como fonte de runtime (manter só tipos/labels ou eliminar); atualizar `cursos.service.test.ts` para códigos v2; só então depreciar/derrubar a tabela legada `disciplinas`.

**Prompt precisa melhorar?** Não
**Skill precisa melhorar?** Não
**Checklist precisa melhorar?** Sim — R0.5 deve incluir "trocar fonte de runtime de disciplinas para disciplinas_v2".
**Documento precisa melhorar?** Não

**✅ QUITADO em 2026-06-20 (R0.5, branch `feat/r0-5-gestao-curriculo`):**
- `cursos.service.ts` virou adapter sobre `disciplinas_v2`/`modulos`/`prerequisitos_v2` (chave por `id`; merge de `modulos.ordem` via query separada — LICAO-026).
- `CursosAdmin.tsx` migrado para o vocabulário v2; removidos o fallback `localDisciplinas/localPrerequisitos`, o banner "Tabela não encontrada" e o `!usingLocal`.
- `src/data/disciplinas.ts` **deletado** (estava órfão — `grep @/data/disciplinas` = 0 em runtime).
- `cursos.service.test.ts` reescrito para códigos/tabelas v2 (7/7 ✅).
- Migração `20260620_048_r0_5_consolida_curriculo_v2.sql` consolida o currículo v2 (coluna `ativo`, CHECK `recomendado`, repopular `prerequisitos_v2`).
- ⚠️ Resta (R0.5 continuação): a tabela LEGADA `disciplinas` + `prerequisitos_disciplinas` ainda existem no banco; depreciar/derrubar após o run das migrações 047/048.

**Status:** corrigido (QUITADO)
**Aprovado pelo Hélio:** Sim (R0.5 aprovado)

---

## SEC-01 — Escalação de privilégio via grants indevidos na VIEW `user_roles`

**Data:** 2026-07-05 (achado) / 2026-07-06 (resolvido)
**Agente envolvido:** 11-security-auditor (auditoria report-B) / 04-db-architect (migração)
**Tipo de erro:** segurança / RLS — escalação de privilégio
**Gravidade:** CRÍTICA (bloqueador de lançamento)

**Descrição:**
`user_roles` é uma VIEW sobre `profiles` (migração 032, criada para servir de fonte de
role às policies sem recursão — ADR-006), mas a 032 nunca fez nenhum `REVOKE`. Com os
grants default do Supabase, `anon`/`authenticated` herdavam INSERT/UPDATE/DELETE na
view. Como a view é auto-atualizável e executa como a **dona** (bypassa o RLS de
`profiles`), qualquer usuário autenticado podia fazer:
```
PATCH /rest/v1/user_roles?user_id=eq.<seu-id>  {"role":"superadmin"}
```
e escrever direto em `profiles.role`, **contornando** as policies P5/P6 (033) que
protegem esse campo contra auto-promoção.

**Como foi descoberto:**
Auditoria de segurança/RLS (Parte B, 2026-07-05) — leitura de todas as migrations de
policies e grants; análise dos privilégios default de views no Postgres/Supabase.

**Causa provável:**
A 032 focou em resolver a recursão (ADR-006) e assumiu implicitamente que uma view
"para uso interno de policies" não precisava de REVOKE explícito — grants default do
schema `public` se aplicam a views como se fossem tabelas.

**Impacto:**
Nenhum incidente confirmado (não há evidência de exploração). Risco era de escalação
total de privilégio por qualquer aluno autenticado.

**Correção aplicada:**
Migração `20260706_054_sec01_revoke_user_roles.sql`:
- `REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` de `anon` e `authenticated`;
- `REVOKE SELECT` de `anon` (authenticated mantém SELECT — as policies dependem disso).

⚠️ **Não** foi usado `security_invoker = true` na view — isso reintroduziria a recursão
infinita do ADR-006 (`profiles_select_staff` consulta `user_roles`, que sob invoker
voltaria a ler `profiles` sob RLS, reavaliando a mesma policy). O REVOKE sozinho já
fecha a escalação: sem privilégio de escrita, o UPDATE morre antes de alcançar a view.

**Como evitar no futuro:**
Toda VIEW criada para uso em policies RLS (padrão "sem RLS, definer implícito") deve
vir com REVOKE explícito de escrita para `anon`/`authenticated` **na mesma migração**
que a cria — nunca assumir que grants default são seguros para views auto-atualizáveis.

**Prompt precisa melhorar?** Sim — Agente 04 (db-architect) deve incluir no checklist:
"Toda CREATE VIEW usada por policies: REVOKE explícito de INSERT/UPDATE/DELETE para
anon/authenticated, a menos que a escrita seja intencional e documentada."
**Skill precisa melhorar?** Sim — checklist de migrations do Agente 04
**Checklist precisa melhorar?** Sim
**Documento precisa melhorar?** Sim — nota adicionada em [[ERR-RISK-001]] (rebaixado:
o upsert que "sincronizava" essa view era código morto, não o risco real)

**Status:** ✅ RESOLVIDO (migração 054 aplicada e validada — `anon` sem privilégios,
`authenticated` só `SELECT`)
**Aprovado pelo Hélio:** Sim (fluxo de auditoria → PR `fix/sec01-user-roles`)

---

*Mantido pelo agente-Osabio · ITEC-EAD · 2025*
