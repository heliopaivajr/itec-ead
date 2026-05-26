-- Migration: 20260526_009_professores_contratos.sql
-- Tabelas: professores, contratos_professor

-- ─── professores ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.professores (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  nome_completo           VARCHAR(200) NOT NULL,
  cpf                     VARCHAR(14)  UNIQUE NOT NULL,
  rg                      VARCHAR(20),
  data_nascimento         DATE,
  telefone                VARCHAR(20),
  email                   VARCHAR(200) NOT NULL,
  endereco                TEXT,
  formacao                TEXT,
  titulacao               VARCHAR(100),
  experiencia_ministerial TEXT,
  igreja_local            VARCHAR(200),
  ativo                   BOOLEAN      NOT NULL DEFAULT true,
  criado_em               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professores_user_id ON public.professores(user_id);
CREATE INDEX IF NOT EXISTS idx_professores_cpf     ON public.professores(cpf);
CREATE INDEX IF NOT EXISTS idx_professores_ativo   ON public.professores(ativo);

ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "professores_leitura_staff"  ON public.professores;
DROP POLICY IF EXISTS "professores_gestao_admin"   ON public.professores;
DROP POLICY IF EXISTS "professor_ve_proprio"       ON public.professores;

-- Professor vê o próprio cadastro
CREATE POLICY "professor_ve_proprio" ON public.professores
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  );

-- Admin e secretaria gerenciam professores
CREATE POLICY "professores_gestao_admin" ON public.professores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );

-- ─── contratos_professor ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contratos_professor (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id      UUID        NOT NULL REFERENCES public.professores(id) ON DELETE RESTRICT,
  disciplina_id     UUID        NOT NULL REFERENCES public.disciplinas_v2(id) ON DELETE RESTRICT,
  status            VARCHAR(20) NOT NULL DEFAULT 'pendente'
                      CHECK (status IN ('pendente','preenchido','impresso','assinado','encerrado')),
  dados_preenchidos JSONB,
  pdf_url           TEXT,
  gerado_por        UUID        REFERENCES public.profiles(id),
  gerado_em         TIMESTAMPTZ,
  preenchido_em     TIMESTAMPTZ,
  impresso_em       TIMESTAMPTZ,
  assinado_em       TIMESTAMPTZ,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contratos_professor_id  ON public.contratos_professor(professor_id);
CREATE INDEX IF NOT EXISTS idx_contratos_disciplina_id ON public.contratos_professor(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status        ON public.contratos_professor(status);

ALTER TABLE public.contratos_professor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contratos_professor_ve_proprio" ON public.contratos_professor;
DROP POLICY IF EXISTS "contratos_gestao_admin"         ON public.contratos_professor;

CREATE POLICY "contratos_professor_ve_proprio" ON public.contratos_professor
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.professores
            WHERE id = professor_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  );

CREATE POLICY "contratos_gestao_admin" ON public.contratos_professor
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );
