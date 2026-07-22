-- Migration: 20260722_072_set_valor_mensalidade.sql
-- Financeiro 2c.2 — edição INLINE do valor da mensalidade na tela de geração.
-- Depende de 069 (matriculas.valor_mensalidade_override). NÃO executar via CLI.
--
-- ─── CONTEXTO / POR QUE UMA FUNÇÃO FOCADA (e não reusar set_valores_matricula) ─
-- O SDD 2c.2 sugeria reusar set_valores_matricula (069) para gravar o override
-- inline. PROBLEMA: aquela função escreve TODOS os campos de valor da matrícula
-- (tipo_cobranca, valor_matricula_override, valor_mensalidade_override,
-- observacao_financeira). Chamá-la a partir da linha do preview — que só tem o
-- valor da mensalidade — **apagaria** a `observacao_financeira` (justificativa
-- obrigatória do REGRAS-FINANCEIRO §4) e o `tipo_cobranca`, pois o preview não
-- carrega esses valores para preservá-los. Perda de dado silenciosa.
--
-- Solução: função FOCADA que altera SÓ `valor_mensalidade_override` — mesma
-- fonte única (matriculas → resolver_valor_efetivo, LICAO-042), mesmo gate,
-- zero efeito colateral. set_valores_matricula (069) segue para a edição
-- completa (painel de valores na Ficha).
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.set_valor_mensalidade_override(
  p_matricula_id uuid,
  p_valor numeric                 -- NULL = limpa override (volta à tabela)
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (is_staff() OR is_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para alterar o valor da mensalidade';
  END IF;
  IF p_valor IS NOT NULL AND p_valor < 0 THEN
    RAISE EXCEPTION 'valor não pode ser negativo';
  END IF;

  UPDATE matriculas
     SET valor_mensalidade_override = p_valor
   WHERE id = p_matricula_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matrícula não encontrada';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_valor_mensalidade_override(uuid, numeric) FROM anon;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar — exige 069)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Função criada:
-- SELECT proname FROM pg_proc WHERE proname='set_valor_mensalidade_override';  → 1
--
-- 2. Grava só a coluna certa (preserva observacao_financeira/tipo_cobranca):
-- -- antes: anotar observacao_financeira e tipo_cobranca de uma matrícula
-- SELECT set_valor_mensalidade_override('<matricula>', 99.90);
-- SELECT valor_mensalidade_override, observacao_financeira, tipo_cobranca
-- FROM matriculas WHERE id='<matricula>';
--    Esperado: valor_mensalidade_override=99.90; obs e tipo INALTERADOS.
-- -- resolver_valor_efetivo(<matricula>) → origem_mensalidade='override', 99.90.
-- -- limpar: set_valor_mensalidade_override('<matricula>', NULL) → volta 'tabela'.
--
-- 3. Papéis: aluno → EXCEPTION 'Sem permissão' ✓; financeiro/secretaria ✓.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.set_valor_mensalidade_override(uuid, numeric);
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
