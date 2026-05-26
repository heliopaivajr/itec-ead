-- Migration: 20260526_011_frequencia_materiais.sql
-- Tabelas: frequencia, materiais, progresso_aluno

-- ─── frequencia ──────────────────────────────────────────────
-- Presença mínima: 75% | Limite faltas: 25% → reprovação automática
CREATE TABLE IF NOT EXISTS public.frequencia (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID        NOT NULL REFERENCES public.disciplinas_v2(id) ON DELETE RESTRICT,
  aluno_id      UUID        NOT NULL REFERENCES public.profiles(id),
  professor_id  UUID        NOT NULL REFERENCES public.profiles(id),
  data_aula     DATE        NOT NULL,
  presente      BOOLEAN     NOT NULL DEFAULT false,
  justificada   BOOLEAN     NOT NULL DEFAULT false,
  documento_url TEXT,
  observacao    TEXT,
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(disciplina_id, aluno_id, data_aula)
);

CREATE INDEX IF NOT EXISTS idx_frequencia_aluno        ON public.frequencia(aluno_id);
CREATE INDEX IF NOT EXISTS idx_frequencia_disciplina   ON public.frequencia(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_frequencia_professor    ON public.frequencia(professor_id);
CREATE INDEX IF NOT EXISTS idx_frequencia_data_aula    ON public.frequencia(data_aula DESC);
CREATE INDEX IF NOT EXISTS idx_frequencia_disc_aluno   ON public.frequencia(disciplina_id, aluno_id);

ALTER TABLE public.frequencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "frequencia_professor_lanca"     ON public.frequencia;
DROP POLICY IF EXISTS "frequencia_aluno_ve_propria"    ON public.frequencia;
DROP POLICY IF EXISTS "frequencia_admin_total"         ON public.frequencia;

CREATE POLICY "frequencia_professor_lanca" ON public.frequencia
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('professor','admin','superadmin','administracao'))
  );

CREATE POLICY "frequencia_aluno_ve_propria" ON public.frequencia
  FOR SELECT USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('professor','admin','superadmin','administracao'))
  );

CREATE POLICY "frequencia_admin_total" ON public.frequencia
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );

-- ─── materiais ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.materiais (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID        NOT NULL REFERENCES public.disciplinas_v2(id) ON DELETE CASCADE,
  nome          VARCHAR(200) NOT NULL,
  tipo          VARCHAR(20)  NOT NULL
                  CHECK (tipo IN ('pdf','video','link','apostila')),
  url           TEXT         NOT NULL,
  ordem         INTEGER      NOT NULL DEFAULT 0,
  visivel       BOOLEAN      NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materiais_disciplina_id ON public.materiais(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_materiais_ordem         ON public.materiais(disciplina_id, ordem);

ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materiais_aluno_ve_visiveis" ON public.materiais;
DROP POLICY IF EXISTS "materiais_gestao_staff"      ON public.materiais;

-- Alunos veem materiais visíveis; admin vê todos
CREATE POLICY "materiais_aluno_ve_visiveis" ON public.materiais
  FOR SELECT USING (
    visivel = true
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('professor','admin','superadmin','administracao'))
  );

CREATE POLICY "materiais_gestao_staff" ON public.materiais
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('professor','admin','superadmin','administracao'))
  );

-- ─── progresso_aluno ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.progresso_aluno (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id       UUID        NOT NULL REFERENCES public.profiles(id),
  material_id    UUID        NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  disciplina_id  UUID        NOT NULL REFERENCES public.disciplinas_v2(id),
  visualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(aluno_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_progresso_aluno_id      ON public.progresso_aluno(aluno_id);
CREATE INDEX IF NOT EXISTS idx_progresso_material_id   ON public.progresso_aluno(material_id);
CREATE INDEX IF NOT EXISTS idx_progresso_disciplina_id ON public.progresso_aluno(disciplina_id);

ALTER TABLE public.progresso_aluno ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progresso_aluno_proprio"    ON public.progresso_aluno;
DROP POLICY IF EXISTS "progresso_admin_ve_todos"   ON public.progresso_aluno;

CREATE POLICY "progresso_aluno_proprio" ON public.progresso_aluno
  FOR ALL USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  );
