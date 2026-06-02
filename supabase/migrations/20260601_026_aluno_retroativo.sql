-- Migration: 20260601_026_aluno_retroativo.sql
-- Adiciona campos para cadastro retroativo de alunos em matriculas
-- Necessário para secretaria cadastrar alunos com data de início no passado

ALTER TABLE public.matriculas
  ADD COLUMN IF NOT EXISTS data_inicio       DATE,
  ADD COLUMN IF NOT EXISTS semestre_ingresso TEXT,
  ADD COLUMN IF NOT EXISTS obs_retroativa    TEXT;

COMMENT ON COLUMN public.matriculas.data_inicio
  IS 'Data real de início do aluno — permite cadastro retroativo';
COMMENT ON COLUMN public.matriculas.semestre_ingresso
  IS 'Ex: 2025-1, 2026-1 — semestre de ingresso para relatórios de turma';
COMMENT ON COLUMN public.matriculas.obs_retroativa
  IS 'Contexto do cadastro retroativo — preenchido pela secretaria';
