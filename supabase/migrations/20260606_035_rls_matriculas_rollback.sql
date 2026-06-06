-- Rollback: 20260606_035_rls_matriculas_rollback.sql
-- Remove todas as policies de matriculas

DROP POLICY IF EXISTS "matriculas_select_own"         ON public.matriculas;
DROP POLICY IF EXISTS "matriculas_select_staff"       ON public.matriculas;
DROP POLICY IF EXISTS "matriculas_insert_staff"       ON public.matriculas;
DROP POLICY IF EXISTS "matriculas_update_staff"       ON public.matriculas;
DROP POLICY IF EXISTS "matriculas_delete_superadmin"  ON public.matriculas;

-- Desabilita RLS (volta ao estado anterior)
ALTER TABLE public.matriculas DISABLE ROW LEVEL SECURITY;
