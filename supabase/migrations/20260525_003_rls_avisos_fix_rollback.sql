-- ============================================================
-- Rollback: 20260525_003_rls_avisos_fix
-- Restaura as policies originais da migration_sprint3_avisos.sql
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "avisos_select" ON avisos;
DROP POLICY IF EXISTS "avisos_insert" ON avisos;
DROP POLICY IF EXISTS "avisos_update" ON avisos;
DROP POLICY IF EXISTS "avisos_delete" ON avisos;

-- Restaurar policies originais (com 'secretaria' — role desatualizado)
CREATE POLICY "avisos_select" ON avisos FOR SELECT TO authenticated
  USING (
    role_destino = 'todos'
    OR role_destino = (SELECT role FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'secretaria'))
  );

CREATE POLICY "avisos_insert" ON avisos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'secretaria', 'professor'))
    AND autor_id = auth.uid()
  );

CREATE POLICY "avisos_delete" ON avisos FOR DELETE TO authenticated
  USING (
    autor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'secretaria'))
  );

-- NOTA: policy de UPDATE NÃO é restaurada — era ausente no original
-- Isso é intencional: o rollback não deve reintroduzir a vulnerabilidade

COMMIT;
