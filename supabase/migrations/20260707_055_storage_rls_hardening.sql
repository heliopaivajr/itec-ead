-- Migration: 20260707_055_storage_rls_hardening.sql
-- Storage RLS hardening — SEC-03 + SEC-05 + SEC-04 (parcial) + manual do aluno editável
-- Origem: auditoria 2026-07-05, report-B (achados SEC-03/04/05).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO (confirmado por query no banco, 2026-07-06) ─────────────────────
-- Buckets `materiais-disciplina` e `manuais-aluno` são PRIVADOS (public=false) e
-- têm 0 objetos → esta migração NÃO tem risco de quebrar conteúdo existente.
-- `aluno_ve_disciplina` é SQL STABLE SECURITY DEFINER search_path=public, gate por
-- CURSO (qualquer disciplina do curso da turma do aluno), SEM filtro de status.
--
-- ─── O QUE ESTA MIGRAÇÃO FAZ ─────────────────────────────────────────────────
-- 1) SEC-05: aluno_ve_disciplina passa a exigir matrícula ATIVA ou CONCLUIDA
--    (evadida/cancelada/trancada/pendente deixam de liberar material).
-- 2) SEC-03: materiais_obj_select deixa de liberar o bucket inteiro a qualquer
--    authenticated; passa a gatear por disciplina (path = disciplinaId/uuid.ext,
--    logo foldername[1] = disciplinaId) + staff/professor leem tudo.
-- 3) SEC-04 (parcial): escrita de materiais inclui 'administracao' (NÃO professor
--    ainda — o professor ganha acesso no sprint seguinte, junto de tela própria).
-- 4) Manual do aluno: escrita/atualização/exclusão inclui 'administracao'
--    (secretaria/coordenação sobem e revisam o handbook). Leitura inalterada.
--
-- ⚠️ ESCOPO INTENCIONALMENTE FORA (sprint seguinte, com UI): dar ao PROFESSOR da
--    cadeira permissão de ESCRITA em materiais/manual da cadeira. Aqui o professor
--    só ganha LEITURA (via materiais_obj_select), não escrita.
--
-- ⚠️ PREMISSA DE PATH (SEC-03): o SELECT faz ((storage.foldername(name))[1])::uuid.
--    Todo objeto de materiais-disciplina é escrito pelo app como `disciplinaId/uuid.ext`
--    (materiais.service.uploadArquivo). Como a escrita é restrita a staff e o bucket
--    está vazio, não há paths legados fora desse formato. Um path sem "/" ou com
--    pasta não-UUID faria o cast ::uuid falhar (22P02) — não ocorre no fluxo atual;
--    se um dia houver upload fora do padrão, tratar antes de aplicar.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) SEC-05 — aluno_ve_disciplina: só matrícula ativa/concluida libera material
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION aluno_ve_disciplina(p_disciplina_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM matriculas m
    JOIN turmas t  ON t.id = m.turma_id
    JOIN modulos mo ON mo.curso_id = t.curso_id
    JOIN disciplinas_v2 d ON d.modulo_id = mo.id
    WHERE m.aluno_id = auth.uid()
      AND d.id = p_disciplina_id
      AND m.status IN ('ativa','concluida')   -- SEC-05: exclui evadida/cancelada/trancada/pendente
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) SEC-03 — materiais_obj_select: gate por disciplina (não mais bucket inteiro)
--    path = disciplinaId/uuid.ext → (storage.foldername(name))[1] = disciplinaId
--    Aluno: só disciplina do seu curso c/ matrícula ativa/concluida (via função).
--    Staff + professor: leem tudo.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS materiais_obj_select ON storage.objects;
CREATE POLICY materiais_obj_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'materiais-disciplina' AND (
    aluno_ve_disciplina( ((storage.foldername(name))[1])::uuid )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
               AND p.role IN ('admin','superadmin','administracao','professor'))
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) SEC-04 (parcial) — materiais WRITE: adiciona 'administracao' (sem professor)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS materiais_obj_write ON storage.objects;
CREATE POLICY materiais_obj_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin','administracao')));

DROP POLICY IF EXISTS materiais_obj_update ON storage.objects;
CREATE POLICY materiais_obj_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin','administracao')));

DROP POLICY IF EXISTS materiais_obj_delete ON storage.objects;
CREATE POLICY materiais_obj_delete ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin','administracao')));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) Manual do aluno — WRITE/UPDATE/DELETE incluem 'administracao'
--    (secretaria/coordenação sobem e revisam). SELECT inalterado (institucional).
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS manuais_aluno_write ON storage.objects;
CREATE POLICY manuais_aluno_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id='manuais-aluno' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin','administracao')));

DROP POLICY IF EXISTS manuais_aluno_update ON storage.objects;
CREATE POLICY manuais_aluno_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id='manuais-aluno' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin','administracao')));

DROP POLICY IF EXISTS manuais_aluno_delete ON storage.objects;
CREATE POLICY manuais_aluno_delete ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id='manuais-aluno' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin','administracao')));

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Policies vigentes dos 2 buckets (esperado: select gateado; write/update/delete
--    com administracao):
-- SELECT policyname, cmd, qual AS using_expr, with_check AS check_expr
-- FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
--   AND (qual LIKE '%materiais-disciplina%' OR with_check LIKE '%materiais-disciplina%'
--     OR qual LIKE '%manuais-aluno%'        OR with_check LIKE '%manuais-aluno%')
-- ORDER BY policyname, cmd;
--
-- 2. Função com o filtro de status:
-- SELECT pg_get_functiondef('public.aluno_ve_disciplina'::regproc);
--    Esperado: WHERE ... AND m.status IN ('ativa','concluida').
--
-- 3. Testes funcionais (após subir 1 material de teste em disciplinaId/uuid.pdf):
--    a) aluno ATIVO de disciplina do seu curso → getDownloadUrl retorna arquivo (200);
--    b) aluno de OUTRO curso (ou evadido/trancado) → SELECT negado / download falha;
--    c) administracao → uploadManualAluno sobe/atualiza o handbook (antes: negado);
--    d) administracao → sobe material de disciplina (antes: negado);
--    e) professor → LÊ material (200), mas ainda NÃO sobe (INSERT negado — esperado).
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (se necessário — recria o estado das migrações 049/050)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- -- função sem filtro de status
-- CREATE OR REPLACE FUNCTION aluno_ve_disciplina(p_disciplina_id UUID)
-- RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
-- SET search_path = public AS $$
--   SELECT EXISTS (
--     SELECT 1 FROM matriculas m
--     JOIN turmas t  ON t.id = m.turma_id
--     JOIN modulos mo ON mo.curso_id = t.curso_id
--     JOIN disciplinas_v2 d ON d.modulo_id = mo.id
--     WHERE m.aluno_id = auth.uid() AND d.id = p_disciplina_id
--   );
-- $$;
-- -- materiais: select bucket-inteiro + write/update/delete só admin/superadmin
-- DROP POLICY IF EXISTS materiais_obj_select ON storage.objects;
-- CREATE POLICY materiais_obj_select ON storage.objects
-- FOR SELECT TO authenticated USING (bucket_id = 'materiais-disciplina');
-- DROP POLICY IF EXISTS materiais_obj_write ON storage.objects;
-- CREATE POLICY materiais_obj_write ON storage.objects
-- FOR INSERT TO authenticated
-- WITH CHECK (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));
-- DROP POLICY IF EXISTS materiais_obj_update ON storage.objects;
-- CREATE POLICY materiais_obj_update ON storage.objects
-- FOR UPDATE TO authenticated
-- USING (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));
-- DROP POLICY IF EXISTS materiais_obj_delete ON storage.objects;
-- CREATE POLICY materiais_obj_delete ON storage.objects
-- FOR DELETE TO authenticated
-- USING (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));
-- -- manual do aluno: write/update/delete só admin/superadmin
-- DROP POLICY IF EXISTS manuais_aluno_write ON storage.objects;
-- CREATE POLICY manuais_aluno_write ON storage.objects
-- FOR INSERT TO authenticated
-- WITH CHECK (bucket_id='manuais-aluno' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));
-- DROP POLICY IF EXISTS manuais_aluno_update ON storage.objects;
-- CREATE POLICY manuais_aluno_update ON storage.objects
-- FOR UPDATE TO authenticated
-- USING (bucket_id='manuais-aluno' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));
-- DROP POLICY IF EXISTS manuais_aluno_delete ON storage.objects;
-- CREATE POLICY manuais_aluno_delete ON storage.objects
-- FOR DELETE TO authenticated
-- USING (bucket_id='manuais-aluno' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin')));
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
