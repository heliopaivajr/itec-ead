# Manual de Uso — Agentes 19 e 20
## ITEC-EAD · Sistema de Agentes IA · Hélio Paiva Jr.

---

## Visão Geral

O sistema de agentes do ITEC-EAD agora conta com **20 agentes especializados**.

Os agentes 01–18 cobrem toda a execução técnica do projeto (arquitetura, banco, backend, frontend, auth, billing, infra, testes, segurança, review, performance, auditoria, LGPD, documentação).

Os agentes **19 e 20** são camadas estratégicas que faltavam:

| Agente | Nome | Função Central |
|--------|------|----------------|
| **19** | Analista de Produto / Negócio | Entende o negócio, identifica lacunas, define requisitos funcionais |
| **20** | Gestor de Projeto / Coordenador | Organiza tarefas, define ordem, aciona os agentes certos |

---

## Quando Usar Cada Agente

### Use o Agente 19 quando precisar responder:

- "O que está faltando na plataforma?"
- "O fluxo de matrícula está correto?"
- "A secretaria consegue trabalhar com o que temos?"
- "Quais campos o cadastro do aluno precisa ter?"
- "As roles fazem sentido para uma instituição teológica?"
- "O menu do professor tem o que ele precisa?"
- "Isso faz sentido para o ITEC ou estou complicando?"
- "Qual é a prioridade — isso é essencial ou pode esperar?"
- "Quais requisitos preciso antes de implementar X?"

**Resumo:** Qualquer pergunta sobre O QUÊ a plataforma deve ter e POR QUÊ.

---

### Use o Agente 20 quando precisar responder:

- "Como vou implementar isso sem bagunçar o projeto?"
- "Por onde começo?"
- "Quais agentes preciso acionar para essa demanda?"
- "Qual é a ordem das tarefas?"
- "Existe risco nessa mudança?"
- "Como organizo o sprint?"
- "Essa demanda é técnica, funcional ou mista?"
- "Já existe spec ou ADR para isso?"

**Resumo:** Qualquer pergunta sobre COMO executar, EM QUE ORDEM, e QUEM faz o quê.

---

## Fluxo de Uso na Prática

### Cenário 1 — Nova funcionalidade solicitada

```
1. Hélio descreve a demanda
2. Agente 20 classifica: funcional, técnica ou mista
3. Agente 19 analisa o lado do negócio (se funcional/mista)
4. Agente 20 monta o Plano de Execução
5. Hélio aprova o plano
6. Agentes técnicos executam em sequência
7. Agente 19 valida se o resultado faz sentido para o negócio
8. Agente 20 confirma que todos os critérios foram atendidos
9. Agente 18 documenta
10. Agente 09 faz o deploy
```

---

### Cenário 2 — "O que está faltando na plataforma?"

```
1. Ative o Agente 19
2. Ele executa o protocolo de análise de completude (10 dimensões)
3. Entrega relatório com lacunas classificadas por prioridade
4. Hélio decide o que vai para o próximo sprint
5. Ative o Agente 20 para organizar a execução das prioridades escolhidas
```

---

### Cenário 3 — Bug crítico em produção

```
1. Ative o Agente 20
2. Ele classifica como demanda corretiva
3. Aciona Agente 12 (Code Reviewer) para diagnóstico
4. Agente 12 identifica causa raiz
5. Agente 20 monta plano de correção
6. Agente técnico adequado (05 ou 06) corrige
7. Agente 10 escreve teste que prova que o bug não volta
8. Deploy
```

---

### Cenário 4 — Início de novo Sprint

```
1. Ative o Agente 20
2. Liste as demandas previstas para o sprint
3. Ele classifica, prioriza e monta o plano do sprint completo
4. Para cada item funcional, aciona o Agente 19 para análise
5. Hélio aprova o plano do sprint
6. Execução começa
```

---

## Como Ativar no Claude Code

### Ativar Agente 19

```
Ative .ai-system/agents/19-product-analyst/SKILL.md

Preciso que você analise [descreva o escopo].
Contexto atual: [descreva o estado da plataforma ou o que já existe].
```

### Ativar Agente 20

```
Ative .ai-system/agents/20-project-manager/SKILL.md

Tenho a seguinte demanda: [descreva].
Preciso de um plano de execução com os agentes certos, na ordem certa.
```

### Ativar os dois em sequência

```
Modo: Análise + Coordenação

1. Ative .ai-system/agents/19-product-analyst/SKILL.md
   Analise: [escopo da análise]
   
2. Após análise aprovada, ative .ai-system/agents/20-project-manager/SKILL.md
   Monte o Plano de Execução baseado na análise do Agente 19.
```

---

## Onde os Arquivos Devem Ficar no Projeto

```
.ai-system/
├── agents/
│   ├── 01-architect/SKILL.md
│   ├── ...
│   ├── 18-doc-writer/SKILL.md
│   ├── 19-product-analyst/SKILL.md      ← NOVO
│   └── 20-project-manager/SKILL.md      ← NOVO
│
└── README.md                             ← atualizar com os novos agentes
```

---

## Relação dos Novos Agentes com os 18 Existentes

```
                    ┌─────────────────────────────┐
                    │   HÉLIO (Product Owner)      │
                    │   Aprova specs e planos      │
                    └──────────┬──────────────────┘
                               │
              ┌────────────────┴─────────────────┐
              │                                  │
    ┌─────────▼──────────┐            ┌──────────▼──────────┐
    │  AGENTE 19         │            │  AGENTE 20          │
    │  Analista Produto  │◄──────────►│  Gestor de Projeto  │
    │  O QUÊ e POR QUÊ   │            │  COMO e EM QUE ORDEM│
    └────────────────────┘            └──────────┬──────────┘
                                                 │
                    ┌────────────────────────────┼──────────────────────────┐
                    │                            │                          │
         ┌──────────▼────────┐       ┌───────────▼────────┐    ┌───────────▼────────┐
         │ ARQUITETURA       │       │ IMPLEMENTAÇÃO      │    │ QUALIDADE          │
         │ 01 · 02 · 03 · 04 │       │ 05 · 06 · 07 · 08  │    │ 10 · 11 · 12 · 13  │
         └───────────────────┘       └────────────────────┘    └────────────────────┘
                    │                            │                          │
         ┌──────────▼────────┐       ┌───────────▼────────┐
         │ AUDITORIA         │       │ DOCUMENTAÇÃO       │
         │ 14 · 15 · 16 · 17 │       │ 18 + 09 (deploy)   │
         └───────────────────┘       └────────────────────┘
```

---

## Regras de Ouro para Usar os Dois Agentes

1. **Agente 19 antes de código.** Se envolve regra de negócio, ele analisa primeiro.
2. **Agente 20 antes de execução.** Se a demanda é complexa, ele organiza o plano.
3. **Hélio aprova o plano.** Nenhum agente técnico é ativado sem o plano aprovado.
4. **Agente 19 valida o resultado.** Após implementação, ele confirma que faz sentido.
5. **Agente 20 não substitui o 19.** Um é negócio, o outro é coordenação. Papéis distintos.
6. **Os dois juntos não substituem o Hélio.** Ele é o Product Owner. A decisão final é sempre sua.

---

*ITEC-EAD · Sistema de Agentes IA · Hélio Paiva Jr. · ObraIA · Paulista/PE · 2025*
