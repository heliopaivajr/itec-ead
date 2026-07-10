-- Migration: 20260709_058_roster_turma_aware.sql
-- Roster turma-aware — get_alunos_operacional ganha p_turma_id OPCIONAL
-- Origem: diagnóstico "Roster turma-aware" (IDEAS-BACKLOG 2.07). Substitui a 057.
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- A 057 criou get_alunos_operacional(p_disciplina_id uuid) — escopo DISCIPLINA.
-- A tela de Notas (LancarNotas/getConsolidadoTurma) é escopo TURMA; semear com o
-- roster de disciplina incluiria alunos de OUTRA turma da mesma disciplina.
-- Cadeia real (validada): matriculas_disciplina NÃO tem turma_id → a turma vem de
-- matriculas.turma_id (migração 019). Filtro turma = m.turma_id = p_turma_id.
--
-- ─── COMPATIBILIDADE COM MeusAlunos (decisão) ────────────────────────────────
-- ⚠️ NÃO dá para manter as duas assinaturas (uuid) e (uuid, uuid): uma chamada de
-- 1 argumento ficaria AMBÍGUA (Postgres: "function is not unique"; PostgREST:
-- PGRST203 "could not choose best candidate"). Por isso esta migração faz:
--   1) DROP da versão 1-arg da 057;
--   2) CREATE da versão 2-arg com p_turma_id DEFAULT NULL.
-- MeusAlunos (e LancarFrequencia/VerTurma) continuam chamando via RPC com só
-- { p_disciplina_id } — o PostgREST preenche p_turma_id com o DEFAULT NULL, que
-- significa "todas as turmas da disciplina" (= comportamento atual). NENHUMA
-- mudança de código é necessária para manter essas telas. A tela de Notas passará
-- a chamar com { p_disciplina_id, p_turma_id } quando for adaptada (código à parte).
--
-- Gate mantido: professor_leciona_disciplina (por disciplina) — suficiente hoje.
-- p_turma_id é FILTRO, não fronteira de segurança. (Professores diferentes por
-- turma da mesma disciplina exigiriam professor_leciona_turma + turma no contrato
-- — arquitetura futura, fora desta migração.)
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1) Remove a versão 1-arg da 057 (senão a chamada de 1 argumento fica ambígua).
DROP FUNCTION IF EXISTS public.get_alunos_operacional(uuid);

-- 2) Versão turma-aware: p_turma_id opcional (NULL = todas as turmas da disciplina).
CREATE OR REPLACE FUNCTION public.get_alunos_operacional(
  p_disciplina_id uuid,
  p_turma_id uuid DEFAULT NULL
)
RETURNS TABLE(
  aluno_id uuid,
  full_name text,
  avatar_url text,
  matricula_id uuid,
  nota numeric,
  faltas integer,
  frequencia_percentual numeric,
  status_disciplina text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    pr.id AS aluno_id,
    pr.full_name,
    pr.avatar_url,
    md.matricula_id,
    md.nota,
    md.faltas,
    md.frequencia_percentual,
    md.status AS status_disciplina
  FROM matriculas_disciplina md
  JOIN matriculas m   ON m.id = md.matricula_id
  JOIN profiles   pr  ON pr.id = m.aluno_id
  WHERE md.disciplina_id = p_disciplina_id
    AND (p_turma_id IS NULL OR m.turma_id = p_turma_id)   -- filtro de turma opcional
    AND (
      professor_leciona_disciplina(p_disciplina_id)
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
                 AND p.role IN ('admin','superadmin','administracao'))
    )
  ORDER BY pr.full_name;
$$;

-- Minimização de superfície: só authenticated executa (nunca anon).
REVOKE EXECUTE ON FUNCTION public.get_alunos_operacional(uuid, uuid) FROM anon;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Só a versão 2-arg deve existir (a 1-arg foi removida):
-- SELECT proname, pg_get_function_identity_arguments(oid) AS args
-- FROM pg_proc WHERE proname = 'get_alunos_operacional';
--    Esperado: 1 linha, args = 'p_disciplina_id uuid, p_turma_id uuid'.
--
-- 2. anon sem EXECUTE:
-- SELECT grantee, privilege_type FROM information_schema.routine_privileges
-- WHERE routine_name = 'get_alunos_operacional';
--
-- 3. Comportamento (como professor da cadeira OU staff; exige matriculas_disciplina
--    + matriculas.turma_id populados):
--    a) get_alunos_operacional('D')            → todos os matriculados da disciplina D
--       (p_turma_id default NULL) — mantém MeusAlunos funcionando.
--    b) get_alunos_operacional('D','T1')       → só os alunos da turma T1 em D.
--    c) get_alunos_operacional('D','T2')       → só os da turma T2 (disjunto de T1).
--    d) professor de outra cadeira / aluno     → 0 linhas (gate).
--    (Via API: POST /rest/v1/rpc/get_alunos_operacional {"p_disciplina_id":"D"}  ou
--     {"p_disciplina_id":"D","p_turma_id":"T1"})
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (se necessário — volta à função de 1 arg da 057)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.get_alunos_operacional(uuid, uuid);
-- CREATE OR REPLACE FUNCTION public.get_alunos_operacional(p_disciplina_id uuid)
-- RETURNS TABLE(aluno_id uuid, full_name text, avatar_url text, matricula_id uuid,
--               nota numeric, faltas integer, frequencia_percentual numeric,
--               status_disciplina text)
-- LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
--   SELECT pr.id, pr.full_name, pr.avatar_url, md.matricula_id,
--          md.nota, md.faltas, md.frequencia_percentual, md.status
--   FROM matriculas_disciplina md
--   JOIN matriculas m  ON m.id = md.matricula_id
--   JOIN profiles   pr ON pr.id = m.aluno_id
--   WHERE md.disciplina_id = p_disciplina_id
--     AND ( professor_leciona_disciplina(p_disciplina_id)
--           OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
--                      AND p.role IN ('admin','superadmin','administracao')) )
--   ORDER BY pr.full_name;
-- $$;
-- REVOKE EXECUTE ON FUNCTION public.get_alunos_operacional(uuid) FROM anon;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
