-- Migration: 20260606_035_rls_matriculas.sql
-- RLS para tabela matriculas
-- Referência: Sprint RLS Fase 1, bugfix getAlunos com join aninhado
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ATIVAR RLS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. SELECT POLICIES — Quem pode LER matrículas?
-- ═══════════════════════════════════════════════════════════════════════════

-- P1: Aluno pode ler suas próprias matrículas
DROP POLICY IF EXISTS "matriculas_select_own" ON public.matriculas;
CREATE POLICY "matriculas_select_own" ON public.matriculas
  FOR SELECT TO authenticated
  USING (aluno_id = auth.uid());

-- P2: Staff pode ler todas as matrículas
DROP POLICY IF EXISTS "matriculas_select_staff" ON public.matriculas;
CREATE POLICY "matriculas_select_staff" ON public.matriculas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'administracao', 'financeiro')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. INSERT POLICIES — Quem pode CRIAR matrículas?
-- ═══════════════════════════════════════════════════════════════════════════

-- P3: Apenas staff pode criar matrículas
DROP POLICY IF EXISTS "matriculas_insert_staff" ON public.matriculas;
CREATE POLICY "matriculas_insert_staff" ON public.matriculas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'administracao')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. UPDATE POLICIES — Quem pode ATUALIZAR matrículas?
-- ═══════════════════════════════════════════════════════════════════════════

-- P4: Apenas staff pode atualizar matrículas (incluindo status)
DROP POLICY IF EXISTS "matriculas_update_staff" ON public.matriculas;
CREATE POLICY "matriculas_update_staff" ON public.matriculas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'administracao', 'financeiro')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. DELETE POLICIES — Quem pode DELETAR matrículas?
-- ═══════════════════════════════════════════════════════════════════════════

-- P5: Apenas superadmin pode deletar matrículas
DROP POLICY IF EXISTS "matriculas_delete_superadmin" ON public.matriculas;
CREATE POLICY "matriculas_delete_superadmin" ON public.matriculas
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

COMMENT ON TABLE public.matriculas
  IS 'Matrículas de alunos com RLS ativo. '
     'Join aninhado com profiles pode falhar — usar queries separadas.';
