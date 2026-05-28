-- Migration: 20260527_018_turmas.sql
-- Tabela turmas + seed TEO-2025-1, TEO-2026-1, TEO-2026-2

-- ─── turmas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.turmas (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       VARCHAR(20) UNIQUE NOT NULL,
  curso_id     UUID        REFERENCES public.cursos(id) ON DELETE SET NULL,
  nome         VARCHAR(100) NOT NULL,
  ano          INTEGER     NOT NULL,
  semestre     INTEGER     CHECK (semestre IN (1, 2)),
  data_inicio  DATE        NOT NULL,
  data_fim     DATE,
  status       VARCHAR(20) NOT NULL DEFAULT 'ativa'
                           CHECK (status IN ('ativa', 'concluida', 'planejada', 'cancelada')),
  vagas_total  INTEGER     NOT NULL DEFAULT 30,
  observacoes  TEXT,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turmas_status   ON public.turmas(status);
CREATE INDEX IF NOT EXISTS idx_turmas_curso_id ON public.turmas(curso_id);
CREATE INDEX IF NOT EXISTS idx_turmas_ano      ON public.turmas(ano);

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "turmas_leitura_autenticados" ON public.turmas;
CREATE POLICY "turmas_leitura_autenticados"
  ON public.turmas FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "turmas_escrita_staff" ON public.turmas;
CREATE POLICY "turmas_escrita_staff"
  ON public.turmas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('superadmin', 'admin', 'administracao')
    )
  );

-- ─── trigger updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at_turmas()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_turmas_updated_at ON public.turmas;
CREATE TRIGGER trg_turmas_updated_at
  BEFORE UPDATE ON public.turmas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_turmas();

-- ─── garante coluna observacoes (caso tabela já existia sem ela) ──
ALTER TABLE public.turmas
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- ─── seed ────────────────────────────────────────────────────
INSERT INTO public.turmas (codigo, nome, ano, semestre, data_inicio, status, vagas_total, observacoes)
VALUES
  ('TEO-2025-1', '1ª Turma Teologia — 2025', 2025, 1, '2025-02-10', 'ativa',   30, 'Turma em andamento — Módulo 2 em 2026'),
  ('TEO-2026-1', '2ª Turma Teologia — 2026', 2026, 1, '2026-01-27', 'ativa',   30, 'Turma em andamento — Módulo 1 em 2026'),
  ('TEO-2026-2', '3ª Turma Teologia — 2026', 2026, 2, '2026-08-03', 'planejada', 30, 'Turma planejada para agosto de 2026')
ON CONFLICT (codigo) DO NOTHING;
