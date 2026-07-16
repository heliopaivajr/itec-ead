-- Migration: 20260714_061_frequencia_policies_insert.sql
-- SDD Bug Fix A1b - restaurar policies completas de public.frequencia.
--
-- CONTEXTO
-- A auditoria em producao confirmou que public.frequencia ficou com uma unica
-- policy vigente: frequencia_professor_update (UPDATE). Com RLS habilitado e sem
-- policy de INSERT, o professor nao cria chamada nova e recebe:
-- "new row violates row-level security policy".
--
-- O que a 031 tinha para frequencia:
-- 1) frequencia_professor_lanca: INSERT por role em user_roles
--    ('professor','admin','superadmin','administracao').
-- 2) frequencia_aluno_ve_propria: SELECT para aluno_id = auth.uid() OU roles de
--    gestao/professor.
-- 3) frequencia_admin_total: FOR ALL para admin/superadmin/administracao.
--
-- O que a 059 fez:
-- - Recriou apenas frequencia_professor_update, assumindo que INSERT/SELECT/ALL
--   da 031 continuavam vigentes.
--
-- Schema confirmado em 011:
-- public.frequencia(id, disciplina_id, aluno_id, professor_id, data_aula,
--                   presente, justificada, documento_url, observacao,
--                   registrado_em)
-- - aluno_id     -> public.profiles(id)
-- - professor_id -> public.profiles(id)
-- - nao existe turma_id em frequencia.
--
-- Verificacao por papel apos aplicar:
-- - Professor da disciplina: SELECT/INSERT/UPDATE na propria cadeira.
-- - Staff (admin/superadmin/administracao): SELECT/INSERT/UPDATE/DELETE.
-- - Aluno: SELECT apenas da propria frequencia (aluno_id = auth.uid()).
-- - Professor fora da disciplina: negado.
--
-- Aplicacao: SQL Editor (service_role), manual. NUNCA via CLI (ERR-INFRA-001).

BEGIN;

ALTER TABLE public.frequencia ENABLE ROW LEVEL SECURITY;

-- Limpa nomes antigos da 011/031/059 e os nomes novos desta 061.
DROP POLICY IF EXISTS "frequencia_professor_lanca"              ON public.frequencia;
DROP POLICY IF EXISTS "frequencia_aluno_ve_propria"             ON public.frequencia;
DROP POLICY IF EXISTS "frequencia_admin_total"                  ON public.frequencia;
DROP POLICY IF EXISTS "frequencia_professor_update"             ON public.frequencia;
DROP POLICY IF EXISTS "frequencia_professor_insert"             ON public.frequencia;
DROP POLICY IF EXISTS "frequencia_select_aluno_propria"         ON public.frequencia;
DROP POLICY IF EXISTS "frequencia_select_professor_disciplina"  ON public.frequencia;
DROP POLICY IF EXISTS "frequencia_staff_all"                    ON public.frequencia;

-- Staff tem gestao completa da frequencia, inclusive correcao e exclusao.
CREATE POLICY "frequencia_staff_all" ON public.frequencia
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin','superadmin','administracao')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin','superadmin','administracao')
    )
  );

-- Aluno le apenas a propria frequencia.
CREATE POLICY "frequencia_select_aluno_propria" ON public.frequencia
  FOR SELECT TO authenticated
  USING (aluno_id = auth.uid());

-- Professor le a frequencia das disciplinas em que leciona.
CREATE POLICY "frequencia_select_professor_disciplina" ON public.frequencia
  FOR SELECT TO authenticated
  USING (public.professor_leciona_disciplina(disciplina_id));

-- Professor cria chamada apenas na disciplina em que leciona.
-- professor_id aponta para profiles(id), entao a autoria deve ser auth.uid().
CREATE POLICY "frequencia_professor_insert" ON public.frequencia
  FOR INSERT TO authenticated
  WITH CHECK (
    professor_id = auth.uid()
    AND public.professor_leciona_disciplina(disciplina_id)
  );

-- Professor corrige chamada/justificativa apenas na disciplina em que leciona.
-- DELETE fica restrito ao staff via frequencia_staff_all.
CREATE POLICY "frequencia_professor_update" ON public.frequencia
  FOR UPDATE TO authenticated
  USING (public.professor_leciona_disciplina(disciplina_id))
  WITH CHECK (
    professor_id = auth.uid()
    AND public.professor_leciona_disciplina(disciplina_id)
  );

COMMIT;
NOTIFY pgrst, 'reload schema';

-- VERIFICACAO POS-APLICACAO
--
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename = 'frequencia'
-- ORDER BY policyname;
--
-- Esperado:
-- - frequencia_staff_all: ALL
-- - frequencia_select_aluno_propria: SELECT
-- - frequencia_select_professor_disciplina: SELECT
-- - frequencia_professor_insert: INSERT
-- - frequencia_professor_update: UPDATE
--
-- Testes manuais:
-- 1) Professor da disciplina insere chamada nova: permitido.
-- 2) Professor da disciplina salva de novo no mesmo dia (ON CONFLICT/UPDATE):
--    permitido.
-- 3) Professor fora da disciplina insere/atualiza: negado.
-- 4) Administracao/admin/superadmin gerencia: permitido.
-- 5) Aluno consulta a propria frequencia: permitido.
-- 6) Aluno consulta frequencia de outro aluno: negado.

-- ROLLBACK DE EMERGENCIA PARA O ESTADO PRE-061
-- ATENCAO: reabre o bug de INSERT/SELECT ausentes se o banco realmente estiver
-- apenas com frequencia_professor_update. Use somente para desfazer esta 061.
--
-- BEGIN;
-- DROP POLICY IF EXISTS "frequencia_staff_all"                   ON public.frequencia;
-- DROP POLICY IF EXISTS "frequencia_select_aluno_propria"        ON public.frequencia;
-- DROP POLICY IF EXISTS "frequencia_select_professor_disciplina" ON public.frequencia;
-- DROP POLICY IF EXISTS "frequencia_professor_insert"            ON public.frequencia;
-- DROP POLICY IF EXISTS "frequencia_professor_update"            ON public.frequencia;
-- CREATE POLICY "frequencia_professor_update" ON public.frequencia
--   FOR UPDATE TO authenticated
--   USING      (public.professor_leciona_disciplina(disciplina_id))
--   WITH CHECK (public.professor_leciona_disciplina(disciplina_id));
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
