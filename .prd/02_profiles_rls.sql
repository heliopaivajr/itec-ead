-- 1. Habilita o RLS na tabela
alter table public.profiles enable row level security;

-- 2. Função Helper para verificar se o usuário logado é Staff (Secretaria/Admin)
-- Usamos "security definer" para que a função possa ler a tabela ignorando o RLS,
-- evitando assim o erro de recursão infinita (infinite loop).
create or replace function public.is_staff()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('administracao', 'admin', 'superadmin')
  );
end;
$$ language plpgsql security definer;

-- Função Helper para verificar se é SuperAdmin
create or replace function public.is_superadmin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  );
end;
$$ language plpgsql security definer;

-- 3. POLÍTICAS DE RLS (SELECT)

-- Qualquer usuário autenticado pode ler SEU PRÓPRIO perfil
create policy "Usuários podem ver seu próprio perfil"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Staff (Secretaria, Admin, SuperAdmin) pode ler TODOS os perfis
create policy "Staff pode ver todos os perfis"
  on public.profiles
  for select
  using (public.is_staff());

-- 4. POLÍTICAS DE RLS (UPDATE)

-- Usuários comuns podem atualizar seus próprios dados (ex: telefone, nome)
create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Staff pode atualizar qualquer perfil (ex: aprovar cadastro, alterar notas)
create policy "Staff pode atualizar qualquer perfil"
  on public.profiles
  for update
  using (public.is_staff());

-- 5. POLÍTICAS DE RLS (DELETE)
-- Apenas SuperAdmin pode deletar contas (Direito ao Esquecimento - LGPD)
create policy "Apenas superadmin pode deletar perfis"
  on public.profiles
  for delete
  using (public.is_superadmin());

-- 6. PROTEÇÃO CONTRA ESCALONAMENTO DE PRIVILÉGIOS (Hackers)
-- Impede que um usuário "pendente" ou "aluno" mude sua própria role via API para "superadmin"
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  if new.role is distinct from old.role then
    if not public.is_staff() then
      new.role = old.role; -- Reverte silenciosamente a tentativa de fraude
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists ensure_profile_role_protection on public.profiles;
create trigger ensure_profile_role_protection
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();