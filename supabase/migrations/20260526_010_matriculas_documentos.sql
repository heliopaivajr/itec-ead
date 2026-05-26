-- Migration: 20260526_010_matriculas_documentos.sql
-- Tabelas: documentos_aluno, matriculas_disciplina
-- Altera: matriculas (adiciona colunas se não existirem)

-- ─── expandir matriculas existente ───────────────────────────
ALTER TABLE public.matriculas
  ADD COLUMN IF NOT EXISTS curso_id      UUID        REFERENCES public.cursos(id),
  ADD COLUMN IF NOT EXISTS validado_por  UUID        REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS validado_em   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS observacoes   TEXT;

-- Garantir que a coluna status existe com os valores corretos
-- (a tabela pode ter sido criada sem o CHECK adequado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'matriculas'
      AND column_name  = 'status'
  ) THEN
    ALTER TABLE public.matriculas ADD COLUMN status VARCHAR(20) DEFAULT 'pendente';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_matriculas_curso_id ON public.matriculas(curso_id);

-- ─── documentos_aluno ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documentos_aluno (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id      UUID        NOT NULL REFERENCES public.profiles(id),
  tipo          VARCHAR(50) NOT NULL,
  url           TEXT        NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','validado','rejeitado')),
  observacao    TEXT,
  enviado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validado_por  UUID        REFERENCES public.profiles(id),
  validado_em   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_documentos_aluno_id ON public.documentos_aluno(aluno_id);
CREATE INDEX IF NOT EXISTS idx_documentos_status   ON public.documentos_aluno(status);

ALTER TABLE public.documentos_aluno ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documentos_aluno_ve_proprio"    ON public.documentos_aluno;
DROP POLICY IF EXISTS "documentos_gestao_administracao" ON public.documentos_aluno;

CREATE POLICY "documentos_aluno_ve_proprio" ON public.documentos_aluno
  FOR SELECT USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  );

CREATE POLICY "documentos_gestao_administracao" ON public.documentos_aluno
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );

-- ─── matriculas_disciplina ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.matriculas_disciplina (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id  UUID         NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  disciplina_id UUID         NOT NULL REFERENCES public.disciplinas_v2(id) ON DELETE RESTRICT,
  status        VARCHAR(20)  NOT NULL DEFAULT 'cursando'
                  CHECK (status IN
                    ('cursando','aprovado','reprovado',
                     'reprovado_falta','convalidado','trancado')),
  nota          DECIMAL(4,2),
  aprovado_por  UUID         REFERENCES public.profiles(id),
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(matricula_id, disciplina_id)
);

CREATE INDEX IF NOT EXISTS idx_mat_disc_matricula_id  ON public.matriculas_disciplina(matricula_id);
CREATE INDEX IF NOT EXISTS idx_mat_disc_disciplina_id ON public.matriculas_disciplina(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_mat_disc_status        ON public.matriculas_disciplina(status);

ALTER TABLE public.matriculas_disciplina ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mat_disc_aluno_ve_propria" ON public.matriculas_disciplina;
DROP POLICY IF EXISTS "mat_disc_gestao_staff"     ON public.matriculas_disciplina;

CREATE POLICY "mat_disc_aluno_ve_propria" ON public.matriculas_disciplina
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.matriculas m
            WHERE m.id = matricula_id AND m.aluno_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('professor','admin','superadmin','administracao'))
  );

CREATE POLICY "mat_disc_gestao_staff" ON public.matriculas_disciplina
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );
