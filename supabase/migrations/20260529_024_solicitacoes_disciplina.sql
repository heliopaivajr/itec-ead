-- Migration: 20260529_024_solicitacoes_disciplina.sql
-- Tabela: solicitacoes_disciplina
-- Fluxo: professor solicita acesso a uma disciplina/turma
--        secretaria/admin aprova ou recusa
--        aprovada → contratos_professor criado pelo sistema

CREATE TABLE IF NOT EXISTS public.solicitacoes_disciplina (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id    UUID        NOT NULL REFERENCES public.professores(id) ON DELETE CASCADE,
  disciplina_id   UUID        NOT NULL REFERENCES public.disciplinas_v2(id) ON DELETE CASCADE,
  turma_id        UUID        REFERENCES public.turmas(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'aprovada', 'recusada', 'encerrada')),
  observacao      TEXT,
  -- quem aprovou/recusou
  aprovado_por    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  aprovado_em     TIMESTAMPTZ,
  -- encerramento
  encerrado_por   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  encerrado_em    TIMESTAMPTZ,
  -- contrato gerado após aprovação
  contrato_id     UUID        REFERENCES public.contratos_professor(id) ON DELETE SET NULL,
  -- timestamps
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- professor não pode solicitar a mesma disciplina/turma duas vezes enquanto ativa
  UNIQUE(professor_id, disciplina_id, turma_id)
);

CREATE INDEX IF NOT EXISTS idx_sol_disc_professor  ON public.solicitacoes_disciplina(professor_id);
CREATE INDEX IF NOT EXISTS idx_sol_disc_disciplina ON public.solicitacoes_disciplina(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_sol_disc_status     ON public.solicitacoes_disciplina(status);
CREATE INDEX IF NOT EXISTS idx_sol_disc_turma      ON public.solicitacoes_disciplina(turma_id);

ALTER TABLE public.solicitacoes_disciplina ENABLE ROW LEVEL SECURITY;

-- Professor vê apenas suas próprias solicitações
CREATE POLICY "sol_disc_professor_ve_propria" ON public.solicitacoes_disciplina
  FOR SELECT TO authenticated
  USING (
    professor_id IN (
      SELECT id FROM public.professores WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'administracao')
    )
  );

-- Professor pode criar solicitação para si mesmo
CREATE POLICY "sol_disc_professor_cria" ON public.solicitacoes_disciplina
  FOR INSERT TO authenticated
  WITH CHECK (
    professor_id IN (
      SELECT id FROM public.professores WHERE user_id = auth.uid()
    )
  );

-- Admin/secretaria pode atualizar (aprovar/recusar/encerrar)
-- Professor pode encerrar a própria disciplina
CREATE POLICY "sol_disc_update" ON public.solicitacoes_disciplina
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'administracao')
    )
    OR professor_id IN (
      SELECT id FROM public.professores WHERE user_id = auth.uid()
    )
  );

-- Somente superadmin pode deletar
CREATE POLICY "sol_disc_delete" ON public.solicitacoes_disciplina
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );
