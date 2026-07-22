-- Migration: 20260721_070_gerar_mensalidades.sql
-- Financeiro Etapa 2c — geração de mensalidades pelo VALOR EFETIVO (override/tabela)
-- Depende de 068 (tabela_precos) + 069 (resolver_valor_efetivo). NÃO executar via CLI.
--
-- ─── CONTEXTO / BUG QUE ISTO CORRIGE ─────────────────────────────────────────
-- A geração atual (financeiro.service.gerarMensalidadesMes) usa .upsert com
-- onConflict 'aluno_id,mes_referencia' → em re-execução, faz UPDATE das linhas
-- existentes: **uma mensalidade JÁ PAGA volta a 'pendente' com valor novo** —
-- corrupção de cobrança (billing é sagrado). Além disso cobra o MESMO valor p/
-- todos (ignora override/tabela/qtd de disciplinas).
--
-- ─── DECISÕES ────────────────────────────────────────────────────────────────
-- • Multa até/após dia 10 → SNAPSHOT na geração: grava `valor` = mensalidade
--   "até dia 10" (base) e nova coluna `valor_com_atraso` = "após dia 10". Assim
--   o documento NÃO muda se a tabela_precos for editada depois (histórico
--   estável). A multa é aplicada na LEITURA/pagamento quando vencido (front /
--   registro), comparando a data — não recalculada da tabela.
-- • Idempotência: INSERT ... ON CONFLICT (aluno_id, mes_referencia) DO NOTHING —
--   nunca toca linha existente (paga ou não). Rodar 2× o mesmo mês = 0 duplicatas
--   e 0 sobrescritas.
-- • Só matrícula 'ativa'. Sem preço (sem tabela do ano p/ tipo×qtd, sem override)
--   → NÃO gera (mensalidades.valor é NOT NULL) e entra na contagem 'sem_preco'.
-- • Régua única: usa resolver_valor_efetivo (069, LICAO-042) via LATERAL.
-- • Gate: só is_staff() OR is_financeiro() gera/pré-visualiza. Funções SECURITY
--   DEFINER (a geração escreve mensalidades bypassando RLS, mas o gate no topo é
--   a fronteira). REVOKE anon.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Snapshot da multa (após dia 10) na própria mensalidade — aditivo
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.mensalidades
  ADD COLUMN IF NOT EXISTS valor_com_atraso numeric(10,2);

COMMENT ON COLUMN public.mensalidades.valor_com_atraso IS
  'Snapshot do valor "após dia 10" (multa) no momento da geração. valor = base (até dia 10).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) PREVIEW — o que seria gerado (sem gravar nada)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.preview_gerar_mensalidades(
  p_ano integer,
  p_mes integer                     -- 1-12
)
RETURNS TABLE(
  matricula_id     uuid,
  aluno_id         uuid,
  nome             text,
  qtd_disciplinas  integer,
  valor            numeric,         -- até dia 10 (base)
  valor_com_atraso numeric,         -- após dia 10
  origem           text,            -- override | tabela | sem_tabela
  ja_existe        boolean          -- já há mensalidade desse aluno nesse mês
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_mes_ref date := make_date(p_ano, p_mes, 1);
BEGIN
  IF NOT (is_staff() OR is_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para pré-visualizar mensalidades';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.aluno_id,
    pr.full_name,
    r.qtd_disciplinas,
    r.valor_mensalidade_ate,
    r.valor_mensalidade_apos,
    r.origem_mensalidade,
    EXISTS (SELECT 1 FROM mensalidades me
            WHERE me.aluno_id = m.aluno_id AND me.mes_referencia = v_mes_ref)
  FROM matriculas m
  JOIN profiles pr ON pr.id = m.aluno_id
  CROSS JOIN LATERAL resolver_valor_efetivo(m.id, p_ano) r
  WHERE m.status = 'ativa'
  ORDER BY pr.full_name;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.preview_gerar_mensalidades(integer, integer) FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) GERAR — idempotente, por valor efetivo
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.gerar_mensalidades_mes(
  p_ano integer,
  p_mes integer,                    -- 1-12
  p_dia_vencimento integer,         -- ex.: 10
  p_registrado_por uuid
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
  ja_existiam := v_compreco - v_geradas;   -- com preço que NÃO inseriram = já existiam
  sem_preco   := v_sempreco;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.gerar_mensalidades_mes(integer, integer, integer, uuid) FROM anon;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar — exige 068 + 069)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Coluna nova:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name='mensalidades' AND column_name='valor_com_atraso';   → 1
--
-- 2. Preview (como financeiro/staff):
-- SELECT * FROM preview_gerar_mensalidades(2026, 8);
--    → 1 linha por matrícula ativa; João (1 disc, sem override) → valor=125.00
--      valor_com_atraso=135.00 origem='tabela' ja_existe=false.
--
-- 3. Gerar + IDEMPOTÊNCIA (o teste que importa):
-- SELECT * FROM gerar_mensalidades_mes(2026, 8, 10, '<uuid-staff>');
--    → geradas=N, ja_existiam=0, sem_preco=? (1ª vez).
-- SELECT * FROM gerar_mensalidades_mes(2026, 8, 10, '<uuid-staff>');
--    → geradas=0, ja_existiam=N  (2ª vez NÃO duplica NEM sobrescreve).
-- -- Marcar 1 como paga e re-rodar: a paga PERMANECE paga (ON CONFLICT DO NOTHING).
--
-- 4. Papéis: aluno → preview/gerar = EXCEPTION 'Sem permissão' ✓.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041) — ⚠️ não apaga mensalidades já geradas
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.gerar_mensalidades_mes(integer, integer, integer, uuid);
-- DROP FUNCTION IF EXISTS public.preview_gerar_mensalidades(integer, integer);
-- ALTER TABLE public.mensalidades DROP COLUMN IF EXISTS valor_com_atraso;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
-- (A geração volta a depender do service antigo — reverter o código junto.)
