-- Migration: 20260722_073_confirmacao_pagamento.sql
-- Financeiro 2f — confirmação de pagamento + bucket de comprovante + status automático.
-- Fonte ÚNICA: mensalidades (cobrança E pagamento — LICAO-042). NÃO há tabela
-- `pagamentos` no projeto (a única "pagamentos" é a ROTA ComingSoon do aluno).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── O QUE ESTA MIGRAÇÃO FAZ ─────────────────────────────────────────────────
-- 1) mensalidades ganha os campos de confirmação (aditivo).
-- 2) Bucket PRIVADO comprovantes-pagamento + policies (aluno sobe o próprio;
--    staff/financeiro leem todos) — conserta o modal que usava um bucket
--    inexistente com getPublicUrl (risco de comprovante bancário público).
-- 3) confirmar_pagamento(...) — SECURITY DEFINER, gate is_staff OR is_financeiro,
--    idempotente (não reconfirma pago). "Quem estiver na frente confirma."
-- 4) VIEW vw_mensalidades (security_invoker) com status_efetivo derivado
--    (pago/atrasado/pendente) — atrasado calculado NA LEITURA, sem cron.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Campos de confirmação em mensalidades (aditivo; data_pagamento/comprovante_url
--    já existem da 012 — IF NOT EXISTS torna a linha idempotente)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.mensalidades
  ADD COLUMN IF NOT EXISTS data_pagamento   date,
  ADD COLUMN IF NOT EXISTS valor_pago       numeric(10,2),
  ADD COLUMN IF NOT EXISTS forma_pagamento  text
    CHECK (forma_pagamento IN ('pix','dinheiro','boleto','transferencia')),
  ADD COLUMN IF NOT EXISTS comprovante_url  text,
  ADD COLUMN IF NOT EXISTS confirmado_por   uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS data_confirmacao timestamptz;

COMMENT ON COLUMN public.mensalidades.valor_pago       IS 'Quanto entrou de fato (pode diferir de valor/valor_com_atraso — quitação/negociação).';
COMMENT ON COLUMN public.mensalidades.forma_pagamento  IS 'pix | dinheiro | boleto | transferencia.';
COMMENT ON COLUMN public.mensalidades.confirmado_por   IS 'Quem (secretaria/financeiro) confirmou o pagamento.';
COMMENT ON COLUMN public.mensalidades.data_confirmacao IS 'Quando foi confirmado (≠ data_pagamento, que é quando o aluno pagou).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Bucket PRIVADO comprovantes-pagamento + policies de Storage
--    Path do app: {aluno_id}/{mensalidade_id}.ext → foldername[1] = aluno_id
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes-pagamento', 'comprovantes-pagamento', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "comprovantes_insert" ON storage.objects;
CREATE POLICY "comprovantes_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'comprovantes-pagamento'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text   -- aluno sobe o PRÓPRIO
      OR public.is_staff() OR public.is_financeiro()      -- staff registra presencial
    )
  );

DROP POLICY IF EXISTS "comprovantes_select" ON storage.objects;
CREATE POLICY "comprovantes_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'comprovantes-pagamento'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text   -- aluno vê o próprio
      OR public.is_staff() OR public.is_financeiro()      -- confirmadores veem todos
    )
  );

DROP POLICY IF EXISTS "comprovantes_update" ON storage.objects;
CREATE POLICY "comprovantes_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'comprovantes-pagamento'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff() OR public.is_financeiro())
  );

DROP POLICY IF EXISTS "comprovantes_delete" ON storage.objects;
CREATE POLICY "comprovantes_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'comprovantes-pagamento' AND public.is_staff());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) confirmar_pagamento — gate + idempotente
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
  IF v_status = 'pago' THEN
    RAISE EXCEPTION 'Mensalidade já confirmada como paga';   -- idempotência (billing sagrado)
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

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) VIEW vw_mensalidades — status_efetivo derivado (atrasado na leitura)
--    security_invoker=true → a RLS de mensalidades (037) aplica-se ao chamador
--    (aluno vê só as suas; staff/financeiro tudo). Sem recursão (ADR-006 não se
--    aplica: nenhuma policy referencia esta view).
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.vw_mensalidades;
CREATE VIEW public.vw_mensalidades
WITH (security_invoker = true) AS
  SELECT m.*,
    CASE
      WHEN m.status = 'pago' OR m.data_pagamento IS NOT NULL THEN 'pago'
      WHEN m.status IN ('isento','cancelado')                THEN m.status
      WHEN m.data_vencimento < CURRENT_DATE                  THEN 'atrasado'
      ELSE 'pendente'
    END AS status_efetivo
  FROM public.mensalidades m;

COMMENT ON VIEW public.vw_mensalidades IS
  'mensalidades + status_efetivo (atrasado derivado na leitura). security_invoker: RLS da base aplica.';

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Colunas (6 relevantes) + bucket privado + 4 policies + função + view:
-- SELECT column_name FROM information_schema.columns WHERE table_name='mensalidades'
--   AND column_name IN ('valor_pago','forma_pagamento','confirmado_por','data_confirmacao');  → 4
-- SELECT id, public FROM storage.buckets WHERE id='comprovantes-pagamento';   → public=false
-- SELECT policyname FROM pg_policies WHERE tablename='objects' AND policyname LIKE 'comprovantes%'; → 4
-- SELECT proname FROM pg_proc WHERE proname='confirmar_pagamento';            → 1
-- SELECT viewname FROM pg_views WHERE viewname='vw_mensalidades';             → 1
--
-- 2. status_efetivo:
-- SELECT id, status, status_efetivo FROM vw_mensalidades LIMIT 5;
--    → pendente vencida aparece como 'atrasado'; paga como 'pago'.
--
-- 3. confirmar + idempotência:
-- SELECT confirmar_pagamento('<mensalidade>', 125.00, 'pix');
--    → status='pago', confirmado_por=quem chamou, data_confirmacao=now().
-- SELECT confirmar_pagamento('<mesma>', 125.00, 'pix');
--    → EXCEPTION 'já confirmada como paga' (NÃO reconfirma).
--
-- 4. Papéis: aluno → confirmar_pagamento = EXCEPTION 'Sem permissão' ✓;
--    aluno sobe comprovante do PRÓPRIO aluno_id no bucket ✓, de outro → negado ✓.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041) — ⚠️ não apaga confirmações já feitas
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP VIEW IF EXISTS public.vw_mensalidades;
-- DROP FUNCTION IF EXISTS public.confirmar_pagamento(uuid, numeric, text, text, date);
-- DROP POLICY IF EXISTS "comprovantes_insert" ON storage.objects;
-- DROP POLICY IF EXISTS "comprovantes_select" ON storage.objects;
-- DROP POLICY IF EXISTS "comprovantes_update" ON storage.objects;
-- DROP POLICY IF EXISTS "comprovantes_delete" ON storage.objects;
-- -- (bucket e colunas podem ficar — remover só se realmente necessário)
-- -- DELETE FROM storage.buckets WHERE id='comprovantes-pagamento';  -- só se vazio
-- -- ALTER TABLE mensalidades DROP COLUMN IF EXISTS valor_pago, DROP COLUMN ...;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
