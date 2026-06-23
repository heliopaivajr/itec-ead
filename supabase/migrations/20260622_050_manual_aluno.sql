BEGIN;

-- 1) coluna do handbook no curso
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS manual_aluno_url TEXT;

-- 2) bucket privado do manual do aluno
INSERT INTO storage.buckets (id, name, public)
VALUES ('manuais-aluno','manuais-aluno', false)
ON CONFLICT (id) DO NOTHING;

-- 3) RLS de Storage: todos autenticados leem; só staff escreve
DROP POLICY IF EXISTS manuais_aluno_select ON storage.objects;
CREATE POLICY manuais_aluno_select ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'manuais-aluno');

DROP POLICY IF EXISTS manuais_aluno_write ON storage.objects;
CREATE POLICY manuais_aluno_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id='manuais-aluno' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));

DROP POLICY IF EXISTS manuais_aluno_update ON storage.objects;
CREATE POLICY manuais_aluno_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id='manuais-aluno' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));

DROP POLICY IF EXISTS manuais_aluno_delete ON storage.objects;
CREATE POLICY manuais_aluno_delete ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id='manuais-aluno' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));

COMMIT;
NOTIFY pgrst, 'reload schema';
