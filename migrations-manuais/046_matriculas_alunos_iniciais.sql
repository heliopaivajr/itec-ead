-- Migration manual: 046_matriculas_alunos_iniciais.sql
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ver ERR-INFRA-001)
-- Data: 2026-06-17
--
-- ─── OBJETIVO ───────────────────────────────────────────────────────────────
-- Criar matrícula 'ativa' para os alunos recém-importados que ficaram SEM
-- matrícula (foram criados com turma_id nulo na Edge Function criar-aluno).
-- O Lucas já tem matrícula → NÃO duplicar (garantido pelo NOT EXISTS).
--
-- ─── REGRAS ─────────────────────────────────────────────────────────────────
-- Público-alvo: profiles com role IN ('aluno','pendente') e codigo_itec 'ITEC-%'.
-- Mapeamento de turma pelo ano do codigo_itec:
--   ITEC-2025-%  → turma TEO-2025-1 (163a9216-0ee2-4242-8a75-6f66e7bdea0e), data_inicio 2025-02-01
--   ITEC-2026-%  → turma TEO-2026-1 (953b4ee8-9b33-4603-8290-dad1623db649), data_inicio 2026-02-01
-- curso_id (TEXT): 'dfc8eda9-ce75-4869-945a-39c80e4c649b' (Graduação em Teologia)
-- status: 'ativa'
--
-- Contagem esperada de INSERT: ~29 (30 importados − 1 Lucas que já tem matrícula).
--
-- IDEMPOTENTE: rodar 2x não duplica — o NOT EXISTS pula quem já tem matrícula.
-- Só matricula quem casa em um dos dois padrões de ano (evita turma_id nulo).
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.matriculas (id, aluno_id, turma_id, curso_id, status, data_inicio, created_at)
SELECT
  gen_random_uuid(),
  p.id,
  CASE
    WHEN p.codigo_itec LIKE 'ITEC-2025-%' THEN '163a9216-0ee2-4242-8a75-6f66e7bdea0e'
    WHEN p.codigo_itec LIKE 'ITEC-2026-%' THEN '953b4ee8-9b33-4603-8290-dad1623db649'
  END AS turma_id,
  'dfc8eda9-ce75-4869-945a-39c80e4c649b' AS curso_id,
  'ativa' AS status,
  CASE
    WHEN p.codigo_itec LIKE 'ITEC-2025-%' THEN DATE '2025-02-01'
    WHEN p.codigo_itec LIKE 'ITEC-2026-%' THEN DATE '2026-02-01'
  END AS data_inicio,
  now() AS created_at
FROM public.profiles p
WHERE p.role IN ('aluno', 'pendente')
  AND p.codigo_itec LIKE 'ITEC-%'
  AND (p.codigo_itec LIKE 'ITEC-2025-%' OR p.codigo_itec LIKE 'ITEC-2026-%')
  AND NOT EXISTS (
    SELECT 1 FROM public.matriculas m WHERE m.aluno_id = p.id
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após o INSERT)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT count(*) FROM public.matriculas WHERE status = 'ativa';

-- Conferência por turma (opcional):
-- SELECT turma_id, count(*) FROM public.matriculas WHERE status='ativa' GROUP BY turma_id;
