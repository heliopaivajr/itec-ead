-- Migration: 20260602_028_professor_status.sql
-- Expande status do professor de boolean (ativo) para TEXT com 4 valores.
--
-- ESTRATÉGIA DE MIGRAÇÃO (sem breaking change):
--   1. Adiciona coluna status TEXT
--   2. Migra dados existentes de ativo → status
--   3. Trigger mantém ativo sincronizado com status (backwards compat)
--   4. Frontend migra para usar status em vez de ativo (Sprint L fase 2)
--   5. Coluna ativo removida no Sprint M após frontend migrado
--
-- Status:
--   'ativo'      → professor ativo, ministrando aulas
--   'aguardando' → cadastrado mas aguardando confirmação/primeiro contrato
--   'afastado'   → temporariamente afastado (licença, saúde, viagem)
--   'desligado'  → encerrou vínculo com o ITEC

-- ─── 1. Adicionar coluna status ──────────────────────────────────────────────

ALTER TABLE public.professores
  ADD COLUMN IF NOT EXISTS status TEXT
    NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'aguardando', 'afastado', 'desligado'));

COMMENT ON COLUMN public.professores.status
  IS 'Status expandido do professor. Substituirá a coluna ativo (boolean) no Sprint M. '
     'Valores: ativo=em exercício | aguardando=cadastrado sem contrato | '
     'afastado=temporariamente ausente | desligado=vínculo encerrado';

COMMENT ON COLUMN public.professores.ativo
  IS 'LEGADO — mantido para compatibilidade com o frontend atual. '
     'Sincronizado via trigger com a coluna status. Remover no Sprint M.';

-- ─── 2. Migrar dados existentes ───────────────────────────────────────────────

UPDATE public.professores
  SET status = CASE
    WHEN ativo = true  THEN 'ativo'
    WHEN ativo = false THEN 'desligado'
    ELSE 'ativo'
  END;

-- ─── 3. Trigger de sincronização bidirecional ─────────────────────────────────
--
-- A) status → ativo  (quando status é atualizado, ativo segue)
--    ativo = true  se status IN ('ativo', 'aguardando', 'afastado')
--    ativo = false se status = 'desligado'
--
-- B) ativo → status  (quando código legado atualiza ativo, status segue)
--    true  → mantém status atual (ou 'ativo' se status era 'desligado')
--    false → 'desligado'

CREATE OR REPLACE FUNCTION public.sync_professor_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A) status foi alterado → atualizar ativo
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.ativo := (NEW.status IN ('ativo', 'aguardando', 'afastado'));
  END IF;

  -- B) ativo foi alterado (sem alterar status) → atualizar status
  IF TG_OP = 'UPDATE'
    AND NEW.ativo IS DISTINCT FROM OLD.ativo
    AND NEW.status = OLD.status
  THEN
    NEW.status := CASE
      WHEN NEW.ativo = true  THEN
        -- preservar status não-desligado se havia um; senão 'ativo'
        CASE WHEN OLD.status IN ('aguardando', 'afastado') THEN OLD.status
             ELSE 'ativo'
        END
      WHEN NEW.ativo = false THEN 'desligado'
    END;
  END IF;

  -- Sempre atualizar atualizado_em
  NEW.atualizado_em := NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_professor_status ON public.professores;

CREATE TRIGGER trg_sync_professor_status
  BEFORE UPDATE ON public.professores
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_professor_status();

-- ─── 4. Índice no novo campo ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_professores_status
  ON public.professores(status);

-- Índice composto útil para query "professores ativos por status"
CREATE INDEX IF NOT EXISTS idx_professores_status_ativo
  ON public.professores(status, ativo);
