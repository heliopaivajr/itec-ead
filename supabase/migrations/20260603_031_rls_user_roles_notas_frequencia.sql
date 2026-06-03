-- Migration: 20260603_031_rls_user_roles_notas_frequencia.sql
-- Sprint M — Corrigir policies de notas_aluno, frequencia e avaliacoes
-- Substituir SELECT FROM profiles por SELECT FROM user_roles (sem RLS, sem recursão)
-- Referência: CORRIGIDO-029, ERR-SUPABASE-003, ADR-006
-- Aplicado via SQL Editor (service_role) — 2026-06-03

-- ─── notas_aluno ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "notas_aluno_select" ON public.notas_aluno;
CREATE POLICY "notas_aluno_select" ON public.notas_aluno
  FOR SELECT TO authenticated
  USING (
    aluno_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('admin','superadmin','administracao','professor'))
  );

DROP POLICY IF EXISTS "notas_aluno_insert" ON public.notas_aluno;
CREATE POLICY "notas_aluno_insert" ON public.notas_aluno
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = lancado_por OR
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin','superadmin'))
  );

DROP POLICY IF EXISTS "notas_aluno_update" ON public.notas_aluno;
CREATE POLICY "notas_aluno_update" ON public.notas_aluno
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = lancado_por OR
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin','superadmin'))
  );

DROP POLICY IF EXISTS "notas_aluno_delete" ON public.notas_aluno;
CREATE POLICY "notas_aluno_delete" ON public.notas_aluno
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles
                 WHERE user_id = auth.uid() AND role = 'superadmin'));

-- ─── frequencia ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "frequencia_professor_lanca"  ON public.frequencia;
DROP POLICY IF EXISTS "frequencia_aluno_ve_propria" ON public.frequencia;
DROP POLICY IF EXISTS "frequencia_admin_total"      ON public.frequencia;

CREATE POLICY "frequencia_professor_lanca" ON public.frequencia
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('professor','admin','superadmin','administracao'))
  );

CREATE POLICY "frequencia_aluno_ve_propria" ON public.frequencia
  FOR SELECT USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid()
                 AND role IN ('professor','admin','superadmin','administracao'))
  );

CREATE POLICY "frequencia_admin_total" ON public.frequencia
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );

-- ─── avaliacoes ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "avaliacoes_select" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_insert" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_update" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_delete" ON public.avaliacoes;

CREATE POLICY "avaliacoes_select" ON public.avaliacoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "avaliacoes_insert" ON public.avaliacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = criado_por OR
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );

CREATE POLICY "avaliacoes_update" ON public.avaliacoes
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = criado_por OR
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin','superadmin'))
  );

CREATE POLICY "avaliacoes_delete" ON public.avaliacoes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles
                 WHERE user_id = auth.uid() AND role IN ('admin','superadmin')));
