# AUDITORIA — Núcleo Acadêmico (R0→R3) — Parte A
## Código · Débito Técnico · Testes · Documentação

**Data:** 2026-07-05
**Agentes:** 14-auditor (condução) · 12-code-reviewer · 15-debt-analyst · 10-test · 18-doc-writer
**Modo:** READ-ONLY (Mandamento 7) — nenhum arquivo do projeto modificado; único artefato produzido é este relatório.
**Método:** `tsc -p tsconfig.app.json` + `vitest run` executados no checkout local E num worktree descartável de `main` (criado no scratchpad da sessão e removido ao final); inspeção de código via `git show`/`git grep` em `main`; leitura do `.ai-system` de `main`.

---

## ⚠️ RESSALVA 0 — O checkout local NÃO é o código auditado

O working tree local está no branch **`fix/auth-provider-unico` (4e6846e)**, que **já foi totalmente mergeado** — `main` está **muito à frente** (todo o R0.5→R3.4, PRs #13–#27, ~5.100 linhas). Consequências:

- O bug de aprovação `updateRole(alunoId, 'aluno')` sem `requesterId` ([Matriculas.tsx:78](src/pages/dashboard/Matriculas.tsx#L78) no checkout) **existe só neste checkout antigo** — em `main` a aprovação foi unificada (R3.2, `aprovarMatricula`/`mudarStatusMatricula` com `requesterId`).
- O `.ai-system` local está desatualizado; o de `main` está coerente e completo.
- Há duplicatas não versionadas na raiz: `ITEC-PLANO-MESTRE-v2_1.md` (duplica `main:.ai-system/memory/PLANO-MESTRE-v2_1.md`) e migrations 048–053 untracked (já commitadas em `main`).

**Recomendação imediata (fora do escopo desta auditoria executar):** `git checkout main && git pull`, remover as duplicatas untracked, e só então iniciar o QA. Todos os achados abaixo referem-se a **`main` (a8bfe1b)**, salvo indicação contrária.

**Limitação:** o projeto Supabase do ITEC não está entre os projetos acessíveis pelo MCP desta sessão — o estado do **banco** (dados de F1/F2, policies vigentes) foi inferido de `migracoes-aplicadas.md` + migrations, não verificado ao vivo.

---

## SUMÁRIO EXECUTIVO (semáforo)

| Área | Status | Resumo |
|---|:---:|---|
| **1. Qualidade de código** | 🟡 | 28 erros de tsc em `main` (29 no checkout antigo) — regra inviolável "build 0 erros TS" violada. Nenhum é bug crítico em runtime em `main`; 12 são triviais, 9 são o barrel `index.ts`, 1 é bug real de tipo (`total_creditos`). Pseudo-subquery inválida exportada em `academico.service` (morta em produção). 9 joins aninhados vivos apesar da LICAO-026. |
| **2. Débito técnico** | 🟡 | Mapa consolidado abaixo. Nada bloqueia agosto, mas: ERR-RISK-001 (upsert `user_roles` sem tratamento) subiu de prioridade (policies dependem de `user_roles` hoje); ERR-DATA-F4 tem registro inconsistente (provável falso positivo); tabelas legadas confirmadas órfãs **no código** — plano de DROP seguro proposto. |
| **3. Testes** | 🟡 | 317 testes, 308 passam. As 9 falhas: 8×ProtectedRoute (teste desatualizado pós-refactor de auth — **corrigível sem tocar em auth de produção**) + 1×academico (mock sequencial desatualizado — trivial). Regras de domínio centrais BEM cobertas (nota/freq, LICAO-039, retroativo, decisão C). Lacunas: regras de convalidação do Manual §9 sem implementação nem teste; zero testes de componente nas telas do núcleo. |
| **4. Documentação** | 🟢 | `.ai-system` de `main` coerente: Tracker atualizado, migracoes-aplicadas completo, F1–F6 e LICAO-035..039 registrados. Ressalvas: `CLAUDE.md` raiz muito desatualizado (alto impacto — é carregado em toda sessão), `ROADMAP-SPRINTS.md` parado no R0, F4 des-reconciliado, 4 decisões importantes sem ADR formal. |

**Leitura geral:** o núcleo acadêmico entregue é sólido e bem documentado no `.ai-system`. O passivo é de *higiene* (tsc, barrel, testes desatualizados, CLAUDE.md), não de arquitetura. Prioridade nº 1 do QA: zerar tsc + as 9 falhas; nº 2: reconciliar F4 e ERR-RISK-001 antes de alunos reais.

---

# 1. QUALIDADE DE CÓDIGO (12-code-reviewer)

## 1.1 Os erros de tsc — inventário e classificação

`main` = **28 erros** · checkout local = **29** (o extra é o TS2554 de Matriculas.tsx, já corrigido em `main`). Classificação:

### Grupo A — Ruído de teste (9 erros, triviais)

| ID | Evidência | Causa | Correção trivial? |
|---|---|---|---|
| A-01 | `src/components/dashboard/__tests__/InlineStatusSelect.test.tsx` 23,28,34,41,48,58 (TS2322 ×6) | `vi.fn()` (tipo `Mock`) passado à prop `onSave: (v: string) => Promise<void>` | Sim — `vi.fn<[string], Promise<void>>().mockResolvedValue(undefined)` ou cast único num helper |
| A-02 | `src/test/sanity.test.ts` 1,2,3 (TS2582/TS2304 ×3) | Usa `describe/it/expect` globais sem import e sem `types: ["vitest/globals"]` no tsconfig | Sim — 1 linha de import de `vitest` |

### Grupo B — Dívida estrutural do barrel (9 erros, mecânico)

| ID | Evidência | Causa |
|---|---|---|
| B-01 | `src/services/index.ts` 8,9,13(×3),14,16,17,18 (TS2308 ×9) | `interface ServiceResult` redefinida em **11 services** (e `Disciplina`/`Prerequisito`/`getPrerequisitos` duplicados entre `cursos.service` e `academico.service`); `export *` colide | 

**Recomendação:** extrair `ServiceResult` para um módulo único (ex.: `src/services/types.ts`) e importar em todos — resolve 7 dos 9 numa tacada; os 3 conflitos `Disciplina/Prerequisito/getPrerequisitos` entre `cursos.service` (currículo/coordenador) e `academico.service` (leitura/aluno) pedem renomeação ou re-export explícito. Esforço: ~1h, zero risco de runtime. Nota: `turmas.service` tem a variante genérica `ServiceResult<T>` — usar essa como base do tipo único.

### Grupo C — Bugs reais de tipo (4 erros)

| ID | Sev. | Evidência | Diagnóstico |
|---|---|---|---|
| C-01 | **ALTA** | `src/services/academico.service.ts:381` (TS2741) | Early-return de `getHistoricoAluno` monta objeto **sem `total_creditos`** (obrigatório em `HistoricoAluno`). Consumidor (Meu Histórico/PDF) lê `undefined` no caminho "aluno sem matrícula". Bug real, correção de 1 linha. |
| C-02 | MÉDIA | `src/pages/dashboard/Alunos.tsx:357-358` (TS2339 ×2) | `avatar_url` usado mas ausente do tipo `UserRow`. Runtime provavelmente OK (campo vem do select), mas o tipo mente — adicionar campo ao tipo. |
| C-03 | MÉDIA | `src/pages/dashboard/Avisos.tsx:41` (TS2345) | **Duas interfaces `Aviso` divergentes** (`avisos.service` × `AvisoCard`; `curso_id` obrigatório só numa). Duplicação de tipo — unificar na do service. |

### Grupo D — Casts e detalhes de UI (6 erros, triviais)

| ID | Evidência | Nota |
|---|---|---|
| D-01 | `R04_PDF.tsx` 220,222,224 (TS2345 ×3) | Spread de estilo parcial sobre estilo tipado do react-pdf — tipar como `Style` ou compor com array de estilos |
| D-02 | `ContratoForm.tsx:110` (TS2352) | Cast `FormData → Record<string, unknown>` — trocar por `as unknown as` (PADRAO-001) ou `Object.fromEntries` |
| D-03 | `LancarNotas.tsx:218` (TS2322) | Prop `title` em ícone Lucide — envolver num `<span title>` |
| D-04 | `solicitacoes.service.ts:81` (TS2352) | Cast `Record<string,unknown> → SolicitacaoDisciplina` — aplicar PADRAO-001 (`as unknown as`) |

### Grupo E — Só no checkout antigo (1 erro; corrigido em main)

| ID | Sev. | Evidência | Diagnóstico |
|---|---|---|---|
| E-01 | (CRÍTICA no branch antigo / **resolvida em main**) | checkout `src/pages/dashboard/Matriculas.tsx:78` (TS2554) | `updateRole(alunoId, 'aluno')` sem o 3º arg `requesterId` → em runtime a validação de hierarquia falha e **aprovar matrícula não liberava acesso**. Em `main`, R3.2 (PR #23/#24) substituiu por `aprovarMatricula`/`mudarStatusMatricula(id, status, obs, profile.id)`. Evidência de que o erro de tsc estava apontando bug de domínio real — reforça a regra "build 0 erros TS". |

**Balanço:** 12 triviais (A+D) + 9 mecânicos (B) + 4 correções de tipo fáceis (C) = **todos os 28 elimináveis em ~1 dia de trabalho**, sem tocar em auth.

## 1.2 Padrões inconsistentes entre services

| ID | Sev. | Achado | Evidência | Recomendação |
|---|---|---|---|---|
| P-01 | MÉDIA | `ServiceResult` duplicado 11× (10 iguais + 1 genérica) | `equipe/cursos/financeiro/material/matricula-academica/calendario/professor/matriculas/turmas/usuarios(.service).ts` | Tipo único compartilhado (ver B-01) |
| P-02 | MÉDIA | **9 joins aninhados `!fkey` vivos** apesar da LICAO-026/033 | `matriculas.service.ts:34` · `frequencia.service.ts:63,139,256` · `financeiro.service.ts:116` · `turmas.service.ts:123` · `notas.service.ts:199` · `academico.service.ts:312` · `matricula-academica.service.ts:79` | Funcionam hoje (policies atuais permitem), mas são exatamente o padrão de falha silenciosa documentado (BUG-RLS-001). Inventariar e converter para query separada + merge **antes** de qualquer nova migração de RLS nessas tabelas; no mínimo, garantir `console.error` no fallback de cada uma (BUG-RLS-002) |
| P-03 | **ALTA** (como armadilha) | **Pseudo-subquery inválida** em `verificarPrerequisitos`: um query-builder é passado como VALOR de `.eq('matricula_id', supabase.from('matriculas')...)`. supabase-js não suporta subquery — o objeto é serializado, o filtro é inválido e o **erro é engolido** (desestrutura só `data`), resultando `cursadas = []` | `main:src/services/academico.service.ts:196-203` | Hoje é **código morto em produção** (nenhuma page/hook chama a versão single; `useMeusCursos` usa `verificarPrerequisitoBatch`, que é correta — 3 queries + merge). Mas está exportada, testada e pronta para ser reusada por engano. Remover a função ou reescrevê-la delegando ao batch. É também a função da 9ª falha de teste (ver §3) |
| P-04 | BAIXA | Error-handling desigual: vários `if (error) return []` sem `console.error` (regra da BUG-RLS-002) | ex.: `academico.service.ts:152,174` | Padronizar log antes de todo fallback |
| P-05 | BAIXA | `as unknown as X[]` (PADRAO-001) aplicado de forma consistente (19 usos, 9 services) — **não corrigir**; apenas `solicitacoes.service.ts:81` e `ContratoForm.tsx:110` fogem do padrão | — | Alinhar os 2 desviantes |
| P-06 | BAIXA | `tsconfig.json` com `strictNullChecks: false` e `noImplicitAny: false` — contradiz o "TypeScript strict" do CLAUDE.md | `tsconfig.json` | Decidir: ou ativar strict gradualmente (sprint próprio, pós-agosto) ou corrigir o CLAUDE.md |

## 1.3 Complexidade de componentes (sinais de refactor)

| Tela | Linhas (main) | Diagnóstico |
|---|---|---|
| `FichaAluno.tsx` | **746** | Monólito com N seções (header/código ITEC, matrículas + nº matrícula, docs, convalidações staff-only, histórico, lançamento retroativo embutido via modal). Estado e helpers de status locais (`:560` mapa de cores duplicado com `constants/statusMatricula.ts`?). **Refactor recomendado (não urgente):** extrair cada seção como componente de apresentação; mover mapas de status para o vocabulário único do R3.2 |
| `CursosAdmin.tsx` | 651 | Reescrito no R0.5 (adapter v2 + CRUD do coordenador). Grande porém coeso; risco maior é o par modal-de-edição + sync de pré-requisitos. Aceitável; extrair modais se crescer |
| `Matriculas.tsx` | 315 | Pós-R3.2 ficou enxuto (abas de funil + InlineStatusSelect + aprovação unificada). **OK, sem refactor** |
| `LancamentoRetroativo.tsx` | 340 | Formulário denso; lógica de derivação de status corretamente extraída para o service (testada). OK |

Nenhum componente bloqueia; único refactor que vale sprint-slot é o de `FichaAluno` (fatiar em seções).

---

# 2. DÉBITO TÉCNICO (15-debt-analyst)

## 2.1 Mapa único priorizado (impacto × esforço)

| # | Item | Origem | Impacto | Esforço | Prioridade | Estado |
|---|---|---|---|---|:---:|---|
| 1 | **ERR-RISK-001** — `updateRole` faz `user_roles.upsert` ignorando erro (`usuarios.service.ts:206`) | known-errors | **ALTO** — subiu de "média": hoje as policies (031/033/037, ADR-006) **dependem de `user_roles`**; sync silenciosamente falha ⇒ permissões erradas | Trivial (3 linhas) | **P1** | aberto |
| 2 | **ERR-DATA-F4** — registro diz "matriculas sem policy aluno-vê-própria", mas a migração 035 (`20260606_035_rls_matriculas.sql:18`) **cria** `matriculas_select_own (aluno_id = auth.uid())` | Bloco 0 / known-errors | ALTO se real (AlunoView/Meu Histórico vazios p/ aluno real); NULO se falso positivo (provável, como foi F3) | 1 query em `pg_policies` | **P1 (verificar)** | inconsistente |
| 3 | **Build ≠ 0 erros TS** (28) — viola regra inviolável §8 do Plano Mestre e mascara erros novos (E-01 provou o custo) | esta auditoria (§1.1) | MÉDIO | ~1 dia | **P2** | aberto |
| 4 | **9 falhas de teste pré-existentes** | esta auditoria (§3) | MÉDIO (CI vermelho normaliza falha) | ~½ dia | **P2** | aberto |
| 5 | **Tabelas legadas** `disciplinas` + `prerequisitos_disciplinas` no schema | ERR-DEBT-002 (código QUITADO em main) | BAIXO (dados já migrados 047/048; risco = alguém reusar) | .sql simples | P3 — ver §2.2 | código ✅ / banco pendente |
| 6 | **ERR-DATA-F1** — `matriculas_disciplina` = 0 linhas (31 alunos sem cadeira) | Bloco 0 | ALTO (dashboards vazios) — mas é **operacional**, não técnico: a ferramenta (R2.2) está entregue e testada | Trabalho da secretaria | P2 (operação) | ferramenta ✅ / dados a lançar |
| 7 | **ERR-DATA-F2** — 0 contratos professor↔disciplina | Bloco 0 | MÉDIO — idem: R3.3a entregou gestão de vínculos (decisão C); falta cadastrar. Nota: o refinamento RLS "professor só das suas cadeiras" (migração 037 §2) segue corretamente ADIADO até F2 ser populado | Operação | P3 (operação) | ferramenta ✅ / dados a lançar |
| 8 | **ERR-DATA-F5** — `matriculas.curso_id` TEXT sem FK | Bloco 0 | BAIXO (vínculo real é `turma_id`) | Migração pequena | P4 backlog | aberto |
| 9 | **Migrations paradas** `migrations-manuais/` 038/039/046 não versionadas em `supabase/migrations` + colisão de numeração (duas "035") | Plano §9 backlog | BAIXO-MÉDIO (rastreabilidade) | ½ dia doc | P3 | aberto |
| 10 | **Bug login/sessão (ERR-AUTH-002)** — cold start / falso logout | Plano §9 + BLOCO AUDITORIA item 4 | ALTO para UX | Sprint dedicado (já gateado no plano — **não tocar fora dele**) | P2 (sprint próprio) | aberto |
| 11 | Dados incorretos: Fátima nasc. 2064 · Icaro nasc. 2013 · coluna Sexo Turma 01 | Plano §9 | BAIXO | Correção pontual SQL | P4 | aberto |
| 12 | IDEAS-BACKLOG pré-agosto: **coleta de emails (CRÍTICA, prazo 30/07)** · Sentry · magic link + "complete seu perfil" · Asaas/cobrança progressiva | IDEAS-BACKLOG §3/4/8 | ALTO (gate de lançamento) | Vários | **P1 (calendário)** | pendente Hélio/sprints |
| 13 | `strictNullChecks/noImplicitAny` desligados | esta auditoria (P-06) | MÉDIO longo prazo | Sprint gradual | P4 pós-agosto | aberto |
| 14 | ERR-DEBT-001 (código morto `statusConfig` em Alunos.tsx) | known-errors | — | — | — | **✅ quitado em main** (não existe mais; atualizar registro) |
| 15 | ERR-EDGE-001/002 (race `codigo_itec` + rollback incompleto na Edge Function) | known-errors | BAIXO hoje, cresce com volume | Pequeno | P3 pré-agosto | aberto |

## 2.2 Tabelas legadas — confirmação e plano de remoção

**Confirmação de orfandade (código, em `main`):** `git grep "from('disciplinas')"` e `from('prerequisitos_disciplinas')` → **zero ocorrências** em `src/` (no checkout antigo `cursos.service.ts` ainda as usava — mais um motivo para sair do branch velho). O fallback runtime `src/data/disciplinas.ts`/`localDisciplinas` do CursosAdmin também foi eliminado. `cursos.service` reescrito consome `disciplinas_v2/modulos/prerequisitos_v2`.

**Orfandade no banco (inferida, confirmar ao vivo):** a 047 re-apontou as FKs de `prerequisitos_disciplinas` → `disciplinas_v2(codigo)`; logo a legada `disciplinas` ficou **sem dependentes**. `prerequisitos_disciplinas` teve os dados copiados para `prerequisitos_v2` pela 048 (validação 13+11), mas **mantém FK ativa para `disciplinas_v2`** — é dependente, não dependência; não bloqueia nada, só polui.

**Plano de remoção seguro (sprint pequeno, .sql executado pelo Hélio — ERR-INFRA-001):**
1. Verificar ao vivo: `pg_policies`, views, functions e FKs que citem as duas tabelas (esperado: nada além da FK própria da `prerequisitos_disciplinas`).
2. Export/backup das duas tabelas (CSV ou `CREATE TABLE ..._backup AS SELECT *`) — são a última cópia dos códigos-hífen do Manual; o de-para oficial já está preservado em `disciplinas_v2-referencia.md` e na própria 047.
3. `DROP TABLE prerequisitos_disciplinas;` depois `DROP TABLE disciplinas;` (nessa ordem, por causa da FK) + `NOTIFY pgrst, 'reload schema'`.
4. Rollback documentado = recriar do backup. Registrar em `migracoes-aplicadas.md` e fechar ERR-DEBT-002 de vez.

## 2.3 Achados F1/F2/F4/F5 do Bloco 0 — estado atual

| Achado | Estado | Evidência |
|---|---|---|
| **F1** (0 linhas em `matriculas_disciplina`) | 🔵 **Ferramenta entregue, dado pendente** — R2.2 (PR #19) + painel de pendências conta "alunos sem vínculo" (Leva 1, PR #22). Volume real no banco não verificável nesta sessão | Tracker §7; `LancamentoRetroativo.tsx` |
| **F2** (0 contratos/solicitações) | 🔵 **Ferramenta entregue, dado pendente** — decisão C (PR #25): contrato não-encerrado destrava professor; ProfessoresAdmin gere vínculos | Tracker §7; `professor.service` `CONTRATO_ATIVO` |
| **F3** (notas_aluno deny-all) | ✅ **Resolvido — falso positivo** do Bloco 0 (policies existiam desde 023/031) | known-errors ERR-DATA-F3, diagnóstico R3.0 de 2026-06-30 |
| **F4** (matriculas sem "aluno vê própria") | ⚠️ **Inconsistente** — known-errors mantém "aberto — endereçado em R3", mas R3 fechou como frontend-only E a migração 035 já criava `matriculas_select_own`. Forte suspeita de falso positivo (padrão F3). **Ação:** 1 query em `pg_policies` + atualizar o registro. Enquanto não conferir, tratar como risco ao portal do aluno | `20260606_035_rls_matriculas.sql:16-20` × known-errors:872 |
| **F5** (curso_id TEXT sem FK) | ⬜ Aberto, backlog (correto — não bloqueante) | known-errors:884 |

---

# 3. TESTES (10-test)

**Baseline em `main`:** 317 testes / **308 passam / 9 falham** (mesmos números do checkout antigo, que tem 263/254 — as falhas são idênticas nos dois).

## 3.1 As 9 falhas pré-existentes — causa raiz

### Grupo 1 — 8× `ProtectedRoute.test.tsx` (todas do arquivo)

- **Causa raiz:** o refactor de auth (PR #11 + branch `fix/auth-provider-unico`, commits b6fc4e6..4e6846e) transformou `ProtectedRoute` em consumidor puro de `useAuth()` do `AuthProvider` ([ProtectedRoute.tsx:7](src/components/ProtectedRoute.tsx#L7)). O teste ainda renderiza o componente **sem** `<AuthProvider>` e mocka `supabase.auth.*` diretamente → `useAuth` lança `"useAuth deve ser usado dentro de <AuthProvider>"` ([AuthProvider.tsx:159](src/contexts/AuthProvider.tsx#L159)) em todos os 8 casos.
- **É corrigível sem tocar em auth?** **SIM** — é dívida do **teste**, não do código de produção. Duas rotas, sem editar `AuthProvider`/`ProtectedRoute`:
  - (a) *preferida*: `vi.mock('@/contexts/AuthProvider')` retornando `{ useAuth: () => ({ status, retry, signOut }) }` por caso — testa o contrato do ProtectedRoute (loading/error/unauthenticated/pending/roles) de forma determinística;
  - (b) envolver o render com o `AuthProvider` real reaproveitando os mocks de `getSession`/`onAuthStateChange` já escritos — vira teste de integração, porém fica acoplado a timeouts internos do provider (mais frágil em jsdom).
- **Não depende** do "Sprint de AUTH dedicado" (item 4 do BLOCO AUDITORIA) — aquele trata ERR-AUTH-002 (cold start em produção).

### Grupo 2 — 1× `academico.service.test.ts` (`verificarPrerequisitos`)

- **Causa raiz:** o teste mocka **4** chamadas sequenciais de `from()` na ordem antiga; após o fix do BUG-ACAD-001 o serviço ganhou uma 4ª query (`excecoes_prerequisito` — `select().eq().eq()`), que consome o mock destinado a `disciplinas_v2` (shape `select().in()`) → `TypeError: .eq is not a function` (`academico.service.ts:211` em main).
- **Correção trivial:** inserir o mock de `excecoes_prerequisito` na posição 4. **Melhor:** dado o achado P-03 (a função tem a pseudo-subquery inválida e está morta em produção), aposentar a função + este teste e manter a cobertura pelo `verificarPrerequisitoBatch` (que já tem 5 referências de teste no mesmo arquivo).
- Observação de arquitetura de teste: mocks **sequenciais por ordem de `from()`** quebram a cada query nova — foi exatamente o que aconteceu. Considerar helper de mock **por nome de tabela** no `setup.ts`.

## 3.2 Cobertura das regras de domínio — o que tem × o que falta

| Regra | Cobertura | Evidência |
|---|:---:|---|
| **Aprovação: média ≥7,0 E freq ≥75%** (D2) | ✅ Forte | `notas.service.test.ts` — 16 casos incl. limites 6.9/74.9, prioridade de falta sobre nota, `null`→cursando |
| **Matrícula/status/acesso (LICAO-039)** | ✅ Forte | `matriculas.service.test.ts` — `aprovarMatricula` (5 casos: pendente→ativa, idempotência, status não-aprovável, permissão) + `mudarStatusMatricula` (5 casos: libera/revoga acesso, exceção `concluida` egresso, transição neutra, não-staff) |
| **Lançamento retroativo** | ✅ Boa | `lancamento-retroativo.service.test.ts` — mappers puros, derivação de status (aprovado/reprovado_falta/recuperacao), `statusOverride` convalidado, erro de banco, recálculo em edição |
| **Vínculo professor (decisão C)** | ✅ Boa | `professor.service.test.ts` — `CONTRATO_ATIVO` (não-encerrado destrava; pendente/impresso incluídos) |
| **Pré-requisitos** | ⚠️ Parcial | `academico.service.test.ts` — batch coberto; versão single com 1 teste quebrado e função defeituosa (P-03); exceções cobertas em `matricula-academica.service.test` (`aprovarExcecaoPrerequisito`) |
| **Convalidação — fluxo** | ✅ CRUD coberto | `matricula-academica.service.test.ts` — solicitar/aprovar/rejeitar/encaminhar/listar |
| **Convalidação — regras do Manual §9** | ❌ **Sem implementação e sem teste** | "não convalida Estágio/TCC" e "mínimo 30% dos créditos cursados no ITEC" (Plano §4.3) não aparecem em nenhum service — a regra hoje depende 100% de disciplina humana da secretaria |
| **Nº de matrícula `ITEC25T001`** | ⚠️ Só no banco | `gerar_numero_matricula()` é função Postgres (051), validada manualmente na aplicação da migração; sem teste automatizado (aceitável — documentar) |

**Riscos sem cobertura (além dos acima):**
- **Zero testes de componente** nas telas do núcleo: `Matriculas.tsx` (funil de 12 status), `LancamentoRetroativo.tsx` (340 linhas), `FichaAluno.tsx`, `CursosAdmin.tsx`. Os services estão testados; a fiação tela→service não.
- **Divergência semântica de frequência:** `frequencia.service.ts:45-52` classifica resumo como `ok ≥75 / alerta 60–74 / reprovado <60`, enquanto a regra de aprovação reprova com `<75`. Se for intencional (semáforo visual ≠ status acadêmico), documentar no service; se não, é bug de régua.
- Acesso por rota/persona (RoleGuard) sem teste — mitigado pela matriz de permissões, mas é a superfície do LICAO-039.

---

# 4. DOCUMENTAÇÃO (18-doc-writer)

## 4.1 Coerência do `.ai-system` (avaliado em `main`)

**Está coerente e acima da média** — as instruções do Plano §9 foram cumpridas: `PLANO-MESTRE-v2_1.md` espelhado em `memory/`; **Tracker §7 atualizado** (Bloco 0, R0, R0.5, R1, R2, R3 = ✅ com PRs, migrações e validações; R4 ⬜; BLOCO AUDITORIA+QA registrado com gate); `migracoes-aplicadas.md` cobre 047–053 com status APLICADA + validações; `known-errors.md` registra F1–F6 (ERR-DATA-F*), ERR-LEGADO-001..003 e ERR-DEBT-002; `lessons-learned.md` registra D1/D2/D3 + convenção v2 (LICAO-035/036/037) e LICAO-039; `disciplinas_v2-referencia.md` criado.

**Divergências encontradas:**

| ID | Sev. | Divergência | Recomendação |
|---|---|---|---|
| DOC-01 | **ALTA** | **`CLAUDE.md` raiz (versionado) muito desatualizado**: "15 services" (são 22 arquivos de service em main), "163/163 testes" (são 317, com 9 falhas conhecidas), "48 testes" no bloco de comandos, migrations listadas até 037, sprint atual "Relatórios", zero menção à trilha R0→R4/Plano Mestre. Impacto alto: é o contexto carregado em TODA sessão do Claude Code e hoje **contradiz** o Plano Mestre | Reescrever a seção de estado (services/testes/migrations/sprint) e apontar para `.ai-system/memory/PLANO-MESTRE-v2_1.md` como fonte da fase atual |
| DOC-02 | MÉDIA | `ROADMAP-SPRINTS.md` parado: R0.5 "🔵 próximo" quando o Tracker o dá como ✅ CONCLUÍDO (idem R1–R3) | Sincronizar com o Tracker §7 (ou reduzir o ROADMAP a um ponteiro para o Tracker, para ter UMA fonte) |
| DOC-03 | MÉDIA | `known-errors.md` ERR-DATA-F4 "aberto — endereçado em R3", mas R3 foi redefinido como frontend-only e fechou sem tratá-lo; e a policy já existe na migração 035 (provável falso positivo) | Verificar `pg_policies` e fechar/reclassificar o registro (mesmo tratamento dado ao F3) |
| DOC-04 | MÉDIA | **Working tree local** (branch mergeado antigo): `.ai-system` defasado + `ITEC-PLANO-MESTRE-v2_1.md` duplicado na raiz (untracked) + migrations 048–053 untracked duplicando as de `main` — risco de alguém editar/auditar a cópia errada (esta sessão quase caiu nisso) | `checkout main` + remover duplicatas |
| DOC-05 | BAIXA | ERR-DEBT-001 (código morto Alunos.tsx) e ERR-DEBT-002 (cursos.service legado) já quitados em main, registros sem baixa formal | Marcar status ✅ nos dois |
| DOC-06 | BAIXA | `CLAUDE.md` cita ADR-001, mas `adr/` começa em ADR-002 (e pula para ADR-019); numeração confusa | Nota no README do adr/ explicando os buracos, ou renumerar |

## 4.2 ADRs faltantes (decisões tomadas sem registro formal)

As 4 decisões estão documentadas como lições/tracker, mas são **arquiteturais** e merecem ADR (formato curto, 1 página):

| ADR proposto | Decisão a formalizar | Fonte existente |
|---|---|---|
| **ADR-008 — Fonte única de currículo v2** | `disciplinas_v2` + `prerequisitos_v2` são a única fonte; código v2 compacto (`ÁREA+ANO+ABREV3`) é o padrão do sistema; legadas depreciadas (047/048) | LICAO-037, `disciplinas_v2-referencia.md` |
| **ADR-009 — Convalidação canônica** | Tabela `convalidacoes` é o registro canônico; colunas `convalidacao_*` de `matriculas_disciplina` (051) foram **removidas** (052) como redundantes; efeito acadêmico via `status='convalidado'` | migracoes-aplicadas (052) |
| **ADR-010 — Aprovação unificada status⇄acesso** | `aprovarMatricula`/`mudarStatusMatricula` como único caminho; `ativa`⇄acesso; `concluida` mantém acesso (egresso); `updateStatusMatricula` removida como footgun | LICAO-039, PRs #23/#24 |
| **ADR-011 — Vínculo de professor (decisão C)** | Vínculo = contrato **não-encerrado** (`CONTRATO_ATIVO`); assinatura é formalidade, não trava operação; restrição RLS por contrato adiada até F2 populado | Tracker R3.3a, PR #25 |

---

## ANEXO — Achados consolidados por severidade

**CRÍTICA:** nenhuma em `main`. (E-01 seria crítica, mas está corrigida em `main` — o risco residual é operar a partir do checkout antigo, ver Ressalva 0.)

**ALTA:** C-01 (`total_creditos` ausente no early-return) · P-03 (pseudo-subquery exportada) · Débito #1 (ERR-RISK-001 upsert `user_roles`) · Débito #2/DOC-03 (F4 des-reconciliado) · DOC-01 (CLAUDE.md raiz) · Lacuna de teste: regras de convalidação do Manual §9 sem implementação.

**MÉDIA:** B-01 (barrel, 9 erros) · C-02/C-03 · P-01/P-02 · Grupo 1 e 2 das falhas de teste · DOC-02/DOC-04/DOC-05 · divergência de régua de frequência (60 vs 75) · migrations-manuais não versionadas · refactor FichaAluno.

**BAIXA:** A-01/A-02 · D-01..D-04 · P-04/P-05/P-06 · F5 · DOC-06 · dados incorretos (Fátima/Icaro/Sexo) · ERR-EDGE-001/002.

**Ordem sugerida para o QA (etapa 2 do BLOCO AUDITORIA), após aprovação deste relatório:**
1. Sair do checkout antigo (Ressalva 0) — pré-condição de tudo.
2. Verificar F4 em `pg_policies` + corrigir ERR-RISK-001 (P1, minutos).
3. Zerar tsc (grupos A→D→C→B) + as 9 falhas de teste (mock de `useAuth` + aposentar/consertar `verificarPrerequisitos`).
4. Implementar (ou registrar como decisão consciente) as regras de convalidação do Manual §9.
5. Atualizar CLAUDE.md raiz, ROADMAP-SPRINTS, baixas em known-errors; escrever ADR-008..011.
6. Sprint pequeno: DROP das tabelas legadas (plano §2.2).

---
*Relatório produzido em modo read-only. Nenhum código foi alterado. Aprovação do Hélio necessária antes de qualquer correção (protocolo do Agente 14).*
