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

## LICAO-025 — VIEW sem RLS é a solução canônica para verificação de roles em policies

**Data:** 2026-06-06
**Contexto:** Sprint RLS Segurança — criação de `user_roles` VIEW sem RLS
**Problema:** Policies de RLS precisam verificar role do usuário, mas consultar `profiles` diretamente causaria recursão infinita (policy chama SELECT → SELECT aciona policy → loop).
**Decisão tomada:** Criar VIEW `user_roles` que projeta apenas `(user_id, role)` de `profiles` SEM RLS ativado. Policies de todas as tabelas usam `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN (...))`.
**Justificativa:** VIEW sem RLS quebra o ciclo de recursão. É a solução recomendada pela documentação do Supabase e PostgreSQL para esse padrão.
**Agentes impactados:** 04-db-architect, 07-auth-specialist, 11-security-auditor
**Mudança aplicada:** Migration 032 criada. Padrão documentado no resumo do sprint.
**Resultado esperado:** Toda nova policy que precisa verificar role usa `user_roles`, nunca `profiles`.
**Como aplicar no futuro:** Ao criar policy RLS que verifica role: `EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN (...))` — nunca `SELECT FROM profiles`.
**Status:** aplicada

---

## LICAO-026 — Joins aninhados + RLS em ambas tabelas = falha silenciosa

**Data:** 2026-06-06
**Contexto:** Sprint RLS Segurança — BUG-RLS-001 em `/dashboard/alunos`
**Problema:** Query `.select('*, matriculas(id, status, created_at)')` com RLS ativo em AMBAS `profiles` E `matriculas` falhava silenciosamente — retornava array vazio sem erro explícito. Policy de cada tabela isoladamente funcionava, mas o join aninhado falhava.
**Decisão tomada:** Substituir join aninhado por queries separadas + merge manual no service:
```typescript
// Query 1: profiles
const { data: profiles } = await supabase.from('profiles').select('*').in('role', ['aluno', 'pendente']);
// Query 2: matriculas
const { data: matriculas } = await supabase.from('matriculas').select('*').in('aluno_id', profileIds);
// Merge manual
```
**Justificativa:** Supabase/PostgREST tem limitação conhecida com joins complexos quando ambas tabelas têm RLS. Queries separadas são mais verbosas mas funcionam de forma confiável.
**Agentes impactados:** 05-backend-engineer, 04-db-architect
**Mudança aplicada:** `getAlunos()` refatorado. Comentário adicionado na migration 035.
**Resultado esperado:** Queries com join aninhado + RLS em ambas tabelas são evitadas. Preferir queries separadas.
**Como aplicar no futuro:** Se ambas tabelas têm RLS E a query precisa de join → usar queries separadas + merge manual. Joins aninhados só quando UMA tabela tem RLS ou nenhuma tem.
**Status:** aplicada

---

## LICAO-027 — Erros de query RLS NÃO devem ser silenciados — sempre logar

**Data:** 2026-06-06
**Contexto:** Sprint RLS Segurança — BUG-RLS-002
**Problema:** Service retornava `if (error) return { data: [], total: 0 }` sem logar o erro. Quando RLS bloqueou a query, a UI mostrou "Nenhum aluno cadastrado" mas o Hélio não sabia que era erro de RLS — achou que era bug de lógica.
**Decisão tomada:** Adicionar log explícito antes do fallback:
```typescript
if (error) {
  console.error('[getAlunos] RLS error:', error);
  return { data: [], total: 0 };
}
```
**Justificativa:** Diagnóstico de RLS é impossível sem os logs. Fallback silencioso esconde a causa raiz.
**Agentes impactados:** 05-backend-engineer, 13-performance-eng
**Mudança aplicada:** Log adicionado em `getAlunos()`.
**Resultado esperado:** Todo service que faz fallback silencioso loga o erro antes.
**Como aplicar no futuro:** NUNCA fazer `if (error) return fallback` sem `console.error(contexto, error)` antes.
**Status:** aplicada

---

## LICAO-028 — Testes manuais na UI são obrigatórios após ativar RLS

**Data:** 2026-06-06
**Contexto:** Sprint RLS Segurança — queries que passavam em SQL Editor falhavam na UI
**Problema:** RLS pode passar em testes SQL diretos (via `service_role` que bypassa RLS) mas falhar na UI real (via `authenticated` role que respeita RLS). SQL Editor não simula o contexto real do `auth.uid()`.
**Decisão tomada:** Sempre testar na UI real após aplicar RLS. Não confiar apenas em testes SQL.
**Justificativa:** `service_role` bypassa RLS — testes SQL não representam o comportamento real do usuário.
**Agentes impactados:** 11-security-auditor, 10-test-engineer
**Mudança aplicada:** Checklist de RLS atualizado: "Testar login + navegação completa após ativar RLS".
**Resultado esperado:** Zero casos de RLS que passa em SQL mas falha na UI.
**Como aplicar no futuro:** Ao ativar RLS em qualquer tabela: (1) aplicar migration; (2) fazer login como usuário real; (3) testar TODAS as telas que acessam a tabela; (4) verificar DevTools Console por erros.
**Status:** aplicada

---

## LICAO-029 — Rollback migrations devem ser criados ANTES da implementação, não depois

**Data:** 2026-06-06
**Contexto:** Sprint RLS Segurança — migrations 032-035
**Problema:** Sem rollback, qualquer problema em produção requer troubleshooting sob pressão. Criar rollback depois de já ter deployado é mais arriscado.
**Decisão tomada:** Todo arquivo `*_migration.sql` tem rollback `*_migration_rollback.sql` criado NO MESMO COMMIT. Rollback é parte da implementação, não afterthought.
**Justificativa:** Rollback feito com calma antes do deploy é mais confiável que rollback improvisado durante incidente.
**Agentes impactados:** 04-db-architect, 09-infra-engineer
**Mudança aplicada:** Padrão estabelecido no Sprint RLS. Checklist atualizado.
**Resultado esperado:** 100% das migrations futuras têm rollback antes do deploy.
**Como aplicar no futuro:** Ao criar migration, criar rollback imediatamente. Testar o rollback localmente antes do deploy.
**Status:** aplicada

---

## LICAO-030 — ERR-INFRA-001 funciona: migrations via SQL Editor > CLI

**Data:** 2026-06-06
**Contexto:** Sprint RLS Segurança — aplicação manual via SQL Editor
**Problema:** CLI do Supabase não funciona com o formato de migrations deste projeto (YYYYMMDD_NNN vs YYYYMMDDHHMMSS). Tentativas de `db push` falhavam.
**Decisão tomada:** Migrations SEMPRE via SQL Editor manual (service_role). Hélio copia/cola SQL completo e executa. Zero uso de CLI para migrations remotas.
**Justificativa:** (1) CLI incompatível com o formato; (2) controle manual é mais seguro; (3) Hélio vê o SQL completo antes de aplicar.
**Agentes impactados:** 09-infra-engineer, 04-db-architect
**Mudança aplicada:** Procedimento consolidado. Padrão seguido com sucesso no Sprint RLS (4 migrations aplicadas sem erro).
**Resultado esperado:** Zero tentativas de usar CLI para migrations remotas.
**Como aplicar no futuro:** Toda migration: (1) Agente cria `.sql`; (2) Hélio copia/cola no SQL Editor; (3) Hélio executa manualmente. CLI só para dev local (`supabase start`).
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

## LICAO-023 — startOfWeek com Domingo como base carrega o mês errado no calendário

**Data:** 2026-06-04
**Contexto:** Sprint N hotfixes — CalendarioAcademico exibia semana vazia
**Problema:** `startOfWeek` usava `d.getDay()` (0=Dom) para recuar ao início da semana. Quando hoje é quarta-feira (4 jun), o domingo anterior é 31/mai. O `ano/mes` sincronizava para maio → carregava eventos de maio → a semana exibia junho vazia.
**Decisão tomada:** Mudar `startOfWeek` para usar Segunda-feira como base: `diff = day === 0 ? -6 : 1 - day`. Além disso, usar `getEventosSemana(inicio, fim)` que carrega por range exato, independente do mês.
**Como aplicar no futuro:** Em qualquer componente de calendário: (1) definir explicitamente qual dia é o início da semana (geralmente Segunda para PT-BR); (2) carregar eventos por range de datas, não por mês — evita perda quando semana cruza mês.
**Agentes impactados:** 06-frontend-engineer, App Mobile v1 (futura feature)
**Status:** aplicada

---

## LICAO-024 — CSS libs com dark mode auto-detect conflitam com Tailwind `.dark`

**Data:** 2026-06-04
**Contexto:** Sprint N hotfixes — @schedule-x renderizava tela preta no dashboard escuro
**Problema:** @schedule-x detecta a classe `.dark` no `<html>` (colocada pelo Tailwind dark mode) e aplica tema escuro. Colocar `data-theme="light"` num elemento filho não sobrescreve a detecção global da lib. O calendário renderizava texto branco sobre fundo preto = tela preta.
**Decisão tomada:** CSS override scoped em `.sx-react-calendar-wrapper *` com `color-scheme: light !important` + cores explícitas. Em seguida, @schedule-x foi substituído por CSS Grid próprio — eliminando o problema.
**Como aplicar no futuro:** Ao instalar qualquer lib de UI com dark mode automático junto com Tailwind: (1) verificar se a lib detecta `.dark` no `<html>`; (2) se sim, criar CSS override scoped antes de usar; (3) considerar lib sem auto-detect ou com prop explícita.
**Agentes impactados:** 06-frontend-engineer
**Status:** aplicada

---

## LICAO-022 — @schedule-x: events no config são inicialização, não binding reativo

**Data:** 2026-06-04
**Contexto:** Sprint N — CalendarioAcademico.tsx atualiza eventos após cada fetch
**Problema:** `useNextCalendarApp({events: minhaLista})` aplica os eventos apenas na inicialização. Ao alterar a variável passada, o calendário NÃO atualiza — porque o hook não cria um binding reativo com a prop `events`.
**Decisão tomada:** Usar `useEffect` + `calendar.events.set(novaLista)` para atualizar eventos de forma imperativa após cada mudança.
**Como aplicar no futuro:** Para qualquer dado dinâmico (eventos carregados do banco, filtros):
1. Criar o calendário uma vez com `useNextCalendarApp({events: []})`
2. Quando dados mudarem: `if (calendar) calendar.events.set(novosEventos)`
3. NUNCA passar estado reativo em `events:` esperando atualização automática
**Agentes impactados:** 06-frontend-engineer
**Status:** registrada

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

## LICAO-031 — Auditoria deve verificar no banco antes de classificar severidade

**Data:** 2026-06-11
**Contexto:** Revisão pós-sprint 11/06 — Agente 14 emitiu relatório de auditoria
**Problema:** Agente 14 reportou "14 tabelas sem RLS" quando TODAS as 29 tabelas já tinham RLS ativo. O diagnóstico foi feito por inferência de leitura parcial de arquivos de migration, sem consultar `pg_policies` no banco real.
**Decisão tomada:** Agente 11 validou via MCP read-only (`SELECT tablename FROM pg_policies GROUP BY tablename`) e confirmou que o relatório estava completamente errado. Nenhuma tabela estava sem RLS.
**Justificativa:** Migrations são artefatos históricos — não representam necessariamente o estado atual do banco. Policies podem ter sido adicionadas fora do histórico de arquivos, alteradas manualmente, ou o agente pode ter lido migrations parcialmente.
**Agentes impactados:** 14-security-auditor (correção crítica de comportamento)
**Mudança aplicada:** MELHORIA-007 proposta para Agente 14 — ver abaixo.
**Como aplicar no futuro:** Antes de classificar qualquer tabela como "sem RLS" ou emitir qualquer alerta de severidade sobre o banco: executar `SELECT tablename FROM pg_policies GROUP BY tablename` e comparar com a lista de tabelas. Só reportar ausência se confirmado pelo banco — nunca por inferência de arquivos.
**Status:** registrada — melhoria obrigatória no Agente 14

---

## LICAO-032 — Verificar nomes reais de policies antes de DROP POLICY

**Data:** 2026-06-11
**Contexto:** Migration 037 — DROP de policies antigas em taxa_matricula falhou
**Problema:** Agente inferiu nomes de policies com base em convenções do projeto. O nome real no banco era `taxa_aluno_ve_propria` — diferente do assumido. `DROP POLICY` falhou com "policy not found".
**Decisão tomada:** Workflow corrigido — consultar `SELECT policyname FROM pg_policies WHERE tablename = 'X'` antes de qualquer DROP. Usar nome exato retornado.
**Justificativa:** Policies podem ser criadas com nomes arbitrários. O banco é a única fonte de verdade. Inferência por convenção é arriscada e causa falha de migration.
**Agentes impactados:** 04-db-architect, 11-security-auditor
**Mudança aplicada:** ERR-RLS-004 registrado. Workflow de migrations com DROP atualizado.
**Como aplicar no futuro:** DROP POLICY em migrations → passo obrigatório antes: `SELECT policyname FROM pg_policies WHERE tablename = 'alvo'`. O Supabase MCP read-only permite essa verificação com segurança.
**Status:** aplicada

---

## LICAO-033 — LICAO-026 reforçada: join aninhado com RLS = vazio silencioso (confirmado em R06)

**Data:** 2026-06-11
**Contexto:** Relatório R06 (Histórico Acadêmico) — join `profiles!fk → full_name` retornou vazio
**Problema:** Query de R06 usava join aninhado `profiles!mensalidades_aluno_id_fkey(full_name)` com RLS ativo em ambas as tabelas. Resultado: array vazio sem erro explícito — exatamente o padrão documentado na LICAO-026.
**Decisão tomada:** Igual a R01/R04/R05: queries separadas + merge manual em JavaScript. Padrão consolidado em todos os 6 relatórios.
**Justificativa:** Supabase/PostgREST não propaga corretamente o contexto de `auth.uid()` em joins complexos quando ambas tabelas têm RLS. Comportamento reproduzível e documentado. A solução de queries separadas é confiável e adotada como padrão definitivo do projeto.
**Agentes impactados:** 05-backend-engineer, relatorios.service.ts
**Mudança aplicada:** R06 implementado com queries separadas. Padrão LICAO-026 agora cobrindo R01-R06 completo.
**Como aplicar no futuro:** Para qualquer relatório ou query que une `profiles` + outra tabela com RLS: queries separadas + merge manual. Nunca join aninhado.
**Status:** aplicada

---

## LICAO-034 — Migration manual + MCP read-only = workflow seguro de DDL

**Data:** 2026-06-11
**Contexto:** Sprint RLS completo — workflow de validação antes de aplicar migrations
**Problema:** Agentes propunham SQL com DDL (DROP POLICY, CREATE POLICY) baseado em inferência de arquivos. Sem validação prévia, migrations podiam falhar ou afetar policies erradas.
**Decisão tomada:** Workflow estabelecido: (1) Agente propõe SQL; (2) Hélio usa Supabase MCP read-only para confirmar estado real do banco (`pg_policies`, `pg_tables`, etc.); (3) Hélio aplica no SQL Editor com nomes confirmados.
**Justificativa:** MCP read-only permite consultas SELECT sem risco de alteração acidental. É a ferramenta ideal para validar nomes, estrutura e estado antes de qualquer DDL. Combina o conhecimento do agente com a verdade do banco.
**Agentes impactados:** 04-db-architect, 09-infra-engineer, 11-security-auditor
**Mudança aplicada:** Supabase MCP configurado em modo read-only (confirmado em sessão de 11/06). Workflow documentado.
**Como aplicar no futuro:** Antes de qualquer migration com DROP/ALTER: usar MCP read-only para confirmar o estado atual. `execute_sql` com SELECT → sempre seguro. DDL → sempre via SQL Editor com aprovação do Hélio.
**Status:** aplicada

---

## MELHORIA-007 — 14-security-auditor — Verificação real no banco antes de classificar severidade

**Data:** 2026-06-11
**Agente:** 14-security-auditor
**Nível anterior:** não definido
**Nível novo:** sem mudança de nível (correção de comportamento crítico)

**Problema identificado:**
Agente 14 emitiu relatório classificando "14 tabelas sem RLS" com base em leitura de arquivos de migration. O estado real do banco (verificado via `pg_policies`) mostrava que TODAS as 29 tabelas tinham RLS. Falso-positivo com potencial de gerar retrabalho e desconfiança nos relatórios de auditoria.

**Melhoria aplicada:**
Adicionar ao SKILL.md do Agente 14 etapa obrigatória ANTES de classificar qualquer item como problema:
> "Para afirmações sobre estado do banco (RLS, policies, índices, constraints): executar query de verificação no banco antes de classificar. Nunca inferir de arquivos de migration. Query mínima: `SELECT tablename FROM pg_policies GROUP BY tablename` para RLS."

**Risco da alteração:** baixo — adiciona passo de verificação, não remove capacidade
**Resultado esperado:** Zero falsos-positivos em relatórios de auditoria por inferência de arquivos.
**Aprovado por:** Hélio (2026-06-11)
**Status:** proposta — aplicar no próximo uso do Agente 14

---

## LICAO-017 — Supabase Studio usa contexto postgres — não valida JWT de usuários

**Data:** 2026-06-02
**Contexto:** Sprint L — testes de RLS e Edge Function via Studio
**Problema:** Studio opera com role `postgres` (superusuário) — bypassa RLS e ignora JWTs. Testes de autorização via Studio sempre passam, mesmo que o acesso real esteja bloqueado.
**Como aplicar no futuro:** Sempre testar RLS e autorização via `curl` com Bearer token real. Studio não é confiável para validar políticas de acesso.
**Agentes impactados:** 07-auth-specialist, 11-security-auditor
**Status:** registrada

---

## LICAO-035 — D1: status de `matriculas` é FEMININO (migração de funil é aditiva)

**Data:** 2026-06-19
**Contexto:** Plano Mestre v2.1 — fechamento do Bloco 0 (schema real confirmado).
**Problema:** Havia dúvida sobre o gênero dos valores do CHECK de `matriculas.status` (masculino vs feminino). Migrar gênero quebraria dados existentes.
**Decisão tomada (D1):** O CHECK real já é **feminino**: `pendente · ativa · inativa · trancada · evadida · concluida · suspensa`. A expansão do funil é **ADITIVA** (sem migrar gênero): adicionar `pre_matricula · aguardando_documentos · aguardando_pagamento · aguardando_aprovacao · cancelada`.
**Justificativa:** O banco é a fonte da verdade. Migrar gênero seria retrabalho destrutivo sem ganho. Expandir o CHECK preserva os 31 registros existentes.
**Agentes impactados:** 04-db-architect, 02-spec, 05-backend-engineer
**Como aplicar no futuro:** Ao especificar qualquer status de `matriculas`, usar SEMPRE o gênero feminino. Verificar o CHECK real no banco (`information_schema`/`pg_constraint`) antes de adicionar valores. NUNCA propor migração de gênero.
**Status:** registrada (trava para sprint R1)

---

## LICAO-036 — D2: regra de notas e aprovação (parciais × final, corte 7,0, presença 75%)

**Data:** 2026-06-19
**Contexto:** Plano Mestre v2.1 — definição do modelo de avaliação.
**Decisão tomada (D2):**
- `notas_aluno` = **notas parciais** (por `avaliacoes`, ponderadas por `avaliacoes.peso`).
- `matriculas_disciplina.nota` = **nota final**.
- Cálculo da final: **média simples (padrão)** OU **ponderada** por `peso` — configurável por cadeira/turma.
- **Aprovação:** média ≥ **7,0** **E** presença ≥ **75%**. Presença < 75% → `reprovado_falta` automático.
- Retroativo 2025: consolidado em `faltas`/`frequencia_percentual` em `matriculas_disciplina` (sem chamada por data). Chamada por data (Bloco 4) só para turmas ao vivo 2026.
**Justificativa:** Separa o registro granular (parciais) do resultado oficial (final), permite flexibilidade por turma e alinha com a regra institucional do Manual ITEC (7,0 / 75%, idêntica à `.ai-system/CLAUDE.md`).
**Agentes impactados:** 04-db-architect, 05-backend-engineer, 06-frontend
**Como aplicar no futuro:** Nota de corte 7,0 e frequência 75% são **regra institucional inviolável** — não alterar sem aprovação da Direção. Toda tela/serviço de notas deve respeitar o `reprovado_falta` automático.
**Status:** registrada (trava para sprints R1/R2)

---

## LICAO-037 — D3 + convenção de código v2: padrão do sistema é o código v2 COMPACTO (`ÁREA+ANO+ABREV3`); re-mapear pré-req para v2

> ✏️ **CORRIGIDA em 2026-06-20 (fechamento do R0).** A redação original dizia "padronizar `disciplinas_v2.codigo` = código do Manual" — direção **invertida**. A migração R0 (047) faz o oposto: **mantém o código v2 compacto** e converte os pré-requisitos (que estavam em código-hífen do Manual) **para v2**. O sistema NÃO adota os códigos-hífen do Manual.

**Data:** 2026-06-19 (corrigida 2026-06-20)
**Contexto:** Plano Mestre v2.1 — reconciliação do currículo com o Manual ITEC (rev.02/25), 46 cadeiras.
**Problema:** `prerequisitos_disciplinas` guardava códigos-hífen do Manual (`B1-ANT01`) com FK para a tabela **legada** `disciplinas` — não resolvia em `disciplinas_v2` (que usa códigos compactos `B1ATG`).
**Decisão tomada (D3, corrigida):** Manter o **código v2 compacto** (`B1ATG`, `T2SOT`, `P3HO2`) como **padrão do sistema** em `disciplinas_v2`. **Re-mapear os 24 pré-requisitos** de código-hífen do Manual → código v2 e re-apontar a FK de `prerequisitos_disciplinas` para `disciplinas_v2(codigo)`. **NÃO** trocar os códigos v2 pelos códigos-hífen do Manual. Depreciar a legada `disciplinas` depois (R0.5). (Execução do remap = sprint **R0**, migração `20260619_047_r0_reconciliacao_prerequisitos.sql`.)
**De-para (Manual → v2):** mantido em `.ai-system/memory/disciplinas_v2-referencia.md` (coluna `cód_manual` × `cód_v2`) e na própria migração 047.
**Convenção do código v2** (para o Coordenador criar/revisar cadeiras): `ÁREA(1) + ANO(1) + ABREV(3)` = 5 caracteres, maiúsculas, único, sem hífen.
- Área: **B**=Bíblica · **T**=Teológica · **P**=Prática · Ano: 1·2·3 · Abrev: 3 letras.
- Sequência troca a última letra por número: `HEB→HE2`, `ACO→AC2`, `HOM→HO2`.
- Ex.: `B1ATG`, `T2SOT`, `P3HO2`. **O código é só rótulo** — as FKs usam `id`; mudar a área NÃO obriga mudar o código.
**Justificativa:** O código v2 compacto já é o padrão de `disciplinas_v2`; convertê-lo para os códigos-hífen seria retrabalho destrutivo. O Manual é a referência de conteúdo (de-para), não o formato de código do sistema.
**Agentes impactados:** 04-db-architect, 02-spec, 14-auditoria
**Como aplicar no futuro:** Matriz oficial das 46 cadeiras + pré-requisitos + de-para em `.ai-system/memory/disciplinas_v2-referencia.md`. Não inventar códigos — seguir a convenção v2 e a matriz.
**Status:** ✅ aplicada (migração 047 APLICADA e validada 24/24/24 — ver `migracoes-aplicadas.md`)

---

## LICAO-038 — Regra de commit: doc/memória vai direto no main; código/migração sempre por PR

**Data:** 2026-06-20
**Contexto:** Fechamento do R0.5 — decisão do Hélio sobre o fluxo git.
**Decisão tomada (regra de ouro):**
- **Doc / memória** (`.ai-system/**`, `*.md`, Tracker §7, lessons/known-errors, `migracoes-aplicadas.md`): **commit direto no `main`**, sem PR.
- **Código / migração** (`src/**`, `supabase/migrations/**`, qualquer `.ts/.tsx/.sql`): **SEMPRE por branch + PR**, merge é decisão do Hélio. Migração só roda via SQL Editor (ERR-INFRA-001).
**Justificativa:** ticks de tracker e notas de memória não justificam o overhead de PR; já código/migração exige revisão e aprovação humana.
**Como aplicar no futuro:** Antes de commitar, classificar o diff. Se houver QUALQUER arquivo de código/migração no diff → branch + PR (não misturar doc no mesmo PR é ok, mas nunca commitar código direto no main). Diff 100% doc → main direto.
**Relacionado:** [[migracoes-aplicadas]] (fonte da verdade de migração), ERR-INFRA-001.
**Status:** registrada (regra ativa)

---

## ERR-LOGIC-003 — Interface lia `observacao` mas a coluna é `observacoes` (leitura sempre `undefined`)

**Data:** 2026-06-27
**Contexto:** R1.2 — alinhamento da interface `Matricula` (`matriculas.service.ts`) ao schema real.
**Problema:** A interface TS expunha `observacao` (singular) e `Matriculas.tsx` lia `m.observacao`, mas a **coluna real é `observacoes`** (plural) — é o que os writes (`createMatricula`, `updateStatusMatricula`) sempre gravaram. Como `select('*')` retorna a coluna real (`observacoes`), `m.observacao` era **sempre `undefined`**: ao abrir os "detalhes" de uma matrícula, o textarea de observação **nunca pré-preenchia** o valor salvo. Bug silencioso (sem erro, sem tipo — `status`/campos eram `string`/`any`).
**Decisão tomada:** Canônico = **`observacoes`** (lado de escrita é a fonte da verdade — writes não falhavam). Interface renomeada `observacao→observacoes`; `Matriculas.tsx` corrigido para `m.observacoes`; interface local duplicada removida (importa do serviço); `status` tipado como union `StatusMatricula` (12 valores do funil) — o que teria evitado a classe do bug.
**Justificativa:** Tipos fracos (`string`/interface defasada) escondem divergência nome-de-coluna. Tipar e ter **uma** fonte do tipo (sem duplicata) faz o compilador apontar o mismatch.
**Agentes impactados:** 02-domain-designer, 12-code-reviewer, 05-backend-engineer
**Como aplicar no futuro:** Interface de tabela = espelho fiel das colunas reais; nunca duplicar o tipo numa página; preferir union a `string` para campos com CHECK. Ao ver write num nome e read em outro, confirmar a coluna real (lado de escrita prevalece). Relacionado a [[migracoes-aplicadas]] e à regra do 12-code-reviewer (ERR-LOGIC-003: opção/campo que não bate com o banco).
**Status:** corrigido (R1.2, PR #18)

---

## ADR informal R2 (G2) — Convalidação canônica = tabela `convalidacoes` (colunas `convalidacao_*` da 051 removidas)

**Data:** 2026-06-27
**Contexto:** R2.0 — diagnóstico do Lançamento Retroativo encontrou **dois modelos de convalidação**: (a) tabela dedicada `convalidacoes` (com `documentos_url[]`, `instituicao_origem`, fluxo `pendente→aprovado/rejeitado`, encaminhamento a coordenador — usada em `matricula-academica.service`, `Convalidacoes.tsx`, `PainelAdmin`), e (b) as 5 colunas `matriculas_disciplina.convalidacao_*` criadas na 051 (Plano §4.3), que **nunca foram referenciadas** em código.
**Decisão tomada:** **Canônico = tabela `convalidacoes`** (mais rica: array de documentos + fluxo de aprovação + encaminhamento). As colunas `convalidacao_*` da 051 são **redundantes** e foram **removidas** pela migração `052_r2_professor_id_drop_convalidacao.sql`. Decidido também (G1): `matriculas_disciplina.professor_id` (FK→`professores`) para registrar "quem deu a cadeira" no lançamento retroativo.
**Justificativa:** Dois modelos para o mesmo conceito violam linguagem ubíqua (02) e geram ambiguidade de fonte da verdade. A tabela já tem UI e fluxo; as colunas estavam órfãs. Drop é seguro (F1: `matriculas_disciplina` = 0 linhas; colunas sem referência).
**Agentes impactados:** 02-domain-designer, 04-db-architect, 05-backend-engineer
**Como aplicar no futuro:** Antes de criar colunas "reuso de tabela" (Plano §4.3), checar se já existe tabela/serviço dedicado ao conceito — evitar modelo duplicado. Ao remover colunas de migração anterior, confirmar 0 referências em código + estado dos dados (14-auditor).
**Status:** decidido (migração 052 CRIADA; R2.2 = código/serviço).

---

## NOTA — Estado real do banco não é verificável por MCP

**Data:** 2026-06-20
O Supabase MCP conectado **não enxerga o projeto ITEC** (conta diferente; só BIBLIA/Formacao_n8n/EBD, todos INACTIVE). Portanto **nunca** afirmar que uma migração está "pendente"/"aplicada" com base no MCP. **Fonte da verdade:** `.ai-system/memory/migracoes-aplicadas.md` (atualizado pelo Hélio quando roda no SQL Editor).

---

## LICAO-039 — Aprovação de matrícula unificada: status `ativa` ⇄ acesso do aluno andam sempre juntos

**Data:** 2026-07-01
**Contexto:** R3.2 Leva 2a/2c. Havia **dois caminhos de aprovação divergentes**: `Matriculas.tsx` (setava status `ativa` + `updateRole`, sem `validado_*`) e `FichaAluno.tsx` (`aprovarMatricula` gravava `validado_*` mas **não liberava acesso**). Resultado: aprovar pela Ficha deixava o aluno **`ativo` sem acesso** ao dashboard.
**Decisão / regra:** O **status da matrícula e o acesso do aluno (role) andam sempre juntos**, por **qualquer tela**. Caminho único:
- `aprovarMatricula` (pendente/`aguardando_aprovacao` → `ativa`): grava `validado_*` **e** libera acesso (role `aluno`). Idempotente.
- `mudarStatusMatricula` (transição livre): `→ativa` libera acesso; **sair de `ativa`** para status **revogador** (`trancada/cancelada/evadida/suspensa/inativa`) revoga acesso (role `pendente`, preserva dados). **Exceção: `concluida` mantém acesso** (egresso vê histórico/baixa certificado).
- A antiga `updateStatusMatricula` (troca de status **sem** efeito de acesso) foi **removida** — era um *footgun* que reintroduziria o bug. Toda troca de status passa por `mudarStatusMatricula`.
**Detalhe técnico:** o efeito de acesso é ação de **sistema** — escreve `profiles.role` + `user_roles` direto, **não** via `updateRole`/`getRolesPermitidas` (que bloqueia `administracao`→`pendente`). Valor sem acesso = `pendente` (confirmado no `AuthProvider`: `role 'pendente' → /aguardando`).
**Agentes impactados:** 02-domain-designer, 05-backend-engineer, 12-code-reviewer
**Como aplicar no futuro:** Nunca criar um caminho de mudança de status de matrícula que não ajuste o acesso do aluno. Vocabulário de status = `constants/statusMatricula.ts` (12 valores femininos; `StatusBadge` lê dele).
**Status:** aplicado (PRs #23/#24). Auditoria completa de transições (tabela de histórico) fica no backlog (exige migração).

---

## LICAO-040 — Dois mundos de ID do professor: cada write usa o ID que a FK daquela tabela espera

**Data:** 2026-07-14
**Contexto:** Bug A1 (auditoria de integração dos 4 dashboards). O professor não conseguia salvar a chamada: `LancarFrequencia` gravava `professores.id` em `frequencia.professor_id`, mas a FK dessa coluna aponta para **`profiles(id)`** → violação no upsert ("new row violates row-level security policy for frequencia"). O sistema tem **dois mundos de ID** para o professor e a coluna `professor_id` NÃO significa sempre a mesma coisa:

| Mundo | Tabela.coluna | FK aponta para | Valor a gravar |
|---|---|---|---|
| **profiles.id** (= auth.uid()) | `frequencia.professor_id` | `profiles(id)` ⚠️ exceção | `profile.id` do logado |
| | `notas_aluno.lancado_por` | `profiles(id)` | `profile.id` do logado |
| | `avaliacoes.criado_por` | `profiles(id)` | `profile.id` do logado |
| **professores.id** (cadastro docente) | `contratos_professor.professor_id` | `professores(id)` | `getProfessorByUserId().id` |
| | `solicitacoes_disciplina.professor_id` | `professores(id)` | idem |
| | `matriculas_disciplina.professor_id` (052) | `professores(id)` | idem |
| | `aulas_recorrentes.professor_id` / calendário (029) | `professores(id)` | idem |

A ponte entre os mundos é `professores.user_id = auth.uid()` (é o que `professor_leciona_disciplina` usa).
**Decisão / regra:** Todo write que grava "quem é o professor" deve **conferir a FK real da coluna no schema antes de escolher o ID**. Autoria de lançamento (quem clicou salvar) = `profiles.id`; vínculo docente (contrato/atribuição) = `professores.id`. `frequencia.professor_id` é a **exceção nomeada**: parece vínculo docente, mas é autoria (FK → profiles).
**Evidência:** seed `seed_testes.sql` grava `u_prof1` (auth id) em `frequencia.professor_id` — nunca `p_prof1`.
**Agentes impactados:** 04-db-architect, 05-backend-engineer, 12-code-reviewer, 11-security-auditor
**Como aplicar no futuro:** ao criar tela/service que grava professor em tabela nova: (1) ler a migração para ver a FK real; (2) se a coluna registra autoria, padronizar o NOME como `lancado_por`/`criado_por` (não `professor_id`) para não repetir a ambiguidade; (3) em code review, qualquer `professor_id:` no payload exige confirmação do mundo certo.
**Status:** aplicado (branch `fix/a1-professor-id-frequencia`); interface `RegistroFrequencia` documentada com a exceção.

---

*Mantido pelo agente-Osabio · ITEC-EAD · 2025*
