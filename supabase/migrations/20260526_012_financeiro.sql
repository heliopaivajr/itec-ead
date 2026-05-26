-- Migration: 20260526_012_financeiro.sql
-- Tabelas: taxa_matricula, mensalidades
-- Nota: cobrança automática PIX/boleto fora do escopo agora

-- ─── taxa_matricula ──────────────────────────────────────────
-- Paga uma vez na entrada — condição para ativar matrícula
CREATE TABLE IF NOT EXISTS public.taxa_matricula (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id         UUID         NOT NULL REFERENCES public.profiles(id),
  matricula_id     UUID         REFERENCES public.matriculas(id),
  valor            DECIMAL(10,2) NOT NULL,
  status           VARCHAR(20)  NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente','pago','isento')),
  data_vencimento  DATE,
  data_pagamento   DATE,
  comprovante_url  TEXT,
  registrado_por   UUID         REFERENCES public.profiles(id),
  observacoes      TEXT,
  criado_em        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taxa_matricula_aluno_id    ON public.taxa_matricula(aluno_id);
CREATE INDEX IF NOT EXISTS idx_taxa_matricula_matricula_id ON public.taxa_matricula(matricula_id);
CREATE INDEX IF NOT EXISTS idx_taxa_matricula_status      ON public.taxa_matricula(status);

ALTER TABLE public.taxa_matricula ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "taxa_aluno_ve_propria"         ON public.taxa_matricula;
DROP POLICY IF EXISTS "taxa_gestao_administracao"     ON public.taxa_matricula;

CREATE POLICY "taxa_aluno_ve_propria" ON public.taxa_matricula
  FOR SELECT USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  );

CREATE POLICY "taxa_gestao_administracao" ON public.taxa_matricula
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );

-- ─── mensalidades ────────────────────────────────────────────
-- Documentos retidos se inadimplente (verificar via status)
CREATE TABLE IF NOT EXISTS public.mensalidades (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id          UUID         NOT NULL REFERENCES public.profiles(id),
  matricula_id      UUID         REFERENCES public.matriculas(id),
  valor             DECIMAL(10,2) NOT NULL,
  mes_referencia    DATE         NOT NULL,
  data_vencimento   DATE         NOT NULL,
  status            VARCHAR(20)  NOT NULL DEFAULT 'pendente'
                      CHECK (status IN
                        ('pendente','pago','atrasado','isento','cancelado')),
  data_pagamento    DATE,
  comprovante_url   TEXT,
  registrado_por    UUID         REFERENCES public.profiles(id),
  observacoes       TEXT,
  criado_em         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(aluno_id, mes_referencia)
);

CREATE INDEX IF NOT EXISTS idx_mensalidades_aluno_id       ON public.mensalidades(aluno_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_matricula_id   ON public.mensalidades(matricula_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_status         ON public.mensalidades(status);
CREATE INDEX IF NOT EXISTS idx_mensalidades_vencimento     ON public.mensalidades(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_mensalidades_mes_referencia ON public.mensalidades(mes_referencia DESC);

ALTER TABLE public.mensalidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensalidades_aluno_ve_propria"   ON public.mensalidades;
DROP POLICY IF EXISTS "mensalidades_gestao_financeiro"  ON public.mensalidades;

CREATE POLICY "mensalidades_aluno_ve_propria" ON public.mensalidades
  FOR SELECT USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  );

CREATE POLICY "mensalidades_gestao_financeiro" ON public.mensalidades
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );
