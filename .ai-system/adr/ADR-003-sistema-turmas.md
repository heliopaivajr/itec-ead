# ADR-003 — Sistema de Turmas ITEC-EAD

**Status:** PROPOSTA
**Data:** 2026-05-27
**Autor:** Hélio Paiva Jr. + Agente 01

## Contexto

O ITEC tem múltiplas turmas simultâneas.
Alunos de turmas diferentes podem cursar
a mesma disciplina.

## Turmas atuais

| Código | Início | Status | Módulo atual |
|--------|--------|--------|--------------|
| TEO-2025-1 | Fev/2025 | Ativa | Módulo 2 |
| TEO-2026-1 | Jan/2026 | Ativa | Módulo 1 |
| TEO-2026-2 | Ago/2026 | Planejada | — |

## Decisões

1. Criar tabela `turmas` com código único
2. Adicionar `turma_id` em `matriculas`
3. Aluno pode ter disciplinas de turmas
   diferentes (flexibilidade)
4. Disciplina pode ter alunos de turmas
   diferentes simultaneamente
5. Aluno que reprovou pode cursar
   a disciplina em turma posterior
   sem nova taxa de matrícula

## Schema proposto

```sql
CREATE TABLE turmas (
  id UUID PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  curso_id UUID REFERENCES cursos(id),
  nome VARCHAR(100) NOT NULL,
  ano INTEGER NOT NULL,
  semestre INTEGER CHECK (semestre IN (1,2)),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status VARCHAR(20) DEFAULT 'ativa',
  vagas_total INTEGER DEFAULT 30
);

ALTER TABLE matriculas
ADD COLUMN turma_id UUID REFERENCES turmas(id);
```

## Pendente para Sprint I
- Criar migration 018 com tabela turmas
- Migration 019: turma_id em matriculas
- Seed das 2 turmas em andamento
- Gestão de turmas no dashboard
