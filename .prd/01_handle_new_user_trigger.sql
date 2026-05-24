-- Função que será executada toda vez que um novo usuário se cadastrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    nome, -- ou full_name, dependendo de como está na sua tabela profiles
    role
  )
  values (
    new.id,
    new.email,
    -- Tenta pegar o nome vindo do Google OAuth, se não tiver, deixa nulo/vazio
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), 
    'pendente' -- Regra de negócio: todo novo usuário entra na sala de espera
  );
  return new;
end;
$$ language plpgsql security definer;

-- Criação da Trigger na tabela auth.users do Supabase
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
