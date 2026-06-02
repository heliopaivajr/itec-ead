# ADR-007 — Calendário Acadêmico: Estrutura Híbrida
# Architecture Decision Record

```
Data:   2026-06-02
Status: Aprovado
Autor:  Agente 01 — Architect + Agente 19 — Product Analyst
```

---

## 📌 Contexto

O ITEC opera com grade horária fixa por semestre (ex: toda terça e quinta, 19h-22h) mas precisa registrar feriados, eventos institucionais, aulas de reposição e cancelamentos. A Camila (secretaria) precisa de um calendário editável que reflita a realidade operacional do instituto.

Três abordagens foram consideradas:
- **A) Datas específicas:** uma linha por aula, muito trabalho de cadastro
- **B) Recorrência pura:** não trata exceções (feriados, cancelamentos)
- **C) Híbrido:** recorrência base + exceções por data ← escolhida

O Hélio fornecerá os dias e matérias reais após a estrutura estar pronta.

---

## 🔍 Opções Consideradas

### Opção A: Agenda dinâmica com datas específicas
Cada aula = um registro com data, horário, professor, disciplina, turma.

**Prós:** Máxima flexibilidade, fácil de editar individualmente
**Contras:** Inserir 40 aulas/semestre manualmente é inviável. Para um semestre de 20 semanas com 3 turmas = ~240 registros manuais.

**Complexidade:** BAIXA para ler, ALTA para cadastrar

### Opção B: Recorrência pura
Uma linha por "padrão semanal". Sistema gera datas automaticamente.

**Prós:** Cadastro rápido (1 linha = semestre inteiro)
**Contras:** Não trata feriados, cancelamentos ou reposições sem lógica adicional complexa.

**Complexidade:** MÉDIA

### Opção C: Híbrido — recorrência base + exceções ← ESCOLHIDA
Tabela de recorrências para a grade semanal + tabela de eventos para exceções e datas especiais.

**Prós:** Cadastro eficiente (grade semanal em segundos) + flexibilidade para exceções
**Contras:** Duas tabelas para gerenciar (mas a lógica de combinação é simples)

**Complexidade:** MÉDIA

---

## ✅ Decisão

**Escolha: Opção C — Estrutura Híbrida**

**Justificativa:** Para o ITEC com 3 turmas e grade horária estável, a recorrência semanal reflete a realidade do instituto. Exceções (feriados, eventos, reposições) são relativamente raras e devem sobrescrever a recorrência de forma explícita.

---

## 🗄️ Estrutura do Banco (a implementar no Sprint L)

### Tabela: `aulas_recorrentes`
Grade fixa semanal — o "esqueleto" do calendário.
Cada registro = uma aula que acontece toda semana no mesmo dia e horário.

```sql
CREATE TABLE public.aulas_recorrentes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id   UUID        NOT NULL REFERENCES public.disciplinas_v2(id) ON DELETE CASCADE,
  turma_id        UUID        NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  professor_id    UUID        REFERENCES public.professores(id) ON DELETE SET NULL,
  dia_semana      INTEGER     NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  -- 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
  horario_inicio  TIME        NOT NULL,
  horario_fim     TIME        NOT NULL,
  data_inicio     DATE        NOT NULL,  -- início do semestre
  data_fim        DATE        NOT NULL,  -- fim do semestre
  sala            TEXT,
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aulas_rec_turma      ON public.aulas_recorrentes(turma_id);
CREATE INDEX idx_aulas_rec_disciplina ON public.aulas_recorrentes(disciplina_id);
CREATE INDEX idx_aulas_rec_professor  ON public.aulas_recorrentes(professor_id);
CREATE INDEX idx_aulas_rec_dia        ON public.aulas_recorrentes(dia_semana);
```

### Tabela: `eventos_calendario`
Exceções e eventos específicos por data.
Pode cancelar uma aula recorrente ou adicionar evento especial.

```sql
CREATE TABLE public.eventos_calendario (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          TEXT        NOT NULL,
  descricao       TEXT,
  data            DATE        NOT NULL,
  tipo            TEXT        NOT NULL CHECK (tipo IN (
    'feriado_nacional',
    'feriado_estadual',
    'feriado_institucional',
    'evento_itec',
    'reposicao',
    'recesso',
    'cancelamento_aula',
    'avaliacao',
    'formatura'
  )),
  -- Escopo: null = afeta todo o ITEC, preenchido = afeta só essa turma/disciplina
  turma_id        UUID        REFERENCES public.turmas(id) ON DELETE CASCADE,
  disciplina_id   UUID        REFERENCES public.disciplinas_v2(id) ON DELETE CASCADE,
  professor_id    UUID        REFERENCES public.professores(id) ON DELETE SET NULL,
  cancelar_aula   BOOLEAN     NOT NULL DEFAULT false,
  -- Para eventos com horário específico (padrão: dia inteiro)
  dia_inteiro     BOOLEAN     NOT NULL DEFAULT true,
  horario_inicio  TIME,
  horario_fim     TIME,
  -- Para visualização no calendário
  cor             TEXT        DEFAULT '#3B82F6',
  created_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_eventos_data          ON public.eventos_calendario(data);
CREATE INDEX idx_eventos_tipo          ON public.eventos_calendario(tipo);
CREATE INDEX idx_eventos_turma         ON public.eventos_calendario(turma_id);
CREATE INDEX idx_eventos_disciplina    ON public.eventos_calendario(disciplina_id);
```

---

## ⚙️ Como o Calendário Funciona

### Cadastro (secretaria)
1. No início do semestre, secretaria cadastra a **grade semanal** em `aulas_recorrentes`:
   - "Toda terça e quinta, 19h-22h, Turma TEO-2026-1, Disciplina X, Prof. Y"
2. Ao longo do semestre, cadastra **exceções** em `eventos_calendario`:
   - "15/08/2026 — Feriado Nacional — cancelar_aula = true"
   - "22/08/2026 — Aula de Reposição — turma TEO-2026-1"

### Geração das datas (frontend/service)
O calendário visual combina as duas tabelas:
```typescript
// Pseudocódigo do service
function getCalendarioMes(ano, mes, turmaId?) {
  const recorrencias = getAulasRecorrentes(turmaId)    // grade semanal
  const eventos = getEventosMes(ano, mes, turmaId)      // exceções do mês
  const diasDoMes = gerarDiasMes(ano, mes)              // array de datas

  return diasDoMes.map(data => ({
    data,
    aulas: recorrencias
      .filter(r => r.dia_semana === data.getDay() && dataInRange(data, r))
      .filter(r => !eventos.some(e => e.data === data && e.cancelar_aula)),
    eventos: eventos.filter(e => e.data === data),
  }))
}
```

---

## 🔐 Permissões

| Role | `aulas_recorrentes` | `eventos_calendario` |
|------|---------------------|----------------------|
| secretaria / admin / superadmin | CRUD | CRUD |
| professor | SELECT (próprias) | SELECT |
| aluno | SELECT (turma dele) | SELECT |

RLS a implementar junto com migration 028 (Sprint L).

---

## 🔗 Integrações Futuras

- **`frequencia.tsx`** — pode usar `aulas_recorrentes` para gerar linhas de presença automaticamente (não mais digitação livre de datas)
- **Declaração de matrícula** — pode incluir grade horária extraída de `aulas_recorrentes`
- **Certificado** — pode referenciar data de conclusão calculada com base no calendário

---

## 📊 Consequências

### Positivas
- Cadastro eficiente: 1 linha = semestre inteiro de aulas
- Flexibilidade para exceções sem recriar a grade
- Aluno e professor veem o mesmo calendário consolidado
- Feriados nacionais podem ser pré-cadastrados uma vez por ano

### Negativas (trade-offs)
- Lógica de combinação no service (recorrências + exceções) precisa de cobertura de testes
- Mudança de professor durante o semestre requer cuidado (atualizar `aulas_recorrentes` ou criar evento?)

### Riscos e Mitigações
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Grade mal cadastrada no início do semestre | Alto | Validação ao salvar + visualização prévia antes de confirmar |
| Feriado não cadastrado = aula no feriado | Médio | Pré-popular feriados nacionais de 2026 na migration |
| Data_fim da recorrência incorreta | Médio | Campo obrigatório com sugestão automática (+6 meses) |

---

## 🔄 Contexto de Revisão

Esta decisão deve ser revisada quando:
- O ITEC passar para aulas online com grade dinâmica por semana
- Houver necessidade de grade individualizada por aluno
- Integração com Google Calendar ou plataforma externa for solicitada

---

## 📚 Referências

- ADR-006 — RLS em profiles (base para permissões do calendário)
- Sprint N — implementação da UI do calendário
- ROADMAP-SPRINTS.md — contexto estratégico

---
*ADR-007 — ITEC-EAD · Hélio Paiva Jr. · 2026-06-02*
