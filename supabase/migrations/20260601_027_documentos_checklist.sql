-- Migration: 20260601_027_documentos_checklist.sql
-- Amplia o CHECK constraint de documentos_aluno.status para suportar
-- o checklist visual do Sprint K (secretaria marca documentos recebidos)
--
-- ANTES: ('pendente','validado','rejeitado')
-- DEPOIS: ('pendente','validado','rejeitado','recebido','ausente')
--
-- 'recebido' → documento entregue fisicamente pela secretaria
-- 'ausente'  → aluno declarou não possuir o documento

-- Remover o constraint antigo pelo nome gerado pelo Postgres
-- (o nome é derivado da tabela e coluna — padrão: documentos_aluno_status_check)
ALTER TABLE public.documentos_aluno
  DROP CONSTRAINT IF EXISTS documentos_aluno_status_check;

-- Recriar com os 5 valores
ALTER TABLE public.documentos_aluno
  ADD CONSTRAINT documentos_aluno_status_check
  CHECK (status IN ('pendente', 'validado', 'rejeitado', 'recebido', 'ausente'));

COMMENT ON COLUMN public.documentos_aluno.status
  IS 'Status do documento: pendente=aguardando, validado=aceito, rejeitado=recusado, recebido=entregue fisicamente, ausente=aluno não possui';
