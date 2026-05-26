-- Migration: 20260526_008_estrutura_academica.sql
-- Tabelas: cursos, modulos, disciplinas (nova com FK modulo_id),
--          prerequisitos_disciplinas (nova com UUID FK),
--          excecoes_prerequisito

-- ─── cursos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cursos (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo               VARCHAR(20) UNIQUE NOT NULL,
  nome                 VARCHAR(200) NOT NULL,
  descricao            TEXT,
  modalidade           VARCHAR(50),
  horario              VARCHAR(200),
  carga_horaria_total  INTEGER,
  creditos_total       INTEGER,
  turma_min            INTEGER     NOT NULL DEFAULT 20,
  turma_max            INTEGER     NOT NULL DEFAULT 30,
  ativo                BOOLEAN     NOT NULL DEFAULT true,
  inicio_turma         DATE,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cursos_leitura_publica" ON public.cursos;
DROP POLICY IF EXISTS "cursos_gestao_admin"    ON public.cursos;

CREATE POLICY "cursos_leitura_publica" ON public.cursos
  FOR SELECT USING (true);

CREATE POLICY "cursos_gestao_admin" ON public.cursos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- ─── modulos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.modulos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id    UUID        NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  nome        VARCHAR(200) NOT NULL,
  ordem       INTEGER     NOT NULL,
  ano_curso   INTEGER     NOT NULL CHECK (ano_curso IN (1,2,3)),
  semestre    INTEGER     NOT NULL CHECK (semestre IN (1,2)),
  periodo     VARCHAR(50),
  data_inicio DATE,
  data_fim    DATE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(curso_id, ordem)
);

CREATE INDEX IF NOT EXISTS idx_modulos_curso_id ON public.modulos(curso_id);

ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modulos_leitura_publica" ON public.modulos;
DROP POLICY IF EXISTS "modulos_gestao_admin"    ON public.modulos;

CREATE POLICY "modulos_leitura_publica" ON public.modulos
  FOR SELECT USING (true);

CREATE POLICY "modulos_gestao_admin" ON public.modulos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- ─── disciplinas_v2 (com FK para modulos) ────────────────────
-- Nota: tabela 'disciplinas' com PK texto já existe da migration 005.
-- Esta cria a versão relacional com UUID e FK para modulos.
CREATE TABLE IF NOT EXISTS public.disciplinas_v2 (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id               UUID        NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  codigo                  VARCHAR(20) UNIQUE NOT NULL,
  nome                    VARCHAR(200) NOT NULL,
  area                    CHAR(1)     NOT NULL CHECK (area IN ('B','T','P')),
  ano_curso               INTEGER     NOT NULL CHECK (ano_curso IN (1,2,3)),
  carga_horaria_presencial INTEGER    NOT NULL DEFAULT 0,
  carga_horaria_ead       INTEGER     NOT NULL DEFAULT 0,
  creditos                INTEGER     NOT NULL DEFAULT 0,
  tipo                    VARCHAR(20) NOT NULL DEFAULT 'regular'
                            CHECK (tipo IN ('regular','eletiva','obrigatoria')),
  status_manual           VARCHAR(20) NOT NULL DEFAULT 'pendente'
                            CHECK (status_manual IN ('pendente','disponivel')),
  manual_url              TEXT,
  descricao               TEXT,
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disciplinas_v2_modulo_id ON public.disciplinas_v2(modulo_id);
CREATE INDEX IF NOT EXISTS idx_disciplinas_v2_codigo    ON public.disciplinas_v2(codigo);
CREATE INDEX IF NOT EXISTS idx_disciplinas_v2_area      ON public.disciplinas_v2(area);

ALTER TABLE public.disciplinas_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disciplinas_v2_leitura_publica" ON public.disciplinas_v2;
DROP POLICY IF EXISTS "disciplinas_v2_gestao_admin"    ON public.disciplinas_v2;

CREATE POLICY "disciplinas_v2_leitura_publica" ON public.disciplinas_v2
  FOR SELECT USING (true);

CREATE POLICY "disciplinas_v2_gestao_admin" ON public.disciplinas_v2
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- ─── prerequisitos_v2 (com UUID FK) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.prerequisitos_v2 (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id    UUID        NOT NULL REFERENCES public.disciplinas_v2(id) ON DELETE CASCADE,
  prerequisito_id  UUID        NOT NULL REFERENCES public.disciplinas_v2(id) ON DELETE CASCADE,
  tipo             VARCHAR(20) NOT NULL DEFAULT 'prerequisito'
                     CHECK (tipo IN ('prerequisito','corequisito')),
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(disciplina_id, prerequisito_id)
);

CREATE INDEX IF NOT EXISTS idx_prereq_v2_disciplina   ON public.prerequisitos_v2(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_prereq_v2_prerequisito ON public.prerequisitos_v2(prerequisito_id);

ALTER TABLE public.prerequisitos_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prereq_v2_leitura_publica" ON public.prerequisitos_v2;
DROP POLICY IF EXISTS "prereq_v2_gestao_admin"    ON public.prerequisitos_v2;

CREATE POLICY "prereq_v2_leitura_publica" ON public.prerequisitos_v2
  FOR SELECT USING (true);

CREATE POLICY "prereq_v2_gestao_admin" ON public.prerequisitos_v2
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- ─── excecoes_prerequisito ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.excecoes_prerequisito (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id                   UUID        NOT NULL REFERENCES public.profiles(id),
  disciplina_id              UUID        NOT NULL REFERENCES public.disciplinas_v2(id),
  prerequisito_dispensado_id UUID        NOT NULL REFERENCES public.disciplinas_v2(id),
  aprovado_por               UUID        NOT NULL REFERENCES public.profiles(id),
  motivo                     TEXT        NOT NULL,
  aprovado_em                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_excecoes_aluno      ON public.excecoes_prerequisito(aluno_id);
CREATE INDEX IF NOT EXISTS idx_excecoes_disciplina ON public.excecoes_prerequisito(disciplina_id);

ALTER TABLE public.excecoes_prerequisito ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "excecoes_aluno_ve_propria"  ON public.excecoes_prerequisito;
DROP POLICY IF EXISTS "excecoes_gestao_superadmin" ON public.excecoes_prerequisito;

CREATE POLICY "excecoes_aluno_ve_propria" ON public.excecoes_prerequisito
  FOR SELECT USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  );

CREATE POLICY "excecoes_gestao_superadmin" ON public.excecoes_prerequisito
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('superadmin','admin'))
  );
