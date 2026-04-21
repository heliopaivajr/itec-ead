-- ============================================================
-- ITEC EAD — Sprint 3: Mural de Avisos
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela principal de avisos
CREATE TABLE IF NOT EXISTS avisos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        TEXT        NOT NULL,
  conteudo      TEXT,
  autor_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  role_destino  TEXT        NOT NULL DEFAULT 'todos',
  -- 'todos' | 'alunos' | 'professores' | 'admin'
  curso_id      UUID        REFERENCES cursos(id) ON DELETE SET NULL,
  fixado        BOOLEAN     NOT NULL DEFAULT false,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em     TIMESTAMPTZ
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_avisos_criado_em     ON avisos (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_avisos_role_destino  ON avisos (role_destino);
CREATE INDEX IF NOT EXISTS idx_avisos_fixado        ON avisos (fixado) WHERE fixado = true;

-- 3. Row Level Security
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer usuário autenticado pode ver avisos direcionados a ele
CREATE POLICY "avisos_select" ON avisos
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
        AND role IN ('superadmin', 'admin', 'secretaria')
    )
  );

-- Inserção: apenas superadmin, secretaria e professor
CREATE POLICY "avisos_insert" ON avisos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('superadmin', 'admin', 'secretaria', 'professor')
    )
    AND autor_id = auth.uid()
  );

-- Deleção: apenas superadmin e secretaria (ou o próprio autor)
CREATE POLICY "avisos_delete" ON avisos
  FOR DELETE
  TO authenticated
  USING (
    autor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('superadmin', 'admin', 'secretaria')
    )
  );

-- 4. Dados iniciais de exemplo (opcional)
-- INSERT INTO avisos (titulo, conteudo, role_destino, fixado) VALUES
--   ('Bem-vindo ao ITEC EAD!',
--    'O sistema de avisos foi ativado. Aqui você encontrará todos os comunicados da secretaria e professores.',
--    'todos', true);

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
