BEGIN;

CREATE TABLE IF NOT EXISTS materiais_disciplina (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES disciplinas_v2(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('pdf','doc','xls','video','outro')),
  origem TEXT NOT NULL CHECK (origem IN ('upload','link')),
  arquivo_url TEXT NOT NULL,
  tamanho_bytes BIGINT,
  eh_resumo BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('rascunho','pendente','aprovado')),
  versao INT NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID REFERENCES profiles(id),
  aprovado_por UUID REFERENCES profiles(id),
  aprovado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_materiais_disc ON materiais_disciplina(disciplina_id, status, ativo);

CREATE OR REPLACE FUNCTION aluno_ve_disciplina(p_disciplina_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM matriculas m
    JOIN turmas t  ON t.id = m.turma_id
    JOIN modulos mo ON mo.curso_id = t.curso_id
    JOIN disciplinas_v2 d ON d.modulo_id = mo.id
    WHERE m.aluno_id = auth.uid() AND d.id = p_disciplina_id
  );
$$;

ALTER TABLE materiais_disciplina ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS materiais_aluno_select ON materiais_disciplina;
CREATE POLICY materiais_aluno_select ON materiais_disciplina
FOR SELECT TO authenticated
USING (status = 'aprovado' AND ativo = true AND aluno_ve_disciplina(disciplina_id));

DROP POLICY IF EXISTS materiais_staff_all ON materiais_disciplina;
CREATE POLICY materiais_staff_all ON materiais_disciplina
FOR ALL TO authenticated
USING      (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')));

INSERT INTO storage.buckets (id, name, public)
VALUES ('materiais-disciplina','materiais-disciplina', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS materiais_obj_select ON storage.objects;
CREATE POLICY materiais_obj_select ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'materiais-disciplina');

DROP POLICY IF EXISTS materiais_obj_write ON storage.objects;
CREATE POLICY materiais_obj_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));

DROP POLICY IF EXISTS materiais_obj_update ON storage.objects;
CREATE POLICY materiais_obj_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));

DROP POLICY IF EXISTS materiais_obj_delete ON storage.objects;
CREATE POLICY materiais_obj_delete ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));

COMMIT;
NOTIFY pgrst, 'reload schema';
