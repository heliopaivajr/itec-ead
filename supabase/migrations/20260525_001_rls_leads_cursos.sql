-- ============================================================
-- Migration: 20260525_001_rls_leads_cursos
-- Descrição: Habilita RLS na tabela leads_cursos e define
--            policies de acesso por role.
-- Data: 2026-05-25
-- Autor: Agente 04 — db-architect (ITEC EAD)
-- Reversão: 20260525_001_rls_leads_cursos_rollback.sql
-- ============================================================
-- CONTEXTO DE NEGÓCIO:
--   leads_cursos guarda dados de visitantes interessados
--   (nome, e-mail, telefone) vindos do formulário público /reservar-vaga.
--   INSERT deve ser permitido sem autenticação (anon).
--   SELECT/UPDATE/DELETE devem ser restritos ao staff.
-- ============================================================

BEGIN;

-- 1. Habilitar RLS
ALTER TABLE leads_cursos ENABLE ROW LEVEL SECURITY;

-- 2. INSERT público — formulário de captação do site (sem login)
--    Regra: qualquer um (incluindo anon) pode registrar interesse.
CREATE POLICY "leads_insert_publico"
ON leads_cursos
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. SELECT — apenas staff (secretaria, diretoria, superadmin)
--    Regra: dados pessoais de visitantes só o staff pode visualizar.
CREATE POLICY "leads_select_staff"
ON leads_cursos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('administracao', 'admin', 'superadmin')
  )
);

-- 4. UPDATE — apenas staff
CREATE POLICY "leads_update_staff"
ON leads_cursos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('administracao', 'admin', 'superadmin')
  )
);

-- 5. DELETE — apenas superadmin (LGPD: direito ao esquecimento)
CREATE POLICY "leads_delete_superadmin"
ON leads_cursos
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
