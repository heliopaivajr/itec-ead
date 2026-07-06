BEGIN;

-- ========== MATRICULAS ==========
-- 1) número da matrícula (nullable; populado no R2)
ALTER TABLE matriculas ADD COLUMN IF NOT EXISTS numero_matricula TEXT;
-- unicidade só quando preenchido (permite NULLs nas 31 atuais)
CREATE UNIQUE INDEX IF NOT EXISTS uq_matriculas_numero
  ON matriculas (numero_matricula) WHERE numero_matricula IS NOT NULL;

-- 2) funil de status — ADITIVO (mantém os 7 atuais + 5 novos)
ALTER TABLE matriculas DROP CONSTRAINT IF EXISTS matriculas_status_check;
ALTER TABLE matriculas ADD CONSTRAINT matriculas_status_check CHECK (status IN (
  'pendente','ativa','inativa','trancada','evadida','concluida','suspensa',
  'pre_matricula','aguardando_documentos','aguardando_pagamento','aguardando_aprovacao','cancelada'
));

-- 3) gerador de numero_matricula à prova de corrida (ITEC + AA + T + NNN)
CREATE OR REPLACE FUNCTION gerar_numero_matricula(p_ano INT DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_ano INT := COALESCE(p_ano, EXTRACT(YEAR FROM now())::INT);
  v_ano2 TEXT := lpad((v_ano % 100)::TEXT, 2, '0');
  v_prefixo TEXT;
  v_seq INT;
BEGIN
  v_prefixo := 'ITEC' || v_ano2 || 'T';
  -- trava nomeada pelo prefixo (mesmo ano) evita corrida sem FOR UPDATE
  PERFORM pg_advisory_xact_lock(hashtext(v_prefixo));
  SELECT COALESCE(MAX(substring(numero_matricula FROM 'ITEC\d\dT(\d+)$')::INT), 0) + 1
    INTO v_seq
  FROM matriculas
  WHERE numero_matricula LIKE v_prefixo || '%';
  RETURN v_prefixo || lpad(v_seq::TEXT, 3, '0');
END $$;

-- ========== MATRICULAS_DISCIPLINA ==========
-- 4) frequência retroativa (consolidada 2025) + observação
ALTER TABLE matriculas_disciplina ADD COLUMN IF NOT EXISTS faltas INT;
ALTER TABLE matriculas_disciplina ADD COLUMN IF NOT EXISTS frequencia_percentual NUMERIC(5,2);
ALTER TABLE matriculas_disciplina ADD COLUMN IF NOT EXISTS observacao TEXT;

-- 5) convalidação (Plano §4.3)
ALTER TABLE matriculas_disciplina ADD COLUMN IF NOT EXISTS convalidacao_instituicao TEXT;
ALTER TABLE matriculas_disciplina ADD COLUMN IF NOT EXISTS convalidacao_ch_origem INT;
ALTER TABLE matriculas_disciplina ADD COLUMN IF NOT EXISTS convalidacao_bate_ch BOOLEAN;
ALTER TABLE matriculas_disciplina ADD COLUMN IF NOT EXISTS convalidacao_justificativa TEXT;
ALTER TABLE matriculas_disciplina ADD COLUMN IF NOT EXISTS convalidacao_doc_url TEXT;

COMMIT;
NOTIFY pgrst, 'reload schema';
