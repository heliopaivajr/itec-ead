-- Migration: 20260606_032_user_roles_view.sql
-- Cria VIEW user_roles sem RLS para uso em policies
-- Referência: Sprint RLS Fase 1, ADR-006, ERR-INFRA-001
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI

-- ─── DROP VIEW SE EXISTE ──────────────────────────────────────────────────

DROP VIEW IF EXISTS public.user_roles CASCADE;

-- ─── CRIAR VIEW SEM RLS ────────────────────────────────────────────────────

-- Projeta apenas (user_id, role) de profiles
-- SEM RLS — evita recursão infinita em policies que verificam role
CREATE VIEW public.user_roles AS
  SELECT
    id AS user_id,
    role
  FROM public.profiles;

-- ─── COMMENTS ──────────────────────────────────────────────────────────────

COMMENT ON VIEW public.user_roles
  IS 'Projeção de profiles sem RLS para uso em policies. '
     'IMPORTANTE: NÃO adicionar RLS nesta view — causaria recursão infinita. '
     'Usado por policies de outras tabelas para verificar role do auth.uid().';

-- ─── TESTES ────────────────────────────────────────────────────────────────

-- Deve retornar todos os perfis com (user_id, role)
-- SELECT * FROM public.user_roles LIMIT 5;

-- Deve retornar role do superadmin (Hélio)
-- SELECT * FROM public.user_roles WHERE role = 'superadmin';
