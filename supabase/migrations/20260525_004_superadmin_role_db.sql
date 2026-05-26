-- Migration: garantir role superadmin no banco de dados
-- Motivo: remover VITE_SUPERADMIN_EMAIL do bundle JS (exposição de informação)
-- O override de role agora é resolvido no banco, não no cliente.

-- Atualiza o profile do superadmin para role='superadmin' caso ainda esteja com outro valor.
-- Usa auth.users para resolver o UUID a partir do email sem expor o email no código.
UPDATE public.profiles
SET    role = 'superadmin'
WHERE  id = (
  SELECT id FROM auth.users WHERE email = 'heliopaiva@gmail.com' LIMIT 1
)
AND    role <> 'superadmin';
