# ADR-005 — Sistema de Certificados

**Status:** PROPOSTA
**Data:** 2026-05-28
**Autor:** Hélio Paiva Jr.

## Contexto

Alunos que concluem o curso precisam
de certificado formal do ITEC.

## Regras de negócio

Critérios para emissão:
1. Frequência ≥ 75% em TODAS as disciplinas
2. Todas as disciplinas com status 'aprovado'
3. Sem mensalidades em aberto
4. Aprovado pela secretaria

## Schema proposto

```sql
CREATE TABLE certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES profiles(id),
  matricula_id UUID REFERENCES matriculas(id),
  numero_registro VARCHAR(20) UNIQUE NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_conclusao DATE NOT NULL,
  carga_horaria INTEGER DEFAULT 185,
  emitido_por UUID REFERENCES profiles(id),
  codigo_verificacao VARCHAR(50) UNIQUE NOT NULL,
  status TEXT DEFAULT 'ativo'
    CHECK (status IN ('ativo','revogado')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

## Número de registro

Formato: ITEC-[ANO]-[SEQUENCIAL]
Exemplo: ITEC-2026-0001

## Verificação pública

Rota pública (sem auth):
GET /verificar/[codigo_verificacao]
→ Retorna: nome, curso, data, status

## Tecnologia
@react-pdf/renderer — já instalado
Mesmo padrão do ContratoForm.tsx
