-- Migration: 20260706_054_sec01_revoke_user_roles.sql
-- SEC-01 (auditoria 2026-07-05, report-B) — fechar escalação de privilégio na VIEW user_roles
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001)
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- user_roles é uma VIEW (032): SELECT id AS user_id, role FROM profiles.
-- Com os grants default do Supabase, anon/authenticated herdam INSERT/UPDATE/
-- DELETE na view. Como a view é auto-atualizável e executa como o DONO
-- (postgres, que bypassa o RLS de profiles), um aluno autenticado poderia:
--   PATCH /rest/v1/user_roles?user_id=eq.<seu-id>  {"role":"superadmin"}
-- ...e escrever em profiles.role CONTORNANDO as policies P5/P6 da 033.
--
-- ─── POR QUE NÃO security_invoker = true ─────────────────────────────────────
-- ⚠️ A proposta original incluía recriar a view com security_invoker=true.
-- EXCLUÍDO desta migração: com invoker, a view passa a ler profiles sob o RLS
-- de quem consulta; a policy profiles_select_staff (033/P2) consulta user_roles,
-- que leria profiles, que reavalia P2 → RECURSÃO INFINITA (42P17) em toda query
-- autenticada. É exatamente o problema que a 032 resolveu ao criar a view como
-- DEFINER ("SEM RLS — evita recursão infinita", ADR-006 / ERR-SUPABASE-003).
-- A escalação fecha só com os REVOKEs: sem privilégio de escrita, o UPDATE
-- morre ANTES de alcançar a view (42501), independente da semântica DEFINER.
--
-- ─── ESCRITORES VERIFICADOS (nenhum funcionalmente afetado) ──────────────────
-- Nenhuma policy/trigger/função SQL escreve na view. No app, 3 upserts
-- redundantes (o efeito real é sempre o UPDATE prévio em profiles) que JÁ
-- falham hoje (view sem PK → 42P10) com erro engolido/logado:
--   - src/services/matriculas.service.ts:187 (aplicarAcesso)
--   - src/services/usuarios.service.ts:206 (updateRole)
--   - supabase/functions/criar-aluno/index.ts:158 (service_role — fora do REVOKE)
-- Pós-REVOKE mudam de 42P10 para 42501, igualmente engolidos. Remoção dessas
-- linhas mortas: PR de código à parte (SEC-02 do report-B).
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1) Remover TODA escrita de anon e authenticated (a view é só leitura p/ policies)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.user_roles FROM authenticated;

-- 2) anon não deve ler roles; authenticated MANTÉM SELECT — as policies fazem
--    EXISTS (SELECT 1 FROM user_roles ...) com os privilégios de quem consulta
--    (revogar SELECT de authenticated quebraria todas essas policies).
REVOKE SELECT ON public.user_roles FROM anon;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Grants restantes — esperado: authenticated apenas SELECT; anon nada;
--    postgres/service_role inalterados:
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants
-- WHERE table_schema='public' AND table_name='user_roles' ORDER BY grantee;
--
-- 2. Teste empírico da escalação (como aluno de teste, via API):
--    PATCH /rest/v1/user_roles?user_id=eq.<id-do-aluno>  {"role":"admin"}
--    Esperado: 42501 / permission denied (antes do fix: risco de 204).
--
-- 3. Smoke test do app (garante que as policies seguem funcionando):
--    login como aluno → dashboard carrega; login como administracao →
--    /dashboard/matriculas lista e aprova normalmente.
--
-- ROLLBACK (se necessário):
-- GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
-- GRANT SELECT ON public.user_roles TO anon;
