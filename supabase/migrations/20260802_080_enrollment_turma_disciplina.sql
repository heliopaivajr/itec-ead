-- Migration: 20260802_080_enrollment_turma_disciplina.sql
-- Correção RAIZ — materializa o vínculo turma→disciplina (enrollment em massa).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
-- Depende de 008 (cursos/modulos/disciplinas_v2), 010 (matriculas_disciplina + UNIQUE),
--   014 (seed: 6 módulos + 46 disciplinas), 018 (turmas), 046 (matrículas de turma).
-- ⚠️ NÃO toca em auth. Só DADO: cria as linhas matriculas_disciplina que faltavam.
--
-- ─── PROBLEMA (diagnóstico validado) ─────────────────────────────────────────
-- getDisciplinasDaTurma() retorna [] porque a turma não tem vínculo turma→disciplina:
--   • aulas_recorrentes (grade horária) nunca foi cadastrada; E
--   • matriculas_disciplina está vazia — a 046 matriculou só no NÍVEL DA TURMA
--     (tabela matriculas), NUNCA por disciplina.
-- → dropdown de disciplina vazio → Frequência / Notas / impressão travados.
-- Uma causa, vários sintomas. Este script materializa o vínculo (fonte 2 do dropdown).
--
-- ─── O QUE FAZ ───────────────────────────────────────────────────────────────
-- Para cada matrícula ATIVA das turmas mapeadas, cria matriculas_disciplina
-- (status 'cursando') de TODAS as disciplinas do MÓDULO ATUAL da turma.
-- IDEMPOTENTE: ON CONFLICT (matricula_id, disciplina_id) DO NOTHING → não duplica
-- e NÃO toca em quem já tem md (nota/faltas/frequência preservadas).
--
-- ─── MAPA turma → módulo atual (2026) ────────────────────────────────────────
-- O "módulo atual" NÃO é derivável do schema (turmas.curso_id é NULL no seed 018;
-- não existe modulo_id em turmas). Fonte: turmas.observacoes + CLAUDE.md. Explícito:
--   • TEO-2026-1 (2ª turma, 953b4ee8) → Módulo 1 — 6 disciplinas (todas regulares)
--   • TEO-2025-1 (1ª turma, 163a9216) → Módulo 2 — 8 disciplinas (6 reg + 2 eletivas)
--   • TEO-2026-2 (3ª turma) → 'planejada', sem alunos → FORA do escopo.
-- Decisão do Hélio (2026-08-02): incluir TODAS as disciplinas do módulo (eletivas
-- inclusas). A escolha individual de eletivas (5 de 10) é corrigida aluno-a-aluno
-- depois, pela ficha acadêmica (matricularEmDisciplina / atualizarStatusDisciplina).
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

WITH curso AS (
  SELECT id FROM public.cursos WHERE codigo = 'GRAD-TEO'
),
-- Mapa explícito turma → ordem do módulo atual (só turmas com alunos ativos).
mapa(turma_id, modulo_ordem) AS (
  VALUES
    ('953b4ee8-9b33-4603-8290-dad1623db649'::uuid, 1),  -- 2ª turma TEO-2026-1 → Módulo 1
    ('163a9216-0ee2-4242-8a75-6f66e7bdea0e'::uuid, 2)   -- 1ª turma TEO-2025-1 → Módulo 2
),
-- Disciplinas de cada módulo mapeado (regulares + eletivas).
disc AS (
  SELECT mp.turma_id, d.id AS disciplina_id
  FROM mapa mp
  JOIN public.modulos mo
    ON mo.curso_id = (SELECT id FROM curso)
   AND mo.ordem    = mp.modulo_ordem
  JOIN public.disciplinas_v2 d
    ON d.modulo_id = mo.id
),
-- Matrículas ATIVAS das turmas mapeadas.
mat AS (
  SELECT m.id AS matricula_id, m.turma_id
  FROM public.matriculas m
  JOIN mapa mp ON mp.turma_id = m.turma_id
  WHERE m.status = 'ativa'
)
INSERT INTO public.matriculas_disciplina (matricula_id, disciplina_id, status)
SELECT mat.matricula_id, disc.disciplina_id, 'cursando'
FROM mat
JOIN disc ON disc.turma_id = mat.turma_id
ON CONFLICT (matricula_id, disciplina_id) DO NOTHING;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Total de md por turma (esperado: nº alunos ativos × nº disciplinas do módulo):
-- SELECT t.codigo, count(*) AS md_total
-- FROM matriculas_disciplina md
-- JOIN matriculas m ON m.id = md.matricula_id
-- JOIN turmas t     ON t.id = m.turma_id
-- WHERE t.id IN ('953b4ee8-9b33-4603-8290-dad1623db649',
--                '163a9216-0ee2-4242-8a75-6f66e7bdea0e')
-- GROUP BY t.codigo;
--
-- 2. Disciplinas distintas por turma (esperado: 2ª turma = 6, 1ª turma = 8):
-- SELECT t.codigo, count(DISTINCT md.disciplina_id) AS disciplinas
-- FROM matriculas_disciplina md
-- JOIN matriculas m ON m.id = md.matricula_id AND m.status = 'ativa'
-- JOIN turmas t     ON t.id = m.turma_id
-- WHERE t.id IN ('953b4ee8-9b33-4603-8290-dad1623db649',
--                '163a9216-0ee2-4242-8a75-6f66e7bdea0e')
-- GROUP BY t.codigo;
--
-- 3. getDisciplinasDaTurma DESTRAVADO (fonte 2 agora tem dado) — deve listar as 6
--    disciplinas do Módulo 1 para a 2ª turma:
-- SELECT DISTINCT d.codigo, d.nome
-- FROM matriculas_disciplina md
-- JOIN matriculas m       ON m.id = md.matricula_id
-- JOIN disciplinas_v2 d   ON d.id = md.disciplina_id
-- WHERE m.turma_id = '953b4ee8-9b33-4603-8290-dad1623db649'
-- ORDER BY d.nome;
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (LICAO-041 — rodar INTEIRO). SEGURO: só apaga linhas 'cursando' criadas
-- por este script que continuam SEM nota/faltas/frequência (nunca apaga o que
-- recebeu lançamento depois).
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- WITH curso AS (SELECT id FROM public.cursos WHERE codigo = 'GRAD-TEO'),
-- mapa(turma_id, modulo_ordem) AS (VALUES
--   ('953b4ee8-9b33-4603-8290-dad1623db649'::uuid, 1),
--   ('163a9216-0ee2-4242-8a75-6f66e7bdea0e'::uuid, 2)),
-- disc AS (
--   SELECT mp.turma_id, d.id AS disciplina_id
--   FROM mapa mp
--   JOIN public.modulos mo ON mo.curso_id = (SELECT id FROM curso) AND mo.ordem = mp.modulo_ordem
--   JOIN public.disciplinas_v2 d ON d.modulo_id = mo.id)
-- DELETE FROM public.matriculas_disciplina md
-- USING public.matriculas m, disc
-- WHERE md.matricula_id  = m.id
--   AND m.turma_id       = disc.turma_id
--   AND md.disciplina_id = disc.disciplina_id
--   AND md.status        = 'cursando'
--   AND md.nota                  IS NULL
--   AND md.faltas                IS NULL
--   AND md.frequencia_percentual IS NULL;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
