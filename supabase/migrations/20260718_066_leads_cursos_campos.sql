-- Migration: 20260718_066_leads_cursos_campos.sql
-- 12.0 parte 2 — leads_cursos ganha as colunas que o form já coleta.
-- Origem: diagnóstico 12.0 (2026-07-18) + decisão do Hélio (adicionar colunas,
-- não remover do form — dados úteis para o funil 12.1).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── CAUSA CONFIRMADA POR SCHEMA ─────────────────────────────────────────────
-- leads_cursos tem só 6 colunas de dados (id, nome, telefone, email, interesse,
-- curso_interesse, criado_em). O form "Reservar minha vaga" envia 4 chaves que
-- NÃO existem na tabela → cidade, como_conheceu, mensagem, lgpd_aceite → o
-- PostgREST rejeita o INSERT INTEIRO (42703/PGRST204) → TODO lead falha
-- (total_leads = 0; "Erro ao enviar" na LP; o ITEC perdia interessados em
-- silêncio). NÃO era RLS: a policy leads_insert_publico (001, anon) existe.
--
-- Esta migração só ADICIONA colunas (ADD COLUMN IF NOT EXISTS — idempotente,
-- aditivo, sem tocar em dados nem em RLS). As policies da 001 permanecem.
-- lgpd_aceite: DEFAULT false por segurança (o form sempre envia true).
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.leads_cursos
  ADD COLUMN IF NOT EXISTS cidade         text,
  ADD COLUMN IF NOT EXISTS como_conheceu  text,
  ADD COLUMN IF NOT EXISTS mensagem       text,
  ADD COLUMN IF NOT EXISTS lgpd_aceite    boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.leads_cursos.cidade        IS 'Cidade informada no form da LP (opcional)';
COMMENT ON COLUMN public.leads_cursos.como_conheceu IS 'Origem do lead (Instagram/indicação/etc.) — alimenta o funil 12.1';
COMMENT ON COLUMN public.leads_cursos.mensagem      IS 'Mensagem livre do interessado (opcional)';
COMMENT ON COLUMN public.leads_cursos.lgpd_aceite   IS 'Consentimento LGPD do form (o form só envia com true)';

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. As 4 colunas novas existem (10 colunas no total):
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='leads_cursos'
-- ORDER BY ordinal_position;
--    Esperado: + cidade (text, YES) · como_conheceu (text, YES) ·
--              mensagem (text, YES) · lgpd_aceite (boolean, NO, false)
--
-- 2. RLS intocada (4 policies da 001 continuam):
-- SELECT policyname, cmd, roles FROM pg_policies
-- WHERE tablename='leads_cursos' ORDER BY policyname;
--
-- 3. TESTE REAL: enviar o form "Reservar minha vaga" na LP →
--    "Solicitação enviada com sucesso" + SELECT count(*) FROM leads_cursos → 1+
--    e o lead aparece no dashboard da secretaria (Leads).
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041) — ⚠️ APAGA os dados dessas colunas!
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- ALTER TABLE public.leads_cursos
--   DROP COLUMN IF EXISTS cidade,
--   DROP COLUMN IF EXISTS como_conheceu,
--   DROP COLUMN IF EXISTS mensagem,
--   DROP COLUMN IF EXISTS lgpd_aceite;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
-- (Reabre o bug: o form volta a falhar até reverter também o código do front.)
