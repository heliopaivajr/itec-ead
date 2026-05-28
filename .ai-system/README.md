# .ai-system — Sistema de Agentes IA · ITEC-EAD
**Hélio Paiva Jr. · ObraIA · Paulista/PE · 2025**

---

## O Que É Esta Pasta

Esta pasta contém o sistema completo de agentes IA para o desenvolvimento do ITEC-EAD.
Cada agente é um especialista com papel, regras e restrições definidas em seu arquivo `SKILL.md`.

**Regra fundamental:** Nenhum código antes de spec aprovada. Nenhum agente técnico ativado sem plano.

---

## Os 20 Agentes — Referência Rápida

### Estratégicos (NOVOS)

| # | Agente | Função | Quando Usar |
|---|--------|--------|-------------|
| **19** | product-analyst | Analista de Produto / Negócio ITEC | O que falta? Fluxo correto? Requisitos funcionais |
| **20** | project-manager | Gestor de Projeto / Coordenador | Como executar? Qual ordem? Quais agentes? |

### Arquitetura

| # | Agente | Função | Quando Usar |
|---|--------|--------|-------------|
| 01 | architect | Arquiteto de Software | Início do projeto, decisões estruturais, ADRs |
| 02 | domain-designer | Domain Designer DDD | Criar entidades, value objects, eventos |
| 03 | api-designer | Designer de API REST | Projetar endpoints antes de implementar |
| 04 | db-architect | Arquiteto de Banco | Schema, migrations, RLS, índices |

### Desenvolvimento

| # | Agente | Função | Quando Usar |
|---|--------|--------|-------------|
| 05 | backend-engineer | Engenheiro Backend | Use cases, services, integrações |
| 06 | frontend-engineer | Engenheiro Frontend | Componentes React, pages, hooks |
| 07 | auth-specialist | Especialista Auth | Login, roles, permissões, middleware |
| 08 | billing-engineer | Engenheiro Billing | Mensalidades, pagamentos, webhooks |
| 09 | infra-engineer | Engenheiro de Infra | Deploy, CI/CD, variáveis de ambiente |

### Qualidade

| # | Agente | Função | Quando Usar |
|---|--------|--------|-------------|
| 10 | test-engineer | Engenheiro de Testes | Unit, integration e E2E tests |
| 11 | security-auditor | Auditor de Segurança | Auth, RLS, secrets, OWASP |
| 12 | code-reviewer | Revisor de Código | Review estruturado com score de qualidade |
| 13 | performance-eng | Engenheiro Performance | N+1, queries lentas, bundle pesado |

### Auditoria

| # | Agente | Função | Quando Usar |
|---|--------|--------|-------------|
| **14** ⭐ | auditor | Auditor de Codebase | **PRIMEIRO em projeto existente** |
| 15 | debt-analyst | Analista Débito Técnico | Mapear e priorizar problemas acumulados |
| 16 | migration-planner | Planejador Migração | Mudanças arquiteturais seguras |
| 17 | lgpd-auditor | Auditor LGPD | PII, consentimento, direitos dos alunos |

### Produto

| # | Agente | Função | Quando Usar |
|---|--------|--------|-------------|
| 18 | doc-writer | Engenheiro Documentação | README, API docs, runbooks |

---

## Comandos de Ativação Rápida

```bash
# Analisar se a plataforma está completa (NOVO)
Ative .ai-system/agents/19-product-analyst/SKILL.md

# Organizar execução de uma demanda (NOVO)
Ative .ai-system/agents/20-project-manager/SKILL.md

# Auditar o projeto
Ative .ai-system/agents/14-auditor/SKILL.md e execute o protocolo completo

# Nova feature
Abra .ai-system/templates/sdd-new-feature.md e siga o protocolo SDD

# Revisar código
Ative .ai-system/agents/12-code-reviewer/SKILL.md e revise [arquivo/PR]

# Verificar segurança
Ative .ai-system/agents/11-security-auditor/SKILL.md e execute o checklist

# Planejar migração
Ative .ai-system/agents/16-migration-planner/SKILL.md para [contexto]

# Verificar LGPD
Ative .ai-system/agents/17-lgpd-auditor/SKILL.md e execute o PII map

# Documentar
Ative .ai-system/agents/18-doc-writer/SKILL.md e documente [o quê]
```

---

## Fluxo Padrão de Trabalho

```
Nova demanda do Hélio
    ↓
[20] Gestor classifica e monta Plano de Execução
    ↓
[19] Analista de Produto analisa o negócio (se funcional/mista)
    ↓
Hélio aprova o plano
    ↓
Agentes técnicos executam (ordem definida pelo Agente 20)
    ↓
[10] Testes → [12] Code Review → [11] Segurança
    ↓
[19] Valida coerência com o negócio
    ↓
[18] Documenta → [09] Deploy
    ↓
Entrega concluída
```

---

## Estrutura da Pasta

```
.ai-system/
├── CLAUDE.md              ← Regras globais (lido automaticamente)
├── SYSTEM.md              ← DNA do produto ITEC-EAD
├── STACK.md               ← Stack técnica com versões
├── ARCHITECTURE.md        ← Decisões arquiteturais do projeto
├── README.md              ← Este arquivo
│
├── agents/
│   ├── 01-architect/SKILL.md
│   ├── 02-domain-designer/SKILL.md
│   ├── 03-api-designer/SKILL.md
│   ├── 04-db-architect/SKILL.md
│   ├── 05-backend-engineer/SKILL.md
│   ├── 06-frontend-engineer/SKILL.md
│   ├── 07-auth-specialist/SKILL.md
│   ├── 08-billing-engineer/SKILL.md
│   ├── 09-infra-engineer/SKILL.md
│   ├── 10-test-engineer/SKILL.md
│   ├── 11-security-auditor/SKILL.md
│   ├── 12-code-reviewer/SKILL.md
│   ├── 13-performance-eng/SKILL.md
│   ├── 14-auditor/SKILL.md          ← usar primeiro em projeto existente
│   ├── 15-debt-analyst/SKILL.md
│   ├── 16-migration-planner/SKILL.md
│   ├── 17-lgpd-auditor/SKILL.md
│   ├── 18-doc-writer/SKILL.md
│   ├── 19-product-analyst/SKILL.md  ← NOVO — análise de negócio
│   └── 20-project-manager/SKILL.md  ← NOVO — coordenação de execução
│
├── templates/
│   ├── sdd-new-feature.md
│   ├── sdd-bug-fix.md
│   ├── sdd-refactor.md
│   ├── adr-template.md
│   └── audit-report.md
│
├── specs/         ← specs aprovadas por feature
├── adr/           ← Architecture Decision Records
├── audit/         ← relatórios de auditoria
└── runbooks/      ← deploy, rollback, incidentes
```

---

*ITEC-EAD · Sistema de Agentes IA · v2.0 com Agentes Estratégicos · 2025*
