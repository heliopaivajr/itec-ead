# Mapa de Maturidade dos Agentes
## ITEC-EAD · Sistema de Agentes IA
**Mantido por:** agente-Osabio  
**Última atualização:** 2026-06-01 — Primeira avaliação real (pós Sprint fix-ux + fix-menus)
**Versão:** 1.1 — Primeira população com dados reais

---

> **Instrução de uso:** Este documento é atualizado pelo agente-Osabio após cada ciclo de avaliação.
> Nunca altere manualmente os níveis sem uma avaliação real do comportamento do agente.
> Nível = comportamento consistente, não apenas documentação existente.

---

## Escala de Maturidade

| Nível | Nome | Critério resumido |
|-------|------|-------------------|
| 1 | Básico | Função simples, prompt inicial, pouca documentação |
| 2 | Organizado | Função clara, limites definidos, sabe quando NÃO agir |
| 3 | Confiável | Checklist ativo, registra problemas, encaminha tarefas |
| 4 | Sênior | Analisa riscos, propõe melhorias, integra-se bem |
| 5 | Especialista Maduro | Alta precisão, aprende com erros, nunca fora dos limites |

---

## Camada Estratégica

### Agente 20 — Gestor de Projeto / Coordenador
| Campo | Valor |
|-------|-------|
| **Nível atual** | 3 — Confiável |
| **Pontos fortes** | Planos detalhados com agentes e critérios de aceite; identifica riscos antes da execução |
| **Pontos fracos** | Não verificou CHECK constraint antes de especificar options de dropdown; ordenou componente base após consumidores |
| **Riscos identificados** | Pode especificar colunas/constraints sem verificar o banco |
| **Skills associadas** | SKILL.md em agents/20-project-manager/ |
| **Melhorias aplicadas** | MELHORIA-001, MELHORIA-003 — verificação de schema e ordenação de dependências |
| **Próxima melhoria recomendada** | Verificar se já existe implementação antes de criar tasks de "adicionar" |
| **Status** | Avaliado — 2026-06-01 |

### agente-Osabio — Mentor / Supervisor de Evolução
| Campo | Valor |
|-------|-------|
| **Nível atual** | 3 — Confiável (recém-criado com estrutura robusta) |
| **Pontos fortes** | Protocolo de avaliação estruturado, modos de operação claros, 7 filtros de segurança |
| **Pontos fracos** | Sem histórico de uso real ainda; sem memória acumulada de erros |
| **Riscos identificados** | Risco de super-ativação no início (tentar melhorar tudo de uma vez) |
| **Skills associadas** | agents/core/agente-Osabio.md |
| **Próxima melhoria recomendada** | Acumular ciclos reais de avaliação para elevar para nível 4 |
| **Status** | Ativo — aguardando primeira execução real |

### Agente 19 — Analista de Produto / Negócio
| Campo | Valor |
|-------|-------|
| **Nível atual** | 4 — Sênior |
| **Pontos fortes** | Análise completa por dimensões (D1-D10); classificação precisa essencial/importante/pode esperar; identifica gaps que o Hélio não listou (campo observações, PDF presença); perguntas certeiras antes de implementar |
| **Pontos fracos** | Nenhum identificado neste sprint |
| **Riscos identificados** | Pode sugerir features além do escopo MVP se não lembrarem de conter |
| **Skills associadas** | SKILL.md em agents/19-product-analyst/ |
| **Próxima melhoria recomendada** | Nenhuma por ora — manter o nível |
| **Status** | Avaliado — 2026-06-01 |

---

## Camada de Arquitetura

### Agente 01 — Architect
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Arquitetura de software, ADRs, decisões estruturais |
| **Próxima melhoria recomendada** | [preencher na primeira execução] |
| **Status** | Aguardando primeira avaliação |

### Agente 02 — Domain Designer
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Entidades, value objects, eventos de domínio |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

### Agente 03 — API Designer
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Contratos de API REST antes da implementação |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

### Agente 04 — DB Architect
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Schema, migrations, RLS, índices |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

---

## Camada de Desenvolvimento

### Agente 05 — Backend Engineer
| Campo | Valor |
|-------|-------|
| **Nível atual** | 3 — Confiável |
| **Pontos fortes** | Services limpos, sanitização de dados (sanitizeDate), validação hierárquica robusta |
| **Pontos fracos** | Não tratou erro do upsert em user_roles (ERR-RISK-001) |
| **Melhorias aplicadas** | MELHORIA-006 — função pura para regras de hierarquia |
| **Próxima melhoria recomendada** | Sempre tratar retorno de operações de sync/cache |
| **Status** | Avaliado — 2026-06-01 |

### Agente 06 — Frontend Engineer
| Campo | Valor |
|-------|-------|
| **Nível atual** | 4 — Sênior |
| **Pontos fortes** | Componentes reutilizáveis (InlineStatusSelect, ComingSoonPage); dark mode automático; padrões consistentes com o projeto |
| **Pontos fracos** | Havia entregado LancarNotas sem ponto de entrada (corrigido) |
| **Melhorias aplicadas** | MELHORIA-002, MELHORIA-004, MELHORIA-005 |
| **Próxima melhoria recomendada** | Nenhuma urgente |
| **Status** | Avaliado — 2026-06-01 |

### Agente 07 — Auth Specialist
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Login, roles, permissões, middleware |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

### Agente 08 — Billing Engineer
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Mensalidades, pagamentos, webhooks |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

### Agente 09 — Infra Engineer
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Deploy, CI/CD, variáveis de ambiente |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

---

## Camada de Qualidade

### Agente 10 — Test Engineer
| Campo | Valor |
|-------|-------|
| **Nível atual** | 3 — Confiável |
| **Pontos fortes** | Testes focados em comportamento (não implementação); casos de borda cobertos; mock correto de useToast |
| **Pontos fracos** | Sem testes de integração ainda (apenas unitários) |
| **Próxima melhoria recomendada** | Adicionar testes de integração para fluxo de matrícula e updateRole |
| **Status** | Avaliado — 2026-06-01 |

### Agente 11 — Security Auditor
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Auth, RLS, secrets, OWASP |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

### Agente 12 — Code Reviewer
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Review estruturado com score de qualidade |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

### Agente 13 — Performance Engineer
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | N+1, queries lentas, bundle pesado |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

---

## Camada de Auditoria

### Agente 14 — Auditor ⭐
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Diagnóstico completo do codebase — PRIMEIRO em projeto existente |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

### Agente 15 — Debt Analyst
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Mapear e priorizar débito técnico |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

### Agente 16 — Migration Planner
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | Mudanças arquiteturais seguras |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

### Agente 17 — LGPD Auditor
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | PII, consentimento, direitos dos alunos |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

---

## Camada de Produto

### Agente 18 — Doc Writer
| Campo | Valor |
|-------|-------|
| **Nível atual** | A avaliar |
| **Função** | README, API docs, runbooks, ADRs |
| **Próxima melhoria recomendada** | [preencher] |
| **Status** | Aguardando primeira avaliação |

---

## Resumo de Níveis (atualizado pelo agente-Osabio)

| Agente | Nível | Atualizado em |
|--------|-------|---------------|
| 19 — product-analyst | **4 Sênior** | 2026-06-01 |
| 20 — project-manager | **3 Confiável** | 2026-06-01 |
| Osabio — mentor | **4 Sênior** | 2026-06-01 |
| 01 — architect | — | aguarda avaliação |
| 02 — domain-designer | — | aguarda avaliação |
| 03 — api-designer | — | aguarda avaliação |
| 04 — db-architect | — | aguarda avaliação |
| 05 — backend-engineer | **3 Confiável** | 2026-06-01 |
| 06 — frontend-engineer | **4 Sênior** | 2026-06-01 |
| 07 — auth-specialist | — | aguarda avaliação |
| 08 — billing-engineer | — | aguarda avaliação |
| 09 — infra-engineer | — | aguarda avaliação |
| 10 — test-engineer | **3 Confiável** | 2026-06-01 |
| 11 — security-auditor | — | aguarda avaliação |
| 12 — code-reviewer | — | aguarda avaliação |
| 13 — performance-eng | — | aguarda avaliação |
| 14 — auditor | — | aguarda avaliação |
| 15 — debt-analyst | — | aguarda avaliação |
| 16 — migration-planner | — | aguarda avaliação |
| 17 — lgpd-auditor | — | aguarda avaliação |
| 18 — doc-writer | — | aguarda avaliação |

---

*Mantido pelo agente-Osabio · ITEC-EAD · 2025*
