# Mapa de Maturidade dos Agentes
## ITEC-EAD · Sistema de Agentes IA
**Mantido por:** agente-Osabio  
**Última atualização:** 2026-06-03 — Pós Sprint M (5 primeiras avaliações reais)
**Versão:** 1.2 — Agentes 09, 11, 12, 14, 18 avaliados pela primeira vez

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
| **Nível atual** | **4 — Sênior** |
| **Pontos fortes** | Edge Function completa com rollback, geração de codigo_itec, validação em camadas, updateStatusProfessor com trigger sync, funções puras testáveis |
| **Pontos fracos** | Race condition não tratada em codigo_itec (ERR-EDGE-001); rollback incompleto possível (ERR-EDGE-002) |
| **Melhorias aplicadas** | MELHORIA-006, MELHORIA-007, MELHORIA-008 |
| **Próxima melhoria recomendada** | Tratar unique violation no codigo_itec com retry |
| **Status** | Avaliado — 2026-06-02 **(subiu 3 → 4)** |

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
| **Nível atual** | **3 — Confiável** |
| **Pontos fortes** | Identificou recursão em policies RLS antes de acontecer, ADR-006 bem fundamentado, validação de Edge Function por curl (não Studio) |
| **Pontos fracos** | Primeira avaliação real — pouca base histórica |
| **Próxima melhoria recomendada** | Documentar checklist de auditoria de RLS para novas tabelas |
| **Status** | Avaliado — 2026-06-02 (primeira avaliação real) |
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
| **Nível atual** | **3 — Confiável** |
| **Pontos fortes** | Sequência de merge correta sem improviso (test→build→commit→checkout→pull→merge --no-ff→push); mensagem de merge completa com entregáveis |
| **Pontos fracos** | Sem histórico de rollback real; deploy Vercel é automático (sem ação manual testada) |
| **Função** | Deploy, CI/CD, variáveis de ambiente |
| **Próxima melhoria recomendada** | Documentar procedimento de rollback para o projeto (Vercel revert) |
| **Status** | Avaliado — 2026-06-03 (primeira avaliação real, Sprint M) |

---

## Camada de Qualidade

### Agente 10 — Test Engineer
| Campo | Valor |
|-------|-------|
| **Nível atual** | **4 — Sênior** |
| **Pontos fortes** | Testes focados em comportamento; mocks ajustados quando falham (thenable builder, spy handlers); casos negativos cobertos (permissão insuficiente, erro de banco); 213 testes sem falsos positivos |
| **Pontos fracos** | Sem testes de integração (apenas unitários com mock) |
| **Próxima melhoria recomendada** | Testes de integração para `updateRole` com RLS ativo (Sprint L) |
| **Status** | Avaliado — 2026-06-01 **(subiu 3 → 4)** |

### Agente 11 — Security Auditor
| Campo | Valor |
|-------|-------|
| **Nível atual** | **3 — Confiável** |
| **Pontos fortes** | Identificou o risco real das 3 tabelas com policies legadas (profiles→user_roles); classificação 🟡 MÉDIO correta; SQL de correção aplicado e confirmado |
| **Pontos fracos** | Não verificou `getAlunosEmRiscoByTurma` como risco de vazamento parcial de dados por aluno (só mencionou em "Sugestão") |
| **Função** | Auth, RLS, secrets, OWASP |
| **Próxima melhoria recomendada** | Adicionar checklist: "toda função que agrega dados de múltiplos alunos → verificar se há role check no service" |
| **Status** | Avaliado — 2026-06-03 (primeira avaliação real, Sprint M) |

### Agente 12 — Code Reviewer
| Campo | Valor |
|-------|-------|
| **Nível atual** | **4 — Sênior** |
| **Pontos fortes** | 3 sprints com score crescente (3.95 → 4.33); bugs reais com file:line; Sprint N identificou risco de manutenção (cast frágil `as TipoEventoPayload`) além de apenas bugs funcionais |
| **Pontos fracos** | Não faz análise de arquitetura global — foca nos arquivos modificados, não no impacto sistêmico |
| **Função** | Review estruturado com score de qualidade |
| **Próxima melhoria recomendada** | Em reviews de features complexas, verificar se há um padrão estabelecido sendo violado (ex: PADRAO-001) antes de apontar apenas bugs funcionais |
| **Status** | Avaliado — 2026-06-04 ⬆️ **(subiu 3 → 4, pós Sprint N + hotfixes)** |

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
| **Nível atual** | **3 — Confiável** |
| **Pontos fortes** | Auditoria rápida objetiva (5 itens, sem verbosidade); score 9.3 justificado dimensão a dimensão; confirmou o que era esperado sem inflar o resultado |
| **Pontos fracos** | Modo "rápida" não verificou arquivos individualmente — usou contexto do sprint. Em auditoria completa, precisaria ler os arquivos |
| **Função** | Diagnóstico completo do codebase — PRIMEIRO em projeto existente |
| **Próxima melhoria recomendada** | Nenhuma — manter o formato de auditoria rápida; auditoria completa quando solicitada explicitamente |
| **Status** | Avaliado — 2026-06-03 (primeira avaliação real, Sprint M) |

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
| **Nível atual** | **3 — Confiável** |
| **Pontos fortes** | Atualizou 4 arquivos com conteúdo preciso e específico (sem texto genérico); LICAO-018/019 bem estruturadas com "Como aplicar no futuro" concreto; ROADMAP com entregáveis técnicos reais |
| **Pontos fracos** | Não documentou o padrão `as unknown as X[]` do Supabase (padrão que aparece em 8+ lugares sem registro) |
| **Função** | README, API docs, runbooks, ADRs, lições aprendidas |
| **Próxima melhoria recomendada** | Registrar padrões estabelecidos (não apenas erros) em `known-errors.md` como "PADRAO-001", "PADRAO-002"... |
| **Status** | Avaliado — 2026-06-03 (primeira avaliação real, Sprint M) |

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
| 05 — backend-engineer | **4 Sênior** | 2026-06-02 |
| 06 — frontend-engineer | **4 Sênior** | 2026-06-01 |
| 07 — auth-specialist | **3 Confiável** | 2026-06-02 |
| 08 — billing-engineer | — | aguarda avaliação |
| 09 — infra-engineer | **3 Confiável** | 2026-06-03 🆕 |
| 10 — test-engineer | **4 Sênior** | 2026-06-01 |
| 11 — security-auditor | **3 Confiável** | 2026-06-03 🆕 |
| 12 — code-reviewer | **4 Sênior** | 2026-06-04 ⬆️ |
| 13 — performance-eng | — | aguarda avaliação |
| 14 — auditor | **3 Confiável** | 2026-06-03 🆕 |
| 15 — debt-analyst | — | aguarda avaliação |
| 16 — migration-planner | — | aguarda avaliação |
| 17 — lgpd-auditor | — | aguarda avaliação |
| 18 — doc-writer | **3 Confiável** | 2026-06-03 🆕 |

---

*Mantido pelo agente-Osabio · ITEC-EAD · 2025*
