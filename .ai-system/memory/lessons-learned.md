# Lições Aprendidas
## ITEC-EAD · Memória Técnica
**Mantido por:** agente-Osabio  
**Última atualização:** 2026-05-29

---

> **Propósito:** Toda decisão importante, todo ajuste de comportamento, toda descoberta
> sobre como os agentes funcionam melhor deve ser registrada aqui.
> A memória técnica é o que impede o projeto de cometer o mesmo erro duas vezes.

---

## Template de Registro

```markdown
---

## LICAO-[número] — [título da lição]

**Data:** [YYYY-MM-DD]
**Contexto:** [em qual situação a lição surgiu]
**Problema:** [o que estava acontecendo de errado]
**Decisão tomada:** [o que foi feito para resolver]
**Justificativa:** [por que essa foi a melhor decisão]
**Agentes impactados:** [quais agentes foram ajustados ou devem considerar essa lição]
**Mudança aplicada:** [o que foi alterado nos arquivos dos agentes]
**Resultado esperado:** [o que deve melhorar]
**Como aplicar no futuro:** [instrução clara para situações semelhantes]
**Status:** [registrada | aplicada | verificada]
```

---

## Lições Registradas

---

## LICAO-001 — Verificar schema do banco antes de especificar colunas em spec de performance

**Data:** 2026-05-29
**Contexto:** Sprint J — pré-requisito de performance P1 especificava `getResumoFrequenciaBatch(turmaId)`. A tabela `frequencia` não tem coluna `turma_id`.
**Problema:** O spec do Agente 20 referenciou `turma_id` em filtro SQL, mas a coluna não existe na migration 011. O agente implementador leu a migration e corrigiu antes de implementar, evitando erro de runtime.
**Decisão tomada:** Renomear a função para `getResumoFrequenciaPorTurma(disciplinaId, alunoIds?)` com filtro por `disciplina_id` (que existe) + `IN (alunoIds)`.
**Justificativa:** Filtrar por uma coluna inexistente quebraria silenciosamente (Supabase retorna erro). A correção preventiva foi mais rápida do que depurar depois.
**Agentes impactados:** 20-project-manager (spec), 05-backend-engineer (implementação), 13-performance-eng (diagnóstico)
**Mudança aplicada:** Nenhuma no agente — lição registrada para aplicação futura.
**Resultado esperado:** Specs de performance com nomes de colunas validados antes da entrega.
**Como aplicar no futuro:** Antes de especificar qualquer task que mencione filtro SQL por coluna (`WHERE coluna = X`), consultar a migration correspondente e confirmar que a coluna existe.
**Status:** registrada

---

## LICAO-002 — Diagnóstico antes de implementar: P2 e P3 já estavam resolvidos

**Data:** 2026-05-29
**Contexto:** Sprint J — P2 (LancarFrequencia) e P3 (VerTurma) eram tasks para eliminar N+1. O código já usava `calcularResumosPorAluno` (Sprint I).
**Problema:** O Agente 20 incluiu P2/P3 no sprint sem verificar se o problema ainda existia no código atual.
**Decisão tomada:** Agente leu o código antes de implementar, confirmou que N+1 já estava eliminado, e não fez mudança desnecessária. Documentou o diagnóstico e seguiu para P1 (a única mudança real necessária).
**Justificativa:** Refatorar código correto introduz risco sem benefício. "Don't fix what ain't broken."
**Agentes impactados:** 20-project-manager (planejamento), 13-performance-eng (diagnóstico)
**Mudança aplicada:** Nenhuma — comportamento correto confirmado.
**Resultado esperado:** Agente 20 inclui etapa de verificação de estado atual antes de criar tasks de fix/refactor.
**Como aplicar no futuro:** Para tasks de "eliminar X", sempre ler o código atual antes de implementar. Se X já foi eliminado, documentar e seguir.
**Status:** registrada

---

## LICAO-003 — Feature implementada mas não navegável: WARN-UX-001

**Data:** 2026-05-29
**Contexto:** Sprint J — `LancarNotas.tsx` criado e rota registrada, mas nenhum link no `ProfessorHome.tsx` ou na sidebar aponta para a tela.
**Problema:** O professor não consegue acessar a tela de notas pela UI — precisaria digitar a URL manualmente. A feature existe mas não é descobrível.
**Decisão tomada:** Registrado como WARN-UX-001. Aceito na fase de Sprint J pois `ProfessorHome.tsx` precisaria conhecer os `turmaId` disponíveis para gerar o link correto — isso depende do sistema de disciplinas do professor (a implementar no Sprint L/N ou em Sprint J-ext).
**Justificativa:** A lógica de listagem de disciplinas do professor já existe em `ProfessorHome.tsx`. Adicionar o botão "Lançar Notas" é trabalho de 30 minutos — mas requer turmaId que o componente atual não expõe facilmente.
**Agentes impactados:** 06-frontend-engineer, 20-project-manager
**Mudança aplicada:** Nenhuma — pendência registrada.
**Resultado esperado:** Sprint J-ext ou início do Sprint K inclui botão "Lançar Notas" em `ProfessorHome.tsx`.
**Como aplicar no futuro:** Ao criar uma nova página com parâmetros de rota (`:turmaId/:disciplinaId`), verificar imediatamente se há componente pai com acesso a esses parâmetros para criar o link de navegação. Se não, registrar como WARN-UX e incluir no próximo sprint.
**Status:** registrada

---

## LICAO-004 — Agentes que leem o schema antes de implementar evitam retrabalho

**Data:** 2026-05-29
**Contexto:** Sprint J — Agente 13 leu a migration antes de implementar e corrigiu a assinatura da função antes de escrever uma linha de código.
**Problema:** Spec do Agente 20 referenciou coluna inexistente. Sem a leitura prévia da migration, o erro teria chegado ao runtime.
**Decisão tomada:** Reforçado no SKILL.md do Agente 20 com verificação obrigatória de schema antes de toda spec de query.
**Justificativa:** Custo de ler uma migration: 30 segundos. Custo de retrabalho por coluna errada: 30 minutos ou mais.
**Agentes impactados:** 20-project-manager, 05-backend-engineer, 13-performance-eng
**Mudança aplicada:** MELHORIA-001 aplicada no SKILL.md do Agente 20.
**Resultado esperado:** Specs de query com nomes de colunas sempre validados contra as migrations.
**Como aplicar no futuro:** Antes de nomear qualquer coluna em spec de query, abrir a migration da tabela e confirmar nome e tipo.
**Status:** aplicada

---

## LICAO-005 — Feature sem ponto de entrada na UI é feature invisível

**Data:** 2026-05-29
**Contexto:** Sprint J — `LancarNotas.tsx` implementada e funcional, mas sem link de acesso em `ProfessorHome.tsx`.
**Problema:** Professor precisaria digitar a URL manualmente para acessar a tela de notas — comportamento inaceitável em produção.
**Decisão tomada:** Botão "Lançar Notas" adicionado em `ProfessorHome.tsx`. Regra reforçada no SKILL.md do Agente 06.
**Justificativa:** Não basta a rota existir. O usuário precisa de um caminho navegável até ela dentro do dashboard.
**Agentes impactados:** 06-frontend-engineer, 20-project-manager
**Mudança aplicada:** MELHORIA-002 aplicada no SKILL.md do Agente 06. WARN-UX-001 corrigido em `ProfessorHome.tsx`.
**Resultado esperado:** Toda feature entregue com pelo menos um ponto de entrada navegável.
**Como aplicar no futuro:** Ao criar nova tela, verificar obrigatoriamente se há link/botão apontando para ela antes do commit.
**Status:** aplicada

---

## LICAO-006 — Seed de usuários requer auth.identities além de auth.users

**Data:** 2026-05-30
**Contexto:** Sprint fix-ux-inline-edit — criação de usuários de teste via INSERT direto
**Problema:** Usuários inseridos em `auth.users` sem `auth.identities` autenticam no formulário mas recebem HTTP 500 ao acessar o dashboard. GoTrue não resolve a sessão sem a identity row.
**Decisão tomada:** Sempre criar `auth.identities` junto com `auth.users`. `seed_testes.sql` atualizado.
**Justificativa:** `auth.users` é o registro; `auth.identities` é o método de autenticação. Sem identity, não há sessão válida.
**Agentes impactados:** 07-auth-specialist, 04-db-architect
**Mudança aplicada:** ERR-SUPABASE-002 registrado.
**Como aplicar no futuro:** Todo INSERT manual em `auth.users` inclui INSERT em `auth.identities`. Usar `seed_testes.sql` como referência.
**Status:** aplicada

---

## LICAO-007 — Policies RLS não devem fazer SELECT em profiles para verificar role

**Data:** 2026-05-30
**Contexto:** Sprint fix-ux-inline-edit — UPDATE de role causava recursão silenciosa via is_staff()
**Problema:** `is_staff()` consultava `profiles.role`. UPDATE em `profiles` acionava a policy → chamava `is_staff()` → SELECT em `profiles` → recursão. Resultado: UPDATE bloqueado silenciosamente.
**Decisão tomada:** Propor ADR-006: tabela `user_roles` sem RLS como cache de roles para policies.
**Justificativa:** Policies que dependem da tabela protegida criam ciclos. Solução canônica: fonte de roles separada e sem RLS.
**Agentes impactados:** 07-auth-specialist, 04-db-architect
**Mudança aplicada:** ERR-SUPABASE-003 registrado. ADR-006 proposto.
**Como aplicar no futuro:** Ao criar policy que verifica role, usar `user_roles` ou `auth.jwt()` — nunca `SELECT FROM profiles`.
**Status:** registrada — ADR-006 pendente

---

## LICAO-008 — CHECK constraint deve ser verificado antes de especificar opções de status

**Data:** 2026-05-30
**Contexto:** Sprint fix-ux-inline-edit — InlineStatusSelect com valores rejeitados pelo banco
**Problema:** Agente 20 especificou 7 opções para `matriculas.status`. Migration aceitava apenas 3. `onSave` retornava erro silencioso.
**Decisão tomada:** Regra adicionada ao SKILL.md do Agente 20: verificar CHECK antes de especificar options.
**Justificativa:** Dropdown com opções que o banco rejeita é armadilha silenciosa. Verificação do CHECK deve preceder a spec.
**Agentes impactados:** 20-project-manager, 04-db-architect, 06-frontend-engineer
**Mudança aplicada:** ERR-DB-001 registrado. MELHORIA-003 aplicada no Agente 20.
**Como aplicar no futuro:** Antes de listar options de status, rodar `pg_get_constraintdef` e confirmar valores. Se faltarem, criar migration primeiro.
**Status:** aplicada

---

## LICAO-009 — Componente base deve ser criado antes das tarefas que o consomem

**Data:** 2026-05-30
**Contexto:** Sprint fix-ux-inline-edit — Agente 20 ordenou InlineStatusSelect (1.5) após 1.3 e 1.4
**Problema:** Tarefas 1.3 e 1.4 precisavam de InlineStatusSelect. Agente 20 posicionou 1.5 depois. O Hélio reordenou manualmente.
**Decisão tomada:** Regra adicionada ao SKILL.md do Agente 20: dependências de artefato UI são dependências de execução.
**Justificativa:** O Hélio não deveria corrigir ordem de dependências — isso é trabalho do Agente 20.
**Agentes impactados:** 20-project-manager
**Mudança aplicada:** MELHORIA-003 aplicada no SKILL.md do Agente 20.
**Como aplicar no futuro:** Se B usa o que A cria → A precede B no plano. Sempre.
**Status:** aplicada

---

*Mantido pelo agente-Osabio · ITEC-EAD · 2025*


---
---

# Histórico de Melhorias dos Agentes
## ITEC-EAD · Rastreabilidade de Evolução
**Mantido por:** agente-Osabio  
**Última atualização:** 2026-05-29

---

> **Propósito:** Todo agente que receber uma melhoria tem essa melhoria registrada aqui.
> Rastreabilidade é não negociável. Se não está registrado, não aconteceu.

---

## Template de Registro

```markdown
---

## MELHORIA-[número] — [agente] — [título da melhoria]

**Data:** [YYYY-MM-DD]
**Agente:** [qual agente foi melhorado]
**Nível anterior:** [nível antes da melhoria]
**Nível novo:** [nível após a melhoria — ou "sem mudança de nível"]

**Problema identificado:**
[O que estava errado ou incompleto]

**Melhoria aplicada:**
[O que foi feito — o mais específico possível]

**Arquivos alterados:**
- [caminho/arquivo.md — o que mudou]

**Risco da alteração:** [baixo | médio | alto]
**Reversibilidade:** [como desfazer se necessário]

**Teste recomendado:**
[Como verificar se a melhoria funcionou]

**Resultado esperado:**
[O que deve melhorar no comportamento do agente]

**Aprovado por:** [Hélio / não necessário]
**Status:** [proposta | aprovada | aplicada | verificada]
```

---

## Histórico de Melhorias

---

## MELHORIA-001 — 20-project-manager — Validar schema antes de spec de query

**Data:** 2026-05-29
**Agente:** 20-project-manager
**Nível anterior:** 3 — Confiável
**Nível novo:** sem mudança de nível (melhoria de checklist, não de comportamento estrutural)

**Problema identificado:**
Spec do Sprint J referenciou coluna `turma_id` em `frequencia` que não existe no banco. Agente implementador teve que corrigir. Risco de erro silencioso se não houvesse verificação.

**Melhoria aplicada:**
Proposta — adicionar ao checklist de spec do Agente 20 o item:
> "Para tasks com filtro SQL (WHERE col = X, IN, JOIN), consultar a migration da tabela correspondente e confirmar o nome exato de cada coluna antes de nomear na spec."

**Arquivos a alterar:**
- `.ai-system/agents/20-project-manager/SKILL.md` — adicionar item no checklist de criação de spec

**Risco da alteração:** baixo
**Reversibilidade:** total — é adição de checklist, não mudança de lógica

**Teste recomendado:**
No próximo sprint com task de performance/query, verificar se o Agente 20 cita a migration no spec.

**Resultado esperado:**
Eliminação de erros de spec por coluna inexistente.

**Aprovado por:** Hélio (2026-05-29)
**Status:** aplicada

---

## MELHORIA-002 — 06-frontend-engineer — Verificar ponto de entrada na UI ao criar nova tela

**Data:** 2026-05-29
**Agente:** 06-frontend-engineer
**Nível anterior:** 3 — Confiável
**Nível novo:** sem mudança de nível

**Problema identificado:**
`LancarNotas.tsx` criada sem link de entrada no `ProfessorHome.tsx`. Feature inacessível pela UI sem digitar URL manualmente.

**Melhoria aplicada:**
Proposta — adicionar ao checklist de entrega do Agente 06:
> "Ao criar nova tela com parâmetros de rota obrigatórios (:param), verificar: (1) qual componente pai tem acesso a esses parâmetros; (2) criar link/botão de navegação nesse componente como subtask obrigatória do mesmo sprint."

**Arquivos a alterar:**
- `.ai-system/agents/06-frontend-engineer/SKILL.md` — adicionar item no checklist de entrega

**Risco da alteração:** baixo
**Reversibilidade:** total

**Teste recomendado:**
No próximo sprint com nova tela, verificar se há link de entrada funcional na UI antes do commit.

**Resultado esperado:**
Toda feature frontend entregue com ponto de entrada navegável.

**Aprovado por:** Hélio (2026-05-29)
**Status:** aplicada

---

## MELHORIA-003 — 20-project-manager — Verificar CHECK constraint e ordenar dependências de componente

**Data:** 2026-05-30
**Agente:** 20-project-manager
**Nível anterior:** 3 — Confiável
**Nível novo:** sem mudança de nível (melhorias de checklist)

**Problema identificado:**
1. Spec de InlineStatusSelect especificou options de status sem verificar o CHECK constraint da tabela — 4 dos 7 valores eram rejeitados pelo banco.
2. Componente `InlineStatusSelect` (Tarefa 1.5) foi posicionado no plano APÓS as tarefas que o consomem (1.3, 1.4). O Hélio corrigiu a ordem manualmente.

**Melhoria aplicada:**
Duas regras adicionadas ao SKILL.md do Agente 20:
1. "Antes de especificar opções de status em qualquer dropdown/select, verificar o CHECK constraint da tabela. Se os valores necessários não estiverem no CHECK, criar migration primeiro."
2. "Ao identificar que uma tarefa cria um artefato (componente, hook, service) e outra tarefa o consome, o criador deve preceder o consumidor no plano. Regra: se B usa o que A cria → A < B."

**Arquivos alterados:**
- `.ai-system/agents/20-project-manager/SKILL.md` — nova seção "VERIFICAÇÃO DE CONSTRAINTS E DEPENDÊNCIAS"

**Risco da alteração:** baixo
**Reversibilidade:** total

**Resultado esperado:**
Zero planos com componentes base posicionados após seus consumidores. Zero specs com opções de status não validadas contra o CHECK.

**Aprovado por:** Hélio (2026-05-30)
**Status:** aplicada

---

## MELHORIA-004 — 06-frontend-engineer — InlineStatusSelect como padrão oficial de edição inline

**Data:** 2026-05-30
**Agente:** 06-frontend-engineer
**Nível anterior:** 3 — Confiável
**Nível novo:** sem mudança de nível

**Problema identificado:**
Sem convenção estabelecida, o agente poderia criar implementações ad-hoc de edição inline por tabela, gerando inconsistência visual e duplicação de código.

**Melhoria aplicada:**
Adicionado ao SKILL.md do Agente 06:
> "Para edição inline de campos enumeráveis (status, role, tipo) em tabelas, usar obrigatoriamente o componente `InlineStatusSelect` de `src/components/dashboard/`. Não criar implementações ad-hoc. O componente aceita `options`, `onSave` e `disabled` — toda a lógica de estado (idle/editing/saving/error) já está encapsulada."

**Arquivos alterados:**
- `.ai-system/agents/06-frontend-engineer/SKILL.md` — nova seção "PADRÕES DE COMPONENTES ESTABELECIDOS"

**Risco da alteração:** baixo
**Reversibilidade:** total

**Resultado esperado:**
Todas as futuras tabelas com campos editáveis inline usam `InlineStatusSelect`.

**Aprovado por:** Hélio (2026-05-30)
**Status:** aplicada

---

*Mantido pelo agente-Osabio · ITEC-EAD · 2025*
