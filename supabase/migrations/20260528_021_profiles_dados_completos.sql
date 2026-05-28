-- Migration 021: dados completos do aluno em profiles
-- Adiciona campos pessoais, endereço, ministério e observações

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf               VARCHAR(14),
  ADD COLUMN IF NOT EXISTS rg                VARCHAR(20),
  ADD COLUMN IF NOT EXISTS data_nascimento   DATE,
  ADD COLUMN IF NOT EXISTS sexo              VARCHAR(10) CHECK (sexo IN ('masculino', 'feminino', 'outro')),
  ADD COLUMN IF NOT EXISTS endereco          TEXT,
  ADD COLUMN IF NOT EXISTS numero            VARCHAR(10),
  ADD COLUMN IF NOT EXISTS complemento       VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bairro            VARCHAR(100),
  ADD COLUMN IF NOT EXISTS cidade            VARCHAR(100),
  ADD COLUMN IF NOT EXISTS estado            VARCHAR(2),
  ADD COLUMN IF NOT EXISTS cep               VARCHAR(9),
  ADD COLUMN IF NOT EXISTS igreja_local      VARCHAR(200),
  ADD COLUMN IF NOT EXISTS observacoes_internas TEXT;

COMMENT ON COLUMN public.profiles.cpf                IS 'CPF do aluno (somente leitura após cadastro)';
COMMENT ON COLUMN public.profiles.rg                 IS 'RG do aluno (somente leitura após cadastro)';
COMMENT ON COLUMN public.profiles.data_nascimento    IS 'Data de nascimento';
COMMENT ON COLUMN public.profiles.sexo               IS 'Sexo: masculino, feminino ou outro';
COMMENT ON COLUMN public.profiles.endereco           IS 'Logradouro (rua, av.)';
COMMENT ON COLUMN public.profiles.numero             IS 'Número do endereço';
COMMENT ON COLUMN public.profiles.complemento        IS 'Apto, bloco, etc.';
COMMENT ON COLUMN public.profiles.bairro             IS 'Bairro';
COMMENT ON COLUMN public.profiles.cidade             IS 'Cidade';
COMMENT ON COLUMN public.profiles.estado             IS 'UF (2 letras)';
COMMENT ON COLUMN public.profiles.cep                IS 'CEP (00000-000)';
COMMENT ON COLUMN public.profiles.igreja_local       IS 'Igreja que o aluno frequenta';
COMMENT ON COLUMN public.profiles.observacoes_internas IS 'Notas internas (visível apenas para secretaria/admin)';
