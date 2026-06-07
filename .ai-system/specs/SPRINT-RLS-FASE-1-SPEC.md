# SPRINT RLS — FASE 1: SPEC TÉCNICA
**Status:** AGUARDANDO APROVAÇÃO DO HÉLIO
**Data:** 2026-06-06
**Autor:** Agente 12 (Claude Code)

---

## 📋 Contexto

### FASE 0 — Diagnóstico (CONCLUÍDO ✅)

**TAREFA 0.1:** Mapeamento `from('profiles')` fora de services
- ✅ Todos os acessos estão dentro de services (6 services)
- ⚠️ `ProtectedRoute.tsx:72` — 1 warmup check (`select('id').limit(1)`)

**TAREFA 0.2:** Perfis sem role
- ✅ `sem_user_roles = 0` (nenhum perfil sem role)

**DECISÃO:** Guards Opção A — redirecionar para `/dashboard` silenciosamente

---

## 🎯 Objetivo da Fase 1

Criar spec técnica completa para RLS em `profiles`, incluindo:
1. Migration SQL para tabela `user_roles` (se não existe)
2. Mapear todas as RLS policies necessárias
3. Plano de implementação seguro
4. Rollback plan

**⚠️ IMPORTANTE:** Esta fase é APENAS documentação. Nenhum código será implementado sem aprovação do Hélio.

---

## 📊 Análise de Uso — Tabela `profiles`

### Services que acessam `profiles`:

| Service | Queries | Contexto |
|---------|---------|----------|
| **profile.service.ts** | 4 | getRole (hot path), getProfile, uploadAvatar, upsertProfile |
| **usuarios.service.ts** | 13 | getUsuarios, getAlunos, CRUD de perfis, verificações de role |
| **dashboard.service.ts** | 1 | KPI contagem de alunos |
| **ficha-aluno.service.ts** | 1 | Dados do aluno para ficha |
| **matriculas.service.ts** | 1 | Join com matrículas |
| **matricula-academica.service.ts** | 1 | Disciplinas do aluno |

### Componentes que acessam `profiles`:

| Componente | Query | Justificativa |
|------------|-------|---------------|
| **ProtectedRoute.tsx:72** | `select('id').limit(1)` | Warmup do Supabase Free (evita timeout no cold start) |

---

## 🗄️ Estrutura Atual — Tabela `profiles`

Baseado nas migrations e uso atual:

```sql
-- Estrutura atual (consolidada das migrations)
CREATE TABLE public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name               TEXT NOT NULL,
  email                   TEXT,
  role                    TEXT NOT NULL DEFAULT 'pendente'
                          CHECK (role IN ('pendente', 'aluno', 'professor',
                                         'administracao', 'financeiro',
                                         'admin', 'superadmin')),
  telefone                TEXT,
  bio                     TEXT,
  avatar_url              TEXT,
  foto_url                TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Dados pessoais (migration 021)
  cpf                     TEXT,
  rg                      TEXT,
  data_nascimento         DATE,
  sexo                    TEXT CHECK (sexo IN ('masculino', 'feminino', 'outro')),
  endereco                TEXT,
  numero                  TEXT,
  complemento             TEXT,
  bairro                  TEXT,
  cidade                  TEXT,
  estado                  TEXT,
  cep                     TEXT,
  igreja_local            TEXT,
  observacoes_internas    TEXT,
  -- Fila de exclusão (migration 025)
  exclusao_solicitada_em  TIMESTAMPTZ,
  exclusao_motivo         TEXT
);
```

---

## 🔐 MIGRATION 1: Tabela `user_roles` (VIEW)

### Problema Identificado

Migrations `029_calendario_academico.sql` e `031_rls_user_roles_notas_frequencia.sql` usam `public.user_roles`, mas essa VIEW/tabela não foi criada ainda.

### Solução Proposta

Criar **VIEW** `user_roles` como projeção de `profiles.role` SEM RLS (evita recursão):

```sql
-- Migration: 20260606_032_user_roles_view.sql
-- Cria VIEW user_roles sem RLS para uso em policies
-- Referência: Sprint RLS Fase 1, ADR-006

-- DROP da view se já existe (idempotente)
DROP VIEW IF EXISTS public.user_roles CASCADE;

-- VIEW sem RLS — projeta apenas (user_id, role) de profiles
CREATE VIEW public.user_roles AS
  SELECT id AS user_id, role
  FROM public.profiles;

-- IMPORTANTE: VIEW não tem RLS
-- Isso evita recursão infinita em policies que verificam role
COMMENT ON VIEW public.user_roles
  IS 'Projeção de profiles sem RLS para uso em policies. '
     'Não adicionar RLS nesta view — isso causaria recursão infinita.';
```

### Rollback

```sql
-- Rollback: 20260606_032_user_roles_view_rollback.sql
DROP VIEW IF EXISTS public.user_roles CASCADE;
```

---

## 🔐 MIGRATION 2: RLS para `profiles`

### Padrões de Acesso Identificados

Baseado na análise dos 6 services:

1. **Leitura próprio perfil** → qualquer autenticado
2. **Leitura de outros perfis** → apenas staff (admin, superadmin, administracao)
3. **Update próprio perfil** → aluno pode atualizar dados pessoais
4. **Update role de outros** → apenas admin/superadmin
5. **Upload avatar próprio** → qualquer autenticado
6. **Delete perfil** → apenas superadmin

### Policies Propostas

```sql
-- Migration: 20260606_033_rls_profiles.sql
-- RLS para tabela profiles
-- Referência: Sprint RLS Fase 1, ADR-006

-- ─── 1. ATIVAR RLS ────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ─── 2. SELECT POLICIES ───────────────────────────────────────────────────

-- P1: Qualquer autenticado pode ler seu próprio perfil
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- P2: Staff pode ler todos os perfis
DROP POLICY IF EXISTS "profiles_select_staff" ON public.profiles;
CREATE POLICY "profiles_select_staff" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'administracao', 'financeiro', 'professor')
    )
  );

-- ─── 3. INSERT POLICIES ───────────────────────────────────────────────────

-- P3: Novos perfis só podem ser criados via Edge Function criar-aluno
--     ou pelo próprio usuário (signup)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- P4: Staff pode criar perfis para outros
DROP POLICY IF EXISTS "profiles_insert_staff" ON public.profiles;
CREATE POLICY "profiles_insert_staff" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'administracao')
    )
  );

-- ─── 4. UPDATE POLICIES ───────────────────────────────────────────────────

-- P5: Usuário pode atualizar seus próprios dados (exceto role)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (
      -- Garante que o usuário não está tentando mudar o próprio role
      role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  );

-- P6: Admin/superadmin pode atualizar qualquer perfil (incluindo role)
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

-- P7: Administração pode atualizar perfis (exceto role)
DROP POLICY IF EXISTS "profiles_update_administracao" ON public.profiles;
CREATE POLICY "profiles_update_administracao" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'administracao'
    )
  )
  WITH CHECK (
    -- Administração não pode mudar role de ninguém
    role = (SELECT role FROM public.profiles WHERE id = profiles.id)
  );

-- ─── 5. DELETE POLICIES ───────────────────────────────────────────────────

-- P8: Apenas superadmin pode deletar perfis
DROP POLICY IF EXISTS "profiles_delete_superadmin" ON public.profiles;
CREATE POLICY "profiles_delete_superadmin" ON public.profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'superadmin'
    )
  );

-- ─── 6. COMMENTS ──────────────────────────────────────────────────────────

COMMENT ON TABLE public.profiles
  IS 'Perfis de usuários com RLS ativo. '
     'Veja user_roles (VIEW sem RLS) para verificação de roles em policies.';
```

### Rollback

```sql
-- Rollback: 20260606_033_rls_profiles_rollback.sql
-- Remove todas as policies de profiles

DROP POLICY IF EXISTS "profiles_select_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_staff"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_staff"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_administracao"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_superadmin"     ON public.profiles;

-- Desabilita RLS (volta ao estado anterior)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

---

## 🔧 MIGRATION 3: Fix ProtectedRoute Warmup

### Problema

`ProtectedRoute.tsx:72` faz warmup query:
```typescript
supabase.from('profiles').select('id').limit(1)
```

Com RLS ativo, essa query pode:
1. Falhar se o usuário não tiver sessão ainda
2. Retornar vazio (não é um erro, mas pode confundir)

### Opções

**OPÇÃO A — Remover warmup**
- Aceitar cold start de 10-30s no Supabase Free
- Mais simples, menos código

**OPÇÃO B — Warmup em tabela pública sem RLS**
- Criar tabela `system_health` sem RLS apenas para warmup
- Mais complexo, mas mantém UX

**OPÇÃO C — Warmup via função pública**
- Criar função SQL pública `ping()` que retorna `true`
- Meio termo entre A e B

### Recomendação

**OPÇÃO A** — remover warmup (mais simples).

Justificativa:
- Cold start só acontece na primeira request após 30min de inatividade
- Com RLS, o warmup pode não ter o efeito desejado de qualquer forma
- Menos código = menos bugs

```typescript
// ProtectedRoute.tsx — remover linhas 69-74
// Antes:
supabase.from('profiles').select('id').limit(1)
  .then(() => { if (montado) iniciar(); })
  .catch(() => { if (montado) iniciar(); });

// Depois:
iniciar();
```

---

## 📝 MIGRATION 4: Storage RLS (avatars)

### Problema

`profile.service.ts` faz upload de avatares no bucket `avatars`:
```typescript
await supabase.storage.from('avatars').upload(path, file, { upsert: true });
```

Storage também precisa de RLS.

### Policies Propostas

```sql
-- Migration: 20260606_034_rls_storage_avatars.sql
-- RLS para bucket storage.avatars
-- Referência: Sprint RLS Fase 1

-- ─── 1. SELECT (download de avatares) ────────────────────────────────────

-- Qualquer autenticado pode ler avatares
DROP POLICY IF EXISTS "avatars_select_all" ON storage.objects;
CREATE POLICY "avatars_select_all" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

-- Público pode ler avatares (para exibir fotos de professores na área pública)
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'avatars');

-- ─── 2. INSERT (upload de avatares) ───────────────────────────────────────

-- Usuário só pode fazer upload do próprio avatar
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.filename(name)) = auth.uid()::text || '.jpg'
       OR (storage.filename(name)) = auth.uid()::text || '.png'
       OR (storage.filename(name)) = auth.uid()::text || '.jpeg'
       OR (storage.filename(name)) = auth.uid()::text || '.webp'
  );

-- Staff pode fazer upload de qualquer avatar
DROP POLICY IF EXISTS "avatars_insert_staff" ON storage.objects;
CREATE POLICY "avatars_insert_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'administracao')
    )
  );

-- ─── 3. UPDATE (substituir avatares) ──────────────────────────────────────

-- Usuário pode atualizar próprio avatar
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.filename(name)) LIKE auth.uid()::text || '.%'
  );

-- Staff pode atualizar qualquer avatar
DROP POLICY IF EXISTS "avatars_update_staff" ON storage.objects;
CREATE POLICY "avatars_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'administracao')
    )
  );

-- ─── 4. DELETE (remover avatares) ─────────────────────────────────────────

-- Apenas superadmin pode deletar avatares
DROP POLICY IF EXISTS "avatars_delete_superadmin" ON storage.objects;
CREATE POLICY "avatars_delete_superadmin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'superadmin'
    )
  );
```

### Rollback

```sql
-- Rollback: 20260606_034_rls_storage_avatars_rollback.sql

DROP POLICY IF EXISTS "avatars_select_all"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_public"     ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_staff"      ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_staff"      ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_superadmin" ON storage.objects;
```

---

## 🧪 PLANO DE TESTES

### Testes Manuais (via Supabase SQL Editor)

#### 1. Testar VIEW user_roles

```sql
-- Deve retornar todos os perfis com (user_id, role)
SELECT * FROM public.user_roles LIMIT 5;

-- Deve retornar role do Hélio (superadmin)
SELECT * FROM public.user_roles WHERE user_id = 'UUID_DO_HELIO';
```

#### 2. Testar RLS profiles — SELECT

```sql
-- Como aluno: deve ver apenas o próprio perfil
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"UUID_ALUNO"}';
SELECT * FROM public.profiles;
-- Esperado: 1 linha (próprio perfil)

-- Como admin: deve ver todos
SET LOCAL "request.jwt.claims" = '{"sub":"UUID_HELIO_SUPERADMIN"}';
SELECT * FROM public.profiles;
-- Esperado: todos os perfis
```

#### 3. Testar RLS profiles — UPDATE

```sql
-- Aluno NÃO pode mudar próprio role
SET LOCAL "request.jwt.claims" = '{"sub":"UUID_ALUNO"}';
UPDATE public.profiles SET role = 'admin' WHERE id = 'UUID_ALUNO';
-- Esperado: erro ou 0 rows affected

-- Admin PODE mudar role de outros
SET LOCAL "request.jwt.claims" = '{"sub":"UUID_HELIO_SUPERADMIN"}';
UPDATE public.profiles SET role = 'professor' WHERE id = 'UUID_ALGUEM';
-- Esperado: 1 row updated
```

#### 4. Testar Storage RLS

```typescript
// Via DevTools console no dashboard
// 1. Upload próprio avatar (deve funcionar)
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
await supabase.storage.from('avatars').upload(`avatars/${user.id}.jpg`, file);

// 2. Tentar upload avatar de outro usuário (deve falhar)
await supabase.storage.from('avatars').upload(`avatars/outro-id.jpg`, file);
```

### Testes Automatizados (Vitest)

Adicionar em `src/test/services/`:

```typescript
// profile.service.rls.test.ts
describe('RLS em profile.service', () => {
  it('getRole deve funcionar com RLS ativo', async () => {
    // Mock com RLS
    const role = await getRole('user-id');
    expect(role).toBe('aluno');
  });

  it('uploadAvatar deve respeitar RLS', async () => {
    // Mock upload + verificar policy
  });
});
```

---

## 📅 CRONOGRAMA DE IMPLEMENTAÇÃO

### Fase 2 — Implementação (após aprovação)

**⚠️ IMPORTANTE:** ERR-INFRA-001 — Migrations APENAS via SQL Editor manual (service_role). Nunca usar CLI.

| Step | Ação | Responsável | Tempo estimado |
|------|------|-------------|----------------|
| 2.1 | Criar arquivo migration 032 (user_roles VIEW) | Agente 12 | 15min |
| 2.2 | **Hélio abre SQL Editor (service_role)** | Hélio | 2min |
| 2.3 | **Hélio copia/cola migration 032 e executa** | Hélio | 3min |
| 2.4 | Testar VIEW no SQL Editor | Hélio | 10min |
| 2.5 | Criar arquivo migration 033 (RLS profiles) | Agente 12 | 30min |
| 2.6 | **Hélio copia/cola migration 033 e executa** | Hélio | 3min |
| 2.7 | Testar policies no SQL Editor | Hélio | 20min |
| 2.8 | Testes manuais na UI (login, perfil, etc.) | Hélio | 30min |
| 2.9 | Remover warmup do ProtectedRoute | Agente 12 | 5min |
| 2.10 | Criar arquivo migration 034 (Storage RLS) | Agente 12 | 20min |
| 2.11 | **Hélio copia/cola migration 034 e executa** | Hélio | 3min |
| 2.12 | Testar upload de avatar na UI | Hélio | 15min |
| 2.13 | Rodar `pnpm test:run` | Agente 12 | 5min |
| 2.14 | Commit migrations + código + push | Agente 12 | 5min |

**Total estimado:** ~2h40min

### Fluxo de Aplicação das Migrations (ERR-INFRA-001)

```
1. Agente 12 cria arquivo .sql em supabase/migrations/
2. Agente 12 envia SQL completo para o Hélio
3. Hélio abre Supabase Dashboard → SQL Editor
4. Hélio seleciona role: service_role (bypass RLS)
5. Hélio copia/cola o SQL do arquivo
6. Hélio executa manualmente
7. Hélio valida resultado (testes SQL)
8. Hélio informa "OK" para Agente 12
9. Agente 12 continua próxima migration
```

**Nunca usar:** `supabase db push`, `supabase migration up`, ou qualquer comando CLI.

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Recursão infinita em policies

**Problema:** Policy de `profiles` consulta `user_roles` que por sua vez consulta `profiles`.

**Mitigação:** `user_roles` é uma VIEW SEM RLS. Não há recursão.

### Risco 2: Edge Function criar-aluno pode quebrar

**Problema:** Se RLS bloquear insert de perfis pela Edge Function.

**Mitigação:** Edge Function usa `service_role` key (bypassa RLS).

### Risco 3: ProtectedRoute pode quebrar

**Problema:** `getRole()` pode retornar vazio com RLS ativo.

**Mitigação:** Policy `profiles_select_own` permite que usuário leia próprio perfil. `getRole()` usa `auth.uid()` então sempre passará na policy.

### Risco 4: Warmup pode não funcionar

**Problema:** Query de warmup pode ser bloqueada por RLS.

**Mitigação:** Remover warmup (Opção A). Cold start é aceitável para o contexto.

### Risco 5: Storage upload pode falhar

**Problema:** Política muito restritiva pode bloquear uploads legítimos.

**Mitigação:** Testar upload antes de aplicar em produção. Rollback disponível.

---

## 🚀 PLANO DE ROLLBACK

Se algo der errado após deploy:

### Rollback Total (volta ao estado anterior)

**⚠️ ERR-INFRA-001:** Rollback APENAS via SQL Editor manual (service_role). Nunca usar CLI.

```
1. Hélio abre Supabase Dashboard → SQL Editor (service_role)

2. Hélio copia/cola e executa (na ordem reversa):

   a) Rollback 034 (Storage):
      supabase/migrations/20260606_034_rls_storage_avatars_rollback.sql

   b) Rollback 033 (Profiles):
      supabase/migrations/20260606_033_rls_profiles_rollback.sql

   c) Rollback 032 (VIEW):
      supabase/migrations/20260606_032_user_roles_view_rollback.sql

3. Reverter código do ProtectedRoute (se aplicável):
   git revert <commit-hash>

4. Deploy no Vercel:
   git push origin sprint-rls-seguranca
```

### Rollback Parcial (só RLS profiles)

```sql
-- Via SQL Editor (service_role)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

---

## ✅ CHECKLIST DE APROVAÇÃO

Antes de implementar, Hélio deve confirmar:

- [ ] Entendi a proposta de criar VIEW `user_roles` sem RLS
- [ ] Concordo com as 8 policies propostas para `profiles`
- [ ] Concordo em remover o warmup do ProtectedRoute (Opção A)
- [ ] Concordo com as policies de Storage para avatares
- [ ] Entendi o plano de testes e rollback
- [ ] Estou ciente de que a implementação levará ~2h30min
- [ ] Tenho tempo disponível para testar na UI após as migrations
- [ ] **APROVAR IMPLEMENTAÇÃO DA FASE 2**

---

## 📌 PRÓXIMOS PASSOS

Após aprovação do Hélio:

1. **Fase 2:** Implementar migrations (032, 033, 034)
2. **Fase 3:** Testes manuais + automatizados
3. **Fase 4:** Deploy + validação em produção
4. **Fase 5:** Documentação final + atualizar CLAUDE.md

---

**FIM DA SPEC — AGUARDANDO APROVAÇÃO** 🟡
