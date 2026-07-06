-- Migration manual: 039_fix_handle_new_user_email_coalesce.sql
-- Correção: ERR-AUTH-001 — NEW.email nulo no AFTER INSERT do signup (admin.createUser)
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ver ERR-INFRA-001)
-- Data: 2026-06-17
--
-- ─── CAUSA ──────────────────────────────────────────────────────────────────
-- No fluxo auth.admin.createUser (GoTrue), a coluna auth.users.email não está
-- preenchida no instante em que o trigger AFTER INSERT on_auth_user_created
-- dispara — questão de timing/versão do GoTrue. Resultado: NEW.email = NULL.
-- O trigger handle_new_user faz INSERT em public.profiles usando NEW.email, e
-- como profiles.email é NOT NULL, estoura:
--   "null value in column email of relation profiles violates not-null" (23502)
-- O erro ocorre DENTRO do trigger e aborta a criação do usuário, surgindo como
-- o genérico "Database error creating new user" (HTTP 500) no createUser.
-- Os 9 usuários antigos vieram por outro caminho (email síncrono), por isso só
-- o caminho da Edge Function criar-aluno expõe o bug.
--
-- ─── CORREÇÃO ───────────────────────────────────────────────────────────────
-- Desacopla o trigger de NEW.email: usa o email do user_metadata como fallback
-- (a Edge Function passa a enviar email também em user_metadata — PASSO 1).
--   NEW.email  →  COALESCE(NEW.email, NEW.raw_user_meta_data->>'email')
--
-- ⚠️ NÃO afrouxa nada e NÃO altera a lógica:
--   - Mantém IF existing_role (UPDATE) / ELSE (INSERT com role='pendente').
--   - Mantém SECURITY DEFINER e search_path = public.
--   - role continua NUNCA sendo alterado para perfis existentes.
--   - Para signups que JÁ trazem NEW.email (caminho normal), o COALESCE devolve
--     exatamente NEW.email — comportamento inalterado.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_role TEXT;
BEGIN
  -- Verificar se o perfil já existe no banco
  SELECT role INTO existing_role
  FROM public.profiles
  WHERE id = NEW.id;

  IF existing_role IS NOT NULL THEN
    -- Perfil já existe — atualizar apenas dados de apresentação.
    -- O campo role NUNCA é modificado aqui.
    UPDATE public.profiles
    SET
      email      = COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', email),
      full_name  = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url)
    WHERE id = NEW.id;
  ELSE
    -- Perfil novo — criar com role='pendente'.
    -- A secretaria precisa aprovar o acesso manualmente.
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      avatar_url,
      role
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),  -- ← fallback p/ timing GoTrue
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      'pendente'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recriar o trigger para garantir que aponta para a função atualizada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Confirmar o corpo atualizado:
-- SELECT pg_get_functiondef('public.handle_new_user'::regproc);
--    Esperado: INSERT com COALESCE(NEW.email, NEW.raw_user_meta_data->>'email')
--
-- 2. Teste real (após redeploy da Edge Function — PASSO 1):
--    node --env-file=.env --experimental-strip-types scripts/importar-alunos.ts --executar --limite=1
--    Esperado: 201 + codigo_itec (sem 23502 / "Database error creating new user").
