-- =====================================================
-- Migration 036: Campos de financiamento em matriculas
-- Data: 2026-06-08
-- Descrição: Adiciona tipo_financiamento, percentual_desconto
--            e observacao_financeira para gestão financeira
-- =====================================================

-- Adicionar colunas de financiamento
ALTER TABLE matriculas
  ADD COLUMN tipo_financiamento TEXT DEFAULT 'integral'
    CHECK (tipo_financiamento IN ('integral', 'bolsista', 'desconto_indicacao', 'desconto_familia')),
  ADD COLUMN percentual_desconto NUMERIC(5,2) DEFAULT 0
    CHECK (percentual_desconto >= 0 AND percentual_desconto <= 100),
  ADD COLUMN observacao_financeira TEXT;

-- Comentários
COMMENT ON COLUMN matriculas.tipo_financiamento IS 'Tipo de financiamento do aluno: integral (100%), bolsista, desconto por indicação ou desconto familiar';
COMMENT ON COLUMN matriculas.percentual_desconto IS 'Percentual de desconto aplicado (0-100%). Bolsistas têm 100%';
COMMENT ON COLUMN matriculas.observacao_financeira IS 'Observações sobre condições financeiras especiais';

-- Atualizar matrículas existentes (opcional - ajustar conforme necessidade)
-- UPDATE matriculas SET tipo_financiamento = 'integral', percentual_desconto = 0 WHERE tipo_financiamento IS NULL;
