-- Migration: 20260527_020_role_financeiro.sql
-- Adiciona role 'financeiro' ao constraint da tabela profiles

-- Remove constraint antigo e recria com financeiro incluso
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'pendente',
    'aluno',
    'professor',
    'administracao',
    'financeiro',
    'admin',
    'superadmin'
  ));
