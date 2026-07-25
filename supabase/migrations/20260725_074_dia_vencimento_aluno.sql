-- Migration: 20260725_074_dia_vencimento_aluno.sql
-- Financeiro 2g — dia de vencimento PADRÃO por aluno (persistente).
-- Decisão do Hélio: antes a Ficha Financeira derivava o dia da última mensalidade
-- gerada; agora o dia "gruda" na matrícula e vira o default da geração por aluno.
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── O QUE ESTA MIGRAÇÃO FAZ ─────────────────────────────────────────────────
-- 1) Coluna ADITIVA em matriculas: dia_vencimento_padrao smallint DEFAULT 10,
--    CHECK 1..28 (cap em 28 por segurança de data em fevereiro — mesma lógica do
--    gerador de mensalidades). Herda a RLS de matriculas; default 10 = comportamento atual.
-- 2) set_dia_vencimento_padrao(matricula_id, dia) — SECURITY DEFINER, gate
--    is_staff() OR is_financeiro(). MOTIVO (fronteira 067): o role `financeiro`
--    NÃO tem UPDATE em matriculas (só SELECT) — sem esta função a edição do dia na
--    Ficha Financeira falharia para o financeiro. Escreve SÓ dia_vencimento_padrao
--    (financeiro edita 1 campo sem ganhar UPDATE amplo). Mesmo padrão da 072
--    (set_valor_mensalidade_override).
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1) coluna aditiva
ALTER TABLE public.matriculas
  ADD COLUMN IF NOT EXISTS dia_vencimento_padrao smallint
    DEFAULT 10
    CHECK (dia_vencimento_padrao BETWEEN 1 AND 28);

COMMENT ON COLUMN public.matriculas.dia_vencimento_padrao IS
  'Dia do mês (1-28) usado como vencimento padrão das mensalidades deste aluno. '
  'Cap em 28 para segurança de data em fevereiro. Editável na Ficha Financeira (2g).';

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
  IF p_dia IS NULL OR p_dia < 1 OR p_dia > 28 THEN
    RAISE EXCEPTION 'dia_vencimento_padrao inválido (1..28): %', p_dia;
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
-- 2. CHECK 1..28 ativo (deve falhar):
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
-- SELECT set_dia_vencimento_padrao('<matricula>', 31); → EXCEPTION 'inválido (1..28)'
--    aluno/anon → EXCEPTION 'Sem permissão'.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041) — ⚠️ apaga o dia salvo por aluno
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.set_dia_vencimento_padrao(uuid, smallint);
-- ALTER TABLE public.matriculas DROP COLUMN IF EXISTS dia_vencimento_padrao;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
