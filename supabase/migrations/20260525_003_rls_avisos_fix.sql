-- ============================================================
-- Migration: 20260525_003_rls_avisos_fix
-- Descrição: Corrige policies da tabela avisos:
--            1. Adiciona policy UPDATE ausente
--            2. Corrige role 'secretaria' → 'administracao' (padrão do sistema)
--            3. Remove e recria todas as policies com nomes consistentes
-- Data: 2026-05-25
-- Autor: Agente 04 — db-architect (ITEC EAD)
-- Reversão: 20260525_003_rls_avisos_fix_rollback.sql
-- ============================================================
-- CONTEXTO DE NEGÓCIO:
--   - A migration original (migration_sprint3_avisos.sql) usava role 'secretaria'
--     mas o sistema usa 'administracao'. Corrigido aqui.
--   - Faltava policy de UPDATE — qualquer autenticado podia editar qualquer aviso.
--   - RLS já estava habilitado — apenas recriamos as policies.
-- ============================================================

BEGIN;

-- Remover policies antigas com nomenclatura inconsistente
DROP POLICY IF EXISTS "avisos_select" ON avisos;
DROP POLICY IF EXISTS "avisos_insert" ON avisos;
DROP POLICY IF EXISTS "avisos_delete" ON avisos;
-- policies antigas com outros nomes possíveis (segurança)
DROP POLICY IF EXISTS "aluno_ve_avisos_do_seu_curso"   ON avisos;
DROP POLICY IF EXISTS "admin_gerencia_avisos"          ON avisos;

-- RLS já habilitado — garantir idempotência
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;

-- 1. SELECT — usuário autenticado vê avisos destinados a seu role
--    ou avisos para 'todos', ou avisos do próprio curso (se aluno matriculado)
CREATE POLICY "avisos_select"
ON avisos
FOR SELECT
TO authenticated
USING (
  role_destino = 'todos'
  OR role_destino = (
    SELECT role FROM profiles WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin', 'administracao')
  )
);

-- 2. INSERT — staff e professores podem criar avisos
CREATE POLICY "avisos_insert"
ON avisos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin', 'administracao', 'professor')
  )
  AND autor_id = auth.uid()
);

-- 3. UPDATE — apenas o próprio autor ou staff
CREATE POLICY "avisos_update"
ON avisos
FOR UPDATE
TO authenticated
USING (
  autor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin', 'administracao')
  )
);

-- 4. DELETE — apenas o próprio autor ou staff
CREATE POLICY "avisos_delete"
ON avisos
FOR DELETE
TO authenticated
USING (
  autor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin', 'administracao')
  )
);

COMMIT;
