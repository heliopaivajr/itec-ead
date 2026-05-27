-- Migration: 20260526_016_trigger_role_definitivo.sql
-- Substitui a migration 015 com uma versão mais robusta.
--
-- Problema com ON CONFLICT: se a constraint não é exatamente (id),
-- ou se a tabela profiles tem constraints diferentes, o ON CONFLICT
-- pode falhar silenciosamente e fazer um INSERT normal, resetando o role.
--
-- Solução: IF/ELSE explícito — lê o role atual antes de qualquer operação.
-- Se perfil existe → UPDATE apenas email/nome/avatar, NUNCA toca role.
-- Se perfil não existe → INSERT com role='pendente'.
--
-- Comportamento garantido:
--   Usuário novo     → role = 'pendente'
--   Usuário existente → role preservado (superadmin continua superadmin)

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
      email      = NEW.email,
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
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      'pendente'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recriar o trigger para garantir que está apontando para a função atualizada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── Verificação após aplicar ────────────────────────────────
-- Execute no SQL Editor para confirmar que role está preservado:
--
-- SELECT email, role FROM public.profiles
-- WHERE email = 'heliopaiva@gmail.com';
-- → Esperado: superadmin
--
-- Se retornar 'pendente', restaurar com:
-- UPDATE public.profiles
-- SET role = 'superadmin'
-- WHERE email = 'heliopaiva@gmail.com';
