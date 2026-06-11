-- ================================================================
-- Migration: 20260611_037_rls_financeiro.sql
-- Sprint: sprint-rls-completo
-- Descrição: Adicionar role 'financeiro' nas policies de
--            mensalidades e taxa_matricula
-- ================================================================
-- CONTEXTO:
-- Role 'financeiro' precisa lançar pagamentos e visualizar
-- mensalidades, mas NÃO deve ter permissão de DELETE.
-- Policies ALL antigas são separadas em INSERT/UPDATE/DELETE.
-- ================================================================

-- ─────────────────────────────────────────────────────────────
-- SEÇÃO 1: mensalidades
-- ─────────────────────────────────────────────────────────────

-- Policy SELECT: adicionar 'financeiro' junto com gestão
DROP POLICY IF EXISTS "mensalidades_aluno_ve_propria" ON public.mensalidades;

CREATE POLICY "mensalidades_aluno_ve_propria" ON public.mensalidades
  FOR SELECT USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao','financeiro'))
  );

COMMENT ON POLICY "mensalidades_aluno_ve_propria" ON public.mensalidades IS
  'Aluno vê próprias mensalidades. Gestão (admin/administracao/financeiro) vê todas.';

-- DROP da policy ALL antiga (será substituída por 3 policies específicas)
DROP POLICY IF EXISTS "mensalidades_gestao_financeiro" ON public.mensalidades;

-- Policy INSERT: admin, administracao, financeiro
CREATE POLICY "mensalidades_insert" ON public.mensalidades
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao','financeiro'))
  );

COMMENT ON POLICY "mensalidades_insert" ON public.mensalidades IS
  'Apenas gestão e financeiro podem criar mensalidades.';

-- Policy UPDATE: admin, administracao, financeiro
CREATE POLICY "mensalidades_update" ON public.mensalidades
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao','financeiro'))
  );

COMMENT ON POLICY "mensalidades_update" ON public.mensalidades IS
  'Apenas gestão e financeiro podem atualizar mensalidades (ex: marcar como pago).';

-- Policy DELETE: apenas admin e superadmin (financeiro NÃO tem DELETE)
CREATE POLICY "mensalidades_delete" ON public.mensalidades
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin'))
  );

COMMENT ON POLICY "mensalidades_delete" ON public.mensalidades IS
  'Apenas admin/superadmin podem deletar mensalidades. Financeiro não tem esta permissão.';

-- ─────────────────────────────────────────────────────────────
-- SEÇÃO 2: taxa_matricula
-- ─────────────────────────────────────────────────────────────

-- Policy SELECT: adicionar 'financeiro' junto com gestão
-- ATENÇÃO: nome REAL no banco é "taxa_aluno_ve_propria" (não "taxa_matricula_...")
DROP POLICY IF EXISTS "taxa_aluno_ve_propria" ON public.taxa_matricula;

CREATE POLICY "taxa_matricula_aluno_ve_propria" ON public.taxa_matricula
  FOR SELECT USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao','financeiro'))
  );

COMMENT ON POLICY "taxa_matricula_aluno_ve_propria" ON public.taxa_matricula IS
  'Aluno vê própria taxa de matrícula. Gestão (admin/administracao/financeiro) vê todas.';

-- DROP da policy ALL antiga
-- ATENÇÃO: nome REAL no banco é "taxa_gestao_administracao" (não "taxa_matricula_gestao_admin")
DROP POLICY IF EXISTS "taxa_gestao_administracao" ON public.taxa_matricula;

-- Policy INSERT: admin, administracao, financeiro
CREATE POLICY "taxa_matricula_insert" ON public.taxa_matricula
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao','financeiro'))
  );

COMMENT ON POLICY "taxa_matricula_insert" ON public.taxa_matricula IS
  'Apenas gestão e financeiro podem criar taxas de matrícula.';

-- Policy UPDATE: admin, administracao, financeiro
CREATE POLICY "taxa_matricula_update" ON public.taxa_matricula
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao','financeiro'))
  );

COMMENT ON POLICY "taxa_matricula_update" ON public.taxa_matricula IS
  'Apenas gestão e financeiro podem atualizar taxas (ex: marcar como paga).';

-- Policy DELETE: apenas admin e superadmin
CREATE POLICY "taxa_matricula_delete" ON public.taxa_matricula
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin'))
  );

COMMENT ON POLICY "taxa_matricula_delete" ON public.taxa_matricula IS
  'Apenas admin/superadmin podem deletar taxas de matrícula. Financeiro não tem esta permissão.';

-- ─────────────────────────────────────────────────────────────
-- Notificar PostgREST para recarregar schema
-- ─────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
