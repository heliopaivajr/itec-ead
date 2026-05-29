# Erros Conhecidos dos Agentes
## ITEC-EAD · Memória Técnica
**Mantido por:** agente-Osabio  
**Última atualização:** 2026-05-29

---

> **Propósito:** Todo erro cometido por um agente deve ser registrado aqui.
> Um erro não registrado é um erro que vai se repetir.
> Um erro registrado é uma lição que protege o projeto.

---

## Como Registrar um Erro

Copie o template abaixo e preencha todos os campos.
Não deixe campos em branco — se não souber, coloque "a investigar".

```markdown
---

## ERR-[número sequencial] — [título curto do erro]

**Data:** [YYYY-MM-DD]
**Agente envolvido:** [qual agente cometeu o erro]
**Tipo de erro:** [prompt fraco | fora do escopo | regra de negócio violada | segurança | performance | documentação | outro]
**Gravidade:** [baixa | média | alta | crítica]

**Descrição:**
[O que aconteceu de forma objetiva]

**Como foi descoberto:**
[Quem identificou e como]

**Causa provável:**
[Por que o agente errou — falta de instrução? prompt ambíguo? skill ausente? fora do escopo?]

**Impacto:**
[O que foi afetado — código, dados, fluxo, usuário]

**Correção aplicada:**
[O que foi feito para corrigir]

**Como evitar no futuro:**
[Instrução específica que deve ser adicionada ao agente]

**Prompt precisa melhorar?** [Sim / Não — se sim, qual parte]
**Skill precisa melhorar?** [Sim / Não — se sim, qual skill]
**Checklist precisa melhorar?** [Sim / Não — se sim, qual checklist]
**Documento precisa melhorar?** [Sim / Não — se sim, qual documento]

**Status:** [aberto | em análise | corrigido | verificado]
**Aprovado pelo Hélio:** [Sim / Não / Não necessário]
```

---

## Registro de Erros

---

## ERR-001 — Agente 20 referenciou coluna inexistente em spec de performance

**Data:** 2026-05-29
**Agente envolvido:** 20-project-manager
**Tipo de erro:** prompt fraco / spec incorreta
**Gravidade:** média

**Descrição:**
O spec do Sprint J especificou `getResumoFrequenciaBatch(turmaId)` com filtro `WHERE turma_id = X`. A tabela `frequencia` não possui coluna `turma_id` (ver migration 011). O erro foi detectado pelo agente implementador antes de causar falha de runtime.

**Como foi descoberto:**
O agente 05 leu a migration 011 antes de implementar e identificou que `turma_id` não existe em `frequencia`.

**Causa provável:**
O Agente 20 inferiu que a tabela teria `turma_id` por analogia com outras tabelas (ex: `notas_aluno`), sem verificar o schema real.

**Impacto:**
Nenhum no código final — o erro foi corrigido preventivamente. Potencial: query SQL com coluna inexistente retornaria erro silencioso do Supabase.

**Correção aplicada:**
Função implementada como `getResumoFrequenciaPorTurma(disciplinaId, alunoIds?)` com filtro correto por `disciplina_id` + `IN (alunoIds)`.

**Como evitar no futuro:**
Agente 20 deve incluir no checklist de spec: "Para tasks com filtro SQL, consultar a migration da tabela e confirmar o nome exato da coluna antes de especificar."

**Prompt precisa melhorar?** Sim — adicionar instrução ao SKILL.md do Agente 20: "Antes de nomear colunas em specs de query, verificar migrations existentes."
**Skill precisa melhorar?** Sim — checklist de spec do Agente 20
**Checklist precisa melhorar?** Sim — adicionar item de validação de schema
**Documento precisa melhorar?** Não

**Status:** corrigido
**Aprovado pelo Hélio:** Não necessário

---

## ERR-002 — WARN-UX-001: LancarNotas não acessível pela UI do professor

**Data:** 2026-05-29
**Agente envolvido:** 06-frontend-engineer
**Tipo de erro:** outro (omissão de navegação)
**Gravidade:** baixa

**Descrição:**
A tela `LancarNotas.tsx` foi criada com rota `/dashboard/professor/notas/:turmaId/:disciplinaId`, mas nenhum link no `ProfessorHome.tsx` ou sidebar aponta para ela. A feature funciona se acessada diretamente pela URL, mas não é descobrível pelo professor na UI atual.

**Como foi descoberto:**
Revisão do Agente 12 (code review) durante checklist final do Sprint J.

**Causa provável:**
`ProfessorHome.tsx` não expõe `turmaId` facilmente para gerar o link correto. O agente priorizou implementar a tela em vez de bloquear o sprint esperando a integração com o componente pai.

**Impacto:**
Feature criada mas inacessível pela UI. Nenhum dado comprometido.

**Correção aplicada:**
Nenhuma ainda — registrado como pendência para Sprint J-ext ou K.

**Como evitar no futuro:**
Ao criar tela com parâmetros de rota obrigatórios, verificar se o componente pai tem acesso a esses parâmetros e criar o link de entrada. Se não tiver, incluir a criação do link como subtask obrigatória no mesmo sprint.

**Prompt precisa melhorar?** Sim — Agente 06 deve incluir no checklist: "A nova tela tem ponto de entrada acessível pela UI atual?"
**Skill precisa melhorar?** Sim — checklist de entrega do Agente 06
**Checklist precisa melhorar?** Sim
**Documento precisa melhorar?** Não

**Status:** corrigido
**Aprovado pelo Hélio:** Não necessário

---

## ERR-SCHEMA-001

**Data:** 2026-05-29
**Sprint:** J
**Agente:** 20-project-manager
**Erro:** Spec referenciou coluna `turma_id` em tabela `frequencia`
      que não existe. Correto: `disciplinaId` + `alunoIds[]`.
**Prevenção:** MELHORIA-001 aplicada no SKILL.md do Agente 20.

---

## ERR-UX-001

**Data:** 2026-05-29
**Sprint:** J
**Agente:** 06-frontend-engineer
**Erro:** `LancarNotas.tsx` entregue sem ponto de entrada na UI.
      Professor não conseguia acessar sem URL manual.
**Prevenção:** MELHORIA-002 aplicada no SKILL.md do Agente 06.

---

*Mantido pelo agente-Osabio · ITEC-EAD · 2025*
