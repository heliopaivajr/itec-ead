-- Migration: 20260713_060_roster_codigo_itec.sql
-- Roster ganha codigo_itec — pré-requisito do R02 escopado (LGPD-01 fase 2 · Mov.2)
-- Origem: diagnóstico "LGPD-01 fase 2 · Mov.2: R02/R03 pro roster" (IDEAS-BACKLOG 2.09).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- get_alunos_operacional (058) retorna aluno_id, full_name, avatar_url, matricula_id,
-- nota, faltas, frequencia_percentual, status_disciplina — mas NÃO codigo_itec.
-- O R02 (Lista de Presença) exibe o "Cód. ITEC" do aluno e hoje o obtém lendo
-- profiles direto (relatorios.service — SELECT id, full_name, codigo_itec). O Mov.2
-- troca essa leitura pelo roster; para isso o roster precisa devolver codigo_itec.
--
-- Postgres NÃO permite CREATE OR REPLACE mudando as colunas do RETURNS TABLE
-- ("cannot change return type of existing function") → DROP FUNCTION + CREATE,
-- exatamente como a 058 fez ao trocar a assinatura. Reaplica o REVOKE anon.
--
-- ─── POSIÇÃO DA COLUNA (decisão) ─────────────────────────────────────────────
-- codigo_itec entra LOGO APÓS avatar_url — agrupado com os campos de identidade
-- do aluno (aluno_id, full_name, avatar_url, codigo_itec), antes dos campos
-- acadêmicos (matricula_id, nota, faltas, ...). A posição é irrelevante para os
-- consumidores: a RPC do PostgREST devolve objetos JSON chaveados por NOME, não
-- por índice — ninguém faz leitura posicional. É escolha de legibilidade.
--
-- ─── ADITIVO — NÃO QUEBRA CONSUMIDORES ───────────────────────────────────────
-- Consumidores atuais (todos via supabase.rpc(...), acesso por nome de campo):
--   • MeusAlunos.tsx / LancarFrequencia.tsx / VerTurma.tsx → getAlunosOperacional()
--   • getConsolidadoTurma (notas.service) → getAlunosOperacional(disciplinaId, turmaId)
-- Nenhum lê por índice; todos mapeiam para a interface AlunoOperacional (por chave).
-- Uma coluna nova é ignorada por quem não a referencia. A interface TS ganhará
-- codigo_itec (aditivo, opcional) em passo de CÓDIGO à parte — sem impacto aqui.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1) Remove a função atual (a 2-arg da 058) — necessário para mudar o RETURNS.
DROP FUNCTION IF EXISTS public.get_alunos_operacional(uuid, uuid);

-- 2) Recria idêntica à 058, adicionando codigo_itec (após avatar_url).
CREATE OR REPLACE FUNCTION public.get_alunos_operacional(
  p_disciplina_id uuid,
  p_turma_id uuid DEFAULT NULL
)
RETURNS TABLE(
  aluno_id uuid,
  full_name text,
  avatar_url text,
  codigo_itec text,                 -- NOVO (Mov.2): usado pelo R02
  matricula_id uuid,
  nota numeric,
  faltas integer,
  frequencia_percentual numeric,
  status_disciplina text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    pr.id AS aluno_id,
    pr.full_name,
    pr.avatar_url,
    pr.codigo_itec,
    md.matricula_id,
    md.nota,
    md.faltas,
    md.frequencia_percentual,
    md.status AS status_disciplina
  FROM matriculas_disciplina md
  JOIN matriculas m   ON m.id = md.matricula_id
  JOIN profiles   pr  ON pr.id = m.aluno_id
  WHERE md.disciplina_id = p_disciplina_id
    AND (p_turma_id IS NULL OR m.turma_id = p_turma_id)   -- filtro de turma opcional
    AND (
      professor_leciona_disciplina(p_disciplina_id)
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
                 AND p.role IN ('admin','superadmin','administracao'))
    )
  ORDER BY pr.full_name;
$$;

-- 3) Minimização de superfície: só authenticated executa (nunca anon).
REVOKE EXECUTE ON FUNCTION public.get_alunos_operacional(uuid, uuid) FROM anon;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 0. Pré-condição — profiles.codigo_itec existe (TEXT UNIQUE nullable, migração 030):
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='profiles' AND column_name='codigo_itec';
--    Esperado: 1 linha, data_type='text', is_nullable='YES'.
--
-- 1. A função agora retorna codigo_itec (9 colunas, na posição 4):
-- SELECT proname, pg_get_function_result(oid) AS retorno
-- FROM pg_proc WHERE proname='get_alunos_operacional';
--    Esperado: retorno contém 'codigo_itec text' após 'avatar_url text'.
--
-- 2. Só a versão 2-arg deve existir:
-- SELECT proname, pg_get_function_identity_arguments(oid) AS args
-- FROM pg_proc WHERE proname='get_alunos_operacional';
--    Esperado: 1 linha, args = 'p_disciplina_id uuid, p_turma_id uuid'.
--
-- 3. anon sem EXECUTE:
-- SELECT grantee, privilege_type FROM information_schema.routine_privileges
-- WHERE routine_name='get_alunos_operacional';
--    Esperado: sem linha para grantee='anon'.
--
-- 4. Comportamento (como professor da cadeira OU staff; exige matriculas_disciplina
--    + matriculas.turma_id populados) — o objeto agora inclui codigo_itec:
--    POST /rest/v1/rpc/get_alunos_operacional {"p_disciplina_id":"D"}
--    POST /rest/v1/rpc/get_alunos_operacional {"p_disciplina_id":"D","p_turma_id":"T1"}
--    Consumidores atuais (MeusAlunos/Frequência/VerTurma/getConsolidadoTurma) seguem
--    OK — acessam por nome de campo e ignoram a coluna nova.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (se necessário — volta à 058, SEM codigo_itec)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.get_alunos_operacional(uuid, uuid);
-- CREATE OR REPLACE FUNCTION public.get_alunos_operacional(
--   p_disciplina_id uuid,
--   p_turma_id uuid DEFAULT NULL
-- )
-- RETURNS TABLE(aluno_id uuid, full_name text, avatar_url text, matricula_id uuid,
--               nota numeric, faltas integer, frequencia_percentual numeric,
--               status_disciplina text)
-- LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
--   SELECT pr.id, pr.full_name, pr.avatar_url, md.matricula_id,
--          md.nota, md.faltas, md.frequencia_percentual, md.status
--   FROM matriculas_disciplina md
--   JOIN matriculas m  ON m.id = md.matricula_id
--   JOIN profiles   pr ON pr.id = m.aluno_id
--   WHERE md.disciplina_id = p_disciplina_id
--     AND (p_turma_id IS NULL OR m.turma_id = p_turma_id)
--     AND ( professor_leciona_disciplina(p_disciplina_id)
--           OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
--                      AND p.role IN ('admin','superadmin','administracao')) )
--   ORDER BY pr.full_name;
-- $$;
-- REVOKE EXECUTE ON FUNCTION public.get_alunos_operacional(uuid, uuid) FROM anon;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
-- ⚠️ Rollback só é seguro DEPOIS de reverter o código do R02 que passa a ler
--    codigo_itec do roster (senão o R02 mostra Cód. vazio).
