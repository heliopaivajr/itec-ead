# .ai-system — Sistema de Agentes IA · ITEC-EAD
**Hélio Paiva Jr. · ObraIA · Paulista/PE · 2025**  
**Versão:** 3.0 — Com agente-Osabio (Supervisor de Evolução)

---

## O Que É Esta Pasta

Sistema completo de agentes IA para o desenvolvimento do ITEC-EAD.
Cada agente é um especialista com papel, regras e restrições definidas em seu `SKILL.md` ou arquivo `.md`.

**Regra fundamental:** Nenhum código antes de spec aprovada. Nenhum agente técnico ativado sem plano. Nenhuma evolução de agente sem controle.

---

## A Hierarquia do Sistema

```
HÉLIO
  └── Visão, decisão final, aprovação de mudanças críticas

AGENTE 20 — Gestor de Projeto
  └── Organiza execução, define ordem, aciona agentes

agente-Osabio — Mentor / Supervisor
  └── Melhora os agentes, registra erros, eleva maturidade

AGENTE 19 — Analista de Produto
  └── Entende o negócio, define requisitos funcionais

AGENTES 01–18 — Técnicos
  └── Implementam com precisão e dentro do escopo
```

---

## Os 21 Agentes — Referência Rápida

### Camada de Supervisão e Estratégia

| Agente | Nome | Função | Quando Usar |
|--------|------|--------|-------------|
| **Osabio** | agente-Osabio | Mentor · Supervisor de Evolução | Auditar agentes, registrar erros, propor melhorias, elevar maturidade |
| **20** | project-manager | Gestor de Projeto / Coordenador | Como executar? Qual ordem? Quais agentes? |
| **19** | product-analyst | Analista de Produto / Negócio | O que falta? Fluxo correto? Requisitos funcionais |

### Arquitetura

| # | Agente | Função | Quando Usar |
|---|--------|--------|-------------|
| 01 | architect | Arquiteto de Software | Decisões estruturais, ADRs |
| 02 | domain-designer | Domain Designer DDD | Entidades, value objects, eventos |
| 03 | api-designer | Designer de API REST | Contratos de endpoint |
| 04 | db-architect | Arquiteto de Banco | Schema, migrations, RLS |

### Desenvolvimento

| # | Agente | Função | Quando Usar |
|---|--------|--------|-------------|
| 05 | backend-engineer | Engenheiro Backend | Services, use cases, integrações |
| 06 | frontend-engineer | Engenheiro Frontend | Componentes React, pages, hooks |
| 07 | auth-specialist | Especialista Auth | Login, roles, permissões |
| 08 | billing-engineer | Engenheiro Billing | Mensalidades, pagamentos |
| 09 | infra-engineer | Engenheiro de Infra | Deploy, CI/CD, env vars |

### Qualidade

| # | Agente | Função | Quando Usar |
|---|--------|--------|-------------|
| 10 | test-engineer | Engenheiro de Testes | Unit, integration, E2E |
| 11 | security-auditor | Auditor de Segurança | RLS, secrets, OWASP |
| 12 | code-reviewer | Revisor de Código | Review com score de qualidade |
| 13 | performance-eng | Engenheiro Performance | N+1, queries lentas, bundle |

### Auditoria

| # | Agente | Função | Quando Usar |
|---|--------|--------|-------------|
| **14** ⭐ | auditor | Auditor de Codebase | **PRIMEIRO em projeto existente** |
| 15 | debt-analyst | Analista Débito Técnico | Mapear problemas acumulados |
| 16 | migration-planner | Planejador Migração | Mudanças arquiteturais seguras |
| 17 | lgpd-auditor | Auditor LGPD | PII, consentimento, direitos |

### Produto

| # | Agente | Função | Quando Usar |
|---|--------|--------|-------------|
| 18 | doc-writer | Engenheiro Documentação | README, API docs, runbooks |

---

## Comandos de Ativação Rápida

```bash
# Auditar os agentes (estado de maturidade, falhas, melhorias)
Ative .ai-system/agents/core/agente-Osabio.md
Modo: Auditoria

# Registrar erro de um agente
Ative .ai-system/agents/core/agente-Osabio.md
Modo: Documentação
Registre o erro: [descrição do erro, agente envolvido]

# Propor melhoria em um agente
Ative .ai-system/agents/core/agente-Osabio.md
Modo: Proposta
Agente a melhorar: [qual agente]
Problema: [o que está errado]

# Analisar se a plataforma está completa
Ative .ai-system/agents/19-product-analyst/SKILL.md

# Organizar execução de uma demanda
Ative .ai-system/agents/20-project-manager/SKILL.md

# Auditar o projeto (código)
Ative .ai-system/agents/14-auditor/SKILL.md e execute o protocolo completo

# Nova feature
Abra .ai-system/templates/sdd-new-feature.md e siga o protocolo SDD
```

---

## Estrutura da Pasta

```
.ai-system/
├── CLAUDE.md
├── SYSTEM.md
├── STACK.md
├── ARCHITECTURE.md
├── README.md                              ← este arquivo
│
├── agents/
│   ├── core/
│   │   └── agente-Osabio.md              ← NOVO — mentor e supervisor
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
│   ├── 14-auditor/SKILL.md
│   ├── 15-debt-analyst/SKILL.md
│   ├── 16-migration-planner/SKILL.md
│   ├── 17-lgpd-auditor/SKILL.md
│   ├── 18-doc-writer/SKILL.md
│   ├── 19-product-analyst/SKILL.md
│   └── 20-project-manager/SKILL.md
│
├── memory/                                ← NOVO — memória técnica
│   ├── agent-maturity-map.md             ← nível de cada agente
│   ├── known-errors.md                   ← erros registrados
│   ├── lessons-learned.md                ← lições e histórico de melhorias
│   └── agent-feedback-log.md             ← feedbacks sobre os agentes
│
├── checklists/                            ← NOVO — qualidade
│   └── quality-checklists.md             ← checklist agente, prompt, skill, produto
│
├── docs/                                  ← NOVO — regras e fluxos
│   └── agent-safety-rules.md             ← regras de segurança + fluxos de orquestração
│
├── templates/
│   ├── sdd-new-feature.md
│   ├── sdd-bug-fix.md
│   ├── sdd-refactor.md
│   ├── adr-template.md
│   └── audit-report.md
│
├── specs/
├── adr/
├── audit/
└── runbooks/
```

---

*ITEC-EAD · Sistema de Agentes IA · v3.0 · 2025*
