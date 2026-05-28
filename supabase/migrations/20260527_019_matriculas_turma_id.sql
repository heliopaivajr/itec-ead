-- Migration: 20260527_019_matriculas_turma_id.sql
-- Adiciona turma_id em matriculas

ALTER TABLE public.matriculas
  ADD COLUMN IF NOT EXISTS turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_matriculas_turma_id ON public.matriculas(turma_id);
