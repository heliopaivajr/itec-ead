-- ============================================================
-- Rollback: 20260525_001_rls_leads_cursos
-- Remove as policies e desabilita RLS da tabela leads_cursos.
-- ATENÇÃO: executar apenas em emergência — desabilita isolamento de dados.
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "leads_insert_publico"   ON leads_cursos;
DROP POLICY IF EXISTS "leads_select_staff"     ON leads_cursos;
DROP POLICY IF EXISTS "leads_update_staff"     ON leads_cursos;
DROP POLICY IF EXISTS "leads_delete_superadmin" ON leads_cursos;

ALTER TABLE leads_cursos DISABLE ROW LEVEL SECURITY;

COMMIT;
