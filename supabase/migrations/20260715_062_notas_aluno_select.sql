-- Migration: 20260715_062_notas_aluno_select.sql
-- SDD Bug Fix — restaurar SELECT (e DELETE) de public.notas_aluno.
-- Par da 061 (frequencia): mesmo dano, mesma família de correção.
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- Auditoria por SQL em produção confirmou que notas_aluno está SÓ com
-- notas_aluno_insert + notas_aluno_update (as duas recriadas pela 059).
-- FALTAM SELECT e DELETE → com RLS ativo, NINGUÉM lê notas: o professor não vê
-- o que lançou (ConsolidadoNotas/LancarNotas abrem vazios), o aluno não verá
-- "Minhas Notas" (Fase C), o staff não vê nada.
--
-- O que existia antes (histórico):
-- 1) 023 (original): notas_aluno_select = aluno_id = auth.uid() OU role IN
--    ('admin','superadmin','administracao','professor') via PROFILES (pré-ADR-006);
--    notas_aluno_delete = admin/superadmin (023) → superadmin-only na 031.
-- 2) 031: recriou as 4 (select/insert/update/delete) trocando profiles→user_roles.
--    SELECT: aluno próprio OU staff/professor (QUALQUER professor via TODAS).
-- 3) 059: dropou/recriou APENAS insert+update (comentário explícito: "SELECT/DELETE
--    NÃO tocados") — o .sql da 059 não explica o sumiço do SELECT/DELETE.
--    Nenhuma migração versionada dropa o select sem recriar → a perda veio de
--    execução manual no SQL Editor (ex.: bloco de DROPs/rollback rodado parcial).
--
-- Schema confirmado (023):
-- notas_aluno(id, avaliacao_id, aluno_id, disciplina_id, turma_id, nota,
--             lancado_por, lancado_em, updated_at)
-- - aluno_id      → profiles(id)  ← liga DIRETO ao aluno (sem passar por matricula)
-- - disciplina_id → disciplinas_v2(id)  ← direto na tabela (gate não navega)
-- - lancado_por   → profiles(id)
--
-- Endurecimento intencional (vs 031): o SELECT do professor passa a ser escopado
-- à cadeira dele (professor_leciona_disciplina, 056) — antes qualquer professor
-- via TODAS as notas. Coerente com 059/061 e com a LGPD-01 fase 2. Consumidores
-- validados: ConsolidadoTurma/LancarNotas (professor da cadeira ✓), Minhas Notas/
-- histórico do aluno (aluno_id = auth.uid() ✓), FichaAluno/R-relatórios (staff ✓).
--
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.notas_aluno ENABLE ROW LEVEL SECURITY;

-- Limpa nomes históricos (023/031) e o nome desta 062 (idempotência).
DROP POLICY IF EXISTS "notas_aluno_select" ON public.notas_aluno;
DROP POLICY IF EXISTS "notas_aluno_delete" ON public.notas_aluno;

-- SELECT: aluno vê a PRÓPRIA nota; professor vê as da SUA cadeira; staff vê tudo.
CREATE POLICY "notas_aluno_select" ON public.notas_aluno
  FOR SELECT TO authenticated
  USING (
    aluno_id = auth.uid()                                      -- aluno: a própria (Fase C)
    OR public.professor_leciona_disciplina(disciplina_id)      -- professor DA cadeira (056)
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  );

-- DELETE: restrito a superadmin (forma da 031). Professor corrige via UPDATE.
CREATE POLICY "notas_aluno_delete" ON public.notas_aluno
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles
                 WHERE user_id = auth.uid() AND role = 'superadmin'));

-- INSERT/UPDATE da 059 (gate professor_leciona_disciplina OR staff + autoria
-- lancado_por = auth.uid()): NÃO tocados — continuam corretos.

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Conjunto completo esperado em notas_aluno (4 policies):
-- SELECT policyname, cmd FROM pg_policies
-- WHERE schemaname='public' AND tablename='notas_aluno' ORDER BY policyname;
--    Esperado: notas_aluno_delete (DELETE) · notas_aluno_insert (INSERT) ·
--              notas_aluno_select (SELECT) · notas_aluno_update (UPDATE).
--
-- 2. Testes por papel:
--    a) PROFESSOR da cadeira → ConsolidadoNotas/LancarNotas mostram as notas ✓
--    b) PROFESSOR de outra cadeira → 0 linhas (endurecido) ✓
--    c) ALUNO → SELECT das próprias notas ✓; de outro aluno → 0 linhas ✓
--    d) administracao/admin/superadmin → veem tudo ✓
--    e) DELETE por não-superadmin → negado ✓
--
-- 3. 🔍 LEVANTAMENTO GERAL (fecha o "buraco por buraco") — comparar o conjunto
--    REAL das tabelas críticas com o ESPERADO abaixo:
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname='public'
--   AND tablename IN ('frequencia','notas_aluno','avaliacoes',
--                     'matriculas_disciplina','matriculas','profiles')
-- ORDER BY tablename, policyname;
--
--    ESPERADO (fonte: migrações versionadas):
--    frequencia (pós-061, 5): frequencia_staff_all (ALL) ·
--      frequencia_select_aluno_propria (SELECT) ·
--      frequencia_select_professor_disciplina (SELECT) ·
--      frequencia_professor_insert (INSERT) · frequencia_professor_update (UPDATE)
--    notas_aluno (pós-062, 4): select · insert · update · delete
--    avaliacoes (031, 4): avaliacoes_select (SELECT, USING true) ·
--      avaliacoes_insert · avaliacoes_update · avaliacoes_delete
--    matriculas_disciplina (010, 2): mat_disc_aluno_ve_propria (SELECT) ·
--      mat_disc_gestao_staff (ALL)
--    matriculas (035, 5): matriculas_select_own · matriculas_select_staff ·
--      matriculas_insert_staff · matriculas_update_staff ·
--      matriculas_delete_superadmin
--    profiles (033, 8): select_own · select_staff · insert_own · insert_staff ·
--      update_own · update_admin · update_administracao · delete_superadmin
--    → QUALQUER tabela com policy a menos = mesmo dano das 061/062: reportar.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (desfaz APENAS a 062 — volta ao estado quebrado pré-062!)
-- ═════════════════════════════════════════════════════════════════════════════
-- ⚠️ Reabre o buraco (ninguém lê nota). Usar somente para desfazer esta migração.
-- BEGIN;
-- DROP POLICY IF EXISTS "notas_aluno_select" ON public.notas_aluno;
-- DROP POLICY IF EXISTS "notas_aluno_delete" ON public.notas_aluno;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
--
-- (Alternativa: restaurar o SELECT no formato da 031 — professor vê TODAS:
-- CREATE POLICY "notas_aluno_select" ON public.notas_aluno
--   FOR SELECT TO authenticated
--   USING (aluno_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles
--          WHERE user_id = auth.uid()
--            AND role IN ('admin','superadmin','administracao','professor'))); )
