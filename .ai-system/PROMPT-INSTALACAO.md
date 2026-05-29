# Prompt de Instalação — Agentes 19, 20 e agente-Osabio
## ITEC-EAD · Atualização do Sistema de Agentes IA

---

Cole este prompt no Claude Code com o projeto ITEC-EAD aberto.

---

```
Leia o arquivo .ai-system/CLAUDE.md para confirmar o contexto do projeto.

Vou instalar uma atualização no sistema de agentes deste projeto.
Não modifique nenhum arquivo existente fora das pastas descritas abaixo.
Não altere código, banco de dados, autenticação ou qualquer outra parte do projeto.
Apenas crie as pastas e arquivos listados.

---

## O QUE SERÁ FEITO

Serão criadas 4 novas pastas dentro de .ai-system/ e 10 novos arquivos.
Nenhum arquivo existente será alterado, exceto o README.md que será substituído.

---

## PASSO 1 — Criar as novas pastas

Dentro de .ai-system/, crie as seguintes pastas caso não existam:

  .ai-system/agents/core/
  .ai-system/memory/
  .ai-system/checklists/
  .ai-system/docs/

---

## PASSO 2 — Criar o arquivo do agente-Osabio

Crie o arquivo:
  .ai-system/agents/core/agente-Osabio.md

Com o seguinte conteúdo:

[COLAR AQUI O CONTEÚDO COMPLETO DO ARQUIVO agente-Osabio.md]

---

## PASSO 3 — Criar o arquivo do Agente 19

Crie o arquivo:
  .ai-system/agents/19-product-analyst/SKILL.md

Com o seguinte conteúdo:

[COLAR AQUI O CONTEÚDO COMPLETO DO ARQUIVO SKILL-19-product-analyst.md]

---

## PASSO 4 — Criar o arquivo do Agente 20

Crie o arquivo:
  .ai-system/agents/20-project-manager/SKILL.md

Com o seguinte conteúdo:

[COLAR AQUI O CONTEÚDO COMPLETO DO ARQUIVO SKILL-20-project-manager.md]

---

## PASSO 5 — Criar os arquivos de memória técnica

Crie os seguintes arquivos dentro de .ai-system/memory/:

  agent-maturity-map.md
  [COLAR CONTEÚDO DO ARQUIVO agent-maturity-map.md]

  known-errors.md
  [COLAR CONTEÚDO DO ARQUIVO known-errors.md]

  lessons-learned.md
  [COLAR CONTEÚDO DO ARQUIVO lessons-learned.md]

  agent-feedback-log.md
  [COLAR CONTEÚDO DO ARQUIVO agent-feedback-log.md]

---

## PASSO 6 — Criar o arquivo de checklists

Crie o arquivo:
  .ai-system/checklists/quality-checklists.md

[COLAR CONTEÚDO DO ARQUIVO quality-checklists.md]

---

## PASSO 7 — Criar o arquivo de regras e fluxos

Crie o arquivo:
  .ai-system/docs/agent-safety-rules.md

[COLAR CONTEÚDO DO ARQUIVO agent-safety-rules.md]

---

## PASSO 8 — Substituir o README

Substitua o conteúdo de:
  .ai-system/README.md

Pelo conteúdo do arquivo README-ai-system-v3.md.

---

## PASSO 9 — Criar os ADRs

Crie os seguintes arquivos em .ai-system/adr/:

  ADR-019-agentes-estrategicos.md
  [COLAR CONTEÚDO DO ARQUIVO ADR-019-agentes-estrategicos.md]

  MANUAL-AGENTES-19-20.md  (salvar em .ai-system/ na raiz)
  [COLAR CONTEÚDO DO ARQUIVO MANUAL-AGENTES-19-20.md]

---

## PASSO 10 — Verificação final

Após criar todos os arquivos, confirme:

1. Liste o conteúdo de .ai-system/agents/core/ — deve mostrar agente-Osabio.md
2. Liste o conteúdo de .ai-system/agents/ — deve mostrar as pastas 01 a 20 + core/
3. Liste o conteúdo de .ai-system/memory/ — deve mostrar 4 arquivos
4. Liste o conteúdo de .ai-system/checklists/ — deve mostrar quality-checklists.md
5. Liste o conteúdo de .ai-system/docs/ — deve mostrar agent-safety-rules.md
6. Confirme que .ai-system/README.md foi atualizado (deve mencionar "v3" ou "agente-Osabio")

---

## PASSO 11 — Commit

Após verificação, faça o commit:

  git add .ai-system/
  git commit -m "chore(agents): adicionar agentes 19, 20 e agente-Osabio com memória técnica"

---

## RESULTADO ESPERADO

Ao final, a estrutura .ai-system/ deve estar assim:

  .ai-system/
  ├── CLAUDE.md
  ├── SYSTEM.md
  ├── STACK.md
  ├── ARCHITECTURE.md
  ├── README.md                          ← versão v3 atualizada
  ├── MANUAL-AGENTES-19-20.md            ← novo
  │
  ├── agents/
  │   ├── core/
  │   │   └── agente-Osabio.md           ← novo
  │   ├── 19-product-analyst/SKILL.md    ← novo
  │   ├── 20-project-manager/SKILL.md    ← novo
  │   └── 01 a 18 (sem alteração)
  │
  ├── memory/                            ← pasta nova
  │   ├── agent-maturity-map.md
  │   ├── known-errors.md
  │   ├── lessons-learned.md
  │   └── agent-feedback-log.md
  │
  ├── checklists/                        ← pasta nova
  │   └── quality-checklists.md
  │
  ├── docs/                              ← pasta nova
  │   └── agent-safety-rules.md
  │
  ├── adr/
  │   └── ADR-019-agentes-estrategicos.md  ← novo
  │
  ├── templates/    (sem alteração)
  ├── specs/        (sem alteração)
  ├── audit/        (sem alteração)
  └── runbooks/     (sem alteração)

---

## IMPORTANTE

- NÃO altere nenhum arquivo fora de .ai-system/
- NÃO modifique os agentes 01 a 18 existentes
- NÃO altere código, banco, autenticação ou deploy
- Se algum arquivo já existir com conteúdo diferente, pergunte antes de sobrescrever
- Se tiver dúvida sobre algum passo, PARE e informe antes de continuar
```
