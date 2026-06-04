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

## Sprint M — Histórico + Turmas + Declaração ✅ CONCLUÍDO 2026-06-03
**Obrigatório para agosto · Core operacional da secretaria**

### Itens
- [x] Histórico acadêmico completo na `FichaAluno.tsx`
  - Notas N1/N2/Rec por disciplina
  - Frequência % por disciplina
  - Status: aprovado_direto / recuperacao / reprovado_nota / reprovado_falta / em_andamento / pendente
- [x] Rendimento médio por módulo e geral
- [x] Alerta de aluno em risco no dashboard da secretaria (frequência < 75%)
- [x] Gestão de turmas: painel "Alunos Matriculados" com lista
- [x] Lista imprimível de alunos por turma (print window)
- [x] Ficha do professor: disciplinas ativas (contratos `assinado`)
- [x] Fluxo de aprovação de matrícula: pendente → ativa (Camila aprova)
- [x] **DECLARAÇÃO DE MATRÍCULA PDF** — `@react-pdf/renderer` ✅

### Entregáveis técnicos
- 5 funções backend novas + testes (241/241 ✅)
- 6 features frontend (6 commits feat)
- 1 fix de bug (frequência padrão)
- 1 migration RLS (031) — policies migradas para user_roles
- Score pós-sprint: **9.3/10** (era 9.2)
- Branch: `sprint-m-historico-turmas` → mergeado em `main`

### O que a Camila pode usar após Sprint M ✅
- Ver histórico completo do aluno na ficha (notas, faltas, aprovação)
- Identificar alunos em risco sem cálculo manual
- Ver lista de alunos por turma e imprimir
- Imprimir declaração de matrícula na hora para o aluno
- Aprovar matrículas pendentes
- Ver disciplinas ativas do professor

---

## Sprint N — Calendário Acadêmico UI ✅ CONCLUÍDO 2026-06-04
**Calendário editável completo — UI sobre o banco criado no Sprint L**

### Itens
- [x] Calendário mensal/semanal visual editável (`@schedule-x/react` v4.6)
- [x] Filtro por turma (dropdown), filtro automático por professor
- [x] Criação/edição/exclusão de evento pela secretaria/admin (`EventoModal.tsx`)
- [x] Visão somente leitura do professor (auto-filtrado por professorId)
- [x] Aluno vê calendário em somente leitura (sem botões de edição)
- [x] Feriados nacionais + estaduais PE 2026 pré-cadastrados (migration 032 seed)
- [x] Impressão do calendário mensal (window.open com tabela HTML)
- [x] Botão "Adicionar ao Google Calendar" por evento (link TEMPLATE, sem OAuth)
- [x] Dados de teste: 14 aulas recorrentes reais (TEO-2025-1 e TEO-2026-1)

### Entregáveis técnicos
- `calendario.service.ts` — 6 funções + `expandirAulasParaPeriodo` (pura)
- `CalendarioAcademico.tsx` — view principal com toggle mês/semana
- `EventoModal.tsx` — CRUD com cores, turma, horários, Google Calendar link
- 22 testes novos (263/263 ✅), incluindo 11 testes de função pura
- Lib instalada: `@schedule-x/react` 4.1 + `@schedule-x/calendar` 4.6 + `@schedule-x/theme-default` 4.6
- Decisão: Google Calendar sincronização automática → V2 pós-agosto (ROADMAP-FUTURO.md)
- Score pós-sprint: **9.3/10** (mantido)
- Branch: `sprint-n-calendario-ui` → mergeado em `main`

### O que a Camila pode usar após Sprint N ✅
- Ver e editar o calendário completo do ITEC
- Cadastrar feriados, aulas de reposição e eventos
- Professor vê o próprio calendário de aulas
- Imprimir o calendário mensal
- Adicionar qualquer evento ao Google Calendar pessoal com 1 clique

### Referência de design
- ADR-007: `.ai-system/adr/ADR-007-calendario-academico.md`

### ⚠️ Decisões pendentes ANTES de iniciar — JÁ RESOLVIDAS
- Biblioteca de calendário: `@schedule-x/react` ✅ (aprovado Hélio 2026-06-03)
- Feriados: seed aplicado no banco ✅ (migration 032)

1. **Decisão técnica de UI** — biblioteca de calendário ou CSS Grid puro?
   - CLAUDE.md exige aviso obrigatório ao Hélio antes de qualquer biblioteca de calendário
   - Sem essa decisão, o Agente 06 não pode começar a implementação
   - Opções: FullCalendar (pago), React Big Calendar (MIT), ou CSS Grid customizado

2. **Fonte dos feriados nacionais** — tarefa nova para o Agente 04
   - A migration 029 criou a tabela mas não tem seed de feriados
   - Adicionar task: "seed SQL com 12 feriados nacionais 2026 em `eventos_calendario`"

3. **Verificar RLS do aluno na tabela `eventos_calendario`**
   - O aluno precisa ver eventos da própria turma (somente leitura)
   - Agente 07 deve confirmar que a policy atual permite isso sem N+1

---

## Sprint RLS — Correções Críticas de Segurança
**Semana 3/8 · Obrigatório antes de alunos reais em produção**

### ⚠️ Riscos identificados pelo agente-Osabio — 2026-06-04

**Tarefa 0 (antes de qualquer código) — Verificação obrigatória:**
```powershell
# Mapear todos os from('profiles') fora de services
Get-ChildItem -Recurse -Include *.ts,*.tsx src |
  Select-String "from\('profiles'\)"
# Resultado esperado: APENAS arquivos em src/services/
```

**Tarefa 1 — ERR-RISK-001: corrigir upsert silencioso em usuarios.service.ts:186**
```typescript
// ANTES (risco): erro descartado
await supabase.from('user_roles').upsert({ user_id: userId, role });

// DEPOIS (correto):
const { error: upsertErr } = await supabase.from('user_roles').upsert({ user_id: userId, role });
if (upsertErr) console.error('[user_roles sync] falhou:', upsertErr.message);
```

**Tarefa 2 — Atualizar seed_testes.sql: inserir user_roles para todos os usuários**
O seed cria 15 usuários mas não insere em `user_roles`. Com RLS ativo em `profiles`,
todos os usuários de teste perderão acesso silenciosamente.
Adicionar INSERT em `user_roles` para os 15 usuários ao final do seed.

**Tarefa 3 — Criar conta de secretaria de teste**
O seed não tem conta `administracao`. O Hélio não consegue testar features de staff.
SQL fornecido pelo agente-Osabio — aguardando aprovação para incluir no seed.

**Tarefa 4 — Ativar RLS em profiles via ADR-006**
SQL completo em: `.ai-system/adr/ADR-006-user-roles-cache-anti-recursao-rls.md`
Pré-requisitos: Tarefas 0, 1, 2 concluídas + backfill user_roles = 0 usuários faltando.

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
