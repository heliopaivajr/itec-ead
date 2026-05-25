-- ============================================================
-- Migration: 20260525_002_rls_matriculas
-- Descrição: Habilita RLS na tabela matriculas e define
--            policies de isolamento por aluno e acesso staff.
-- Data: 2026-05-25
-- Autor: Agente 04 — db-architect (ITEC EAD)
-- Reversão: 20260525_002_rls_matriculas_rollback.sql
-- ============================================================
-- CONTEXTO DE NEGÓCIO:
--   matriculas vincula aluno_id (UUID do profile) ao curso_id.
--   Aluno só pode ver e criar suas próprias matrículas.
--   Staff (administracao, admin, superadmin) gerencia todas.
--   Coluna de vínculo: aluno_id (confirmado no código — não user_id)
-- ============================================================

BEGIN;

-- 1. Habilitar RLS
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;

-- 2. SELECT — aluno vê apenas suas próprias matrículas
CREATE POLICY "matriculas_select_proprio_aluno"
ON matriculas
FOR SELECT
TO authenticated
USING (
  auth.uid() = aluno_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('administracao', 'admin', 'superadmin')
  )
);

-- 3. INSERT — aluno cria apenas para si mesmo
CREATE POLICY "matriculas_insert_proprio_aluno"
ON matriculas
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = aluno_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('administracao', 'admin', 'superadmin')
  )
);

-- 4. UPDATE — apenas staff (aprovação/recusa pela secretaria/diretoria)
CREATE POLICY "matriculas_update_staff"
ON matriculas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('administracao', 'admin', 'superadmin')
  )
);

-- 5. DELETE — apenas superadmin (LGPD)
CREATE POLICY "matriculas_delete_superadmin"
ON matriculas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
  )
);

COMMIT;
