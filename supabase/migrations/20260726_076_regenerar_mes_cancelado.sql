-- Migration: 20260726_076_regenerar_mes_cancelado.sql
-- Financeiro 2g.1 — regenerar um mês CANCELADO reativa a linha (uma linha por mês).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
-- Depende de 074 (versão atual de gerar_mensalidades_mes, clamp de mês curto) e
-- 075 (coluna motivo_cancelamento).
--
-- ─── PROBLEMA ────────────────────────────────────────────────────────────────
-- cancelar_mensalidade (075) é SOFT: a linha fica com status='cancelado' e ocupa
-- o UNIQUE(aluno_id, mes_referencia). Ao gerar o mesmo mês de novo, a 074 fazia
-- ON CONFLICT DO NOTHING → "já existia" → NÃO regenerava. O Hélio quer que gerar
-- de novo REATIVE o mês cancelado.
--
-- ─── SOLUÇÃO ─────────────────────────────────────────────────────────────────
-- CREATE OR REPLACE de gerar_mensalidades_mes (mesma assinatura da 074): troca o
-- ON CONFLICT DO NOTHING por DO UPDATE CONDICIONAL —
--   ... ON CONFLICT (aluno_id, mes_referencia) DO UPDATE SET
--         status='pendente', valor=EXCLUDED.valor, valor_com_atraso=EXCLUDED...,
--         data_vencimento=EXCLUDED.data_vencimento, motivo_cancelamento=NULL, ...
--       WHERE mensalidades.status = 'cancelado';
-- O predicado `WHERE mensalidades.status = 'cancelado'` é a TRAVA: só reativa linha
-- cancelada. Se a linha existente é 'pendente'/'atrasado'/'pago', o UPDATE é
-- PULADO (comportamento idêntico ao DO NOTHING) — NUNCA sobrescreve o que está
-- vivo e, em especial, NUNCA toca uma 'pago' (billing sagrado).
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

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
    -- REATIVAÇÃO condicional: só quando a linha existente está 'cancelado'.
    -- Para 'pendente'/'atrasado'/'pago' o predicado é falso → UPDATE pulado (= DO NOTHING).
    ON CONFLICT (aluno_id, mes_referencia) DO UPDATE
      SET status              = 'pendente',
          valor               = EXCLUDED.valor,
          valor_com_atraso    = EXCLUDED.valor_com_atraso,
          data_vencimento     = EXCLUDED.data_vencimento,
          motivo_cancelamento = NULL,
          registrado_por      = EXCLUDED.registrado_por,
          atualizado_por      = EXCLUDED.registrado_por,
          atualizado_em       = now()
      WHERE mensalidades.status = 'cancelado'
    RETURNING 1
  )
  SELECT
    (SELECT count(*) FROM inseridos),                                  -- inseridas + reativadas
    (SELECT count(*) FROM ativos WHERE origem <> 'sem_tabela'),
    (SELECT count(*) FROM ativos WHERE origem =  'sem_tabela')
  INTO v_geradas, v_compreco, v_sempreco;

  geradas     := v_geradas;                 -- geradas OU reativadas neste mês
  ja_existiam := v_compreco - v_geradas;    -- vivas intactas (pendente/atrasado/pago)
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
-- Prep: gere o mês, cancele, tente gerar de novo.
-- SELECT * FROM gerar_mensalidades_mes(2026, 9, 10, '<staff>', ARRAY['<mat>']::uuid[]); -- geradas=1
-- SELECT cancelar_mensalidade('<mensalidade-set/2026>', 'teste');                       -- status='cancelado'
-- SELECT * FROM gerar_mensalidades_mes(2026, 9, 10, '<staff>', ARRAY['<mat>']::uuid[]); -- geradas=1 (REATIVOU)
-- SELECT status, motivo_cancelamento, valor, data_vencimento FROM mensalidades WHERE id='<mensalidade-set/2026>';
--    → status='pendente', motivo_cancelamento=NULL, valor/vencimento atualizados.
--
-- PROTEÇÃO do 'pago' (o teste crítico):
-- SELECT confirmar_pagamento('<m>', 125, 'pix');   -- deixa 'pago'
-- SELECT * FROM gerar_mensalidades_mes(2026, 9, 10, '<staff>', ARRAY['<mat>']::uuid[]);
--    → geradas=0, ja_existiam=1; a linha 'pago' permanece pago, valor_pago intacto. NUNCA reativada.
--
-- IDEMPOTÊNCIA da viva pendente:
-- gerar 2x um mês pendente → 2ª vez geradas=0 (WHERE status='cancelado' é falso → não mexe).
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041): volta ao DO NOTHING da 074
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- -- reaplicar o CREATE OR REPLACE de gerar_mensalidades_mes da 074 (ON CONFLICT DO NOTHING).
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
