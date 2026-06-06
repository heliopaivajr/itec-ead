-- Migration: 20260606_033_rls_profiles.sql
-- RLS para tabela profiles
-- Referência: Sprint RLS Fase 1, ADR-006, ERR-INFRA-001
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ATIVAR RLS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. SELECT POLICIES — Quem pode LER perfis?
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. INSERT POLICIES — Quem pode CRIAR perfis?
-- ═══════════════════════════════════════════════════════════════════════════

-- P3: Usuário pode criar próprio perfil (signup)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- P4: Staff pode criar perfis para outros (via Edge Function criar-aluno)
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. UPDATE POLICIES — Quem pode ATUALIZAR perfis?
-- ═══════════════════════════════════════════════════════════════════════════

-- P5: Usuário pode atualizar seus próprios dados (EXCETO role)
--
-- PROTEÇÃO DE ROLE:
--   WITH CHECK garante que o novo `role` == role atual no banco
--   Se usuário tentar mudar role: 'admin' != 'aluno' → REJEITADO
--   Se usuário não tocar em role: 'aluno' == 'aluno' → PERMITIDO
--
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- P6: Admin/superadmin pode atualizar qualquer perfil (INCLUINDO role)
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

-- P7: Administração pode atualizar perfis (EXCETO role)
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. DELETE POLICIES — Quem pode DELETAR perfis?
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.profiles
  IS 'Perfis de usuários com RLS ativo. '
     'Veja user_roles (VIEW sem RLS) para verificação de roles em policies.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. TESTES SUGERIDOS (executar após aplicar migration)
-- ═══════════════════════════════════════════════════════════════════════════

-- Teste 1: Verificar RLS está ativo
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
-- Esperado: rowsecurity = true

-- Teste 2: Listar policies criadas
-- SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
-- Esperado: 8 policies listadas

-- Teste 3: Simular SELECT como aluno (deve ver só próprio perfil)
-- SET LOCAL ROLE authenticated;
-- SET LOCAL "request.jwt.claims" = '{"sub":"UUID_ALUNO_TESTE"}';
-- SELECT COUNT(*) FROM public.profiles;
-- Esperado: 1

-- Teste 4: Simular UPDATE de role como aluno (deve falhar)
-- SET LOCAL "request.jwt.claims" = '{"sub":"UUID_ALUNO_TESTE"}';
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'UUID_ALUNO_TESTE';
-- Esperado: 0 rows affected ou erro de policy
