-- Migration: 20260715_063_restaurar_policies_perdidas.sql  (v2 — ADITIVA)
-- ADICIONA apenas as policies que FALTAM em avaliacoes, matriculas e profiles.
-- NÃO toca em NENHUMA policy existente.
--
-- ─── POR QUE v2 ──────────────────────────────────────────────────────────────
-- A v1 recriava o conjunto "verbatim das migrações de origem" (031/033/035).
-- REPROVADA: o pg_policies real mostrou que as policies atuais EVOLUÍRAM além
-- das migrações versionadas — usam is_staff() e trazem endurecimentos
-- posteriores (ex.: profiles_update_staff com lista de roles SEM superadmin =
-- anti-escalação). Recriar "da origem" DESFARIA esses endurecimentos.
--
-- ─── is_staff() (investigada) ────────────────────────────────────────────────
-- Origem: .prd/02_profiles_rls.sql (PRD aplicado manualmente no início do
-- projeto — não é migração versionada). Definição:
--   plpgsql SECURITY DEFINER → lê profiles SEM recursão (bypassa RLS; a versão
--   sem DEFINER causou o ERR-SUPABASE-003).
--   retorna EXISTS(profiles WHERE id = auth.uid()
--                  AND role IN ('administracao','admin','superadmin'))
--   ⚠️ NÃO inclui financeiro nem professor.
--
-- ─── EXISTEM HOJE (NÃO MEXER — nenhuma linha desta migração as toca) ─────────
-- matriculas:  insert_staff · select_staff · update_staff        (is_staff())
-- profiles:    insert_auth_admin (signup) · insert_own · select_own ·
--              select_staff (is_staff(); LGPD Mov.3 mexe depois) · update_own ·
--              update_staff (is_staff() + role = ANY(lista SEM superadmin) —
--              ANTI-ESCALAÇÃO, não desfazer)
-- avaliacoes:  select (USING true)
--
-- ─── FALTAM (o que esta migração ADICIONA) ───────────────────────────────────
-- avaliacoes:  INSERT · UPDATE · DELETE  → sem INSERT o professor não cria
--              avaliação (createAvaliacao) → NÃO lança nota.
-- matriculas:  matriculas_select_own (aluno vê a PRÓPRIA — fecha o ERR-DATA-F4
--              / Plano Mestre F4, portal do aluno) · matriculas_delete_superadmin.
-- profiles:    profiles_insert_staff (staff cria perfil; com o MESMO guarda
--              anti-escalação do update_staff — staff não cria superadmin) ·
--              profiles_delete_superadmin (LGPD direito ao esquecimento).
--
-- Padrões: staff = is_staff() (família atual dessas tabelas); superadmin-only e
-- admin/superadmin = user_roles (VIEW sem RLS, ADR-006 — padrão das 059/061/062;
-- evita depender de is_superadmin() cuja presença em prod não foi confirmada).
-- DROP IF EXISTS apenas dos NOMES NOVOS (no-op se não existem — Postgres não
-- tem CREATE POLICY IF NOT EXISTS).
--
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) avaliacoes — INSERT/UPDATE/DELETE (só existia SELECT)
-- ─────────────────────────────────────────────────────────────────────────────

-- Professor cria avaliação SÓ da cadeira dele (056) + staff. Autoria travada.
DROP POLICY IF EXISTS "avaliacoes_insert" ON public.avaliacoes;
CREATE POLICY "avaliacoes_insert" ON public.avaliacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    criado_por = auth.uid()
    AND (
      public.professor_leciona_disciplina(disciplina_id)
      OR public.is_staff()
    )
  );

-- Professor edita avaliação da SUA cadeira; staff tudo.
DROP POLICY IF EXISTS "avaliacoes_update" ON public.avaliacoes;
CREATE POLICY "avaliacoes_update" ON public.avaliacoes
  FOR UPDATE TO authenticated
  USING      (public.professor_leciona_disciplina(disciplina_id) OR public.is_staff())
  WITH CHECK (public.professor_leciona_disciplina(disciplina_id) OR public.is_staff());

-- DELETE só admin/superadmin (is_staff incluiria administracao; apagar
-- avaliação CASCATEIA nas notas — 023 — então mais restrito, forma da 031).
DROP POLICY IF EXISTS "avaliacoes_delete" ON public.avaliacoes;
CREATE POLICY "avaliacoes_delete" ON public.avaliacoes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles
                 WHERE user_id = auth.uid() AND role IN ('admin','superadmin')));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) matriculas — as 2 que faltam (real=3 · esperado=5)
-- ─────────────────────────────────────────────────────────────────────────────

-- Aluno vê a PRÓPRIA matrícula — fecha ERR-DATA-F4 (Meu Curso/portal do aluno).
DROP POLICY IF EXISTS "matriculas_select_own" ON public.matriculas;
CREATE POLICY "matriculas_select_own" ON public.matriculas
  FOR SELECT TO authenticated
  USING (aluno_id = auth.uid());

-- Só superadmin deleta matrículas (forma da 035, via user_roles).
DROP POLICY IF EXISTS "matriculas_delete_superadmin" ON public.matriculas;
CREATE POLICY "matriculas_delete_superadmin" ON public.matriculas
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles
                 WHERE user_id = auth.uid() AND role = 'superadmin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) profiles — as 2 que faltam (real=6 · esperado=8 no modelo evoluído:
--    update_admin+update_administracao da 033 foram CONSOLIDADAS na
--    update_staff endurecida — não são "faltantes")
-- ─────────────────────────────────────────────────────────────────────────────

-- Staff cria perfis — com o MESMO guarda anti-escalação da update_staff atual:
-- staff NÃO cria perfil com role superadmin.
DROP POLICY IF EXISTS "profiles_insert_staff" ON public.profiles;
CREATE POLICY "profiles_insert_staff" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    AND role = ANY (ARRAY['pendente','aluno','professor','administracao','financeiro','admin'])
  );

-- Só superadmin deleta perfis (LGPD — direito ao esquecimento; forma da 033).
DROP POLICY IF EXISTS "profiles_delete_superadmin" ON public.profiles;
CREATE POLICY "profiles_delete_superadmin" ON public.profiles
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles
                 WHERE user_id = auth.uid() AND role = 'superadmin'));

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Contagens finais:
-- SELECT tablename, count(*) FROM pg_policies
-- WHERE schemaname='public'
--   AND tablename IN ('avaliacoes','matriculas','profiles')
-- GROUP BY tablename ORDER BY tablename;
--    Esperado: avaliacoes=4 · matriculas=5 · profiles=8
--
-- 2. As PRÉ-EXISTENTES intactas (comparar texto com o snapshot pré-063):
-- SELECT policyname, cmd, qual, with_check FROM pg_policies
-- WHERE schemaname='public' AND tablename IN ('avaliacoes','matriculas','profiles')
-- ORDER BY tablename, policyname;
--    → matriculas_insert/select/update_staff, profiles_insert_auth_admin,
--      profiles_update_staff (anti-escalação), profiles_select_staff etc.
--      devem estar BYTE A BYTE iguais ao antes (esta migração não as tocou).
--
-- 3. Testes por papel:
--    a) PROFESSOR da cadeira → LancarNotas cria avaliação e lança nota ✓
--    b) PROFESSOR de outra cadeira / ALUNO → criar avaliação → negado ✓
--    c) ALUNO → vê a própria matrícula (Meu Curso) ✓; a de outro → 0 linhas ✓
--    d) administracao → cria perfil role 'aluno' ✓; tenta criar 'superadmin' → negado ✓
--    e) DELETE de matrícula/perfil por não-superadmin → negado ✓
--    f) Signup (criar-aluno) continua OK — profiles_insert_auth_admin intocada ✓
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (desfaz APENAS o que a 063 adicionou — rodar INTEIRO, LICAO-041)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP POLICY IF EXISTS "avaliacoes_insert"            ON public.avaliacoes;
-- DROP POLICY IF EXISTS "avaliacoes_update"            ON public.avaliacoes;
-- DROP POLICY IF EXISTS "avaliacoes_delete"            ON public.avaliacoes;
-- DROP POLICY IF EXISTS "matriculas_select_own"        ON public.matriculas;
-- DROP POLICY IF EXISTS "matriculas_delete_superadmin" ON public.matriculas;
-- DROP POLICY IF EXISTS "profiles_insert_staff"        ON public.profiles;
-- DROP POLICY IF EXISTS "profiles_delete_superadmin"   ON public.profiles;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
-- (Volta ao estado pré-063: avaliacoes sem INSERT → professor sem lançar nota.)
