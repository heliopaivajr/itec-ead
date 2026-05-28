# ADR-004 — Estratégia de Vídeos EAD

**Status:** PROPOSTA
**Data:** 2026-05-28
**Autor:** Hélio Paiva Jr.

## Contexto

O ITEC tem aulas complementares EAD
conforme o manual institucional.
Precisamos de uma estratégia de vídeos
que seja simples, barata e escalável.

## Decisão

Adotar estratégia em 3 fases:

### Fase 1 — YouTube não listado (atual)
- Custo: $0
- Professor sobe no YouTube
- Link salvo na tabela materiais
- Aluno assiste via iframe

### Fase 2 — Cloudflare Stream (150+ alunos)
- Custo: $5/1000 minutos armazenados
- Upload direto no sistema
- Player com identidade ITEC

### Fase 3 — Mux (300+ alunos)
- Custo: $0.015/min armazenado
- Rastreamento completo de visualização
- Analytics para secretaria

## Schema para Fase 1

```sql
-- Adicionar campo video_url na tabela materiais
ALTER TABLE materiais
ADD COLUMN IF NOT EXISTS video_url TEXT;
ADD COLUMN IF NOT EXISTS video_tipo TEXT
  DEFAULT 'youtube'
  CHECK (video_tipo IN ('youtube','cloudflare','mux'));
ADD COLUMN IF NOT EXISTS video_duracao_min INTEGER;
```

## Impacto no código
- Sprint K implementa player no dashboard aluno
- MeusCursos.tsx adiciona tab Vídeos
- Marcar como assistido conta para progresso
