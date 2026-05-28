# .ai-system — Sistema de Agentes IA para SaaS
# Hélio Paiva Jr. | ObraIA | obraIA.com.br

> Esta pasta é o cérebro do sistema de desenvolvimento com IA.
> Ela transforma o Claude de um assistente genérico em uma equipe técnica completa.
> **Não modifique os arquivos desta pasta sem entender o que cada um faz.**

---

## 📁 O Que Há Aqui

```
.ai-system/
│
├── CLAUDE.md          ← LIDO AUTOMATICAMENTE pelo Claude Code
│                        Contém as regras globais do projeto.
│                        PREENCHER: nome, stack, fase do projeto.
│
├── SYSTEM.md          ← DNA do produto
│                        Contexto, personas, regras de negócio, integrações.
│                        PREENCHER: tudo sobre o seu SaaS.
│
├── STACK.md           ← Stack técnica completa
│                        Frameworks, libs, versões, restrições.
│                        PREENCHER: tecnologias reais do projeto.
│
├── ARCHITECTURE.md    ← Decisões arquiteturais
│                        Diagramas, bounded contexts, fluxos.
│                        ATUALIZAR: a cada ADR aprovado.
│
├── agents/            ← 18 agentes especializados
│   ├── 01-architect/        SKILL.md — Arquiteto de Software
│   ├── 02-domain-designer/  SKILL.md — Designer de Domínio DDD
│   ├── 03-api-designer/     SKILL.md — Designer de API REST
│   ├── 04-db-architect/     SKILL.md — Arquiteto de Banco
│   ├── 05-backend-engineer/ SKILL.md — Engenheiro Backend
│   ├── 06-frontend-engineer/SKILL.md — Engenheiro Frontend
│   ├── 07-auth-specialist/  SKILL.md — Especialista Auth/IAM
│   ├── 08-billing-engineer/ SKILL.md — Engenheiro de Billing
│   ├── 09-infra-engineer/   SKILL.md — Engenheiro de Infra
│   ├── 10-test-engineer/    SKILL.md — Engenheiro de Testes
│   ├── 11-security-auditor/ SKILL.md — Auditor de Segurança
│   ├── 12-code-reviewer/    SKILL.md — Revisor de Código
│   ├── 13-performance-eng/  SKILL.md — Engenheiro de Performance
│   ├── 14-auditor/          SKILL.md — Auditor de Codebase ★ (primeiro a usar)
│   ├── 15-debt-analyst/     SKILL.md — Analista de Débito Técnico
│   ├── 16-migration-planner/SKILL.md — Planejador de Migração
│   ├── 17-lgpd-auditor/     SKILL.md — Auditor LGPD
│   └── 18-doc-writer/       SKILL.md — Engenheiro de Documentação
│
├── templates/         ← Templates SDD prontos para uso
│   ├── sdd-new-feature.md   Como especificar uma nova funcionalidade
│   ├── sdd-bug-fix.md       Como reportar e corrigir um bug
│   ├── sdd-refactor.md      Como planejar um refactoring
│   ├── adr-template.md      Como documentar uma decisão arquitetural
│   └── audit-report.md      Template de saída do Agente 14
│
├── specs/             ← Specs aprovadas (criadas automaticamente)
│   └── YYYY-MM-DD-[feature]/
│       ├── functional.md    Spec funcional
│       ├── technical.md     Spec técnica
│       └── acceptance.md    Critérios de aceite
│
├── adr/               ← Architecture Decision Records (criados pelo Agente 01)
│   └── ADR-001-[decisao].md
│
├── audit/             ← Relatórios de auditoria (criados pelo Agente 14)
│   └── YYYY-MM-DD-[tipo]/
│       ├── report.md
│       └── remediation-plan.md
│
└── runbooks/          ← Procedimentos operacionais
    ├── deploy.md        Como fazer deploy com segurança
    └── rollback.md      Como reverter um deploy problemático
```

---

## 🚀 Como Começar

### Em um Projeto Novo:

```
PASSO 1: Preencher CLAUDE.md (seção "Identidade do Projeto")
PASSO 2: Preencher SYSTEM.md completamente
PASSO 3: Preencher STACK.md com suas tecnologias
PASSO 4: Abrir Claude Code no diretório do projeto
PASSO 5: Primeira mensagem:
         "Leia .ai-system/CLAUDE.md e confirme que entendeu as regras"
PASSO 6: Segunda mensagem:
         "Ative .ai-system/agents/01-architect/SKILL.md e crie a ADR-001"
```

### Em um Projeto Existente:

```
PASSO 1: Preencher CLAUDE.md, SYSTEM.md e STACK.md
PASSO 2: Enviar ao Claude:
         "Ative .ai-system/agents/14-auditor/SKILL.md
          Execute o protocolo completo de auditoria de entrada.
          Salve o relatório em .ai-system/audit/[hoje]-entrada/report.md
          NÃO modifique nenhum arquivo até aprovação."
PASSO 3: Aguardar o relatório completo
PASSO 4: Aprovar o plano de remediação
PASSO 5: Executar remediações com specs individuais
```

---

## 💬 Comandos Rápidos de Ativação

```
# Auditar o projeto do zero:
"Ative .ai-system/agents/14-auditor/SKILL.md e execute protocolo completo"

# Nova feature:
"Abra .ai-system/templates/sdd-new-feature.md, preenchi com [contexto], execute SDD"

# Corrigir bug:
"Abra .ai-system/templates/sdd-bug-fix.md para o problema: [descrição]"

# Revisar código:
"Ative .ai-system/agents/12-code-reviewer/SKILL.md e revise [arquivo/pasta]"

# Verificar segurança:
"Ative .ai-system/agents/11-security-auditor/SKILL.md, execute checklist completo"

# Registrar decisão arquitetural:
"Ative .ai-system/agents/01-architect/SKILL.md, crie ADR-[NNN] sobre [decisão]"

# Verificar LGPD:
"Ative .ai-system/agents/17-lgpd-auditor/SKILL.md, execute protocolo de auditoria"

# Mapear débito técnico:
"Ative .ai-system/agents/15-debt-analyst/SKILL.md, produza mapa completo"
```

---

## ⭐ Agentes por Contexto

| Situação | Agentes a Ativar |
|----------|-----------------|
| Projeto novo | 01 → 02 → 04 → 07 → 05 → 06 → 08 → 10 → 18 |
| Projeto existente (primeiro contato) | **14** → 15 → 11 → 01 |
| Nova feature | 01 (spec) → 05/06 (impl) → 10 (testes) → 12 (review) |
| Bug crítico | 12 (diagnóstico) → 05 (correção) → 10 (teste) |
| Auditoria de segurança | 11 → 17 → 14 |
| Refactoring | 16 (plano) → 05 (execução) → 10 (testes) |
| Preparar para escalar | 14 → 13 → 04 → 01 |

---

*Sistema de Agentes IA para SaaS — Hélio Paiva Jr. — Itec 2026*
*obraIA.com.br | heliopaiva.com.br*
