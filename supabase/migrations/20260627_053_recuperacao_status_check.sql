BEGIN;
ALTER TABLE matriculas_disciplina DROP CONSTRAINT IF EXISTS matriculas_disciplina_status_check;
ALTER TABLE matriculas_disciplina ADD CONSTRAINT matriculas_disciplina_status_check
  CHECK (status IN ('cursando','aprovado','reprovado','reprovado_falta','convalidado','trancado','recuperacao'));
COMMIT;
NOTIFY pgrst, 'reload schema';
