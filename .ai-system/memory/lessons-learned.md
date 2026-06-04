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

## LICAO-010 — Regras de hierarquia em função pura testável, não inline

**Data:** 2026-06-01
**Contexto:** Sprint fix-menus-dashboard — implementação de hierarquia de roles em Usuarios.tsx
**Problema:** Lógica de "quem pode alterar quem" poderia ter ficado inline no componente React ou numa policy SQL — ambos ilegíveis, não testáveis e difíceis de manter.
**Decisão tomada:** `getRolesPermitidas(meuRole, roleAlvo)` como função pura exportada — usada no service (validação real) e no frontend (opções do dropdown).
**Justificativa:** Função pura = testável em isolamento + sem mock de banco + lógica de negócio num único lugar. Qualquer mudança nas regras é feita em 1 arquivo.
**Agentes impactados:** 05-backend-engineer, 06-frontend-engineer
**Mudança aplicada:** MELHORIA-005 proposta — adicionar ao SKILL.md do Agente 05.
**Como aplicar no futuro:** Toda regra de permissão hierárquica → função pura exportada + testes unitários. Nunca inline no componente, nunca só na policy SQL.
**Status:** registrada

---

## LICAO-011 — Toda rota futura deve ter ComingSoonPage, não 404

**Data:** 2026-06-01
**Contexto:** Sprint fix-menus-dashboard — 10 novas rotas de features planejadas para sprints futuros
**Problema:** Sem placeholder, menus novos retornariam 404 — transmite descuido institucional. Com `null` ou redirect, o usuário não sabe o que esperar.
**Decisão tomada:** `ComingSoonPage` com `titulo`, `descricao` e `previsao` em toda rota de feature futura. Informativo e elegante.
**Justificativa:** 404 em menu ativo é pior que "em breve". O `ComingSoonPage` comunica intenção, define prazo e mantém a UI coerente.
**Agentes impactados:** 06-frontend-engineer, 20-project-manager
**Mudança aplicada:** MELHORIA-005 no SKILL.md do Agente 06 — seção "Rotas de Feature Futura".
**Como aplicar no futuro:** Nova rota planejada mas não implementada → `element={<ComingSoonPage titulo="..." descricao="..." previsao="..." icone={...} />}`. Nunca deixar rota sem element.
**Status:** registrada

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

## MELHORIA-005 — 06-frontend-engineer — ComingSoonPage como padrão para rotas futuras

**Data:** 2026-06-01
**Agente:** 06-frontend-engineer
**Nível anterior:** 3 — Confiável
**Nível novo:** sem mudança de nível

**Problema identificado:**
Sem convenção estabelecida, rotas de features planejadas poderiam ficar sem element no router, causando 404 silencioso — ou serem deixadas de fora do router completamente.

**Melhoria aplicada:**
Adicionado ao SKILL.md do Agente 06:
> "Para toda rota de feature planejada mas ainda não implementada, usar `ComingSoonPage` com `titulo`, `descricao` e `previsao`. Nunca deixar rota sem element. 404 em menu ativo transmite descuido."

**Arquivos alterados:**
- `.ai-system/agents/06-frontend-engineer/SKILL.md` — nova subseção em "PADRÕES DE COMPONENTES ESTABELECIDOS"

**Risco da alteração:** baixo
**Resultado esperado:** Toda rota nova no router tem element definido, mesmo que seja `ComingSoonPage`.
**Aprovado por:** Hélio (2026-06-01)
**Status:** aplicada

---

## MELHORIA-006 — 05-backend-engineer — Regras de hierarquia em função pura testável

**Data:** 2026-06-01
**Agente:** 05-backend-engineer
**Nível anterior:** 3 — Confiável
**Nível novo:** sem mudança de nível

**Problema identificado:**
Regras de permissão hierárquica (`quem pode alterar quem`) tendem a ficar inline no componente ou numa policy SQL — ilegíveis, não testáveis e difíceis de manter.

**Melhoria aplicada:**
Adicionado ao SKILL.md do Agente 05:
> "Regras de hierarquia de permissão → função pura exportada (`getFoo(param): string[]`) com testes unitários próprios. Usada no service (validação) e no frontend (opções do UI). Nunca inline no componente."

**Arquivos alterados:**
- `.ai-system/agents/05-backend-engineer/SKILL.md` — nova seção "REGRAS DE NEGÓCIO COMO FUNÇÕES PURAS"

**Risco da alteração:** baixo
**Resultado esperado:** Toda lógica de hierarquia/permissão tem teste unitário e ponto único de verdade.
**Aprovado por:** Hélio (2026-06-01)
**Status:** aplicada

---

## DECISAO-PRODUTO-001 — Upload de documentos (B2) adiado para Sprint L

**Data:** 2026-06-01
**Tipo:** Decisão de produto aprovada pelo Hélio
**Contexto:** Sprint K — análise de prioridade pelo Agente 19

**Decisão:** Upload real de documentos adiado para Sprint L.

**Motivo:** Não bloqueante para a operação da Camila no curto prazo. O volume de alunos antes do lançamento (agosto 2026) é pequeno o suficiente para controle manual.

**Solução interim — Sprint K:**
Checklist visual de documentos com controle de status por item:
- Secretaria marca cada documento como "recebido" manualmente
- Dados salvos em `documentos_aluno` com `status: 'recebido' | 'pendente' | 'ausente'`
- Visual: checkbox clicável por documento, sem upload de arquivo
- Sem necessidade de bucket no Supabase Storage ainda

**Sprint L:** Adicionar botão de upload real quando o checklist estiver em uso e validado em produção.

**Status:** registrada

---

## LICAO-012 — Filtro em memória após query paginada quebra o total

**Data:** 2026-06-01
**Contexto:** Sprint K — `getUsuarios + data.filter()` em `Alunos.tsx`
**Problema:** `getUsuarios` retornava `total = N_todos_profiles`. Filtro em memória reduzia os dados exibidos mas o `total` continuava errado. Paginação calculava páginas erradas silenciosamente.
**Decisão tomada:** Criar `getAlunos()` com filtro `.in('role', [...])` no banco — total correto vem do banco.
**Como aplicar no futuro:** Filtro em memória pós-paginação = antipadrão. Filtrar sempre na query. `Array.filter()` só para dados já completos (sem paginação).
**Agentes impactados:** 05-backend-engineer, 06-frontend-engineer
**Status:** aplicada

---

## LICAO-013 — Mudança de assinatura de função exportada requer busca de todos os chamadores

**Data:** 2026-06-01
**Contexto:** Sprint K — `updateRole` mudou de 2 para 3 args; `Alunos.tsx` ficou com 2 args sem aviso de TS
**Problema:** Aprovação de alunos quebrada silenciosamente em produção. Descoberta só no diagnóstico.
**Decisão tomada:** Corrigir `Alunos.tsx:229,241`. Registrar regra para evitar recorrência.
**Como aplicar no futuro:** Ao mudar assinatura de função exportada, executar `grep -rn "nomeFuncao" src/` e atualizar todos os chamadores antes do commit. Nunca assumir que o TypeScript vai capturar.
**Agentes impactados:** 05-backend-engineer (MELHORIA-008)
**Status:** aplicada

---

## LICAO-014 — CLI do Supabase incompatível com formato YYYYMMDD_NNN de migrations

**Data:** 2026-06-01
**Contexto:** Sprint K — `supabase db push` e `migration repair` falharam com "invalid version number"
**Problema:** CLI espera formato `YYYYMMDDHHMMSS` (14 dígitos). O projeto usa `YYYYMMDD_NNN_descricao`.
**Decisão tomada:** Migrations sempre via SQL Editor do Supabase (role: `service_role`). Ver `supabase/seed/RUNBOOK.md`.
**Como aplicar no futuro:** Para este projeto, nunca usar `supabase db push` no projeto remoto. CLI só para desenvolvimento local com `supabase start`.
**Agentes impactados:** 09-infra-engineer, 04-db-architect
**Status:** registrada

---

## LICAO-015 — Funcionalidades que requerem service_role devem ter placeholder explícito

**Data:** 2026-06-01
**Contexto:** Sprint K — `executarExclusao` e `criarAluno` requerem `auth.admin.*` indisponível no frontend
**Problema:** Bloquear UI enquanto Edge Function não existe impede entrega incremental.
**Decisão tomada:** Placeholder no service com `{ error: 'Edge Function não configurada — Sprint X' }` + UI completa + TODO em `known-errors.md`.
**Como aplicar no futuro:** Toda feature com `service_role`: (1) placeholder; (2) UI completa; (3) TODO documentado; (4) Edge Function no próximo sprint.
**Agentes impactados:** 05-backend-engineer (MELHORIA-007)
**Status:** registrada

---

## LICAO-016 — Mock encadeado quebra silenciosamente quando filtro de query muda

**Data:** 2026-06-02
**Contexto:** Sprint L — `getProfessores` migrou de `.eq('ativo', true)` para `.not('status', 'eq', 'desligado')`
**Problema:** Mock do teste encadeava `.eq` — sem `.not`, o método retornava `undefined` e lançava `TypeError` só na execução, não no build.
**Como aplicar no futuro:** Ao mudar método de query no service (`.eq` → `.not`, etc.), buscar todos os testes que mockam essa função e verificar o encadeamento. Não confiar no build — rodar `pnpm test:run`.
**Agentes impactados:** 10-test-engineer (MELHORIA-009)
**Status:** aplicada

---

## LICAO-018 — Frequência padrão deve ser 100%, não 0%, quando sem registros

**Data:** 2026-06-03
**Contexto:** Sprint M — `getHistoricoAluno` usava `freq?.percentual_presenca ?? 0`
**Problema:** Sem dados de frequência (professor ainda não lançou), o padrão 0% fazia `calcularStatus(media, 0)` retornar `reprovado_falta` incorretamente para disciplinas com notas já lançadas.
**Decisão tomada:** Trocar fallback para `?? 100` — consistente com `getResumoFrequencia` que já retorna 100% quando `total_aulas === 0`.
**Justificativa:** Sem dados não significa ausência — significa que ninguém registrou ainda. Punir o aluno por falta de lançamento seria erro de negócio grave.
**Como aplicar no futuro:** Sempre que usar `freq?.percentual_presenca`, usar `?? 100` — não `?? 0`.
**Agentes impactados:** 05-backend-engineer, 10-test-engineer
**Status:** aplicada

---

## LICAO-019 — Map/variável construída mas nunca consumida é query desperdiçada

**Data:** 2026-06-03
**Contexto:** Sprint M — `getAlunosEmRiscoByTurma` construía `alunoByMatricula` Map (Query 4) que nunca era consultado
**Problema:** A query extra executava sem propósito a cada chamada da função, multiplicada pelo número de turmas ativas no dashboard.
**Decisão tomada:** Remover a query e o Map completamente — a função já tinha as informações necessárias de queries anteriores.
**Como aplicar no futuro:** Antes de commitar, verificar se cada variável/Map construído é efetivamente lido em algum ponto da função. Map construído + nunca `.get()` = dead code.
**Agentes impactados:** 05-backend-engineer, 12-code-reviewer
**Status:** aplicada

---

## LICAO-020 — @schedule-x requer peer dependency @schedule-x/calendar

**Data:** 2026-06-04
**Contexto:** Sprint N — instalação de `@schedule-x/react` sem a peer dependency
**Problema:** `@schedule-x/react` lista `@schedule-x/calendar` como `peerDependency` mas não a instala automaticamente. Build passa, mas imports de `createViewMonthGrid`/`createViewWeek` não resolvem em runtime.
**Decisão tomada:** Instalar todas explicitamente: `pnpm add @schedule-x/react @schedule-x/calendar @schedule-x/theme-default`
**Como aplicar no futuro:** Ao instalar qualquer lib, verificar `peerDependencies` no `package.json` e instalar todas. `pnpm` avisa sobre peerDeps faltantes — não ignorar.
**Agentes impactados:** 06-frontend-engineer, 09-infra-engineer
**Status:** registrada

---

## LICAO-021 — Google Calendar: end deve ser data+1 para eventos de dia inteiro

**Data:** 2026-06-04
**Contexto:** Sprint N — `EventoModal` gerava `dates=20260421/20260421` para feriados
**Problema:** Google Calendar usa range **exclusivo**: `start/end` onde `end` é o primeiro dia fora do evento. Com start=end, o evento aparece com duração zero (ponto, sem bloco colorido).
**Decisão tomada:** Para dia inteiro: `endData = data + 1 dia`. Para com horário: sem mudança.
**Regra:** Dia inteiro: `dates=YYYYMMDD/YYYYMMDD+1` | Com horário: `dates=YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS`
**Como aplicar no futuro:** Toda integração com Google Calendar por link: always end = start+1 para dia inteiro.
**Agentes impactados:** 06-frontend-engineer
**Status:** aplicada

---

## LICAO-017 — Supabase Studio usa contexto postgres — não valida JWT de usuários

**Data:** 2026-06-02
**Contexto:** Sprint L — testes de RLS e Edge Function via Studio
**Problema:** Studio opera com role `postgres` (superusuário) — bypassa RLS e ignora JWTs. Testes de autorização via Studio sempre passam, mesmo que o acesso real esteja bloqueado.
**Como aplicar no futuro:** Sempre testar RLS e autorização via `curl` com Bearer token real. Studio não é confiável para validar políticas de acesso.
**Agentes impactados:** 07-auth-specialist, 11-security-auditor
**Status:** registrada

---

*Mantido pelo agente-Osabio · ITEC-EAD · 2025*
