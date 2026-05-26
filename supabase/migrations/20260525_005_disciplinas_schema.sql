-- =============================================================
-- Migration: 20260525_005_disciplinas_schema.sql
-- Criada retroativamente via reverse engineering de:
--   src/pages/dashboard/CursosAdmin.tsx  (queries Supabase)
--   src/data/disciplinas.ts              (dados locais de fallback)
--
-- Contexto: tabelas criadas manualmente no Supabase Studio sem
-- versionamento. Esta migration documenta e reproduz o schema.
-- =============================================================

-- ─── 1. TABELA disciplinas ────────────────────────────────────
-- PK é o código textual (ex: 'B1-ANT01') — identificador único
-- por design da grade curricular do ITEC.

CREATE TABLE IF NOT EXISTS public.disciplinas (
  codigo            TEXT        PRIMARY KEY,
  nome              TEXT        NOT NULL,
  modulo            SMALLINT    NOT NULL CHECK (modulo BETWEEN 1 AND 6),
  ano               SMALLINT    NOT NULL CHECK (ano BETWEEN 1 AND 3),
  carga_horaria     SMALLINT    NOT NULL DEFAULT 0,
  horas_presencial  SMALLINT    NOT NULL DEFAULT 0,
  horas_ead         SMALLINT    NOT NULL DEFAULT 0,
  tipo              TEXT        NOT NULL DEFAULT 'obrigatoria'
                      CHECK (tipo IN ('obrigatoria', 'eletiva', 'eletiva_obrigatoria')),
  area              TEXT        NOT NULL DEFAULT 'B'
                      CHECK (area IN ('B', 'T', 'P')),
  ativo             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.disciplinas IS
  'Grade curricular do ITEC — 6 módulos, 3 anos, ~40 disciplinas. '
  'PK textual (código) por design. Editável via CursosAdmin no Dashboard.';

COMMENT ON COLUMN public.disciplinas.tipo IS
  'obrigatoria | eletiva | eletiva_obrigatoria';
COMMENT ON COLUMN public.disciplinas.area IS
  'B=Bíblico | T=Teológico | P=Prático';

-- Índice para os selects com ORDER BY modulo, nome
CREATE INDEX IF NOT EXISTS idx_disciplinas_modulo ON public.disciplinas (modulo, nome);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_disciplinas_updated_at ON public.disciplinas;
CREATE TRIGGER trg_disciplinas_updated_at
  BEFORE UPDATE ON public.disciplinas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 2. RLS — disciplinas ─────────────────────────────────────

ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;

-- Qualquer um (incluindo anônimo) pode LER a grade curricular
DROP POLICY IF EXISTS "disciplinas_read_public" ON public.disciplinas;
CREATE POLICY "disciplinas_read_public"
  ON public.disciplinas FOR SELECT
  USING (TRUE);

-- Apenas admin/superadmin pode modificar
DROP POLICY IF EXISTS "disciplinas_write_admin" ON public.disciplinas;
CREATE POLICY "disciplinas_write_admin"
  ON public.disciplinas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

-- ─── 3. TABELA prerequisitos_disciplinas ─────────────────────
-- Relação N:N entre disciplinas com tipo de prerequisito.
-- PK composta (disciplina_codigo, prerequisito_codigo) garante unicidade.

CREATE TABLE IF NOT EXISTS public.prerequisitos_disciplinas (
  disciplina_codigo   TEXT  NOT NULL REFERENCES public.disciplinas (codigo) ON DELETE CASCADE,
  prerequisito_codigo TEXT  NOT NULL REFERENCES public.disciplinas (codigo) ON DELETE CASCADE,
  tipo                TEXT  NOT NULL DEFAULT 'formal'
                        CHECK (tipo IN ('formal', 'recomendado', 'corequisito')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (disciplina_codigo, prerequisito_codigo)
);

COMMENT ON TABLE public.prerequisitos_disciplinas IS
  'Pré-requisitos entre disciplinas da grade. '
  'formal=bloqueante | recomendado=sugestão | corequisito=cursar junto.';

COMMENT ON COLUMN public.prerequisitos_disciplinas.tipo IS
  'formal=bloqueante | recomendado=sugestão | corequisito=cursar junto';

-- Índice para lookup por prerequisito_codigo (ex: "quem depende de X?")
CREATE INDEX IF NOT EXISTS idx_prereq_prereq_codigo
  ON public.prerequisitos_disciplinas (prerequisito_codigo);

-- ─── 4. RLS — prerequisitos_disciplinas ──────────────────────

ALTER TABLE public.prerequisitos_disciplinas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prereqs_read_public" ON public.prerequisitos_disciplinas;
CREATE POLICY "prereqs_read_public"
  ON public.prerequisitos_disciplinas FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "prereqs_write_admin" ON public.prerequisitos_disciplinas;
CREATE POLICY "prereqs_write_admin"
  ON public.prerequisitos_disciplinas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

-- ─── 5. SEED — dados da grade curricular do ITEC ─────────────
-- Fonte: src/data/disciplinas.ts (arquivo local de fallback)
-- INSERT ... ON CONFLICT DO NOTHING = idempotente

INSERT INTO public.disciplinas (codigo, nome, modulo, ano, carga_horaria, horas_presencial, horas_ead, tipo, area) VALUES
  -- 1º Módulo
  ('B1-ANT01',   'Introdução ao Antigo Testamento I (Pentateuco)',                         1, 1, 40, 30, 10, 'obrigatoria',        'B'),
  ('P1-ESPCR',   'Espiritualidade Cristã',                                                 1, 1, 40, 30, 10, 'obrigatoria',        'P'),
  ('B1-BIBLI',   'Introdução Bíblica: Bibliologia',                                        1, 1, 30, 20, 10, 'obrigatoria',        'B'),
  ('B1-NOVO1',   'Introdução ao Novo Testamento I (Evangelhos)',                           1, 1, 40, 30, 10, 'obrigatoria',        'B'),
  ('T1-TEOS1',   'Teologia Sistemática I: Doutrina de Deus e Antropologia/Hamartiologia',  1, 1, 60, 30, 30, 'obrigatoria',        'T'),
  ('P1-MISS1',   'Missiologia I: Teologia em Missões (introdução)',                        1, 1, 60, 30, 30, 'obrigatoria',        'P'),
  -- 2º Módulo
  ('B1-ANT02',   'Introdução ao Antigo Testamento II (Históricos)',                        2, 1, 40, 30, 10, 'obrigatoria',        'B'),
  ('T1-INTER-E', 'Período Interbíblico',                                                   2, 1, 40, 30, 10, 'eletiva',            'T'),
  ('T1-HIST1',   'História da Igreja I: Primitiva e Medieval',                             2, 1, 60, 30, 30, 'obrigatoria',        'T'),
  ('T1-TEOS2',   'Teologia Sistemática II: Cristologia',                                   2, 1, 60, 30, 30, 'obrigatoria',        'T'),
  ('B1-GREK1',   'Língua Grega I',                                                         2, 1, 40, 30, 10, 'obrigatoria',        'B'),
  ('T1-FILOS-E', 'Introdução à Filosofia',                                                 2, 1, 40, 30, 10, 'eletiva',            'T'),
  ('B1-NOVO2',   'Introdução ao Novo Testamento II (Atos)',                                2, 1, 40, 30, 10, 'obrigatoria',        'B'),
  ('T1-HIST2',   'História da Igreja II: Reforma e Modernidade',                           2, 1, 60, 30, 30, 'obrigatoria',        'T'),
  -- 3º Módulo
  ('B2-GREK2',   'Língua Grega II',                                                        3, 2, 40, 30, 10, 'obrigatoria',        'B'),
  ('T2-HBRAS-E', 'História da Igreja do Brasil',                                           3, 2, 40, 30, 10, 'eletiva',            'T'),
  ('B2-ANT03',   'Introdução ao Antigo Testamento III (Proféticos)',                       3, 2, 40, 30, 10, 'obrigatoria',        'B'),
  ('T2-TEOS3',   'Teologia Sistemática III: Soteriologia e Pneumatologia',                 3, 2, 60, 30, 30, 'obrigatoria',        'T'),
  ('B2-NOVO3',   'Introdução ao Novo Testamento III (Cartas Paulinas)',                    3, 2, 40, 30, 10, 'obrigatoria',        'B'),
  ('T2-ARQCB-E', 'Arqueologia e Costumes Bíblicos / Geografia Bíblica',                   3, 2, 60, 30, 30, 'eletiva',            'T'),
  ('T2-ETICA',   'Ética Cristã',                                                           3, 2, 40, 30, 10, 'obrigatoria',        'T'),
  ('T2-MISS2',   'Missiologia II: Evangelismo',                                            3, 2, 40, 30, 10, 'obrigatoria',        'P'),
  -- 4º Módulo
  ('T2-HERMB',   'Hermenêutica Bíblica',                                                   4, 2, 60, 30, 30, 'obrigatoria',        'B'),
  ('B2-HEBR1-E', 'Língua Hebraica I',                                                      4, 2, 40, 30, 10, 'eletiva_obrigatoria','B'),
  ('B2-ANT04',   'Introdução ao Antigo Testamento IV (Poéticos)',                          4, 2, 40, 30, 10, 'obrigatoria',        'B'),
  ('T2-MISS3',   'Missiologia III: História em Missões',                                   4, 2, 40, 30, 10, 'obrigatoria',        'P'),
  ('B2-EXENT',   'Exegese do Novo Testamento',                                             4, 2, 40, 30, 10, 'obrigatoria',        'B'),
  ('B2-HEBR2-E', 'Língua Hebraica II',                                                     4, 2, 40, 30, 10, 'eletiva',            'B'),
  ('T2-ESCTO',   'Escatologia',                                                            4, 2, 40, 30, 10, 'obrigatoria',        'T'),
  ('B2-NOVO4',   'Introdução ao Novo Testamento IV (Cartas Gerais)',                       4, 2, 40, 30, 10, 'obrigatoria',        'B'),
  -- 5º Módulo
  ('T3-MISS4',   'Missiologia IV: Implantação de Igreja',                                  5, 3, 40, 40, 10, 'obrigatoria',        'P'),
  ('B3-EXEAT-E', 'Exegese do Antigo Testamento',                                           5, 3, 40, 30, 10, 'eletiva',            'B'),
  ('P3-ACOS1',   'Aconselhamento Bíblico I',                                               5, 3, 60, 30, 30, 'obrigatoria',        'P'),
  ('P3-ACOS2',   'Aconselhamento Bíblico II',                                              5, 3, 60, 30, 30, 'obrigatoria',        'P'),
  ('P3-HOMIT',   'Homilética I (Teoria)',                                                   5, 3, 60, 30, 30, 'obrigatoria',        'P'),
  ('T3-TEOCO',   'Teologia Contemporânea',                                                 5, 3, 40, 30, 10, 'eletiva',            'T'),
  ('P3-HOMIP',   'Homilética II (Oratória e Prática)',                                     5, 3, 40, 30, 10, 'obrigatoria',        'P'),
  ('P3-LIDMI',   'Liderança Ministerial',                                                   5, 3, 60, 30, 30, 'obrigatoria',        'P'),
  -- 6º Módulo
  ('P3-LITCU',   'Liturgia do Culto Cristão',                                              6, 3, 40, 30, 10, 'obrigatoria',        'P'),
  ('P3-CAPEL-E', 'Capelania e Visitação',                                                  6, 3, 40, 30, 10, 'eletiva',            'P'),
  ('T3-APOLO',   'Apologética',                                                            6, 3, 40, 30, 10, 'obrigatoria',        'T'),
  ('B3-TEAT',    'Teologia do Antigo Testamento',                                          6, 3, 60, 30, 30, 'obrigatoria',        'B'),
  ('P3-PRATM',   'Prática Ministerial e Adoração',                                         6, 3, 60, 30, 30, 'obrigatoria',        'P'),
  ('T3-SEITA-E', 'Seitas e Heresias',                                                      6, 3, 40, 30, 10, 'eletiva',            'T'),
  ('B3-TENT',    'Teologia do Novo Testamento',                                            6, 3, 60, 30, 30, 'obrigatoria',        'B'),
  ('P3-EDUCA',   'Educação Cristã e Discipulado',                                          6, 3, 60, 30, 30, 'obrigatoria',        'P')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.prerequisitos_disciplinas (disciplina_codigo, prerequisito_codigo, tipo) VALUES
  -- NT sequência
  ('B1-NOVO2',   'B1-NOVO1',   'formal'),
  ('B2-NOVO3',   'B1-NOVO2',   'formal'),
  ('B2-NOVO4',   'B2-NOVO3',   'formal'),
  -- AT sequência
  ('B1-ANT02',   'B1-ANT01',   'formal'),
  ('B2-ANT03',   'B1-ANT02',   'formal'),
  ('B2-ANT04',   'B2-ANT03',   'formal'),
  -- Teologia Sistemática
  ('T1-TEOS2',   'T1-TEOS1',   'formal'),
  ('T2-TEOS3',   'T1-TEOS2',   'formal'),
  ('T2-ESCTO',   'T2-TEOS3',   'recomendado'),
  -- Hermenêutica
  ('T2-HERMB',   'B1-BIBLI',   'recomendado'),
  ('T2-HERMB',   'T1-TEOS1',   'recomendado'),
  ('T2-HERMB',   'B1-GREK1',   'recomendado'),
  -- Grego
  ('B2-GREK2',   'B1-GREK1',   'formal'),
  -- Hebraico
  ('B2-HEBR2-E', 'B2-HEBR1-E', 'formal'),
  -- Exegese NT
  ('B2-EXENT',   'B2-GREK2',   'recomendado'),
  ('B2-EXENT',   'T2-HERMB',   'recomendado'),
  -- Exegese AT
  ('B3-EXEAT-E', 'B2-HEBR2-E', 'recomendado'),
  ('B3-EXEAT-E', 'T2-HERMB',   'recomendado'),
  -- Homilética
  ('P3-HOMIP',   'P3-HOMIT',   'formal'),
  -- Aconselhamento
  ('P3-ACOS2',   'P3-ACOS1',   'formal'),
  -- Missiologia
  ('T2-MISS2',   'P1-MISS1',   'recomendado'),
  ('T2-MISS3',   'T2-MISS2',   'recomendado'),
  ('T3-MISS4',   'T2-MISS3',   'recomendado'),
  -- História da Igreja
  ('T1-HIST2',   'T1-HIST1',   'formal')
ON CONFLICT (disciplina_codigo, prerequisito_codigo) DO NOTHING;
