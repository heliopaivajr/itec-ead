# ADR-019 — Criação dos Agentes Estratégicos 19 e 20

**Status:** Aprovado  
**Data:** 2025  
**Autor:** Hélio Paiva Jr.  
**Projeto:** ITEC-EAD  

---

## Contexto

O sistema de 18 agentes cobre com excelência toda a execução técnica do projeto (arquitetura, banco, backend, frontend, auth, testes, segurança, review, deploy, documentação). Porém, identificou-se uma lacuna estratégica: os agentes técnicos executam bem, mas nenhum deles é responsável por:

1. **Analisar se o que está sendo construído faz sentido para o negócio** — não apenas se o código está correto, mas se a plataforma atende de forma coerente uma instituição educacional teológica.

2. **Coordenar a execução entre os agentes** — sem coordenação explícita, existe risco de agentes técnicos receberem demandas vagas, decidirem regras de negócio sozinhos, ou executarem tarefas fora de ordem.

---

## Decisão

Criar dois novos agentes com papéis estratégicos, complementares e não-sobrepostos:

### Agente 19 — Analista de Produto / Negócio
- Papel: Product Owner + Analista de Negócios + especialista em secretaria acadêmica
- Responsabilidade: analisar a plataforma do ponto de vista funcional e institucional
- Foco: O QUÊ deve existir e POR QUÊ
- NÃO executa código, NÃO coordena agentes

### Agente 20 — Gestor de Projeto / Coordenador
- Papel: Tech Lead de processo + Orquestrador + Controller de qualidade
- Responsabilidade: receber demandas, classificá-las, definir plano de execução, acionar agentes na ordem correta
- Foco: COMO executar e EM QUE ORDEM
- NÃO executa código, NÃO faz análise funcional de negócio

---

## Motivação

**Por que o Agente 19?**
- Os 18 agentes técnicos não têm contexto suficiente para decidir "o que a secretaria de uma escola teológica precisa"
- Sem análise funcional, corre-se o risco de construir funcionalidades tecnicamente corretas mas institucionalmente incorretas
- O ITEC tem características específicas (instituição cristã, jornadas de aluno/professor/secretaria/admin) que exigem análise especializada

**Por que o Agente 20?**
- Sem coordenação explícita, demandas complexas chegam diretamente a agentes técnicos sem spec, sem análise de risco, sem ordem de execução
- O Agente 20 formaliza o papel de "Tech Lead de processo" que Hélio exercia informalmente
- Garante que nenhum agente técnico seja ativado sem contexto adequado

---

## Consequências

**Positivas:**
- Plataforma mais coerente com as necessidades reais do ITEC
- Menos retrabalho por falta de análise prévia
- Decisões de negócio separadas de decisões técnicas
- Rastreabilidade da ordem de execução
- Agentes técnicos recebem contexto mais rico antes de executar

**Negativas / Trade-offs:**
- Fluxo de trabalho tem mais etapas (análise → plano → execução)
- Para tarefas pequenas e bem definidas, os dois novos agentes podem ser desnecessários
- Requer que Hélio aprove o plano antes da execução (adiciona uma etapa de revisão)

**Mitigação dos trade-offs:**
- Para tarefas simples e bem delimitadas, os agentes técnicos podem ser ativados diretamente sem passar pelo 19 e 20
- O Agente 20 pode ser ativado sozinho (sem o 19) quando a demanda é claramente técnica

---

## Regra de Uso

- Use o **Agente 19** quando a pergunta for sobre O QUÊ a plataforma deve ter
- Use o **Agente 20** quando a pergunta for sobre COMO executar
- Use os **dois em sequência** quando a demanda for mista (funcional + técnica)
- **Continue usando os agentes técnicos diretamente** para tarefas simples e bem especificadas

---

*ADR-019 · ITEC-EAD · Hélio Paiva Jr. · ObraIA · 2025*
