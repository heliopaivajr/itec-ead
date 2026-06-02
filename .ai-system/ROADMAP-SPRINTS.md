# Roadmap de Sprints — ITEC-EAD
Data: 2026-06-02
Aprovado por: Hélio Paiva Jr.
Status: Em execução

---

## Visão Geral

| Sprint | Nome | Foco | Obrigatório Agosto? |
|--------|------|------|---------------------|
| **L** | Infraestrutura Crítica | RLS + Edge Function + Foto + DB Calendário | 🔴 Sim |
| **M** | Histórico + Turmas + Declaração | Core operacional secretaria | 🔴 Sim |
| **N** | Calendário Acadêmico UI | Calendário editável completo | 🟡 Básico |
| **O** | Certificados | Por módulo e final | 🟢 Setembro |
| **P** | Impressões Completas | Todos os PDFs | 🟡 Parcial |

---

## Sprint L — Infraestrutura Crítica
**Obrigatório para agosto · Pré-requisito para todos os outros sprints**

### Itens
- [ ] RLS em `profiles` (ADR-006 aprovado — migration 028)
- [ ] Edge Function `criar-aluno` (completa o `NovoAlunoModal`)
- [ ] Upload de foto do aluno (bucket `avatars` existente)
- [ ] Corrigir ERR-RISK-001 (`user_roles.upsert` sem tratamento de erro)
- [ ] Status professor expandido: `ativo | aguardando | afastado | reativado | excluído` (migration + UI)
- [ ] Migrations do calendário: `aulas_recorrentes` + `eventos_calendario` (só banco — UI no Sprint M)
- [ ] Limpeza ERR-DEBT-001 (código morto em `Alunos.tsx`)

### O que a Camila pode usar após Sprint L
- Criar aluno diretamente (sem depender de signup do aluno)
- Aluno com foto na ficha
- Segurança real no banco (RLS)
- Professor com controle de status mais granular

### Referências
- ADR-006: `.ai-system/adr/ADR-006-user-roles-cache-anti-recursao-rls.md`
- ADR-007: `.ai-system/adr/ADR-007-calendario-academico.md`
- TODO-SPRINT-L-001: upload de documentos
- TODO-SPRINT-L-002: RLS em profiles

---

## Sprint M — Histórico + Turmas + Declaração
**Obrigatório para agosto · Core operacional da secretaria**

### Itens
- [ ] Histórico acadêmico completo na `FichaAluno.tsx`
  - Notas N1/N2/Rec por disciplina
  - Frequência % por disciplina
  - Status: aprovado / recuperação / reprovado nota / reprovado falta / em andamento
- [ ] Rendimento médio por módulo e geral
- [ ] Alerta de aluno em risco no dashboard da secretaria (frequência < 75%)
- [ ] Gestão de turmas: aba "Alunos Matriculados" com lista
- [ ] Lista imprimível de alunos por turma
- [ ] Ficha do professor: disciplinas ativas (contratos `assinado`)
- [ ] Fluxo de aprovação de matrícula: pendente → ativa (Camila aprova)
- [ ] **DECLARAÇÃO DE MATRÍCULA PDF** ← prioritário (mais solicitado)

### Dependências
- Sprint L deve estar concluído (RLS ativo, Edge Function disponível)
- Services `notas.service.ts` e `frequencia.service.ts` já existem ✅
- `calcularResultado()` e `calcularStatus()` já existem ✅

### O que a Camila pode usar após Sprint M
- Ver histórico completo do aluno na ficha (notas, faltas, aprovação)
- Identificar alunos em risco sem cálculo manual
- Ver lista de alunos por turma e imprimir
- Imprimir declaração de matrícula na hora para o aluno
- Aprovar matrículas pendentes
- Ver disciplinas ativas do professor

---

## Sprint N — Calendário Acadêmico UI
**Calendário editável completo — UI sobre o banco criado no Sprint L**

### Itens
- [ ] Calendário mensal/semanal visual editável
- [ ] Filtro por turma, disciplina, professor
- [ ] Criação/edição de evento pela secretaria/admin
- [ ] Visão somente leitura do professor (seu próprio calendário)
- [ ] Aluno vê calendário da sua turma (somente leitura)
- [ ] Feriados nacionais pré-cadastrados (2026)
- [ ] Impressão do calendário mensal
- [ ] Hélio fornecerá dias e matérias reais para popular após entrega

### Dependências
- Migrations de Sprint L (`aulas_recorrentes` + `eventos_calendario`)
- Sprint M NÃO é pré-requisito — pode rodar em paralelo

### O que a Camila pode usar após Sprint N
- Ver e editar o calendário completo do ITEC
- Cadastrar feriados, aulas de reposição e eventos
- Professor vê o próprio calendário de aulas
- Imprimir o calendário mensal

### Referência de design
- ADR-007: `.ai-system/adr/ADR-007-calendario-academico.md`

---

## Sprint O — Certificados
**Geração de certificados por módulo e final**

### Itens
- [ ] Migration: tabela `certificados` (aluno_id, modulo_id, tipo, codigo_validacao, emitido_por, emitido_em)
- [ ] Lógica de elegibilidade: `checkModuloConcluido(alunoId, moduloId)`
  - Todas as disciplinas do módulo com status `aprovado_direto` ou passou na recuperação
  - Frequência ≥ 75% em todas
- [ ] `CertificadoPDF.tsx` com `@react-pdf/renderer` (já instalado)
- [ ] Botão "Emitir Certificado de Módulo" na ficha do aluno (secretaria confirma)
- [ ] Rota pública `/verificar/:codigo` (validação externa)
- [ ] Botão "Emitir Certificado Final" (secretaria/admin — todos os módulos concluídos)
- [ ] Dashboard do aluno: "Meus Certificados" (lista + download)

### Dependências
- **Sprint M deve estar concluído** — histórico acadêmico completo é pré-requisito
- `@react-pdf/renderer` já instalado ✅
- `calcularStatus()` já existe ✅

### Regra de negócio aprovada
- Certificado de módulo: secretaria emite após verificação dos critérios
- Certificado final: secretaria/admin emite manualmente
- Código de validação: UUID curto público para `/verificar/:codigo`

### O que a Camila pode usar após Sprint O
- Emitir certificados de módulo para alunos que concluíram
- Aluno baixa o próprio certificado no dashboard
- Certificados verificáveis publicamente

---

## Sprint P — Impressões Completas
**Todos os PDFs pendentes**

### Itens
- [ ] Boletim de Notas PDF (depende de Sprint M)
- [ ] Situação Financeira PDF (depende de Sprint M)
- [ ] Histórico Acadêmico PDF completo (depende de Sprint M)
- [ ] Relatório Final do Aluno PDF (depende de Sprint O)
- [ ] Relatório de turma (secretaria) — depende de Sprint M
- [ ] Ficha do professor impressa

### Dependências
- Sprint M (histórico, turmas) — obrigatório
- Sprint O (certificados) — para Relatório Final

### O que a Camila pode usar após Sprint P
- Imprimir qualquer documento quando aluno vem à secretaria
- Exportar relatórios para a diretoria

---

## Decisões de Produto Registradas

| Decisão | Onde está documentado |
|---------|----------------------|
| Upload docs adiado para Sprint L | DECISAO-PRODUTO-001 em lessons-learned.md |
| RLS adiado para Sprint L | TODO-SPRINT-L-002 em known-errors.md |
| Calendário: estrutura híbrida | ADR-007 |
| Certificado: secretaria confirma | Este documento |
| Média: N1+N2 simples, recuperação substitui menor | notas.service.ts |
| Foto: bucket `avatars` existente | Sprint L |

---

## Regra de Qualidade (obrigatória em todo sprint)

```
SPEC (19) → PLANO (20) → IMPL (04/05/06) →
TESTES (10) → REVIEW (12) → SEGURANÇA (11) →
AUDITORIA (14) → DOCS (18) → DEPLOY (09)
```

`pnpm test:run` deve passar 100% antes de qualquer commit.

---
*Roadmap ITEC-EAD · Aprovado 2026-06-02 · Hélio Paiva Jr.*
