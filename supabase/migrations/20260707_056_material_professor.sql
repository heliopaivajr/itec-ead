-- Migration: 20260707_056_material_professor.sql
-- Sprint "Material do Professor + Contrato Assinado" — fecha SEC-04 metade 2 + gap da 055
-- Origem: report-B SEC-04 + diagnóstico Material do Professor (2026-07-07).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- Decisões do Hélio (imutáveis): professor gerencia material APENAS de disciplina
-- do SEU contrato ativo (CONTRATO_ATIVO = não-encerrado: pendente/preenchido/
-- impresso/assinado — decisão C); material de professor é AUTO-APROVADO (feito no
-- app; a policy não restringe status); contrato assinado: professor baixa, assina
-- fora (gov.br) e SOBE o PDF; secretaria confirma via "Marcar como assinado".
--
-- GAP DA 055 FECHADO AQUI: a 055 deu à 'administracao' escrita no STORAGE de
-- materiais, mas a policy da TABELA materiais_disciplina (049, materiais_staff_all)
-- continuou admin/superadmin-only → administracao subia o arquivo e o INSERT da
-- linha falhava. Esta migração inclui 'administracao' na policy da tabela.
--
-- O QUE ESTA MIGRAÇÃO FAZ:
-- 1) Função professor_leciona_disciplina(uuid) — gate por contrato ativo.
-- 2) Função professor_dono_contrato(uuid)     — gate pelo próprio contrato.
-- 3) Tabela materiais_disciplina: policies do professor (SELECT/INSERT/UPDATE/
--    DELETE na cadeira dele) + 'administracao' no staff_all (gap da 055).
-- 4) Storage materiais-disciplina: ramo do professor no write/update/delete.
-- 5) Bucket privado 'contratos-professor' + policies (professor lê/sobe o PDF do
--    PRÓPRIO contrato; staff lê/escreve tudo; delete só staff).
--    Path do app: {contratoId}/{uuid}.pdf → foldername[1] = contratoId.
-- 6) Tabela contratos_professor: professor pode UPDATE da PRÓPRIA linha, com
--    WITH CHECK travando status/professor_id/disciplina_id (na prática, só
--    pdf_url muda — professor NÃO marca o próprio contrato como assinado).
--
-- ⚠️ PREMISSA DE PATH (mesma da 055): materiais = disciplinaId/uuid.ext;
--    contratos = contratoId/uuid.pdf. Cast ::uuid falha em path fora do padrão —
--    não ocorre nos fluxos do app (uploads só via services com UUID).
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) professor_leciona_disciplina — vínculo = contrato NÃO-encerrado (decisão C)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION professor_leciona_disciplina(p_disciplina_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM contratos_professor c
    JOIN professores p ON p.id = c.professor_id
    WHERE p.user_id = auth.uid()
      AND c.disciplina_id = p_disciplina_id
      AND c.status IN ('pendente','preenchido','impresso','assinado')  -- CONTRATO_ATIVO
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) professor_dono_contrato — o contrato é do professor logado?
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION professor_dono_contrato(p_contrato_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM contratos_professor c
    JOIN professores p ON p.id = c.professor_id
    WHERE p.user_id = auth.uid()
      AND c.id = p_contrato_id
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) TABELA materiais_disciplina — professor gerencia a própria cadeira
--    + fecha o gap da 055 ('administracao' no staff_all)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS materiais_staff_all ON materiais_disciplina;
CREATE POLICY materiais_staff_all ON materiais_disciplina
FOR ALL TO authenticated
USING      (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin','administracao')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin','administracao')));

-- Professor VÊ todos os materiais das disciplinas dele (inclusive pendente/inativo,
-- que a policy do aluno esconde) — necessário para a tela "Meus Materiais".
DROP POLICY IF EXISTS materiais_professor_select ON materiais_disciplina;
CREATE POLICY materiais_professor_select ON materiais_disciplina
FOR SELECT TO authenticated
USING (professor_leciona_disciplina(disciplina_id));

DROP POLICY IF EXISTS materiais_professor_insert ON materiais_disciplina;
CREATE POLICY materiais_professor_insert ON materiais_disciplina
FOR INSERT TO authenticated
WITH CHECK (professor_leciona_disciplina(disciplina_id));

-- UPDATE: USING e WITH CHECK ambos gateados — professor não "move" material
-- para disciplina que não leciona.
DROP POLICY IF EXISTS materiais_professor_update ON materiais_disciplina;
CREATE POLICY materiais_professor_update ON materiais_disciplina
FOR UPDATE TO authenticated
USING      (professor_leciona_disciplina(disciplina_id))
WITH CHECK (professor_leciona_disciplina(disciplina_id));

DROP POLICY IF EXISTS materiais_professor_delete ON materiais_disciplina;
CREATE POLICY materiais_professor_delete ON materiais_disciplina
FOR DELETE TO authenticated
USING (professor_leciona_disciplina(disciplina_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) STORAGE materiais-disciplina — ramo do professor no write/update/delete
--    (recria as policies da 055 + OR professor_leciona_disciplina)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS materiais_obj_write ON storage.objects;
CREATE POLICY materiais_obj_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'materiais-disciplina' AND (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin','administracao'))
    OR professor_leciona_disciplina( ((storage.foldername(name))[1])::uuid )
  )
);

DROP POLICY IF EXISTS materiais_obj_update ON storage.objects;
CREATE POLICY materiais_obj_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'materiais-disciplina' AND (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin','administracao'))
    OR professor_leciona_disciplina( ((storage.foldername(name))[1])::uuid )
  )
);

DROP POLICY IF EXISTS materiais_obj_delete ON storage.objects;
CREATE POLICY materiais_obj_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'materiais-disciplina' AND (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin','administracao'))
    OR professor_leciona_disciplina( ((storage.foldername(name))[1])::uuid )
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5) CONTRATO ASSINADO — bucket privado 'contratos-professor'
--    (não existia nenhum bucket para o PDF do contrato; pdf_url [009] estava sem uso)
--    Path do app: {contratoId}/{uuid}.pdf → foldername[1] = contratoId
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos-professor','contratos-professor', false)
ON CONFLICT (id) DO NOTHING;

-- Leitura: staff + o professor dono do contrato
DROP POLICY IF EXISTS contratos_obj_select ON storage.objects;
CREATE POLICY contratos_obj_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'contratos-professor' AND (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin','administracao'))
    OR professor_dono_contrato( ((storage.foldername(name))[1])::uuid )
  )
);

-- Upload/atualização: staff + o professor dono (re-envio gera novo UUID; o PDF
-- antigo permanece no bucket como histórico — delete é só staff)
DROP POLICY IF EXISTS contratos_obj_write ON storage.objects;
CREATE POLICY contratos_obj_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'contratos-professor' AND (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin','administracao'))
    OR professor_dono_contrato( ((storage.foldername(name))[1])::uuid )
  )
);

DROP POLICY IF EXISTS contratos_obj_update ON storage.objects;
CREATE POLICY contratos_obj_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'contratos-professor' AND (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin','administracao'))
    OR professor_dono_contrato( ((storage.foldername(name))[1])::uuid )
  )
);

DROP POLICY IF EXISTS contratos_obj_delete ON storage.objects;
CREATE POLICY contratos_obj_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'contratos-professor'
  AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin','administracao'))
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6) TABELA contratos_professor — professor grava pdf_url na PRÓPRIA linha.
--    WITH CHECK trava status/professor_id/disciplina_id no valor atual (padrão
--    profiles P5/P7): na prática o professor só consegue mudar pdf_url.
--    Professor NÃO marca o próprio contrato como 'assinado' — isso é da secretaria.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS contratos_professor_envia_pdf ON contratos_professor;
CREATE POLICY contratos_professor_envia_pdf ON contratos_professor
FOR UPDATE TO authenticated
USING (professor_dono_contrato(id))
WITH CHECK (
  professor_dono_contrato(id)
  AND status        = (SELECT c2.status        FROM contratos_professor c2 WHERE c2.id = contratos_professor.id)
  AND professor_id  = (SELECT c2.professor_id  FROM contratos_professor c2 WHERE c2.id = contratos_professor.id)
  AND disciplina_id = (SELECT c2.disciplina_id FROM contratos_professor c2 WHERE c2.id = contratos_professor.id)
);

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Funções criadas (esperado: 2 linhas, SECURITY DEFINER, search_path=public):
-- SELECT proname, prosecdef FROM pg_proc
-- WHERE proname IN ('professor_leciona_disciplina','professor_dono_contrato');
--
-- 2. Policies da tabela materiais_disciplina (esperado: staff_all com
--    administracao + 4 policies materiais_professor_*):
-- SELECT policyname, cmd FROM pg_policies WHERE tablename='materiais_disciplina';
--
-- 3. Policies de Storage (materiais com ramo professor; contratos-professor com 4):
-- SELECT policyname, cmd, qual FROM pg_policies
-- WHERE schemaname='storage' AND tablename='objects'
--   AND (qual LIKE '%materiais-disciplina%' OR with_check LIKE '%materiais-disciplina%'
--     OR qual LIKE '%contratos-professor%'  OR with_check LIKE '%contratos-professor%');
--
-- 4. Bucket criado e privado:
-- SELECT id, public FROM storage.buckets WHERE id='contratos-professor';  -- public=false
--
-- 5. Testes por papel (exigem contrato de teste em contratos_professor):
--    a) professor COM contrato ativo na disciplina D → sobe arquivo em D/uuid.pdf (200)
--       e criarMaterial em D funciona; em disciplina SEM contrato → negado (both).
--    b) professor → UPDATE contratos_professor.pdf_url da própria linha OK;
--       UPDATE status → 0 rows (WITH CHECK trava); linha de outro professor → negado.
--    c) administracao → cria material COMPLETO (arquivo + linha) — gap da 055 fechado.
--    d) aluno → nada muda (leitura via 055).
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (se necessário — volta ao estado pós-055)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP POLICY IF EXISTS contratos_professor_envia_pdf ON contratos_professor;
-- DROP POLICY IF EXISTS contratos_obj_select ON storage.objects;
-- DROP POLICY IF EXISTS contratos_obj_write  ON storage.objects;
-- DROP POLICY IF EXISTS contratos_obj_update ON storage.objects;
-- DROP POLICY IF EXISTS contratos_obj_delete ON storage.objects;
-- -- (bucket contratos-professor pode permanecer; sem policies fica inacessível a authenticated)
-- DROP POLICY IF EXISTS materiais_professor_select ON materiais_disciplina;
-- DROP POLICY IF EXISTS materiais_professor_insert ON materiais_disciplina;
-- DROP POLICY IF EXISTS materiais_professor_update ON materiais_disciplina;
-- DROP POLICY IF EXISTS materiais_professor_delete ON materiais_disciplina;
-- DROP POLICY IF EXISTS materiais_staff_all ON materiais_disciplina;
-- CREATE POLICY materiais_staff_all ON materiais_disciplina
-- FOR ALL TO authenticated
-- USING      (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')))
-- WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')));
-- -- Storage de materiais: recriar as versões da 055 (sem ramo professor)
-- DROP POLICY IF EXISTS materiais_obj_write ON storage.objects;
-- CREATE POLICY materiais_obj_write ON storage.objects
-- FOR INSERT TO authenticated
-- WITH CHECK (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin','administracao')));
-- DROP POLICY IF EXISTS materiais_obj_update ON storage.objects;
-- CREATE POLICY materiais_obj_update ON storage.objects
-- FOR UPDATE TO authenticated
-- USING (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin','administracao')));
-- DROP POLICY IF EXISTS materiais_obj_delete ON storage.objects;
-- CREATE POLICY materiais_obj_delete ON storage.objects
-- FOR DELETE TO authenticated
-- USING (bucket_id='materiais-disciplina' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','superadmin','administracao')));
-- DROP FUNCTION IF EXISTS professor_leciona_disciplina(UUID);
-- DROP FUNCTION IF EXISTS professor_dono_contrato(UUID);
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
