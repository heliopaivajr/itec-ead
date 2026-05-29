-- Migration: 20260529_022_avaliacoes.sql
-- Tabela: avaliacoes — define tipos de avaliação configuráveis por disciplina/turma

CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id  UUID        NOT NULL REFERENCES public.disciplinas_v2(id) ON DELETE CASCADE,
  turma_id       UUID        NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  tipo           TEXT        NOT NULL CHECK (tipo IN ('N1','N2','recuperacao','trabalho','extra')),
  descricao      TEXT,
  peso           NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  data_avaliacao DATE,
  criado_por     UUID        REFERENCES public.profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_disciplina ON public.avaliacoes(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_turma      ON public.avaliacoes(turma_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_disc_turma ON public.avaliacoes(disciplina_id, turma_id);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado lê (professor, admin, secretaria, aluno)
CREATE POLICY "avaliacoes_select" ON public.avaliacoes
  FOR SELECT TO authenticated USING (true);

-- Insert: professor que criou OU admin/superadmin/administracao
CREATE POLICY "avaliacoes_insert" ON public.avaliacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = criado_por OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao'))
  );

-- Update: quem criou OU admin/superadmin
CREATE POLICY "avaliacoes_update" ON public.avaliacoes
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = criado_por OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- Delete: somente admin/superadmin
CREATE POLICY "avaliacoes_delete" ON public.avaliacoes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
