-- Migration: 20260719_067_financeiro_acesso.sql
-- Acesso granular do role 'financeiro' (Breno) — LEITURA do acadêmico, sem poder de escrita.
-- Origem: diagnóstico "destravar o role financeiro" (2026-07-19) + fronteira do Hélio.
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- O role 'financeiro' perdeu acesso quando as policies de profiles/matriculas
-- evoluíram para is_staff() (administracao/admin/superadmin — SEM financeiro):
--   • profiles  → Breno não lê nem o NOME dos alunos (R04/R05/inadimplentes sem nomes)
--   • matriculas → gerarMensalidadesMes retorna "0 geradas"; isenções do R04 sem dado
--   • matriculas_disciplina → sem contagem de disciplinas (modelo de preços)
--
-- DECISÃO (validada no diagnóstico): NÃO adicionar 'financeiro' ao is_staff() —
-- a função guarda ESCRITAS sensíveis (profiles_update_staff permite mudar ROLE →
-- escalação parcial; matriculas insert/update = aprovar matrícula, função da
-- secretaria). Estratégia ADITIVA: função is_financeiro() + policies de SELECT
-- específicas, SEM tocar em NENHUMA policy existente.
--
-- FRONTEIRA (Hélio):
--   VÊ (SELECT): matriculas · matriculas_disciplina · profiles(alunos) ·
--                turmas ✓(já authenticated-read, 018) · cursos/modulos/
--                disciplinas_v2 ✓(leitura pública, 008) · mensalidades/taxa ✓(037)
--   EDITA: só o financeiro — mensalidades/taxa_matricula S/I/U já dados pela 037
--          (DELETE segue admin/superadmin — inalterado). Override de valor virá
--          na frente de preços com policy própria.
--   NÃO FAZ: aprovar matrícula, notas_aluno, frequencia, avaliacoes, materiais —
--          NENHUMA policy de escrita é criada aqui; as existentes não o incluem.
--
-- ─── ABORDAGEM ───────────────────────────────────────────────────────────────
-- Função is_financeiro() espelhando a família existente (is_staff/is_superadmin:
-- SECURITY DEFINER lendo profiles — sem recursão, ERR-SUPABASE-003) + 3 policies
-- aditivas de SELECT. Policies permissivas somam por OR — zero DROP, zero risco
-- às existentes (padrão da 063).
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Função is_financeiro() — família de is_staff()/is_superadmin()
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_financeiro()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'financeiro'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_financeiro() FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Policies ADITIVAS de SELECT (nenhuma existente é tocada)
-- ─────────────────────────────────────────────────────────────────────────────

-- Nomes/dados dos alunos: R04/R05/inadimplentes/listas voltam a mostrar nomes.
DROP POLICY IF EXISTS "profiles_select_financeiro" ON public.profiles;
CREATE POLICY "profiles_select_financeiro" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_financeiro());

-- Matrículas em LEITURA: geração de mensalidades, isenções (tipo_financiamento/
-- percentual_desconto da 036), funil. SEM insert/update (aprovação = secretaria).
DROP POLICY IF EXISTS "matriculas_select_financeiro" ON public.matriculas;
CREATE POLICY "matriculas_select_financeiro" ON public.matriculas
  FOR SELECT TO authenticated
  USING (public.is_financeiro());

-- Disciplinas por matrícula em LEITURA: contagem p/ o modelo de preços (1-4).
DROP POLICY IF EXISTS "mat_disc_select_financeiro" ON public.matriculas_disciplina;
CREATE POLICY "mat_disc_select_financeiro" ON public.matriculas_disciplina
  FOR SELECT TO authenticated
  USING (public.is_financeiro());

-- Tabelas financeiras (mensalidades/taxa_matricula): NADA a fazer — a 037 já dá
-- SELECT/INSERT/UPDATE ao financeiro; DELETE segue admin/superadmin (correto).
-- Leads: FORA por decisão (não é função financeira).

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Função criada + policies novas (3):
-- SELECT proname FROM pg_proc WHERE proname='is_financeiro';
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE policyname LIKE '%financeiro%' ORDER BY tablename;
--    Esperado: profiles_select_financeiro · matriculas_select_financeiro ·
--              mat_disc_select_financeiro (todas SELECT) + as 2 da 037 em
--              mensalidades/taxa intactas.
--
-- 2. Testes por papel — logado como financeiro@itecedu.com (Breno):
--    a) Tela Financeiro → inadimplentes COM NOMES ✓ (antes: vazio/ID)
--    b) Gerar mensalidades do mês → "N geradas" com N>0 ✓ (antes: 0)
--    c) R04 Situação Financeira → nomes + isenções ✓
--    d) Registrar pagamento de mensalidade → ✓ (037, já funcionava)
--    e) NEGATIVOS: UPDATE em matriculas (aprovar) → negado ✓ ·
--       INSERT em notas_aluno/frequencia/avaliacoes → negado ✓ ·
--       UPDATE em profiles de terceiro → negado ✓ (update_staff é is_staff)
--
-- 3. Aluno/professor NÃO ganharam nada (is_financeiro() = false p/ eles).
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041; Breno volta ao estado travado)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP POLICY IF EXISTS "profiles_select_financeiro"   ON public.profiles;
-- DROP POLICY IF EXISTS "matriculas_select_financeiro" ON public.matriculas;
-- DROP POLICY IF EXISTS "mat_disc_select_financeiro"   ON public.matriculas_disciplina;
-- DROP FUNCTION IF EXISTS public.is_financeiro();
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
