-- Migration: 20260529_023_notas_aluno.sql
-- Tabela: notas_aluno — nota individual por aluno/avaliação

CREATE TABLE IF NOT EXISTS public.notas_aluno (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id   UUID        NOT NULL REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
  aluno_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  disciplina_id  UUID        NOT NULL REFERENCES public.disciplinas_v2(id),
  turma_id       UUID        NOT NULL REFERENCES public.turmas(id),
  nota           NUMERIC(4,1) CHECK (nota >= 0 AND nota <= 10),
  lancado_por    UUID        REFERENCES public.profiles(id),
  lancado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(avaliacao_id, aluno_id)
);

CREATE INDEX IF NOT EXISTS idx_notas_aluno_aluno      ON public.notas_aluno(aluno_id);
CREATE INDEX IF NOT EXISTS idx_notas_aluno_disciplina ON public.notas_aluno(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_notas_aluno_turma      ON public.notas_aluno(turma_id);
CREATE INDEX IF NOT EXISTS idx_notas_aluno_avaliacao  ON public.notas_aluno(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_notas_disc_turma       ON public.notas_aluno(disciplina_id, turma_id);

ALTER TABLE public.notas_aluno ENABLE ROW LEVEL SECURITY;

-- Aluno vê apenas as próprias notas; professor/admin/secretaria vê todas
CREATE POLICY "notas_aluno_select" ON public.notas_aluno
  FOR SELECT TO authenticated
  USING (
    aluno_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao','professor'))
  );

-- Insert: professor que lançou OU admin/superadmin
CREATE POLICY "notas_aluno_insert" ON public.notas_aluno
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = lancado_por OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- Update: professor que lançou OU admin/superadmin
CREATE POLICY "notas_aluno_update" ON public.notas_aluno
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = lancado_por OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- Delete: somente superadmin
CREATE POLICY "notas_aluno_delete" ON public.notas_aluno
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));
