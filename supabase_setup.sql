-- 1. Criação da tabela de perfis (profiles) que armazena a role e dados extras do usuário
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('aluno', 'professor', 'admin')) DEFAULT 'aluno',
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Perfis são visíveis por todos os usuários autenticados." ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar o próprio perfil." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Trigger para criar o perfil automaticamente quando um usuário se cadastrar no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno') -- por padrão, se torna aluno
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
