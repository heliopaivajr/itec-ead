BEGIN;
ALTER TABLE matriculas_disciplina
  ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES professores(id);
ALTER TABLE matriculas_disciplina DROP COLUMN IF EXISTS convalidacao_instituicao;
ALTER TABLE matriculas_disciplina DROP COLUMN IF EXISTS convalidacao_ch_origem;
ALTER TABLE matriculas_disciplina DROP COLUMN IF EXISTS convalidacao_bate_ch;
ALTER TABLE matriculas_disciplina DROP COLUMN IF EXISTS convalidacao_justificativa;
ALTER TABLE matriculas_disciplina DROP COLUMN IF EXISTS convalidacao_doc_url;
COMMIT;
NOTIFY pgrst, 'reload schema';
