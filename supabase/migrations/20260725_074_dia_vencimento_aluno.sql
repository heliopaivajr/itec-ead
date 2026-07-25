-- Migration: 20260725_074_dia_vencimento_aluno.sql
-- Financeiro 2g — dia de vencimento PADRÃO por aluno (persistente).
-- Decisão do Hélio: antes a Ficha Financeira derivava o dia da última mensalidade
-- gerada; agora o dia "gruda" na matrícula e vira o default da geração por aluno.
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── O QUE ESTA MIGRAÇÃO FAZ ─────────────────────────────────────────────────
-- 1) Coluna ADITIVA em matriculas: dia_vencimento_padrao smallint DEFAULT 10,
--    CHECK 1..30 (decisão do Hélio: permitir até dia 30). Herda a RLS de
--    matriculas; default 10 = comportamento atual.
-- 2) set_dia_vencimento_padrao(matricula_id, dia) — SECURITY DEFINER, gate
--    is_staff() OR is_financeiro(). MOTIVO (fronteira 067): o role `financeiro`
--    NÃO tem UPDATE em matriculas (só SELECT) — sem esta função a edição do dia na
--    Ficha Financeira falharia para o financeiro. Escreve SÓ dia_vencimento_padrao
--    (financeiro edita 1 campo sem ganhar UPDATE amplo). Mesmo padrão da 072
--    (set_valor_mensalidade_override).
-- 3) REDEFINE gerar_mensalidades_mes (mesma assinatura 5-arg da 071) para ajustar
--    MESES CURTOS: a 071 cortava o vencimento em 28 fixo (`LEAST(...,28)`) — com o
--    cap novo de 30, dia 29/30 seria silenciosamente reduzido a 28. Agora o clamp
--    usa o ÚLTIMO DIA DO MÊS (ex.: dia 30 em fevereiro → 28/29; em mês de 31 → 30).
--    Só muda o cálculo de v_venc; idempotência/gate/seleção inalterados.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1) coluna aditiva
ALTER TABLE public.matriculas
  ADD COLUMN IF NOT EXISTS dia_vencimento_padrao smallint
    DEFAULT 10
    CHECK (dia_vencimento_padrao BETWEEN 1 AND 30);

COMMENT ON COLUMN public.matriculas.dia_vencimento_padrao IS
  'Dia do mês (1-30) usado como vencimento padrão das mensalidades deste aluno. '
  'A geração ajusta meses curtos para o último dia do mês. Editável na Ficha Financeira (2g).';

-- 2) setter focado (preserva a fronteira 067: financeiro não ganha UPDATE amplo)
CREATE OR REPLACE FUNCTION public.set_dia_vencimento_padrao(
  p_matricula_id uuid,
  p_dia smallint
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (is_staff() OR is_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para editar o dia de vencimento';
  END IF;
  IF p_dia IS NULL OR p_dia < 1 OR p_dia > 30 THEN
    RAISE EXCEPTION 'dia_vencimento_padrao inválido (1..30): %', p_dia;
  END IF;

  UPDATE matriculas
     SET dia_vencimento_padrao = p_dia
   WHERE id = p_matricula_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matrícula não encontrada';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_dia_vencimento_padrao(uuid, smallint) FROM anon;

-- 3) REDEFINE gerar_mensalidades_mes — clamp do vencimento no ÚLTIMO DIA DO MÊS
--    (antes: LEAST(...,28) fixo). Mesma assinatura 5-arg da 071 → CREATE OR REPLACE
--    (sem DROP). Único ponto alterado: v_ultimo_dia + v_venc. Resto idêntico à 071.
CREATE OR REPLACE FUNCTION public.gerar_mensalidades_mes(
  p_ano integer,
  p_mes integer,                    -- 1-12
  p_dia_vencimento integer,         -- ex.: 10 (por aluno vem de dia_vencimento_padrao)
  p_registrado_por uuid,
  p_matricula_ids uuid[] DEFAULT NULL   -- NULL = todas as ativas; senão só essas
)
RETURNS TABLE(geradas integer, ja_existiam integer, sem_preco integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_mes_ref    date    := make_date(p_ano, p_mes, 1);
  -- último dia do mês de referência (28/29/30/31) — ajusta meses curtos
  v_ultimo_dia integer := extract(day FROM (v_mes_ref + interval '1 month - 1 day'))::int;
  v_venc       date    := make_date(p_ano, p_mes, LEAST(GREATEST(p_dia_vencimento, 1), v_ultimo_dia));
  v_geradas    integer := 0;
  v_compreco   integer := 0;
  v_sempreco   integer := 0;
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
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Coluna existe com default 10:
-- SELECT column_name, column_default, data_type
--   FROM information_schema.columns
--  WHERE table_name = 'matriculas' AND column_name = 'dia_vencimento_padrao';
--    → column_default = 10; data_type = smallint
--
-- 2. CHECK 1..30 ativo (deve falhar):
-- UPDATE matriculas SET dia_vencimento_padrao = 31 WHERE id = '<qualquer>';
--    → ERRO de violação de CHECK (esperado).
--
-- 3. Linhas existentes assumem o default:
-- SELECT count(*) FILTER (WHERE dia_vencimento_padrao = 10) AS com_default,
--        count(*) AS total FROM matriculas;   → com_default = total
--
-- 4. Setter existe e respeita papéis:
-- SELECT proname FROM pg_proc WHERE proname = 'set_dia_vencimento_padrao';  → 1
-- SELECT set_dia_vencimento_padrao('<matricula>', 5);  (staff/financeiro) → OK, dia=5
-- SELECT set_dia_vencimento_padrao('<matricula>', 31); → EXCEPTION 'inválido (1..30)'
--    aluno/anon → EXCEPTION 'Sem permissão'.
--
-- 5. Geração ajusta mês curto (dia 30 em fevereiro → último dia):
-- SELECT make_date(2026, 2, 1) + interval '1 month - 1 day';  -- confirma 2026-02-28
-- SELECT * FROM gerar_mensalidades_mes(2026, 2, 30, '<uuid-staff>', ARRAY['<matricula>']::uuid[]);
--    → mensalidade de fev/2026 com data_vencimento = 2026-02-28 (não 02-30/inválida).
-- SELECT * FROM gerar_mensalidades_mes(2026, 3, 30, '<uuid-staff>', ARRAY['<matricula>']::uuid[]);
--    → mar/2026 com data_vencimento = 2026-03-30 (mês de 31, respeita o 30).
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041) — ⚠️ apaga o dia salvo por aluno
-- ⚠️ Reverter gerar_mensalidades_mes volta ao corte fixo em 28 — reaplicar a 071.
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.set_dia_vencimento_padrao(uuid, smallint);
-- ALTER TABLE public.matriculas DROP COLUMN IF EXISTS dia_vencimento_padrao;
-- -- (opcional) reaplicar o CREATE OR REPLACE de gerar_mensalidades_mes da 071 (clamp 28).
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
