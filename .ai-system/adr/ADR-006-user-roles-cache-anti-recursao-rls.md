# ADR-006 — Tabela `user_roles` como cache de roles para políticas RLS
# Architecture Decision Record

```
Data:   2026-06-01
Status: Proposta — aguardando aprovação do Hélio
Autor:  Agente 01 — Architect (via auditoria Agente 11 + LICAO-007)
```

---

## 📌 Contexto

O Supabase usa Row Level Security (RLS) para proteger os dados no banco. As policies RLS precisam verificar o role do usuário logado para decidir o que ele pode ver ou modificar.

A abordagem natural seria consultar `profiles.role` diretamente nas policies:

```sql
CREATE POLICY "profiles_select_staff" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p     -- ← recursão: profiles lendo profiles
      WHERE p.id = auth.uid()
        AND p.role IN ('administracao', 'admin', 'superadmin')
    )
  );
```

**O problema:** policies na tabela `profiles` que fazem `SELECT FROM profiles` criam recursão infinita. O Postgres resolve isso retornando `false` silenciosamente — sem erro, sem log, apenas acesso negado para todo mundo. Este é o bug documentado em ERR-SUPABASE-003 e LICAO-007.

Além disso, a tabela `profiles` atualmente **não tem RLS ativado** (GAP-001 da auditoria do Sprint K). Qualquer usuário autenticado pode fazer SELECT ou UPDATE direto em `profiles` via Supabase client, bypass total do service layer. Isso expõe campos sensíveis (CPF, RG, `exclusao_solicitada_em`) e permite que qualquer aluno promova seu próprio role para `admin`.

---

## 🔍 Opções Consideradas

### Opção A: Usar `auth.jwt() ->> 'role'` nas policies

Ler o role diretamente do JWT token, sem consultar nenhuma tabela.

```sql
USING (auth.jwt() ->> 'role' IN ('administracao', 'admin', 'superadmin'))
```

**Prós:**
- Zero queries adicionais — O(1) por policy
- Sem risco de recursão
- Implementação simples

**Contras:**
- O JWT do Supabase não inclui campos customizados do `profiles.role` por padrão — requer configuração adicional de custom claims via trigger ou hook
- Se o role mudar no banco, o JWT antigo ainda tem o role velho até expirar (5-60 min de defasagem)
- Requer `supabase_functions` ou hook no GoTrue para injetar o claim — complexidade de infra

**Complexidade de implementação:** ALTA

---

### Opção B: Tabela `user_roles` sem RLS como cache de roles

Criar uma tabela auxiliar `user_roles` sem RLS (acessível para qualquer query de policy, sem recursão). Mantida sincronizada com `profiles.role` via trigger.

```sql
CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL DEFAULT 'pendente'
);
-- SEM RLS — intencionalmente acessível para policies
```

Nas policies:
```sql
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('administracao', 'admin', 'superadmin')
  )
)
```

**Prós:**
- Sem recursão — `user_roles` não tem RLS, pode ser consultada por qualquer policy
- Role sempre consistente (sem defasagem de JWT)
- Padrão canônico usado pela comunidade Supabase para este problema
- Simples de entender e auditar

**Contras:**
- `user_roles` deve ser preenchida em paralelo com `profiles` — requer trigger de sincronização
- Se o trigger falhar, `user_roles` fica dessincronizado (ERR-RISK-001 já documentado)
- Uma tabela extra para manter

**Complexidade de implementação:** MÉDIA

---

### Opção C: Manter tudo sem RLS em `profiles` (status quo)

Não ativar RLS em `profiles`, confiar apenas no service layer para segurança.

**Prós:**
- Zero trabalho adicional

**Contras:**
- Qualquer usuário autenticado pode fazer `supabase.from('profiles').update({role:'admin'})` diretamente
- Exposição de CPF, RG, `exclusao_solicitada_em` de outros usuários via SELECT direto
- Violação de LGPD (dados pessoais sem proteção no banco)
- Inaceitável para produção com alunos reais

**Complexidade de implementação:** BAIXA (mas cria risco alto)

---

## ✅ Decisão

**Escolha: Opção B — Tabela `user_roles` sem RLS**

**Justificativa:**
A Opção A (JWT claims) requer infraestrutura adicional no GoTrue e introduz defasagem de role que pode causar bugs de autorização. A Opção C é inaceitável para produção.

A Opção B é o padrão recomendado pela própria documentação do Supabase para este problema. A tabela `user_roles` funciona como um cache confiável de roles, sem recursão, sem infra adicional. A sincronização via trigger é simples e rastreável.

O trigger de sync deve ser SECURITY DEFINER para poder escrever em `user_roles` independente do RLS de outras tabelas.

---

## 📊 Consequências

### Positivas
- `profiles` pode ter RLS ativo com policies seguras e sem recursão
- CPF, RG, `exclusao_solicitada_em` ficam protegidos no banco
- Qualquer tool de acesso direto ao banco (pgAdmin, Supabase Studio) respeita RLS
- LGPD compliance: alunos só veem seus próprios dados

### Negativas (trade-offs aceitos)
- Uma tabela extra (`user_roles`) para manter sincronizada
- Toda mudança de role em `profiles` deve também atualizar `user_roles` — `updateRole` já faz o upsert (ERR-RISK-001: tratar erro do upsert no Sprint L)
- Usuários criados antes desta migration precisam ter `user_roles` populado (script de backfill)

### Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Trigger de sync falha silenciosamente | MÉDIA | MÉDIO | Log de erro no trigger; monitorar via `user_roles` vs `profiles` |
| `updateRole` upsert sem tratamento de erro (ERR-RISK-001) | ALTA | MÉDIO | Corrigir no Sprint L — adicionar `if (upsertErr) log(...)` |
| Policy recursiva acidental no futuro | BAIXA | ALTO | Regra de código: policies NUNCA consultam `profiles` — sempre `user_roles` |
| Backfill incompleto na ativação | MÉDIA | ALTO | Script de migração verifica 100% antes de ativar RLS |

---

## 🔧 Implementação (quando aprovado)

**Migration 028 — criar `user_roles` + RLS em `profiles`:**

```sql
-- 1. Criar tabela user_roles SEM RLS
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL DEFAULT 'pendente'
);
-- Sem ENABLE ROW LEVEL SECURITY — intencional

-- 2. Backfill a partir de profiles existentes
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- 3. Trigger de sincronização
CREATE OR REPLACE FUNCTION public.sync_user_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, NEW.role)
  ON CONFLICT (user_id) DO UPDATE SET role = NEW.role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_roles ON public.profiles;
CREATE TRIGGER trg_sync_user_roles
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_roles();

-- 4. Ativar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policies sem recursão (usando user_roles)
CREATE POLICY "profiles_select_proprio" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_select_staff" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('administracao','admin','superadmin','financeiro','professor'))
  );

CREATE POLICY "profiles_update_proprio" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    role = (SELECT role FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "profiles_update_staff" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('administracao','admin','superadmin'))
  );
```

**Verificação pré-ativação:**
```sql
-- Confirmar que backfill está completo
SELECT COUNT(*) FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.user_id IS NULL;
-- Deve retornar 0 antes de ativar RLS
```

---

## 🔄 Contexto de Revisão

Esta decisão deve ser revisada quando:
- O Supabase oferecer suporte nativo a custom JWT claims sem hook (simplifica a Opção A)
- A tabela `profiles` for substituída por outra estrutura de identidade
- Houver necessidade de roles com escopo por turma ou disciplina (multi-tenancy de roles)

---

## 📚 Referências

- LICAO-007 — Policies RLS não devem fazer SELECT em profiles para verificar role
- ERR-SUPABASE-003 — Recursão silenciosa em policies de UPDATE em profiles
- ERR-RISK-001 — user_roles.upsert sem tratamento de erro em updateRole
- [Supabase docs — Custom Claims & Role-based Access Control](https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac)

---
*ADR-006 — ITEC-EAD · Hélio Paiva Jr. · 2026-06-01*
