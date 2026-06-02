-- Migration: 20260601_025_exclusao_profiles.sql
-- Adiciona suporte a fila de exclusão em profiles
-- Fluxo: secretaria solicita → superadmin autoriza → exclusão executada
-- Nunca exclusão direta pela secretaria

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS exclusao_solicitada_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exclusao_motivo         TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_exclusao
  ON public.profiles(exclusao_solicitada_em)
  WHERE exclusao_solicitada_em IS NOT NULL;

COMMENT ON COLUMN public.profiles.exclusao_solicitada_em
  IS 'Preenchido quando secretaria solicita exclusão — aguarda autorização do superadmin';
COMMENT ON COLUMN public.profiles.exclusao_motivo
  IS 'Motivo informado pela secretaria ao solicitar exclusão';
