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
