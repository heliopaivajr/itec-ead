-- Migration: 20260725_075_correcoes_financeiras.sql
-- Financeiro 2h — "corrigir sem medo": estorno de pagamento, cancelamento de
-- mensalidade, guard na confirmação e colunas de auditoria.
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
-- Depende de 073 (confirmar_pagamento, vw_mensalidades) e da família is_staff/is_financeiro (067).
--
-- ─── O QUE ESTA MIGRAÇÃO FAZ ─────────────────────────────────────────────────
-- 1) mensalidades ganha colunas de AUDITORIA (aditivo): atualizado_por/em,
--    estornado_por, data_estorno, motivo_estorno, motivo_cancelamento.
-- 2) estornar_pagamento(id, motivo) — desfaz um pagamento confirmado por engano:
--    volta a 'pendente', limpa os campos de pagamento (PRESERVA comprovante_url),
--    grava quem/quando/motivo. Gate is_staff() OR is_financeiro(); motivo OBRIGATÓRIO.
-- 3) cancelar_mensalidade(id, motivo) — anula uma mensalidade gerada errada (SOFT:
--    status 'cancelado', NÃO exclui — rastro > exclusão). Bloqueia se já 'pago'
--    (estorne primeiro). Motivo OBRIGATÓRIO.
-- 4) confirmar_pagamento GANHA guard: só confirma 'pendente'/'atrasado' (bloqueia
--    'pago' — idempotência — e também 'cancelado'/'isento' — borda do diagnóstico).
-- Segurança: estorno/cancelamento = staff + financeiro COM motivo + log. Exclusão
-- HARD continua fora (só admin/superadmin via policy DELETE da 037 — sem UI).
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Colunas de auditoria (aditivo — IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.mensalidades
  ADD COLUMN IF NOT EXISTS atualizado_por      uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS atualizado_em       timestamptz,
  ADD COLUMN IF NOT EXISTS estornado_por       uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS data_estorno        timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_estorno      text,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text;

COMMENT ON COLUMN public.mensalidades.atualizado_por      IS 'Quem editou por último valor/vencimento (ficha 2g).';
COMMENT ON COLUMN public.mensalidades.estornado_por       IS 'Quem estornou o pagamento (2h).';
COMMENT ON COLUMN public.mensalidades.motivo_estorno      IS 'Justificativa obrigatória do estorno.';
COMMENT ON COLUMN public.mensalidades.motivo_cancelamento IS 'Justificativa obrigatória do cancelamento (soft).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) estornar_pagamento — desfaz 'pago' → 'pendente', limpa pagamento, loga
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.estornar_pagamento(
  p_mensalidade_id uuid,
  p_motivo text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT (is_staff() OR is_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para estornar pagamento';
  END IF;
  IF p_motivo IS NULL OR btrim(p_motivo) = '' THEN
    RAISE EXCEPTION 'Motivo do estorno é obrigatório';
  END IF;

  SELECT status INTO v_status FROM mensalidades WHERE id = p_mensalidade_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Mensalidade não encontrada';
  END IF;
  IF v_status <> 'pago' THEN
    RAISE EXCEPTION 'Só é possível estornar mensalidade paga (status atual: %)', v_status;
  END IF;

  UPDATE mensalidades
     SET status           = 'pendente',
         valor_pago       = NULL,
         forma_pagamento  = NULL,
         data_pagamento   = NULL,
         data_confirmacao = NULL,
         confirmado_por   = NULL,
         -- comprovante_url PRESERVADO de propósito (histórico do que foi anexado)
         estornado_por    = auth.uid(),
         data_estorno     = now(),
         motivo_estorno   = btrim(p_motivo),
         atualizado_por   = auth.uid(),
         atualizado_em    = now()
   WHERE id = p_mensalidade_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.estornar_pagamento(uuid, text) FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) cancelar_mensalidade — SOFT (status 'cancelado'), bloqueia se paga
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancelar_mensalidade(
  p_mensalidade_id uuid,
  p_motivo text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT (is_staff() OR is_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para cancelar mensalidade';
  END IF;
  IF p_motivo IS NULL OR btrim(p_motivo) = '' THEN
    RAISE EXCEPTION 'Motivo do cancelamento é obrigatório';
  END IF;

  SELECT status INTO v_status FROM mensalidades WHERE id = p_mensalidade_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Mensalidade não encontrada';
  END IF;
  IF v_status = 'pago' THEN
    RAISE EXCEPTION 'Mensalidade paga não pode ser cancelada — estorne o pagamento primeiro';
  END IF;
  IF v_status = 'cancelado' THEN
    RAISE EXCEPTION 'Mensalidade já está cancelada';   -- idempotência
  END IF;

  UPDATE mensalidades
     SET status              = 'cancelado',
         motivo_cancelamento = btrim(p_motivo),
         atualizado_por      = auth.uid(),
         atualizado_em       = now()
   WHERE id = p_mensalidade_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancelar_mensalidade(uuid, text) FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) confirmar_pagamento — guard: só 'pendente'/'atrasado' (bloqueia pago/cancelado/isento)
--    Redefinição (mesma assinatura da 073) — só muda o bloco de validação de status.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.confirmar_pagamento(
  p_mensalidade_id uuid,
  p_valor_pago numeric,
  p_forma text,
  p_comprovante_url text DEFAULT NULL,
  p_data_pagamento date DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT (is_staff() OR is_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para confirmar pagamento';
  END IF;
  IF p_valor_pago IS NULL OR p_valor_pago < 0 THEN
    RAISE EXCEPTION 'valor_pago inválido';
  END IF;
  IF p_forma NOT IN ('pix','dinheiro','boleto','transferencia') THEN
    RAISE EXCEPTION 'forma_pagamento inválida: %', p_forma;
  END IF;

  SELECT status INTO v_status FROM mensalidades WHERE id = p_mensalidade_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Mensalidade não encontrada';
  END IF;
  -- GUARD (2h): só confirma o que está em aberto. 'pago' → idempotência;
  -- 'cancelado'/'isento' → não faz sentido confirmar (borda do diagnóstico).
  IF v_status NOT IN ('pendente','atrasado') THEN
    RAISE EXCEPTION 'Só é possível confirmar mensalidade pendente/atrasada (status atual: %)', v_status;
  END IF;

  UPDATE mensalidades
     SET status           = 'pago',
         valor_pago       = p_valor_pago,
         forma_pagamento  = p_forma,
         data_pagamento   = p_data_pagamento,
         comprovante_url  = COALESCE(p_comprovante_url, comprovante_url),
         confirmado_por   = auth.uid(),
         registrado_por   = COALESCE(registrado_por, auth.uid()),
         data_confirmacao = now()
   WHERE id = p_mensalidade_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirmar_pagamento(uuid, numeric, text, text, date) FROM anon;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Colunas novas (6):
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name='mensalidades'
--    AND column_name IN ('atualizado_por','atualizado_em','estornado_por','data_estorno','motivo_estorno','motivo_cancelamento'); → 6
-- 2. Funções existem:
-- SELECT proname FROM pg_proc WHERE proname IN ('estornar_pagamento','cancelar_mensalidade'); → 2
--
-- 3. Estorno (staff/financeiro):
-- SELECT confirmar_pagamento('<m>', 125, 'pix');          -- deixa 'pago'
-- SELECT estornar_pagamento('<m>', 'aluno errado');       -- → 'pendente', valor_pago NULL, estornado_por/data_estorno preenchidos, comprovante_url PRESERVADO
-- SELECT estornar_pagamento('<m>', '');                   -- → EXCEPTION 'Motivo ... obrigatório'
-- SELECT estornar_pagamento('<pendente>', 'x');           -- → EXCEPTION 'Só ... paga'
--
-- 4. Cancelamento:
-- SELECT cancelar_mensalidade('<pendente>', 'mês gerado errado'); -- → 'cancelado', motivo gravado
-- SELECT cancelar_mensalidade('<paga>', 'x');             -- → EXCEPTION 'estorne o pagamento primeiro'
-- SELECT cancelar_mensalidade('<cancelada>', 'x');        -- → EXCEPTION 'já está cancelada'
--
-- 5. Guard da confirmação:
-- SELECT confirmar_pagamento('<cancelada>', 100, 'pix');  -- → EXCEPTION 'Só ... pendente/atrasada'
-- SELECT confirmar_pagamento('<paga>', 100, 'pix');       -- → EXCEPTION 'Só ... pendente/atrasada'
--
-- 6. Papéis: aluno/anon → EXCEPTION 'Sem permissão' em estornar/cancelar.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041) — ⚠️ não desfaz estornos/cancelamentos já feitos
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.estornar_pagamento(uuid, text);
-- DROP FUNCTION IF EXISTS public.cancelar_mensalidade(uuid, text);
-- -- reaplicar o confirmar_pagamento da 073 (guard antigo: só bloqueia 'pago'):
-- --   (copiar o CREATE OR REPLACE da 073)
-- -- colunas de auditoria podem ficar (aditivas). Remover só se necessário:
-- -- ALTER TABLE mensalidades DROP COLUMN IF EXISTS atualizado_por, DROP COLUMN ...;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
