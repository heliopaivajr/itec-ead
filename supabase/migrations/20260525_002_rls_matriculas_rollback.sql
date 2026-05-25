-- ============================================================
-- Rollback: 20260525_002_rls_matriculas
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "matriculas_select_proprio_aluno" ON matriculas;
DROP POLICY IF EXISTS "matriculas_insert_proprio_aluno" ON matriculas;
DROP POLICY IF EXISTS "matriculas_update_staff"         ON matriculas;
DROP POLICY IF EXISTS "matriculas_delete_superadmin"    ON matriculas;

ALTER TABLE matriculas DISABLE ROW LEVEL SECURITY;

COMMIT;
