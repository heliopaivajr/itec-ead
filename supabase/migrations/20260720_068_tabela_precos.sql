-- Migration: 20260720_068_tabela_precos.sql
-- Financeiro Etapa 2a — tabela de preços EDITÁVEL (Disciplinas/Família × 1-4 × prazos)
-- Origem: diagnóstico "fundação de preços" (2026-07-19, Opção A aprovada) +
-- REGRAS-FINANCEIRO.md (tabelas oficiais aprovadas pela Direção em 2026-06-11).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- Hoje NÃO existe preço no sistema: taxa_matricula nasce com valor=0 e
-- mensalidades.valor é o número digitado na geração em massa (igual p/ todos).
-- As tabelas oficiais vivem só no papel (REGRAS-FINANCEIRO.md).
--
-- MODELO (confirmado pelo Hélio): preços por ANO, editáveis pela secretaria/
-- financeiro. Preço = tipo(disciplinas|familia) × qtd_disciplinas(1-4) →
-- 4 valores: matrícula até/após 15/01 e mensalidade até/após dia 10 (multa
-- simbólica). Cálculo automático na geração (Etapa 2b) com override por aluno.
--
-- ─── ADITIVA — NÃO TOCA EM NADA EXISTENTE ────────────────────────────────────
-- Só CREATE TABLE nova + RLS própria + seed. `mensalidades`/`taxa_matricula`
-- (012/037) e o fluxo de comprovante ficam intocados. (Obs.: não há tabelas
-- `financeiro_*` no repositório — se existirem no banco, são órfãs sem código
-- e ficam fora desta migração.)
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Tabela
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tabela_precos (
  id                     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  ano                    integer       NOT NULL,
  tipo                   text          NOT NULL CHECK (tipo IN ('disciplinas','familia')),
  qtd_disciplinas        integer       NOT NULL CHECK (qtd_disciplinas BETWEEN 1 AND 4),
  valor_matricula_ate    numeric(10,2) NOT NULL,  -- matrícula até 15/01
  valor_matricula_apos   numeric(10,2) NOT NULL,  -- matrícula após 15/01
  valor_mensalidade_ate  numeric(10,2) NOT NULL,  -- mensalidade até dia 10
  valor_mensalidade_apos numeric(10,2) NOT NULL,  -- mensalidade após dia 10 (multa simbólica)
  ativo                  boolean       NOT NULL DEFAULT true,
  atualizado_em          timestamptz   DEFAULT now(),
  atualizado_por         uuid          REFERENCES public.profiles(id),
  UNIQUE (ano, tipo, qtd_disciplinas)
);

COMMENT ON TABLE public.tabela_precos IS
  'Preços por ano: tipo (disciplinas|familia) × qtd (1-4) → matrícula até/após 15/01 e mensalidade até/após dia 10. Editável (secretaria/financeiro). REGRAS-FINANCEIRO.md.';

CREATE INDEX IF NOT EXISTS idx_tabela_precos_ano ON public.tabela_precos(ano);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) RLS — leitura authenticated (é referência de preço); escrita staff+financeiro
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tabela_precos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "precos_select_authenticated" ON public.tabela_precos;
CREATE POLICY "precos_select_authenticated" ON public.tabela_precos
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "precos_write_gestao" ON public.tabela_precos;
CREATE POLICY "precos_write_gestao" ON public.tabela_precos
  FOR ALL TO authenticated
  USING      (public.is_staff() OR public.is_financeiro())
  WITH CHECK (public.is_staff() OR public.is_financeiro());

REVOKE ALL ON TABLE public.tabela_precos FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) SEED — ano 2026, valores OFICIAIS (imagem do Hélio / REGRAS-FINANCEIRO)
--    ordem: matricula_ate · matricula_apos · mensalidade_ate · mensalidade_apos
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.tabela_precos
  (ano, tipo, qtd_disciplinas, valor_matricula_ate, valor_matricula_apos, valor_mensalidade_ate, valor_mensalidade_apos)
VALUES
  (2026, 'disciplinas', 1,  50.00, 125.00, 125.00, 135.00),
  (2026, 'disciplinas', 2, 100.00, 210.00, 210.00, 230.00),
  (2026, 'disciplinas', 3, 150.00, 265.00, 265.00, 300.00),
  (2026, 'disciplinas', 4, 200.00, 340.00, 340.00, 370.00),
  (2026, 'familia',     1,  50.00, 115.00, 115.00, 125.00),
  (2026, 'familia',     2, 100.00, 190.00, 190.00, 210.00),
  (2026, 'familia',     3, 150.00, 235.00, 235.00, 270.00),
  (2026, 'familia',     4, 200.00, 300.00, 300.00, 330.00)
ON CONFLICT (ano, tipo, qtd_disciplinas) DO NOTHING;   -- idempotente

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Seed completo (8 linhas de 2026):
-- SELECT count(*) FROM tabela_precos WHERE ano = 2026;      → 8
-- SELECT tipo, qtd_disciplinas, valor_mensalidade_ate FROM tabela_precos
-- WHERE ano=2026 ORDER BY tipo, qtd_disciplinas;
--    Conferir com a tabela oficial (ex.: disciplinas/3 → 265.00 · familia/4 → 300.00).
--
-- 2. Policies:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename='tabela_precos';
--    Esperado: precos_select_authenticated (SELECT) · precos_write_gestao (ALL).
--
-- 3. Testes por papel:
--    a) financeiro/administracao → edita um valor na tela e salva ✓
--    b) aluno → SELECT ok (referência), INSERT/UPDATE → negado ✓
--    c) anon → nada (REVOKE + sem policy) ✓
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041) — ⚠️ apaga os preços cadastrados!
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP TABLE IF EXISTS public.tabela_precos;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
-- (Só é seguro antes da Etapa 2b — depois, a geração de mensalidades depende dela.)
