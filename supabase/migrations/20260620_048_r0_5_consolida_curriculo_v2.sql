BEGIN;
ALTER TABLE disciplinas_v2 ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE prerequisitos_v2 DROP CONSTRAINT IF EXISTS prerequisitos_v2_tipo_check;
ALTER TABLE prerequisitos_v2 ADD CONSTRAINT prerequisitos_v2_tipo_check
  CHECK (tipo IN ('prerequisito','corequisito','recomendado'));
DELETE FROM prerequisitos_v2;
INSERT INTO prerequisitos_v2 (id, disciplina_id, prerequisito_id, tipo)
SELECT gen_random_uuid(), d.id, p.id,
       CASE pd.tipo WHEN 'formal' THEN 'prerequisito'
                    WHEN 'recomendado' THEN 'recomendado'
                    ELSE pd.tipo END
FROM prerequisitos_disciplinas pd
JOIN disciplinas_v2 d ON d.codigo = pd.disciplina_codigo
JOIN disciplinas_v2 p ON p.codigo = pd.prerequisito_codigo;
COMMIT;
NOTIFY pgrst, 'reload schema';
