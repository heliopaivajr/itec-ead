-- Migration: 20260802_081_enrollment_todos_modulos.sql
-- Amplia o 080 — vincula TODAS as REGULARES de TODOS os módulos (retroativo + futuro).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
-- Depende de 008 (modulos/disciplinas_v2), 010 (matriculas_disciplina + UNIQUE), 014
--   (seed 6 módulos/46 disciplinas), 048 (disciplinas_v2.ativo), 080 (baseline Mód 1/2).
-- ⚠️ NÃO toca em auth. Só DADO.
--
-- ─── DECISÃO DO HÉLIO (2026-08-02) ───────────────────────────────────────────
-- Quer TODAS as disciplinas REGULARES de TODOS os módulos (1-6) vinculadas às turmas
-- com alunos — para lançar RETROATIVO (módulos passados), ATUAL, e conforme a turma
-- avança. Flexível/editável; os filtros (módulo/disciplina/aluno) facilitam o manuseio.
-- ELETIVAS: NÃO entram automático (aluno escolhe 5 de 10) → ficam manuais na ficha.
--
-- ─── O QUE FAZ ───────────────────────────────────────────────────────────────
-- PASSO 1 (reverter eletivas do 080): o 080 vinculou a 1ª turma às 2 eletivas do
--   Módulo 2 (B1PIE, T1FIE). Aqui elas voltam a ser MANUAIS — DELETE guardado, só
--   linhas 'cursando' SEM nota/faltas/frequência (nunca apaga o que teve lançamento).
-- PASSO 2 (ampliar regulares): para cada matrícula ATIVA das turmas com alunos, cria
--   matriculas_disciplina (status 'cursando') de TODAS as 36 REGULARES dos 6 módulos
--   do GRAD-TEO. IDEMPOTENTE (ON CONFLICT DO NOTHING — não duplica o 080, não toca
--   em nota/faltas). 6 regulares × 6 módulos = 36 disciplinas por aluno.
--
-- ─── 7ª DISCIPLINA DA 2ª TURMA (investigação) ────────────────────────────────
-- Após o 080 a 2ª turma apareceu com 7 disciplinas (esperado 6 do Mód 1). A 7ª é
-- T3APO (Apologética, Módulo 6) — artefato do teste A2 do João (migração 064).
-- Sob a regra "todos os módulos", Apologética passa a ser REGULAR legítima do Mód 6
-- para TODOS → o md do João é ABSORVIDO (deixa de ser anomalia). NÃO removemos: o 081
-- re-vincularia mesmo. Se a linha do João carregar nota/faltas de TESTE, ver query de
-- verificação nº 3 e avaliar reset manual (report-first — não apaga lançamento).
--
-- ─── TURMAS COM ALUNOS ───────────────────────────────────────────────────────
--   • TEO-2026-1 (2ª, 953b4ee8) e TEO-2025-1 (1ª, 163a9216) → ativas, com alunos.
--   • TEO-2026-2 (3ª) → planejada, sem alunos → fora do escopo.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── PASSO 1: eletivas auto-vinculadas pelo 080 voltam a ser MANUAIS (guardado) ──
WITH turmas_alvo(turma_id) AS (
  VALUES
    ('953b4ee8-9b33-4603-8290-dad1623db649'::uuid),  -- 2ª turma
    ('163a9216-0ee2-4242-8a75-6f66e7bdea0e'::uuid)   -- 1ª turma
)
DELETE FROM public.matriculas_disciplina md
USING public.matriculas m, public.disciplinas_v2 d, turmas_alvo ta
WHERE md.matricula_id  = m.id
  AND m.turma_id       = ta.turma_id
  AND md.disciplina_id = d.id
  AND d.tipo <> 'regular'                 -- eletiva/obrigatória → escolha manual
  AND md.status = 'cursando'
  AND md.nota                  IS NULL
  AND md.faltas                IS NULL
  AND md.frequencia_percentual IS NULL;

-- ── PASSO 2: vincular TODAS as REGULARES dos 6 módulos (retroativo + futuro) ──
WITH curso AS (
  SELECT id FROM public.cursos WHERE codigo = 'GRAD-TEO'
),
turmas_alvo(turma_id) AS (
  VALUES
    ('953b4ee8-9b33-4603-8290-dad1623db649'::uuid),
    ('163a9216-0ee2-4242-8a75-6f66e7bdea0e'::uuid)
),
-- 36 disciplinas: 6 regulares × 6 módulos (eletivas/obrigatórias excluídas).
regulares AS (
  SELECT d.id AS disciplina_id
  FROM public.disciplinas_v2 d
  JOIN public.modulos mo ON mo.id = d.modulo_id
  WHERE mo.curso_id = (SELECT id FROM curso)
    AND d.tipo = 'regular'
    AND d.ativo IS NOT FALSE
),
mat AS (
  SELECT m.id AS matricula_id
  FROM public.matriculas m
  JOIN turmas_alvo ta ON ta.turma_id = m.turma_id
  WHERE m.status = 'ativa'
)
INSERT INTO public.matriculas_disciplina (matricula_id, disciplina_id, status)
SELECT mat.matricula_id, regulares.disciplina_id, 'cursando'
FROM mat
CROSS JOIN regulares
ON CONFLICT (matricula_id, disciplina_id) DO NOTHING;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Regulares por módulo (esperado: 6 em cada um dos 6 módulos = 36 no total):
-- SELECT mo.ordem, count(*) FILTER (WHERE d.tipo='regular') AS regulares
-- FROM disciplinas_v2 d JOIN modulos mo ON mo.id = d.modulo_id
-- WHERE mo.curso_id = (SELECT id FROM cursos WHERE codigo='GRAD-TEO')
-- GROUP BY mo.ordem ORDER BY mo.ordem;
--
-- 2. Disciplinas distintas por turma (esperado: 36 em cada — todas as regulares):
-- SELECT t.codigo, count(DISTINCT md.disciplina_id) AS disciplinas
-- FROM matriculas_disciplina md
-- JOIN matriculas m ON m.id = md.matricula_id AND m.status='ativa'
-- JOIN turmas t     ON t.id = m.turma_id
-- WHERE t.id IN ('953b4ee8-9b33-4603-8290-dad1623db649',
--                '163a9216-0ee2-4242-8a75-6f66e7bdea0e')
-- GROUP BY t.codigo;
--
-- 3. Apologética (7ª) — checar se a linha do João tem nota/faltas de TESTE:
-- SELECT p.full_name, d.codigo, md.status, md.nota, md.faltas, md.frequencia_percentual
-- FROM matriculas_disciplina md
-- JOIN matriculas m     ON m.id = md.matricula_id
-- JOIN profiles p       ON p.id = m.aluno_id
-- JOIN disciplinas_v2 d ON d.id = md.disciplina_id
-- WHERE d.codigo = 'T3APO'
--   AND m.turma_id = '953b4ee8-9b33-4603-8290-dad1623db649'
-- ORDER BY p.full_name;
--   → Todos 'cursando' com null = enrollment limpo (nada a fazer).
--   → João com nota/faltas preenchidas = dado de TESTE → avaliar reset manual (avise).
--
-- 4. Eletivas do Mód 2 saíram da 1ª turma (esperado: 0 linhas):
-- SELECT count(*) FROM matriculas_disciplina md
-- JOIN matriculas m ON m.id=md.matricula_id
-- JOIN disciplinas_v2 d ON d.id=md.disciplina_id
-- WHERE m.turma_id='163a9216-0ee2-4242-8a75-6f66e7bdea0e'
--   AND d.codigo IN ('B1PIE','T1FIE');
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (LICAO-041 — rodar INTEIRO). SEGURO: só apaga REGULARES 'cursando'
-- pristine (sem nota/faltas/frequência) das 2 turmas. ⚠️ Reverte também o baseline
-- do 080 (Mód 1/2). As eletivas apagadas no PASSO 1 NÃO são restauradas — re-adicionar
-- manualmente na ficha se necessário.
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- WITH curso AS (SELECT id FROM public.cursos WHERE codigo='GRAD-TEO'),
-- turmas_alvo(turma_id) AS (VALUES
--   ('953b4ee8-9b33-4603-8290-dad1623db649'::uuid),
--   ('163a9216-0ee2-4242-8a75-6f66e7bdea0e'::uuid)),
-- regulares AS (
--   SELECT d.id AS disciplina_id FROM disciplinas_v2 d
--   JOIN modulos mo ON mo.id=d.modulo_id
--   WHERE mo.curso_id=(SELECT id FROM curso) AND d.tipo='regular')
-- DELETE FROM matriculas_disciplina md
-- USING matriculas m, regulares, turmas_alvo ta
-- WHERE md.matricula_id=m.id AND m.turma_id=ta.turma_id
--   AND md.disciplina_id=regulares.disciplina_id
--   AND md.status='cursando'
--   AND md.nota IS NULL AND md.faltas IS NULL AND md.frequencia_percentual IS NULL;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
