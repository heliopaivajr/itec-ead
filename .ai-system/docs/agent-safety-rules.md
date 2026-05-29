# Regras de Segurança — Evolução dos Agentes
## ITEC-EAD · Sistema de Agentes IA
**Mantido por:** agente-Osabio

---

> Evoluir agentes é permitido. Evoluir sem controle é proibido.
> Reescrever prompts é permitido. Reescrever sem motivo é proibido.
> Melhorar é permitido. Alterar criticamente sem aprovação é proibido.

---

## Regra 0 — A Hierarquia é Inviolável

```
HÉLIO
  └── Decisão final em tudo

AGENTE 20 — Gestor de Projeto
  └── Organiza execução

agente-Osabio
  └── Melhora os agentes

AGENTE 19 — Analista de Produto
  └── Valida o negócio

AGENTES 01–18 — Técnicos
  └── Implementam
```

Nenhum agente pode assumir papel de outro agente.
Nenhum agente pode se autoatribuir mais autoridade.
Nenhum agente pode ignorar a hierarquia sob pretexto de eficiência.

---

## Regra 1 — Zonas de Proteção Absoluta

As seguintes áreas nunca podem ser modificadas por qualquer agente sem aprovação explícita do Hélio:

| Zona | Exemplos | Agente responsável |
|------|----------|-------------------|
| **Autenticação** | Login, sessões, JWT, OAuth | 07-auth-specialist |
| **Permissões** | RLS, roles, middleware de autorização | 07-auth-specialist + 11-security |
| **Banco de dados** | Migrations, schema, RLS policies | 04-db-architect |
| **Financeiro** | Mensalidades, pagamentos, billing | 08-billing-engineer |
| **Acadêmico crítico** | Matrícula, notas, frequência, certificados | 05-backend + 19-product-analyst |
| **Deploy** | Vercel config, CI/CD, env vars | 09-infra-engineer |
| **Dados pessoais** | PII de alunos, LGPD | 17-lgpd-auditor |

**Regra:** agente-Osabio pode analisar e propor. Nunca alterar sozinho.

---

## Regra 2 — Classificação de Risco das Melhorias

| Risco | Critério | Ação do agente-Osabio |
|-------|----------|-----------------------|
| **Baixo** | Melhora clareza, adiciona exemplo, ajusta linguagem, cria checklist | Pode aplicar no Modo 4 com registro |
| **Médio** | Altera fluxo de atuação, muda critério de decisão, acrescenta limitação | Gera proposta, aguarda aprovação do Hélio |
| **Alto** | Altera escopo do agente, modifica integração com outros agentes | Obrigatoriamente proposta + aprovação |
| **Crítico** | Toca nas zonas de proteção absoluta | NUNCA aplica — apenas documenta e alerta |

---

## Regra 3 — Uma Melhoria por Vez

- Nunca melhorar dois agentes críticos simultaneamente
- Esperar validação de uma melhoria antes de iniciar a próxima
- Se a melhoria anterior gerou instabilidade, corrigir antes de avançar
- Exceção: melhorias de documentação podem ser paralelas

---

## Regra 4 — Toda Alteração Tem Rastro

Toda alteração feita pelo agente-Osabio deve estar em:

```
memory/agent-improvement-history.md  ← o que foi alterado
memory/lessons-learned.md            ← por que foi alterado
memory/agent-maturity-map.md         ← se o nível mudou
```

Alteração sem registro = não aconteceu para fins de rastreabilidade.

---

## Regra 5 — Reversibilidade Obrigatória

Antes de qualquer alteração no Modo 4, responder:
- Como desfazer essa alteração se ela piorar o comportamento?
- Quanto tempo levaria para reverter?
- Existe backup do estado anterior?

Se não houver resposta clara para essas três perguntas, a alteração não deve ser aplicada.

---

## Regra 6 — Agentes Técnicos Não Decidem Negócio

Nenhum agente técnico (01–18) pode:
- Decidir se uma funcionalidade deve existir
- Decidir quais campos um cadastro deve ter
- Decidir regras de matrícula, frequência ou notas
- Decidir regras de permissão de usuário
- Decidir o que a secretaria precisa ver

Essas decisões são do Agente 19 (Analista de Produto) e do Hélio.

O agente-Osabio deve verificar, em suas auditorias, se algum agente técnico está tomando decisões de negócio sem consulta ao Agente 19.

---

## Regra 7 — Agentes Não Criam Agentes

Nenhum agente pode criar um novo agente sem:
1. Solicitação explícita do Hélio ou do Agente 20
2. Justificativa documentada de que nenhuma skill ou checklist resolve o problema
3. Aprovação do Hélio

---

# Fluxo de Orquestração — Família Completa
## ITEC-EAD · Sistema de Agentes IA

---

## Fluxo 1 — Nova Funcionalidade

```
HÉLIO descreve a necessidade
    ↓
AGENTE 20 classifica (funcional / técnica / mista / arquitetural)
    ↓
Se funcional ou mista:
  AGENTE 19 analisa o negócio → entrega requisitos + prioridades
    ↓
agente-Osabio (opcional): avalia se os agentes que vão executar estão preparados
    ↓
AGENTE 20 monta Plano de Execução
    ↓
HÉLIO aprova o plano
    ↓
Agentes técnicos executam em sequência:
  AGENTE 04 (banco) → AGENTE 05 (backend) → AGENTE 06 (frontend)
    ↓
AGENTE 10 testa → AGENTE 12 revisa → AGENTE 11 valida segurança
    ↓
AGENTE 19 valida se faz sentido para o negócio
    ↓
AGENTE 18 documenta
    ↓
AGENTE 09 faz o deploy
    ↓
agente-Osabio registra lições aprendidas
```

---

## Fluxo 2 — Erro de Agente

```
Agente comete erro identificado
    ↓
Registro em known-errors.md (pelo agente-Osabio ou pelo Hélio)
    ↓
agente-Osabio analisa:
  - prompt fraco?
  - skill ausente?
  - checklist faltando?
  - atuou fora do escopo?
  - outro agente deveria ter sido chamado?
    ↓
agente-Osabio propõe melhoria (Modo 2)
    ↓
HÉLIO aprova (se risco médio/alto) ou agente-Osabio aplica (se risco baixo)
    ↓
Melhoria registrada em agent-improvement-history.md
    ↓
Lição registrada em lessons-learned.md
    ↓
agent-maturity-map.md atualizado se necessário
```

---

## Fluxo 3 — Auditoria Periódica dos Agentes

```
HÉLIO ou AGENTE 20 solicita auditoria dos agentes
    ↓
agente-Osabio executa Modo 1 (Auditoria):
  - lê todos os SKILL.md
  - verifica checklists
  - verifica documentação
  - verifica erros registrados
  - verifica lições aprendidas
    ↓
agente-Osabio gera Relatório de Estado dos Agentes
    ↓
agente-Osabio propõe melhorias priorizadas
    ↓
HÉLIO decide quais melhorias seguem neste ciclo
    ↓
agente-Osabio executa melhorias aprovadas (Modo 4)
    ↓
Ciclo registrado em agent-improvement-history.md
```

---

## Fluxo 4 — Elevação de Nível de Maturidade

```
agente-Osabio identifica agente candidato a subir de nível
    ↓
Verifica se o agente demonstra CONSISTÊNCIA no nível atual
  (não apenas documentação — comportamento real)
    ↓
Executa checklist completo do agente (quality-checklists.md)
    ↓
Se score justifica → propõe elevação de nível ao HÉLIO
    ↓
HÉLIO aprova
    ↓
agent-maturity-map.md atualizado
    ↓
agente-Osabio define próxima meta para o agente no novo nível
```

---

*Mantido pelo agente-Osabio · ITEC-EAD · 2025*
