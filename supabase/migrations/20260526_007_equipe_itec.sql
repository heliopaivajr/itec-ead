-- Migration: 20260526_007_equipe_itec.sql
-- Tabelas: equipe_itec

CREATE TABLE IF NOT EXISTS public.equipe_itec (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  nome            VARCHAR(200) NOT NULL,
  cargo           VARCHAR(100) NOT NULL,
  role_sistema    VARCHAR(50)  NOT NULL,
  email           VARCHAR(200),
  telefone        VARCHAR(20),
  ativo           BOOLEAN      NOT NULL DEFAULT true,
  criado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipe_itec_user_id ON public.equipe_itec(user_id);
CREATE INDEX IF NOT EXISTS idx_equipe_itec_ativo   ON public.equipe_itec(ativo);

ALTER TABLE public.equipe_itec ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "equipe_leitura_interna"  ON public.equipe_itec;
DROP POLICY IF EXISTS "equipe_gestao_admin"      ON public.equipe_itec;

-- Qualquer usuário autenticado pode ver a equipe
CREATE POLICY "equipe_leitura_interna" ON public.equipe_itec
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin e superadmin gerenciam
CREATE POLICY "equipe_gestao_admin" ON public.equipe_itec
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','superadmin')
    )
  );

-- Seed — equipe real do ITEC
INSERT INTO public.equipe_itec (nome, cargo, role_sistema, email, telefone) VALUES
  ('Bispo Adonias',      'Capelania',              'admin',         NULL,                    NULL),
  ('Pr. Eliel',          'Reitor',                 'admin',         NULL,                    '81984274078'),
  ('Rev. Alan',          'Vice-Reitor',            'admin',         NULL,                    NULL),
  ('Pr. Hélio Paiva Jr.','Diretor Acadêmico',      'superadmin',    'heliopaiva@gmail.com',  '81982724556'),
  ('Prof. Andrea',       'Vice-Diretora Acadêmica','admin',         NULL,                    '81989564978'),
  ('Rev. Breno',         'Diretor Financeiro',     'financeiro',    NULL,                    NULL),
  ('Adv. Hugo',          'Jurídico',               'juridico',      NULL,                    NULL),
  ('Camila',             'Secretaria',             'administracao', 'secretaria@itecedu.com','81991161448')
ON CONFLICT DO NOTHING;
