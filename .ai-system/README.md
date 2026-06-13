# Kit de Agentes Portátil v2.0

Um sistema de **21 agentes de IA + memória + templates** para desenvolver
produtos digitais com engenharia de verdade — não "vibe coding". Portátil:
instale em qualquer projeto novo.

## O que é

Markdown puro, sem dependências externas. O Claude Code lê estes arquivos e
os segue. Inclui:

- **20 agentes especializados** (01–20) + o **agente-Osábio** (meta-agente)
- **Memória do kit** — lições e erros conhecidos universais, já embutidos
- **Templates de projeto** — CLAUDE / SYSTEM / STACK / ARCHITECTURE / README
- **Instalador guiado por entrevista** (15 perguntas → gera o PRD e a estrutura)

## Instalação

Veja **`INSTALL.md`**. Em resumo:

1. Copie a pasta `.ai-system/` para a raiz do projeto novo
2. Diga ao Claude Code: **"instale o kit"**
3. Responda à entrevista (15 perguntas, uma por vez)
4. Revise o `bootstrap.md` gerado, execute-o e rode `/init`

## Os 21 agentes

| Faixa | Agentes |
|-------|---------|
| Arquitetura | 01-architect · 02-domain-designer · 03-api-designer · 04-db-architect |
| Implementação | 05-backend · 06-frontend · 07-auth · 08-billing · 09-infra |
| Qualidade | 10-test · 11-security · 12-code-reviewer · 13-performance |
| Auditoria | 14-auditor · 15-debt-analyst · 16-migration-planner · 17-lgpd |
| Estratégia | 18-doc-writer · 19-product-analyst · 20-project-manager |
| Meta | core/agente-Osábio (guardião da evolução e da memória) |

## Hierarquia

```
Responsável (decisão final)
  └─ Agente 20 — Gestor de Projeto (organiza execução)
       └─ agente-Osábio (evolui os agentes, mantém a memória)
            └─ Agente 19 — Analista de Produto (entende o negócio)
                 └─ Agentes 01–18 — Técnicos (implementam)
```

## Filosofia

- **SDD (Spec-Driven Development):** nenhum código antes de spec aprovada.
- **8 Regras de Segurança embutidas** (REG-001 a REG-008) — ver `INSTALL.md`.
- **Memória viva:** o Osábio destila cada sprint em lições e padrões de erro.

## Estrutura

```
.ai-system/
├── INSTALL.md              ← instalador guiado (entrevista)
├── README.md               ← este arquivo
├── VERSION.md              ← changelog do kit
├── prd/PRD-TEMPLATE.md     ← template de PRD
├── agents/                 ← 20 agentes + core/agente-Osábio
├── templates/
│   ├── project/            ← 5 templates (CLAUDE/SYSTEM/STACK/ARCH/README)
│   ├── memory/             ← memória do kit (lições, erros, maturidade)
│   ├── adr-template.md · audit-report.md · checklist-sprint.md
│   └── sdd-*.md            ← templates de spec
├── runbooks/               ← deploy.md · rollback.md
├── checklist/              ← quality-checklists.md
├── adr/ · specs/ · audit/  ← vazias (o projeto preenche)
└── docs/                   ← (opcional)
```

## Versão

Ver **`VERSION.md`**.

---
*Kit de Agentes Portátil v2.0 — desenvolvido a partir de lições aprendidas em produção*
