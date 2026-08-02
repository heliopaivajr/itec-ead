-- Migration: 20260801_079_frequencia_fp.sql
-- Frequência 2.13f — meia-presença (FP). 3 estados: presente(1,0) · meia(0,5) · falta(0,0).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
-- Depende de 011 (frequencia) + 051 (matriculas_disciplina.faltas) + 065 (trigger consolidado).
-- ⚠️ NÃO toca em auth. A régua de cálculo vive NA FUNÇÃO do banco (LICAO-042): o front só marca.
--
-- ─── REGRA (Hélio) ───────────────────────────────────────────────────────────
-- freq% = (presentes·1,0 + meias·0,5 + faltas·0,0) / total × 100
-- faltas (exibido) = faltas·1,0 + meias·0,5  (FP conta 0,5 falta) → agora NUMÉRICO
-- aprovação: freq ≥ 75% E média ≥ 7,0 (inalterado); reprovado_falta quando freq < 75.
--
-- ─── O QUE ESTA MIGRAÇÃO FAZ ─────────────────────────────────────────────────
-- 1) frequencia +tipo_presenca ('presente'|'meia'|'falta'). Migra os dados existentes
--    (presente=true→'presente'; false→'falta'). Mantém `presente` (compat: o service
--    sincroniza presente = (tipo='presente'); leitores antigos seguem funcionando —
--    'meia' lê como não-presente, comportamento seguro).
-- 2) matriculas_disciplina.faltas: INT → NUMERIC(5,1) (para guardar 0,5).
-- 3) recalcular_consolidado (trigger 065) passa a usar os PESOS por tipo_presenca.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Coluna tipo_presenca (aditiva) + migração do dado existente
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.frequencia
  ADD COLUMN IF NOT EXISTS tipo_presenca text
    DEFAULT 'presente'
    CHECK (tipo_presenca IN ('presente','meia','falta'));

-- backfill dos registros já lançados (boolean → 3 estados)
UPDATE public.frequencia
   SET tipo_presenca = CASE WHEN presente THEN 'presente' ELSE 'falta' END
 WHERE tipo_presenca IS NULL
    OR tipo_presenca NOT IN ('presente','meia','falta');

COMMENT ON COLUMN public.frequencia.tipo_presenca IS
  'presente(1,0) | meia(0,5) | falta(0,0). Régua no trigger 065. `presente` é mantida em sincronia (compat).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) faltas passa a aceitar meia-falta (0,5) → numérico
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.matriculas_disciplina
  ALTER COLUMN faltas TYPE numeric(5,1) USING faltas::numeric;

COMMENT ON COLUMN public.matriculas_disciplina.faltas IS
  'Faltas ponderadas: falta=1,0 · meia-presença=0,5. Ex.: 1 falta + 1 meia = 1,5. NULL sem chamada.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) recalcular_consolidado — pesos por tipo_presenca (único ponto que muda vs 065)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.recalcular_consolidado(
  p_aluno_id      uuid,
  p_disciplina_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total     integer;
  v_presentes integer;
  v_meias     integer;
  v_faltas_n  integer;   -- nº de faltas cheias
  v_freq_pct  numeric;   -- NULL se não há chamada
  v_faltas    numeric;   -- ponderado (falta + 0,5·meia); NULL sem chamada
  v_freq_ef   numeric;   -- freq efetiva p/ status (100 quando sem chamada)
  v_n1        numeric;
  v_n2        numeric;
  v_nota      numeric;
  v_status    text;
BEGIN
  -- Frequência do par (aluno, disciplina) — por tipo_presenca (pesos)
  SELECT count(*),
         count(*) FILTER (WHERE tipo_presenca = 'presente'),
         count(*) FILTER (WHERE tipo_presenca = 'meia'),
         count(*) FILTER (WHERE tipo_presenca = 'falta')
    INTO v_total, v_presentes, v_meias, v_faltas_n
  FROM frequencia
  WHERE aluno_id = p_aluno_id AND disciplina_id = p_disciplina_id;

  IF v_total > 0 THEN
    -- peso: presente 1,0 · meia 0,5 · falta 0,0
    v_freq_pct := round((v_presentes * 1.0 + v_meias * 0.5) * 100.0 / v_total);
    -- faltas ponderadas: falta cheia + meia-falta
    v_faltas   := (v_faltas_n * 1.0) + (v_meias * 0.5);
  ELSE
    v_freq_pct := NULL;
    v_faltas   := NULL;
  END IF;
  v_freq_ef := COALESCE(v_freq_pct, 100);

  -- Notas N1/N2 (inalterado)
  SELECT max(n.nota) FILTER (WHERE a.tipo = 'N1'),
         max(n.nota) FILTER (WHERE a.tipo = 'N2')
    INTO v_n1, v_n2
  FROM notas_aluno n
  JOIN avaliacoes a ON a.id = n.avaliacao_id
  WHERE n.aluno_id = p_aluno_id AND n.disciplina_id = p_disciplina_id;

  IF v_n1 IS NOT NULL AND v_n2 IS NOT NULL THEN
    v_nota := round((v_n1 + v_n2) / 2.0, 1);
  ELSE
    v_nota := NULL;
  END IF;

  -- Status (inalterado — freq efetiva já reflete os pesos)
  IF v_nota IS NULL THEN
    v_status := 'cursando';
  ELSIF v_freq_ef < 75 THEN
    v_status := 'reprovado_falta';
  ELSIF v_nota >= 7.0 THEN
    v_status := 'aprovado';
  ELSIF v_nota >= 5.0 THEN
    v_status := 'recuperacao';
  ELSE
    v_status := 'reprovado';
  END IF;

  UPDATE matriculas_disciplina md
     SET nota                  = v_nota,
         faltas                = v_faltas,
         frequencia_percentual = v_freq_pct,
         status                = v_status
  FROM matriculas m
  WHERE m.id = md.matricula_id
    AND m.aluno_id = p_aluno_id
    AND md.disciplina_id = p_disciplina_id
    AND md.status NOT IN ('trancado','convalidado');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.recalcular_consolidado(uuid, uuid) FROM anon;

-- Re-consolida todos os pares com chamada (aplica os pesos ao histórico já lançado).
DO $$
DECLARE par record;
BEGIN
  FOR par IN SELECT DISTINCT aluno_id, disciplina_id FROM public.frequencia LOOP
    PERFORM public.recalcular_consolidado(par.aluno_id, par.disciplina_id);
  END LOOP;
END $$;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Coluna + migração:
-- SELECT tipo_presenca, count(*) FROM frequencia GROUP BY 1;  -- só presente/meia/falta
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name='matriculas_disciplina' AND column_name='faltas';  -- numeric
--
-- 2. Cálculo com FP (ex.: 7 presente + 2 meia + 1 falta em 10 aulas):
--   freq% = (7·1 + 2·0,5 + 1·0)·100/10 = 8·10 = 80%  · faltas = 1 + 2·0,5 = 2,0
--   UPDATE frequencia SET tipo_presenca='meia' WHERE id IN (<2 registros>);
--   → o trigger recalcula: SELECT frequencia_percentual, faltas FROM matriculas_disciplina
--     WHERE ...  → 80 e 2.0
--
-- 3. reprovado_falta continua < 75% (ex.: 6P+1FP em 10 = 65% → reprovado_falta se tem nota).
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041) — volta ao boolean presente
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- -- reaplicar recalcular_consolidado da 065 (conta presente/total; faltas int)
-- -- ALTER TABLE matriculas_disciplina ALTER COLUMN faltas TYPE integer USING round(faltas);
-- -- ALTER TABLE frequencia DROP COLUMN IF EXISTS tipo_presenca;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
