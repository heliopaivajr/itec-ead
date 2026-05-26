-- Migration: 20260526_015_fix_trigger_role.sql
-- Problema: o trigger handle_new_user usava INSERT simples,
--   que sobrescrevia o role ao fazer login com Google OAuth.
--   Cada login Google disparava o trigger e resetava role para 'pendente'.
--
-- Correção: INSERT ... ON CONFLICT (id) DO UPDATE
--   atualiza apenas dados de perfil (email, full_name, avatar_url)
--   e NUNCA atualiza o campo role.
--
-- Comportamento após esta migration:
--   - Novo usuário    → cria perfil com role='pendente' ✅
--   - Usuário existente logando novamente → preserva role existente ✅
--   - superadmin logando com Google       → continua superadmin ✅

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email      = EXCLUDED.email,
      full_name  = COALESCE(EXCLUDED.full_name,  profiles.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
      -- role NÃO é atualizado — preserva o role já definido manualmente
  RETURN NEW;
END;
$$;

-- Garante que o trigger está ativo na tabela correta
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verificação: role do superadmin não deve ser sobrescrito
-- Rodar após aplicar para confirmar:
-- SELECT email, role FROM public.profiles
-- WHERE email = 'heliopaiva@gmail.com';
-- Esperado: role = 'superadmin'
