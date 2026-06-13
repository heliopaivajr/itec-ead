# VERSION — Kit de Agentes Portátil

## v2.0.0

Kit limpo e portátil, destilado de lições de produção. Primeira versão
distribuível (a v1.x era um sistema interno acoplado a um único projeto).

### O que entrega

| Bloco | Conteúdo |
|-------|----------|
| 1 | `INSTALL.md` (instalador) + `prd/PRD-TEMPLATE.md` |
| 2 | 5 templates de projeto (CLAUDE / SYSTEM / STACK / ARCHITECTURE / README) |
| 3 | Memória do kit: `lessons-learned`, `known-errors`, `agent-maturity-map`, `README` |
| 4 | 21 agentes (20 + Osábio) em `version: 2.0.0` — sem contaminação de domínio |
| — | Instalação Guiada (Opção 3): entrevista de 15 perguntas gera o PRD |

### Memória inicial embutida

- **10 lições** — LICAO-001 a LICAO-010
- **Erros conhecidos** — categorias ERR-RLS, ERR-INFRA, ERR-LOGIC, ERR-TEST
- **8 regras de segurança** — REG-001 a REG-008 (no `INSTALL.md`)

### Princípios de design

- Markdown puro, sem dependências.
- Domínio do projeto definido por entrevista — zero acoplamento a um produto real.
- Placeholders `{{VAR}}` só onde a stack amarra; exemplos concretos onde ensinam.
- Substituição na instalação por **lista branca** (preserva `${{ secrets.X }}` de CI).

### Agentes (todos `version: 2.0.0`)

```
01-architect · 02-domain-designer · 03-api-designer · 04-db-architect
05-backend-engineer · 06-frontend-engineer · 07-auth-specialist
08-billing-engineer · 09-infra-engineer · 10-test-engineer
11-security-auditor · 12-code-reviewer · 13-performance-eng · 14-auditor
15-debt-analyst · 16-migration-planner · 17-lgpd-auditor · 18-doc-writer
19-product-analyst · 20-project-manager · core/agente-Osábio
```

### Próximo

- Manual-Guia Completo (.docx) — documento de ensino do kit (ver Roadmap no `INSTALL.md`).

---
*Kit de Agentes Portátil v2.0*
