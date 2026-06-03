-- Migration: 20260602_030_codigo_itec.sql
-- Adiciona código único do aluno no ITEC
-- Formato: ITEC-AAAA-NNN (ex: ITEC-2026-001)
-- Gerado automaticamente pela Edge Function criar-aluno
-- Imutável após gerado — identifica o aluno institucionalmente

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS codigo_itec TEXT UNIQUE;

COMMENT ON COLUMN public.profiles.codigo_itec
  IS 'Código único do aluno no ITEC. Formato: ITEC-AAAA-NNN. '
     'Gerado automaticamente na criação via Edge Function criar-aluno. '
     'Imutável após gerado.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_codigo_itec
  ON public.profiles(codigo_itec)
  WHERE codigo_itec IS NOT NULL;
