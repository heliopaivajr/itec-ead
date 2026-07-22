-- Migration: 20260720_069_matricula_valores.sql
-- Financeiro Etapa 2b — valor efetivo por matrícula (override do preço da tabela)
-- Origem: modelo confirmado pelo Hélio: valor_efetivo = override ?? tabela_precos.
-- Depende da 068 (tabela_precos) APLICADA. NÃO executar via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO / DECISÕES DE MODELO ───────────────────────────────────────────
-- • Matrícula ↔ aluno: matriculas.aluno_id → profiles(id); disciplinas contadas
--   em matriculas_disciplina (status 'cursando'), clamp 1-4.
-- • Campo disciplinas|familia: EXISTIA PARCIALMENTE — tipo_financiamento (036)
--   aceita 'familia', mas CONFLITA dimensões (família com bolsa parcial seria
--   irrepresentável). Criamos tipo_cobranca (qual TABELA de preço usar) e
--   BACKFILL de quem já é tipo_financiamento='familia'. tipo_financiamento
--   segue para bolsas/descontos.
-- • Observação do override: NÃO criamos obs nova — observacao_financeira (036)
--   já existe exatamente p/ isso (REGRAS-FINANCEIRO §4: todo desconto/override
--   com justificativa registrada).
-- • Override é VALOR FIXO negociado: quando presente, vale para até E após o
--   prazo (sem multa variante) — o negociado não muda no dia 11.
-- • Escrita dos campos: financeiro NÃO tem UPDATE em matriculas (fronteira 067 —
--   update liberaria aprovar matrícula). Solução: função SECURITY DEFINER
--   set_valores_matricula() que altera SÓ estes campos, gated
--   is_staff() OR is_financeiro() — escrita por coluna, sem abrir a linha.
-- • Resolução no BANCO (não no service): a régua vive numa função única
--   (LICAO-042) — a geração de mensalidades (2c), o painel do staff e a futura
--   tela do aluno leem a MESMA verdade.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Campos novos em matriculas (aditivo)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.matriculas
  ADD COLUMN IF NOT EXISTS tipo_cobranca text NOT NULL DEFAULT 'disciplinas'
    CHECK (tipo_cobranca IN ('disciplinas','familia')),
  ADD COLUMN IF NOT EXISTS valor_matricula_override   numeric(10,2),
  ADD COLUMN IF NOT EXISTS valor_mensalidade_override numeric(10,2);

COMMENT ON COLUMN public.matriculas.tipo_cobranca IS
  'Qual tabela de preço usar: disciplinas (padrão) ou familia. Independe de tipo_financiamento (bolsas).';
COMMENT ON COLUMN public.matriculas.valor_matricula_override IS
  'Valor negociado da taxa de matrícula. NULL = usa tabela_precos. Justificar em observacao_financeira.';
COMMENT ON COLUMN public.matriculas.valor_mensalidade_override IS
  'Valor negociado da mensalidade (fixo, sem multa variante). NULL = usa tabela_precos.';

-- Backfill: quem já era família no financiamento usa a tabela família na cobrança
UPDATE public.matriculas
   SET tipo_cobranca = 'familia'
 WHERE tipo_financiamento = 'familia'
   AND tipo_cobranca = 'disciplinas';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) resolver_valor_efetivo — a RÉGUA (fonte única, LICAO-042)
--    Retorna a linha de preço resolvida (tabela × qtd × tipo) com override
--    aplicado. Quem decide até/após (15/01, dia 10) é a GERAÇÃO, pela data.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolver_valor_efetivo(
  p_matricula_id uuid,
  p_ano integer DEFAULT NULL          -- NULL = ano corrente
)
RETURNS TABLE(
  matricula_id            uuid,
  ano                     integer,
  tipo_cobranca           text,
  qtd_disciplinas         integer,    -- contadas (clamp 1-4)
  valor_matricula_ate     numeric,    -- já com override aplicado (se houver)
  valor_matricula_apos    numeric,
  valor_mensalidade_ate   numeric,
  valor_mensalidade_apos  numeric,
  origem_matricula        text,       -- 'override' | 'tabela' | 'sem_tabela'
  origem_mensalidade      text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_mat   RECORD;
  v_ano   integer := COALESCE(p_ano, EXTRACT(YEAR FROM now())::integer);
  v_qtd   integer;
  v_preco RECORD;
BEGIN
  SELECT m.id, m.aluno_id, m.tipo_cobranca AS tc,
         m.valor_matricula_override AS ov_mat, m.valor_mensalidade_override AS ov_mens
    INTO v_mat
  FROM matriculas m WHERE m.id = p_matricula_id;

  IF v_mat.id IS NULL THEN RETURN; END IF;

  -- Gate: staff, financeiro, ou o PRÓPRIO aluno (vê o próprio valor)
  IF NOT (is_staff() OR is_financeiro() OR v_mat.aluno_id = auth.uid()) THEN
    RETURN;
  END IF;

  SELECT GREATEST(1, LEAST(4, count(*)::integer)) INTO v_qtd
  FROM matriculas_disciplina md
  WHERE md.matricula_id = p_matricula_id AND md.status = 'cursando';

  SELECT * INTO v_preco
  FROM tabela_precos tp
  WHERE tp.ano = v_ano AND tp.tipo = v_mat.tc
    AND tp.qtd_disciplinas = v_qtd AND tp.ativo;

  RETURN QUERY SELECT
    p_matricula_id,
    v_ano,
    v_mat.tc,
    v_qtd,
    COALESCE(v_mat.ov_mat,  v_preco.valor_matricula_ate),
    COALESCE(v_mat.ov_mat,  v_preco.valor_matricula_apos),   -- override = fixo
    COALESCE(v_mat.ov_mens, v_preco.valor_mensalidade_ate),
    COALESCE(v_mat.ov_mens, v_preco.valor_mensalidade_apos), -- override = fixo
    CASE WHEN v_mat.ov_mat  IS NOT NULL THEN 'override'
         WHEN v_preco.id    IS NOT NULL THEN 'tabela' ELSE 'sem_tabela' END,
    CASE WHEN v_mat.ov_mens IS NOT NULL THEN 'override'
         WHEN v_preco.id    IS NOT NULL THEN 'tabela' ELSE 'sem_tabela' END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolver_valor_efetivo(uuid, integer) FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) set_valores_matricula — escrita POR COLUNA, sem abrir UPDATE da linha
--    (financeiro edita valores sem ganhar poder de aprovar matrícula)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_valores_matricula(
  p_matricula_id uuid,
  p_tipo_cobranca text,                 -- 'disciplinas' | 'familia'
  p_valor_matricula numeric,            -- NULL = limpa override (volta à tabela)
  p_valor_mensalidade numeric,          -- NULL = limpa override
  p_observacao text                     -- justificativa (grava em observacao_financeira)
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (is_staff() OR is_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para alterar valores de matrícula';
  END IF;
  IF p_tipo_cobranca NOT IN ('disciplinas','familia') THEN
    RAISE EXCEPTION 'tipo_cobranca inválido: %', p_tipo_cobranca;
  END IF;
  IF p_valor_matricula IS NOT NULL AND p_valor_matricula < 0 THEN
    RAISE EXCEPTION 'valor_matricula não pode ser negativo';
  END IF;
  IF p_valor_mensalidade IS NOT NULL AND p_valor_mensalidade < 0 THEN
    RAISE EXCEPTION 'valor_mensalidade não pode ser negativo';
  END IF;

  UPDATE matriculas
     SET tipo_cobranca              = p_tipo_cobranca,
         valor_matricula_override   = p_valor_matricula,
         valor_mensalidade_override = p_valor_mensalidade,
         observacao_financeira      = p_observacao
   WHERE id = p_matricula_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matrícula não encontrada';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_valores_matricula(uuid, text, numeric, numeric, text) FROM anon;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar — exige 068 aplicada)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Colunas novas + backfill:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name='matriculas' AND column_name IN
--   ('tipo_cobranca','valor_matricula_override','valor_mensalidade_override');  → 3
-- SELECT count(*) FROM matriculas WHERE tipo_financiamento='familia'
--   AND tipo_cobranca<>'familia';                                               → 0
--
-- 2. Régua — João (1 disciplina cursando, sem override, 2026):
-- SELECT * FROM resolver_valor_efetivo(
--   (SELECT id FROM matriculas WHERE aluno_id='c43c5e9a-73b6-4e81-b83b-f7c2028462d1' LIMIT 1));
--    Esperado: qtd=1 · mensalidade_ate=125.00 · apos=135.00 · origem='tabela'.
--
-- 3. Override: set_valores_matricula(<id>,'disciplinas',NULL,99.90,'teste negociado')
--    → resolver de novo → mensalidade ate=apos=99.90 · origem='override'.
--    Limpar: set_valores_matricula(<id>,'disciplinas',NULL,NULL,NULL) → volta 'tabela'.
--
-- 4. Papéis: aluno resolve o PRÓPRIO valor ✓ (e de outro → 0 linhas);
--    aluno chama set_valores_matricula → EXCEPTION 'Sem permissão' ✓;
--    financeiro/secretaria → set + resolver ✓.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.set_valores_matricula(uuid, text, numeric, numeric, text);
-- DROP FUNCTION IF EXISTS public.resolver_valor_efetivo(uuid, integer);
-- ALTER TABLE public.matriculas
--   DROP COLUMN IF EXISTS tipo_cobranca,
--   DROP COLUMN IF EXISTS valor_matricula_override,
--   DROP COLUMN IF EXISTS valor_mensalidade_override;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
-- (⚠️ apaga overrides negociados; observacao_financeira é da 036 e permanece.)
