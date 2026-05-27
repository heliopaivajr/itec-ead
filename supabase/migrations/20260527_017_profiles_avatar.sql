-- Migration 017: adiciona avatar_url na tabela profiles
-- Coluna foi referenciada no frontend mas nunca existiu no banco

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
