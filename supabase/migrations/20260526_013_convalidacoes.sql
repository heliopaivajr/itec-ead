-- Migration: 20260526_013_convalidacoes.sql
-- Tabelas: convalidacoes
-- Fluxo: aluno solicita → secretaria registra docs →
--        coordenador analisa → superadmin aprova

CREATE TABLE IF NOT EXISTS public.convalidacoes (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id                UUID        NOT NULL REFERENCES public.profiles(id),
  disciplina_id           UUID        NOT NULL REFERENCES public.disciplinas_v2(id),
  instituicao_origem      VARCHAR(200) NOT NULL,
  disciplina_origem       VARCHAR(200) NOT NULL,
  carga_horaria_origem    INTEGER,
  coordenador_responsavel UUID        REFERENCES public.profiles(id),
  aprovado_por            UUID        REFERENCES public.profiles(id),
  status                  VARCHAR(20) NOT NULL DEFAULT 'pendente'
                            CHECK (status IN ('pendente','aprovado','rejeitado')),
  documentos_url          TEXT[],
  observacoes             TEXT,
  solicitado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aprovado_em             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_convalidacoes_aluno_id      ON public.convalidacoes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_convalidacoes_disciplina_id ON public.convalidacoes(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_convalidacoes_status        ON public.convalidacoes(status);

ALTER TABLE public.convalidacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "convalidacoes_aluno_ve_propria"  ON public.convalidacoes;
DROP POLICY IF EXISTS "convalidacoes_gestao_superadmin" ON public.convalidacoes;

CREATE POLICY "convalidacoes_aluno_ve_propria" ON public.convalidacoes
  FOR SELECT USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  );

-- Apenas superadmin e admin aprovam convalidações
CREATE POLICY "convalidacoes_gestao_superadmin" ON public.convalidacoes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );
