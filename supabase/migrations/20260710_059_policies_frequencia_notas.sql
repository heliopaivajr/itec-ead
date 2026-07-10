-- Migration: 20260710_059_policies_frequencia_notas.sql
-- Camada 0 do módulo Frequência/Notas — fecha SEC-06 + edição pelos 3 perfis
-- Origem: diagnóstico Camada 0 (2026-07-10) · known-errors SEC-06 · IDEAS-BACKLOG 2.08.
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- 🔴 SEC-06 (BLOQUEADOR pré-lançamento): a policy notas_aluno_insert da 031 aceita
-- `auth.uid() = lancado_por` para QUALQUER authenticated → um ALUNO insere a própria
-- nota (lancado_por = ele) e a média (getConsolidadoTurma usa notas_aluno) absorve a
-- nota forjada. O UPDATE tem a mesma forma (aluno edita a linha que forjou).
--
-- Esta migração (SÓ policies — nenhuma tabela/coluna/dado alterado):
-- 1) notas_aluno INSERT/UPDATE: gate real = professor DA cadeira
--    (professor_leciona_disciplina, 056 — contrato ativo/decisão C) OU staff,
--    agora INCLUINDO 'administracao' (matriz §5: secretaria lança/corrige nota —
--    hoje ela nem lançava). `lancado_por = auth.uid()` no WITH CHECK trava a
--    autoria (o app já envia assim: lancarNota/atualizarNota).
-- 2) frequencia: NOVA policy de UPDATE para o professor da cadeira — destrava
--    corrigir chamada já lançada (ramo ON CONFLICT do upsert) e justificarFalta,
--    que hoje só staff consegue.
-- SELECT/DELETE de notas_aluno e INSERT/ALL de frequencia: INALTERADOS.
--
-- notas_aluno.disciplina_id e frequencia.disciplina_id existem DIRETO nas tabelas
-- (023/011) — o gate não precisa navegar por avaliacoes.
--
-- Mudança de comportamento intencional: professor SEM contrato ativo na disciplina
-- deixa de lançar/editar nota nela (antes qualquer authenticated conseguia — era o
-- buraco). Coerente com a decisão C; o vínculo é criado pela secretaria.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) notas_aluno — fecha SEC-06 + inclui administracao
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notas_aluno_insert" ON public.notas_aluno;
CREATE POLICY "notas_aluno_insert" ON public.notas_aluno
  FOR INSERT TO authenticated
  WITH CHECK (
    lancado_por = auth.uid()                                   -- auditoria: quem lança assina
    AND (
      professor_leciona_disciplina(disciplina_id)              -- professor DA cadeira (contrato ativo)
      OR EXISTS (SELECT 1 FROM public.user_roles
                 WHERE user_id = auth.uid()
                   AND role IN ('admin','superadmin','administracao'))
    )
  );

DROP POLICY IF EXISTS "notas_aluno_update" ON public.notas_aluno;
CREATE POLICY "notas_aluno_update" ON public.notas_aluno
  FOR UPDATE TO authenticated
  USING (        -- linha existente: professor da cadeira OU staff (corrige nota de qualquer lançador)
    professor_leciona_disciplina(disciplina_id)
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  )
  WITH CHECK (   -- valores novos: idem + lancado_por vira quem corrigiu (o app já faz isso)
    lancado_por = auth.uid()
    AND (
      professor_leciona_disciplina(disciplina_id)
      OR EXISTS (SELECT 1 FROM public.user_roles
                 WHERE user_id = auth.uid()
                   AND role IN ('admin','superadmin','administracao'))
    )
  );

-- SELECT (aluno vê a própria + staff/professor) e DELETE (só superadmin): NÃO tocados.

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) frequencia — professor da cadeira corrige chamada / justifica falta
--    (INSERT frequencia_professor_lanca e ALL frequencia_admin_total: NÃO tocados)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "frequencia_professor_update" ON public.frequencia;
CREATE POLICY "frequencia_professor_update" ON public.frequencia
  FOR UPDATE TO authenticated
  USING      (professor_leciona_disciplina(disciplina_id))
  WITH CHECK (professor_leciona_disciplina(disciplina_id));

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- AUDITORIA DE DADOS PRÉ-EXISTENTES (rodar ANTES ou logo após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- Notas lançadas por usuários com role 'aluno' (forjadas via SEC-06):
-- SELECT count(*) FROM notas_aluno n
-- JOIN user_roles u ON u.user_id = n.lancado_por
-- WHERE u.role = 'aluno';
--    ESPERADO: 0 (alunos reais ainda não usam a plataforma).
--    Se > 0: listar e LIMPAR antes de considerar o SEC-06 encerrado:
--    SELECT n.* FROM notas_aluno n JOIN user_roles u ON u.user_id = n.lancado_por
--    WHERE u.role = 'aluno';
--
-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO POR PAPEL (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Policies vigentes (esperado: insert/update com professor_leciona_disciplina +
--    administracao; select/delete inalterados; frequencia com a nova UPDATE):
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE tablename IN ('notas_aluno','frequencia') ORDER BY tablename, policyname;
--
-- 2. Testes por papel (via app ou API):
--    a) ALUNO → POST /rest/v1/notas_aluno (aluno_id=ele, lancado_por=ele) →
--       ❌ NEGADO (42501) — SEC-06 fechado.
--    b) PROFESSOR da cadeira (contrato ativo) → lança nota (LancarNotas) ✓;
--       corrige nota existente ✓; re-salva chamada do MESMO dia ✓ (novo);
--       justificarFalta ✓ (novo).
--    c) PROFESSOR de OUTRA cadeira → lançar/corrigir nota na disciplina alheia →
--       ❌ NEGADO.
--    d) ADMINISTRACAO → lança e corrige nota → ✓ (novo — antes nem lançava).
--    e) admin/superadmin → tudo, inalterado. DELETE de nota: só superadmin.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (se necessário — recria as policies da 031; ⚠️ REABRE o SEC-06)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP POLICY IF EXISTS "frequencia_professor_update" ON public.frequencia;
-- DROP POLICY IF EXISTS "notas_aluno_insert" ON public.notas_aluno;
-- CREATE POLICY "notas_aluno_insert" ON public.notas_aluno
--   FOR INSERT TO authenticated
--   WITH CHECK (
--     auth.uid() = lancado_por OR
--     EXISTS (SELECT 1 FROM public.user_roles
--             WHERE user_id = auth.uid() AND role IN ('admin','superadmin'))
--   );
-- DROP POLICY IF EXISTS "notas_aluno_update" ON public.notas_aluno;
-- CREATE POLICY "notas_aluno_update" ON public.notas_aluno
--   FOR UPDATE TO authenticated
--   USING (
--     auth.uid() = lancado_por OR
--     EXISTS (SELECT 1 FROM public.user_roles
--             WHERE user_id = auth.uid() AND role IN ('admin','superadmin'))
--   );
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
