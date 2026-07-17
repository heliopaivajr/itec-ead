-- Migration: 20260716_064_roster_turma_id.sql
-- Roster ganha turma_id — solução DEFINITIVA do A2 ("Sem turma vinculada" nas Notas)
-- Origem: SDD A2 (fix/a2-turma-notas) + confirmação por SQL de que a fonte 1 falha.
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- O botão "Lançar Notas" exige turma_id (rota professor/notas/:turmaId/:disciplinaId).
-- A resolução da turma no app (getTurmasByDisciplina, PR fix/a2-turma-notas) usa:
--   Fonte 1: aulas_recorrentes → CONFIRMADO POR SQL: Apologética tem count=0
--            (grade não cadastrada) → fonte vazia.
--   Fonte 2 (fallback): matriculas_disciplina → matriculas → a RLS BLOQUEIA para
--            o professor (ele não tem NENHUMA policy de SELECT em matriculas).
-- → Para o professor, ambas as fontes falham → botão continua desabilitado.
--
-- SOLUÇÃO DEFINITIVA: expor turma_id no roster get_alunos_operacional — função
-- SECURITY DEFINER (bypassa RLS) que o professor JÁ usa com sucesso (Meus Alunos,
-- Frequência, VerTurma, Notas/consolidado, R02). A turma passa a vir da MESMA
-- fonte confiável e gated (professor_leciona_disciplina OR staff), sem depender
-- de grade cadastrada nem de policy de matriculas.
--
-- Espelha 058/060: Postgres NÃO permite CREATE OR REPLACE mudando as colunas do
-- RETURNS TABLE → DROP FUNCTION + CREATE, reaplicando o REVOKE anon.
-- turma_id entra APÓS matricula_id (par natural: a matrícula e a turma dela).
--
-- ─── ADITIVO — NÃO QUEBRA CONSUMIDORES ───────────────────────────────────────
-- Todos os consumidores chamam via supabase.rpc(...) e mapeiam por NOME de campo
-- (interface AlunoOperacional) — o PostgREST devolve objetos JSON chaveados por
-- nome, não posicionais; coluna extra é ignorada por quem não a usa:
--   • MeusAlunos.tsx / LancarFrequencia.tsx / VerTurma.tsx → getAlunosOperacional()
--   • getConsolidadoTurma (notas.service) → getAlunosOperacional(disc, turma)
--   • getListaPresencaRelatorio R02 (relatorios.service) → idem
-- Código TS (interface + consumo do turma_id no useProfessorDisciplinas) vem em
-- passo de CÓDIGO à parte — nada quebra enquanto isso.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1) Remove a versão atual (2-arg da 060) — necessário para mudar o RETURNS.
DROP FUNCTION IF EXISTS public.get_alunos_operacional(uuid, uuid);

-- 2) Recria idêntica à 060, adicionando turma_id (após matricula_id).
CREATE OR REPLACE FUNCTION public.get_alunos_operacional(
  p_disciplina_id uuid,
  p_turma_id uuid DEFAULT NULL
)
RETURNS TABLE(
  aluno_id uuid,
  full_name text,
  avatar_url text,
  codigo_itec text,
  matricula_id uuid,
  turma_id uuid,                    -- NOVO (064): turma da matrícula — habilita Notas
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
    m.turma_id,
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
-- 1. A função agora retorna turma_id (10 colunas):
-- SELECT proname, pg_get_function_result(oid) AS retorno
-- FROM pg_proc WHERE proname='get_alunos_operacional';
--    Esperado: retorno contém 'turma_id uuid' após 'matricula_id uuid'.
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
-- 4. CASO A2 (o teste que motivou): roster de Apologética traz a turma —
-- SELECT aluno_id, full_name, turma_id
-- FROM get_alunos_operacional('e030e960-f24f-40e9-be32-9a465c518769');
--    Esperado: 1 linha (João) com turma_id = 953b4ee8-9b33-4603-8290-dad1623db649
--    ("2ª Turma Teologia — 2026"). Como professor da cadeira (via app), idem.
--
-- 5. Consumidores atuais (MeusAlunos/Frequência/VerTurma/Consolidado/R02) seguem
--    OK — acesso por nome de campo; a coluna nova é ignorada até o código usá-la.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (volta à 060 — SEM turma_id)
-- ═════════════════════════════════════════════════════════════════════════════
-- ⚠️ Só é seguro DEPOIS de reverter o código que consumir turma_id do roster
--    (senão Notas volta a "sem turma"). Rodar INTEIRO (LICAO-041):
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.get_alunos_operacional(uuid, uuid);
-- CREATE OR REPLACE FUNCTION public.get_alunos_operacional(
--   p_disciplina_id uuid,
--   p_turma_id uuid DEFAULT NULL
-- )
-- RETURNS TABLE(aluno_id uuid, full_name text, avatar_url text, codigo_itec text,
--               matricula_id uuid, nota numeric, faltas integer,
--               frequencia_percentual numeric, status_disciplina text)
-- LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
--   SELECT pr.id, pr.full_name, pr.avatar_url, pr.codigo_itec, md.matricula_id,
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
