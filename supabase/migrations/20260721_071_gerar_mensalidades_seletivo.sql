-- Migration: 20260721_071_gerar_mensalidades_seletivo.sql
-- Financeiro 2c.1 — geração SELETIVA: escolher quais matrículas gerar (individual/lote)
-- Depende de 070 (gerar_mensalidades_mes). NÃO executar via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- A 070 gera TODAS as matrículas ativas de uma vez. O Hélio precisa de controle:
-- gerar coletivo OU individual, escolhendo quem. Adiciona p_matricula_ids uuid[]:
--   NULL/ausente = todas as ativas (compat 070); preenchido = só essas.
--
-- Postgres não faz overload por DEFAULT sem ambiguidade → DROP da 4-arg da 070 +
-- CREATE da 5-arg (espelha o padrão da 058). O front chama sempre com o array
-- (ou NULL). Idempotência, gate e SECURITY DEFINER inalterados.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Remove a versão 4-arg da 070 (senão a chamada fica ambígua com o novo default).
DROP FUNCTION IF EXISTS public.gerar_mensalidades_mes(integer, integer, integer, uuid);

CREATE OR REPLACE FUNCTION public.gerar_mensalidades_mes(
  p_ano integer,
  p_mes integer,                    -- 1-12
  p_dia_vencimento integer,         -- ex.: 10
  p_registrado_por uuid,
  p_matricula_ids uuid[] DEFAULT NULL   -- NULL = todas as ativas; senão só essas
)
RETURNS TABLE(geradas integer, ja_existiam integer, sem_preco integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_mes_ref date := make_date(p_ano, p_mes, 1);
  v_venc    date := make_date(p_ano, p_mes, LEAST(GREATEST(p_dia_vencimento,1),28));
  v_geradas integer := 0;
  v_compreco integer := 0;
  v_sempreco integer := 0;
BEGIN
  IF NOT (is_staff() OR is_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para gerar mensalidades';
  END IF;

  WITH ativos AS (
    SELECT m.id AS matricula_id, m.aluno_id,
           r.valor_mensalidade_ate  AS v_base,
           r.valor_mensalidade_apos AS v_multa,
           r.origem_mensalidade     AS origem
    FROM matriculas m
    CROSS JOIN LATERAL resolver_valor_efetivo(m.id, p_ano) r
    WHERE m.status = 'ativa'
      AND (p_matricula_ids IS NULL OR m.id = ANY(p_matricula_ids))   -- SELEÇÃO
  ),
  inseridos AS (
    INSERT INTO mensalidades
      (aluno_id, matricula_id, valor, valor_com_atraso, mes_referencia, data_vencimento, status, registrado_por)
    SELECT a.aluno_id, a.matricula_id, a.v_base, a.v_multa, v_mes_ref, v_venc, 'pendente', p_registrado_por
    FROM ativos a
    WHERE a.origem <> 'sem_tabela' AND a.v_base IS NOT NULL
    ON CONFLICT (aluno_id, mes_referencia) DO NOTHING
    RETURNING 1
  )
  SELECT
    (SELECT count(*) FROM inseridos),
    (SELECT count(*) FROM ativos WHERE origem <> 'sem_tabela'),
    (SELECT count(*) FROM ativos WHERE origem =  'sem_tabela')
  INTO v_geradas, v_compreco, v_sempreco;

  geradas     := v_geradas;
  ja_existiam := v_compreco - v_geradas;
  sem_preco   := v_sempreco;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.gerar_mensalidades_mes(integer, integer, integer, uuid, uuid[]) FROM anon;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar — exige 068+069+070)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Só a versão 5-arg existe:
-- SELECT pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname='gerar_mensalidades_mes';
--    Esperado: 'p_ano integer, p_mes integer, p_dia_vencimento integer, p_registrado_por uuid, p_matricula_ids uuid[]'
--
-- 2. Individual (só 1 matrícula):
-- SELECT * FROM gerar_mensalidades_mes(2026, 9, 10, '<uuid-staff>', ARRAY['<matricula-João>']::uuid[]);
--    → geradas=1 (se sem preço=0 e não existia).
-- 3. Coletivo (todas): mesma chamada com NULL no 5º arg → todas as ativas.
-- 4. Idempotência mantida: repetir a individual → geradas=0, ja_existiam=1.
-- 5. anon → sem EXECUTE ✓.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (volta à 4-arg da 070 — rodar INTEIRO, LICAO-041)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.gerar_mensalidades_mes(integer, integer, integer, uuid, uuid[]);
-- -- (re-aplicar o CREATE 4-arg da 070)
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
