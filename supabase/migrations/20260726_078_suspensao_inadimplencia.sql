-- Migration: 20260726_078_suspensao_inadimplencia.sql
-- Financeiro E5 (parte 1) — suspender/reativar matrícula por inadimplência, com o
-- financeiro incluído (regra do Hélio: "só o financeiro destrava"), SEM dar UPDATE
-- amplo em matriculas (fronteira 067). Reusa o efeito de acesso da LICAO-039.
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
-- ⚠️ NÃO toca em auth/ProtectedRoute (cicatriz 2d79368). A suspensão só muda
--    matriculas.status + profiles.role (o gate de SESSÃO é outro assunto).
--
-- ─── FONTE DO ROLE (confirmado) ──────────────────────────────────────────────
-- `user_roles` é uma VIEW (032): SELECT id AS user_id, role FROM profiles — e a 054
-- REVOGOU INSERT/UPDATE/DELETE nela. Logo a FONTE ÚNICA do role é `profiles.role`;
-- o `.upsert('user_roles')` do aplicarAcesso (TS) é redundante e falha em silêncio.
-- Portanto o EFEITO DE ACESSO COMPLETO = apenas `UPDATE profiles SET role=...`
-- (a view reflete automaticamente). É isso que evita "ativa sem acesso" (LICAO-039).
--
-- ─── O QUE ESTA MIGRAÇÃO FAZ ─────────────────────────────────────────────────
-- 1) matriculas +motivo_suspensao/data_suspensao/suspensa_por (distingue suspensão
--    por inadimplência de trancamento manual; parte 2 usa na tela /aguardando).
-- 2) suspender_matricula_inadimplencia(id, motivo) — gate staff+financeiro; status
--    'suspensa' + role 'pendente' (revoga acesso, preserva dados); idempotente.
-- 3) reativar_matricula(id) — gate staff+financeiro; status 'ativa' + role 'aluno'
--    (RESTAURA acesso completo) + limpa campos de suspensão; idempotente.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Campos de suspensão (aditivo)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.matriculas
  ADD COLUMN IF NOT EXISTS motivo_suspensao text,
  ADD COLUMN IF NOT EXISTS data_suspensao   timestamptz,
  ADD COLUMN IF NOT EXISTS suspensa_por     uuid REFERENCES public.profiles(id);

COMMENT ON COLUMN public.matriculas.motivo_suspensao IS
  'Motivo da suspensão (ex.: inadimplência 90+). NULL = não suspensa por este fluxo. Distingue de trancamento manual.';
COMMENT ON COLUMN public.matriculas.suspensa_por IS 'Quem (financeiro/staff) aplicou a suspensão.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) suspender_matricula_inadimplencia — status 'suspensa' + revoga acesso
--    Efeito de acesso = UPDATE profiles.role='pendente' (única fonte; view reflete).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.suspender_matricula_inadimplencia(
  p_matricula_id uuid,
  p_motivo text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
  v_aluno  uuid;
BEGIN
  IF NOT (is_staff() OR is_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para suspender matrícula';
  END IF;

  SELECT status, aluno_id INTO v_status, v_aluno
    FROM matriculas WHERE id = p_matricula_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Matrícula não encontrada';
  END IF;
  -- Idempotência / segurança: não mexer no que não está ativo.
  IF v_status = 'suspensa' THEN
    RAISE EXCEPTION 'Matrícula já está suspensa';
  END IF;
  IF v_status IN ('trancada','cancelada','concluida') THEN
    RAISE EXCEPTION 'Não é possível suspender matrícula % (esperado: ativa)', v_status;
  END IF;

  UPDATE matriculas
     SET status         = 'suspensa',
         motivo_suspensao = COALESCE(NULLIF(btrim(p_motivo), ''), 'inadimplência'),
         data_suspensao   = now(),
         suspensa_por     = auth.uid()
   WHERE id = p_matricula_id;

  -- EFEITO DE ACESSO (LICAO-039): revoga acesso preservando os dados.
  -- profiles.role é a fonte única; user_roles (view) reflete sozinho.
  UPDATE profiles SET role = 'pendente' WHERE id = v_aluno;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.suspender_matricula_inadimplencia(uuid, text) FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) reativar_matricula — status 'ativa' + RESTAURA acesso completo (role 'aluno')
--    Só o financeiro/staff destrava (regra do Hélio).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reativar_matricula(
  p_matricula_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
  v_aluno  uuid;
BEGIN
  IF NOT (is_staff() OR is_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para reativar matrícula';
  END IF;

  SELECT status, aluno_id INTO v_status, v_aluno
    FROM matriculas WHERE id = p_matricula_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Matrícula não encontrada';
  END IF;
  IF v_status <> 'suspensa' THEN
    RAISE EXCEPTION 'Só é possível reativar matrícula suspensa (status atual: %)', v_status;
  END IF;

  UPDATE matriculas
     SET status           = 'ativa',
         motivo_suspensao = NULL,
         data_suspensao   = NULL,
         suspensa_por     = NULL
   WHERE id = p_matricula_id;

  -- EFEITO DE ACESSO COMPLETO (não só o status — senão "ativa sem acesso", LICAO-039):
  -- restaura profiles.role='aluno' (a view user_roles reflete automaticamente).
  UPDATE profiles SET role = 'aluno' WHERE id = v_aluno;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reativar_matricula(uuid) FROM anon;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Colunas + funções:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='matriculas'
--     AND column_name IN ('motivo_suspensao','data_suspensao','suspensa_por');   → 3
-- SELECT proname FROM pg_proc
--   WHERE proname IN ('suspender_matricula_inadimplencia','reativar_matricula');  → 2
--
-- 2. Suspender (logado como FINANCEIRO — o teste da regra do Hélio):
-- SELECT suspender_matricula_inadimplencia('<matricula-ativa>', 'inadimplência 90+');
--   → matriculas.status='suspensa', motivo/data/suspensa_por preenchidos;
--   → profiles.role do aluno = 'pendente'; user_roles (view) devolve 'pendente' (reflete);
--   → o aluno cai em /aguardando (ProtectedRoute inalterado).
-- SELECT suspender_matricula_inadimplencia('<mesma>', 'x');    → EXCEPTION 'já está suspensa'
--
-- 3. Reativar (logado como FINANCEIRO):
-- SELECT reativar_matricula('<mesma>');
--   → status='ativa', motivo/data/suspensa_por = NULL;
--   → profiles.role = 'aluno' (ACESSO RESTAURADO — não fica "ativa sem acesso");
--   → user_roles reflete 'aluno'.
-- SELECT reativar_matricula('<ativa>');                        → EXCEPTION 'só ... suspensa'
--
-- 4. Papéis: aluno/professor/anon → EXCEPTION 'Sem permissão' em ambas.
--    (is_staff = administracao/admin/superadmin; is_financeiro = financeiro.)
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041) — ⚠️ não reverte suspensões/reativações já feitas
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.suspender_matricula_inadimplencia(uuid, text);
-- DROP FUNCTION IF EXISTS public.reativar_matricula(uuid);
-- -- colunas aditivas podem ficar; remover só se necessário:
-- -- ALTER TABLE public.matriculas
-- --   DROP COLUMN IF EXISTS motivo_suspensao, DROP COLUMN IF EXISTS data_suspensao,
-- --   DROP COLUMN IF EXISTS suspensa_por;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
