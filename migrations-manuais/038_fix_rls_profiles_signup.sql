-- Migration manual: 038_fix_rls_profiles_signup.sql
-- Correção: ERR-RLS-005 — RLS em profiles bloqueia o trigger de signup
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ver ERR-INFRA-001)
-- Data: 2026-06-17
--
-- ─── CAUSA ──────────────────────────────────────────────────────────────────
-- A migration 033 ativou RLS em public.profiles. A única policy de INSERT
-- existente é "profiles_insert_own" (TO authenticated, WITH CHECK id = auth.uid()).
--
-- No signup via auth.admin.createUser (Edge Function criar-aluno) e também no
-- signup normal/OAuth, o INSERT em profiles é feito pelo trigger AFTER INSERT
-- handle_new_user, executado no contexto interno do GoTrue — onde auth.uid()
-- é NULL e o papel efetivo é supabase_auth_admin.
--
-- ─── EFEITO ─────────────────────────────────────────────────────────────────
-- Com auth.uid() NULL, nenhuma policy de INSERT passa:
--   profiles_insert_own   → id = auth.uid() (NULL) → falha
--   profiles_insert_staff → EXISTS(user_roles WHERE user_id = auth.uid()) → falha
-- A RLS nega o INSERT do trigger → exceção dentro do trigger → o GoTrue aborta a
-- criação do usuário e retorna "Database error creating new user" (HTTP 500,
-- unexpected_failure). Bloqueia QUALQUER criação de usuário desde 2026-06-06.
--
-- ─── CORREÇÃO ───────────────────────────────────────────────────────────────
-- Adiciona uma policy de INSERT restrita ao papel supabase_auth_admin (o papel
-- do GoTrue/Auth, usado pelo trigger de signup). Apenas esse papel ganha um
-- WITH CHECK (true).
--
-- ⚠️ NÃO AFROUXA a segurança dos usuários comuns:
--   - profiles_insert_own permanece intacta — usuários "authenticated" continuam
--     só podendo inserir o PRÓPRIO profile (id = auth.uid()).
--   - supabase_auth_admin é um papel interno do Supabase, não acessível via API
--     pública/anon. Apenas o motor de Auth o utiliza ao processar signups.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "profiles_insert_auth_admin" ON public.profiles;

CREATE POLICY "profiles_insert_auth_admin" ON public.profiles
  FOR INSERT TO supabase_auth_admin
  WITH CHECK (true);

-- Recarrega o cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Confirmar que a policy foi criada para o papel correto:
-- SELECT policyname, cmd, roles, with_check
-- FROM pg_policies
-- WHERE tablename = 'profiles' AND policyname = 'profiles_insert_auth_admin';
-- Esperado: cmd = INSERT | roles = {supabase_auth_admin} | with_check = true
--
-- 2. Teste real: criar 1 aluno pela Edge Function criar-aluno (--limite=1).
-- Esperado: 201 + codigo_itec gerado (sem "Database error creating new user").
