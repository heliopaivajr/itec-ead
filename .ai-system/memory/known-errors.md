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

*Mantido pelo agente-Osabio · ITEC-EAD · 2025*
