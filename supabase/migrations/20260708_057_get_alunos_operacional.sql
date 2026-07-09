-- Migration: 20260708_057_get_alunos_operacional.sql
-- Roster do professor + LGPD-01 fase 1 — função get_alunos_operacional(disciplina_id)
-- Origem: diagnósticos "LGPD-01" e "Telas operacionais do professor" (IDEAS-BACKLOG 2.05).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- Retorna os alunos MATRICULADOS de uma disciplina com SÓ campos operacionais
-- (full_name + avatar_url — SEM email por minimização LGPD; SEM cpf/rg/endereco/
-- data_nascimento/sexo) + o snapshot acadêmico da matrícula (nota/faltas/freq/status).
-- Alicerce de: tela "Meus Alunos", semear roster em Frequência/Notas (hoje as telas
-- montam a lista a partir de registros já existentes → turma nova abre VAZIA), e
-- LGPD-01 fase 1 (professor obtém nomes sem ler profiles direto → fase 2 remove
-- 'professor' de profiles_select_staff).
--
-- GATE (a função é SECURITY DEFINER → bypassa o RLS de profiles; o gate DEVE estar
-- no corpo): retorna linhas só se o solicitante for professor DA cadeira
-- (professor_leciona_disciplina da 056, contrato ativo) OU staff
-- (admin/superadmin/administracao). Qualquer outro → 0 linhas.
--
-- ─── VALIDAÇÃO CONTRA O SCHEMA REAL (nenhum ajuste de tipo foi necessário) ────
-- matriculas_disciplina (010 + 051): nota DECIMAL(4,2)→numeric · faltas INT→integer ·
--   frequencia_percentual NUMERIC(5,2)→numeric · status VARCHAR(20)→text (coerção ok).
--   SEM coluna de soft-delete (não há ativo/deleted_at) → nada a filtrar.
--   matricula_id UUID → matriculas.id (a MATRÍCULA/enrollment, não matriculas_disciplina.id).
-- matriculas.aluno_id UUID → profiles.id (RLS 002). profiles.full_name / avatar_url (TEXT, 017).
-- professor_leciona_disciplina(uuid) RETURNS boolean — existe (056), SECURITY DEFINER.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.get_alunos_operacional(p_disciplina_id uuid)
RETURNS TABLE(
  aluno_id uuid,
  full_name text,
  avatar_url text,
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
    md.matricula_id,
    md.nota,
    md.faltas,
    md.frequencia_percentual,
    md.status AS status_disciplina
  FROM matriculas_disciplina md
  JOIN matriculas m   ON m.id = md.matricula_id
  JOIN profiles   pr  ON pr.id = m.aluno_id
  WHERE md.disciplina_id = p_disciplina_id
    AND (
      professor_leciona_disciplina(p_disciplina_id)
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
                 AND p.role IN ('admin','superadmin','administracao'))
    )
  ORDER BY pr.full_name;
$$;

-- Minimização de superfície: só authenticated executa (nunca anon).
REVOKE EXECUTE ON FUNCTION public.get_alunos_operacional(uuid) FROM anon;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Função criada (SECURITY DEFINER, search_path):
-- SELECT proname, prosecdef, proconfig FROM pg_proc WHERE proname = 'get_alunos_operacional';
--    Esperado: prosecdef = true; proconfig = {search_path=public}.
--
-- 2. Grants (anon NÃO deve ter EXECUTE):
-- SELECT grantee, privilege_type FROM information_schema.routine_privileges
-- WHERE routine_name = 'get_alunos_operacional';
--
-- 3. Testes por papel (exigem contrato ativo do professor + matriculas_disciplina
--    na disciplina D — hoje 0 linhas por F1/F2, então testar após o retroativo):
--    a) professor COM contrato ativo em D → SELECT * FROM get_alunos_operacional('D-uuid')
--       retorna os alunos matriculados (nome/foto + nota/faltas/freq/status).
--    b) professor de OUTRA cadeira (sem contrato em D) → retorna 0 linhas.
--    c) staff (admin/superadmin/administracao) → retorna os alunos de qualquer D.
--    d) aluno/pendente → retorna 0 linhas.
--    (Via API: POST /rest/v1/rpc/get_alunos_operacional  { "p_disciplina_id": "..." })
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (se necessário)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.get_alunos_operacional(uuid);
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
