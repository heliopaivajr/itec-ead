# AUDITORIA — Núcleo Acadêmico (R0→R3) — Parte B
## Segurança · RLS · LGPD · Performance

**Data:** 2026-07-05/06
**Agentes:** 14-auditor (condução) · 11-security-auditor · 17-lgpd-auditor · 13-performance
**Modo:** READ-ONLY (Mandamento 7) — nenhum arquivo do projeto modificado; único artefato é este relatório.
**Base auditada:** `main` (a8bfe1b + chore 69f6c76) — código + as 53 migrations + `migrations-manuais/`.
**Limitação:** o projeto Supabase do ITEC não está acessível pelo MCP desta sessão — policies e grants foram lidos das **migrations**, não do banco vivo. Onde o estado vivo importa, o achado indica a query de verificação para o Hélio rodar no SQL Editor.

---

## SUMÁRIO EXECUTIVO (semáforo)

| Área | Status | Resumo |
|---|:---:|---|
| **1. Segurança / RLS** | 🟡 (com 1 vermelho condicional) | As 9 tabelas sensíveis têm RLS com padrão correto (aluno vê o próprio; escrita staff). Secrets limpos. **MAS**: a `user_roles` é uma **VIEW sem `security_invoker` e sem REVOKE** — com os grants default do Supabase ela pode permitir **leitura de todos os roles** e, no pior caso, **escalação de privilégio via UPDATE na view** (SEC-01, verificar ao vivo). Storage de materiais/manuais com SELECT amplo demais vs a spec. |
| **2. LGPD** | 🟡 | PII sob RLS ✅, sem PII em URL ✅, signed URLs ✅. Ressalvas: **professor lê CPF/RG/endereço de TODOS os alunos** (minimização), exclusão definitiva é stub (fila manual), avatars de alunos públicos. |
| **3. Performance** | 🟢 | Índices cobrem todas as colunas quentes; LIMIT disciplinado em 100% das queries (DT-03 mantido); MeusCursos batelado. Ressalva: detector F1 com `limit(2000)` full-scan e relatórios com tetos de 500–5000 — ok para 150 alunos, monitorar. **Porém a análise de queries revelou PERF-01, que é bug funcional grave** (pré-requisitos). |

### 🔴 BLOQUEADORES DE LANÇAMENTO (agosto)

| # | Achado | Por quê bloqueia |
|---|---|---|
| **SEC-01** | Grants da VIEW `user_roles` (exposição de roles + possível **escalação de privilégio** via UPDATE na view) | Se confirmado ao vivo, qualquer aluno autenticado promove o próprio role. Verificação custa 2 queries; correção custa 2 `REVOKE`. **Verificar antes de qualquer aluno real.** |
| **PERF-01** | **As DUAS vias de verificação de pré-requisito estão quebradas** (coluna `aluno_id` inexistente em `matriculas_disciplina` no batch + pseudo-subquery na single) — falha silenciosa, `cursadas` sempre vazio | Hoje é invisível (F1: 0 linhas na tabela). No instante em que a secretaria fizer o **lançamento retroativo (R2)**, todo aluno de módulo 2+ verá disciplinas **bloqueadas indevidamente** no portal. Quebra o motor de elegibilidade do Plano §4.4. |

Tudo o mais abaixo é **melhoria pré-agosto** (recomendada) ou **melhoria futura** (marcado por achado).

---

# 1. SEGURANÇA / RLS (11-security-auditor)

## 1.1 SEC-01 — VIEW `user_roles`: grants default expõem leitura e, possivelmente, ESCRITA — 🔴 CRÍTICA (condicional) · BLOQUEADOR

**Contexto que muda tudo:** `user_roles` **não é tabela — é VIEW** criada pela migração 032:

```sql
-- 20260606_032_user_roles_view.sql
CREATE VIEW public.user_roles AS
  SELECT id AS user_id, role FROM public.profiles;
```

A migração **não contém nenhum `REVOKE`/`GRANT` nem `security_invoker`**. Consequências prováveis (verificar ao vivo):

1. **Exposição de leitura:** o Supabase aplica `ALTER DEFAULT PRIVILEGES ... GRANT ALL ON TABLES TO anon, authenticated` no schema `public` — views entram nesse default. Se valer aqui, **qualquer usuário autenticado (talvez até `anon`) lê `GET /rest/v1/user_roles`** → enumeração de todos os `user_id` + roles do sistema. Vazamento de metadados (quem é admin, quantos usuários), não de PII direto.
2. **Risco de escalação (o grave):** a view é **auto-atualizável** (projeção simples de uma tabela). Views sem `security_invoker` executam com os privilégios do **dono** (`postgres`), que como dono de `profiles` **bypassa o RLS**. Se o grant default de INSERT/UPDATE também se aplicar, um aluno autenticado pode fazer:
   ```
   PATCH /rest/v1/user_roles?user_id=eq.<seu-id>  {"role": "superadmin"}
   ```
   …e o UPDATE atravessa a view direto em `profiles.role`, **ignorando as policies P5/P6** que protegem role. Escalação total de privilégio.

**Verificação (SQL Editor, 2 queries):**
```sql
SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='user_roles';   -- anon/authenticated têm o quê?

SELECT relname, reloptions FROM pg_class WHERE relname='user_roles';  -- security_invoker setado?
```
**Teste empírico definitivo:** logado como aluno de teste, tentar o PATCH acima; esperado: 42501/permission denied. Se retornar 200/204 → confirmado crítico.

**Correção recomendada (migração pequena, .sql do Hélio):**
```sql
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
-- leitura: avaliar. As policies referenciam a view como o USUÁRIO da query,
-- então REVOKE SELECT pode quebrar as policies — testar em staging antes.
-- Alternativa robusta: trocar a view por função SECURITY DEFINER get_my_role()
-- e reescrever as policies (sprint próprio, pós-verificação).
```
O REVOKE de escrita é seguro incondicionalmente (nenhuma policy escreve na view). A leitura exige teste, porque as policies fazem `EXISTS (SELECT 1 FROM user_roles ...)` sob os privilégios do usuário da query.

## 1.2 SEC-02 — ERR-RISK-001 detalhado e RECLASSIFICADO — BAIXA (código morto enganoso)

A Parte A (e o próprio known-errors) tratou o `user_roles.upsert` ignorando erro como risco ALTO de dessincronização. **A análise da 032 muda o diagnóstico:**

- `usuarios.service.ts:206` — `await supabase.from('user_roles').upsert({ user_id, role })` roda contra uma **VIEW sem PK/unique constraint** → o `ON CONFLICT` do upsert **falha SEMPRE** (42P10) e o erro é engolido.
- **Mas dessincronização é impossível:** a view é uma projeção de `profiles` — quando `updateRole` atualiza `profiles.role` (linha 202, com tratamento de erro ✅), a view reflete **instantaneamente**. Não há estado para sincronizar.

**Cenário de falha real:** nenhum dos dois temidos (aluno sem acesso / acesso indevido) acontece por esta via. O código é **morto e enganoso** — sugere uma tabela-cache que não existe e mascara um erro permanente no console de rede.

**Recomendação:** remover a linha do upsert (1 linha); atualizar `known-errors.md` (ERR-RISK-001 → reclassificado; ERR-SEED-001 também propõe `INSERT INTO user_roles`, que falharia contra a view — corrigir o registro); registrar em `lessons-learned` que `user_roles` é VIEW (a Parte A §2.1 item 1 marcou P1 por premissa errada — **rebaixar aquele item**, o P1 real é o SEC-01 acima).

## 1.3 RLS por tabela sensível — inventário (lido das migrations)

| Tabela | SELECT aluno-vê-próprio | Escrita só staff | Fonte | Observação |
|---|:---:|:---:|---|---|
| `profiles` | ✅ P1 own + P2 staff | ✅ P5 own-sem-role / P6 admin / P7 administracao-sem-role / P8 delete superadmin | 033 | Proteção de role bem desenhada (WITH CHECK compara role atual). ⚠️ P2 inclui **professor** → ver LGPD-01 |
| `matriculas` | ✅ `matriculas_select_own` | ✅ insert/update staff (update incl. financeiro), delete superadmin | 035 | **Confirma F4 como falso positivo** (a policy existe desde 06/06) — atualizar known-errors |
| `matriculas_disciplina` | ✅ via join com `matriculas` | ✅ ALL admin/superadmin/administracao | 010 | Professor lê tudo (adiado 037 §2, documentado). Professor NÃO escreve — conferir se LancarNotas precisa escrever nota final aqui (se sim, falha silenciosa) |
| `notas_aluno` | ✅ `aluno_id = auth.uid()` + staff | ✅ insert/update `lancado_por` ou admin; delete superadmin | 023→031 | F3 resolvido; granularidade professor-por-contrato adiada (depende F2) |
| `convalidacoes` | ✅ própria + staff | ✅ ALL admin/superadmin/administracao | 013 | OK |
| `documentos_aluno` | ✅ própria + staff | ✅ ALL staff | 010 | Aluno não faz upload próprio (feature pendente TODO-SPRINT-L-001) — coerente |
| `taxa_matricula` | ✅ própria + staff (+financeiro na 037) | ✅ staff/financeiro, sem DELETE p/ financeiro | 012→037 | OK |
| `materiais_disciplina` | ✅ gated por `aluno_ve_disciplina()` + aprovado/ativo | ✅ ALL admin/superadmin | 049 | ⚠️ ver SEC-03 (Storage) e SEC-05 (status da matrícula) |
| `contratos_professor` | ✅ professor vê o próprio (via `professores.user_id`) + staff | ✅ ALL staff | 009 | OK |

**Nenhuma tabela sensível sem RLS ou com `USING (true)` em dado sensível.** `avaliacoes` tem `SELECT USING (true)` para authenticated (031) — estrutura de avaliação, não sensível; aceitável. Curriculum (`cursos/modulos/disciplinas_v2/prerequisitos_v2`) tem leitura pública — intencional (site público).

**SEC-09 (BAIXA · melhoria futura):** dois padrões convivem nas policies — as antigas (009–013) checam `EXISTS (SELECT FROM profiles WHERE id=auth.uid() AND role IN ...)` e as novas usam `user_roles`. O padrão antigo **funciona** sob RLS (a própria linha do usuário é legível por P1), mas a mistura dificulta auditoria. Consolidar num padrão único quando SEC-01 definir o mecanismo final.

## 1.4 SEC-03 — Storage: SELECT amplo demais em `materiais-disciplina` e `manuais-aluno` — MÉDIA · melhoria pré-agosto

```sql
-- 049 e 050, idênticas na leitura:
CREATE POLICY ... ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'materiais-disciplina');   -- e 'manuais-aluno'
```

- **Qualquer autenticado** (incluindo role `pendente`, aluno evadido, ou aluno de outro curso futuro) pode **listar e baixar QUALQUER objeto** dos dois buckets. O gate fino por matrícula/status existe só na **tabela** `materiais_disciplina`; o Storage não o replica. O path com `crypto.randomUUID()` não protege — a policy de SELECT permite listar.
- Contradiz o Plano §4.2: *"manual da cadeira … Aluno **bloqueado no Storage**"* — se o manual da cadeira for para este bucket, alunos baixam.
- **Mitigante:** conteúdo é material didático (não PII) e o universo de autenticados é controlado pela secretaria. Por isso MÉDIA, não ALTA.

**Recomendação:** replicar o gate na policy do Storage — ex.: `USING (bucket_id='materiais-disciplina' AND (aluno_ve_disciplina((storage.foldername(name))[1]::uuid) OR <staff>))` (o path já começa com `disciplinaId/`), ou servir downloads exclusivamente por signed URL emitida por caminho autorizado e remover o SELECT amplo.

## 1.5 SEC-04 — Escrita nos buckets 049/050 restrita a admin/superadmin — BAIXA (gap funcional) · melhoria pré-agosto

A matriz de permissões (Plano §5) diz que **professor da cadeira re-sobe manual** e **secretaria/coordenador sobem manual do aluno** — mas as policies de INSERT/UPDATE/DELETE dos dois buckets só aceitam `admin/superadmin` (nem `administracao`). O fluxo de aprovação de manuais (§4.2) não funciona para professor/secretaria: upload falhará. Não é furo de segurança (é restritivo demais, não permissivo demais) — é feature quebrada para essas personas.

## 1.6 SEC-05 — `aluno_ve_disciplina()` não filtra status da matrícula — BAIXA · melhoria futura

A função (049, SECURITY DEFINER com `search_path` fixado ✅) considera **qualquer** matrícula do aluno no curso — incluindo `evadida`, `cancelada`, `trancada`. Aluno que saiu continua vendo materiais aprovados (na tabela; no Storage já via tudo pelo SEC-03). Adicionar `AND m.status IN ('ativa','concluida')` quando fizer o SEC-03.

## 1.7 SEC-06/07/08 — Higiene geral — ✅ OK com notas

- **Secrets:** nenhum hardcoded; client usa `VITE_SUPABASE_URL/ANON_KEY` via env com PKCE ([supabase.ts](src/lib/supabase.ts)); `.env*` no `.gitignore` (só `.env.example` versionado); `service_role` aparece apenas na Edge Function via `Deno.env` ✅.
- **XSS:** único `dangerouslySetInnerHTML` é o `chart.tsx` do shadcn (injeção de CSS de config interna, sem input de usuário) — OK.
- **Upload:** `materiais.service.uploadArquivo` valida extensão allowlist + tamanho ≤50MB + path com UUID ✅; `curso.service` fixa `contentType: application/pdf` ✅. ⚠️ `profile.service.uploadAvatar` ([profile.service.ts:55](src/services/profile.service.ts#L55)) **não valida extensão/tamanho no client** — a policy do bucket restringe filename a `uid.{jpg,png,jpeg,webp}` (034), então extensão estranha falha no Storage ✅, mas sem limite de tamanho além do global do Supabase. BAIXA.
- **RPC:** `gerar_numero_matricula` é a única RPC chamada; sem SECURITY DEFINER (RLS aplica ao SELECT interno) — um aluno que a chame obtém no máximo o próximo sequencial calculado sobre as matrículas que ELE enxerga (a própria) — inócuo. Opcional: `REVOKE EXECUTE ... FROM anon, authenticated` e restringir a staff. BAIXA.

---

# 2. LGPD (17-lgpd-auditor)

**Inventário de PII:** `profiles` concentra o dado pessoal (full_name, email, telefone, **cpf, rg, data_nascimento, sexo, endereco** — migração 021) + `documentos_aluno.url` (documentos digitalizados, upload ainda não implementado) + avatars (imagem). Financeiro (`mensalidades`, `taxa_matricula`) é dado pessoal por associação (`aluno_id`).

| ID | Sev. | Achado | Recomendação |
|---|---|---|---|
| **LGPD-01** | **MÉDIA** · pré-agosto | **Professor lê PII completa de todos os alunos**: `profiles_select_staff` (033 P2) inclui `professor` → qualquer professor autenticado pode `SELECT *` de todos os profiles (CPF, RG, endereço, nascimento — de alunos E colegas). Viola minimização (Art. 6º III): professor precisa de nome/foto/email da SUA turma, não do cadastro civil de todos | Tirar `professor` do P2 e atender as telas do professor com uma view/colunas não sensíveis (`full_name, avatar_url, email`), ou policy separada por colunas via view dedicada. Fazer JUNTO com a decisão do SEC-01 (mesmo mecanismo) |
| **LGPD-02** | **MÉDIA** · pré-agosto | **Exclusão definitiva é stub**: `executarExclusao` retorna erro fixo ("requer Edge Function — Sprint L"); a fila (025: `exclusao_solicitada_em/motivo`) funciona, mas a eliminação real depende de SQL manual do superadmin. Não há política de retenção documentada. O **soft delete** do histórico acadêmico é intencional (regra §8 do Plano) mas nunca foi formalizado como base legal/retenção (Art. 16 — conservação p/ cumprimento de obrigação) | Antes de alunos reais: (a) implementar a Edge Function de exclusão/anonimização OU documentar o runbook manual; (b) escrever 1 página de política de retenção (o que é apagado, o que é anonimizado, o que é retido por obrigação acadêmica e por quanto tempo) — pode ser ADR |
| **LGPD-03** | BAIXA · pré-agosto | **Avatars públicos para `anon`** (034): a policy existe "para exibir fotos de professores na área pública", mas o bucket serve avatar de **todo mundo** — incluindo alunos, cujo rosto fica acessível sem login por URL pública (`getPublicUrl` em profile.service) | Separar path/policy (`professores/` público, resto authenticated) ou aceitar e registrar consentimento no cadastro |
| **LGPD-04** | BAIXA | **Logs**: `console.log('getDisciplinasPorAluno:', filtro)` e `getHistoricoAcademico` ([relatorios.service.ts:545,1057](src/services/relatorios.service.ts#L545)) logam filtros de relatório (podem conter nome/código do aluno) no console de produção; vários `console.error(..., err)` logam o objeto de erro inteiro (PostgREST inclui `details` com valores da linha em alguns erros) | Remover os `console.log` de filtro; padronizar `err.message` (não o objeto) nos fallbacks. Entra na leva do BUG-RLS-002/P-04 da Parte A |
| **LGPD-05** | ✅ OK | **Sem PII em URL**: rotas usam UUID (`/dashboard/alunos/:id`); downloads de materiais usam **signed URL de 1h** ✅; nenhum email/CPF em query string encontrado | — |
| **LGPD-06** | INFO | **Acesso a PII sob RLS**: com 033 ativa, aluno lê só o próprio profile; staff (admin/superadmin/administracao/financeiro) lê tudo — compatível com função. A exceção é o professor (LGPD-01) | — |

---

# 3. PERFORMANCE (13-performance)

## 3.1 PERF-01 — Verificação de pré-requisitos: coluna inexistente → falha silenciosa TOTAL — 🔴 ALTA (bug funcional) · BLOQUEADOR

Achado durante a varredura de queries (é bug de domínio, não de velocidade — reportado aqui e cruzado com a Parte A P-03):

- **Batch (a via USADA em produção):** `verificarPrerequisitoBatch` ([academico.service.ts:257-260](src/services/academico.service.ts#L257)) filtra `.from('matriculas_disciplina') ... .eq('aluno_id', alunoId)`. **`matriculas_disciplina` NÃO tem coluna `aluno_id`** — schema da 010 tem `matricula_id`; nenhuma migração posterior (051/052 verificadas) adicionou `aluno_id`. O PostgREST retorna 400; o erro é engolido (`matriculaRes.data ?? []`); `cursadas` fica **sempre vazio**.
- **Single:** `verificarPrerequisitos` tem a pseudo-subquery inválida (Parte A P-03) — mesmo efeito.
- **A prova de que o time sabia:** [matricula-academica.service.ts:117](src/services/matricula-academica.service.ts#L117) comenta *"matriculas_disciplina não tem aluno_id"* e faz o filtro **correto** via `matriculas!inner(aluno_id)` — o padrão certo existe no projeto, só não chegou ao `academico.service`.
- **Consequência:** o motor de elegibilidade (Plano §4.4) **nunca reconhece disciplina cursada**. Invisível hoje (F1: tabela vazia). Assim que o lançamento retroativo popular `matriculas_disciplina`, o portal do aluno (`useMeusCursos` → `verificarPrerequisitoBatch`) marcará como **bloqueada** toda disciplina com pré-req formal, mesmo com o pré-req aprovado. Os testes unitários não pegam (mocks não validam schema).
- **Correção (1 linha no batch):** trocar o filtro por join — `select('disciplina_id, matricula:matriculas!inner(aluno_id)').eq('matricula.aluno_id', alunoId)` (padrão já usado no matricula-academica) — e aposentar/reescrever a single (Parte A P-03). Cobrir com teste que valide o shape da query contra o schema real (ou teste de integração em staging).

## 3.2 Fetches que crescem com volume

| ID | Sev. | Local | Diagnóstico |
|---|---|---|---|
| PERF-02 | MÉDIA · monitorar | Detector F1: `getPendenciasSecretaria` ([dashboard.service.ts:162](src/services/dashboard.service.ts#L162)) — `from('matriculas_disciplina').select('matricula_id').limit(2000)` sem filtro, dedupe client-side p/ achar "alunos sem vínculo" | Full scan da tabela. Com 46 disciplinas × centenas de alunos o teto de 2000 **trunca** e o detector passa a dar **falso positivo** (aluno com vínculo além do corte aparece como "sem vínculo"). OK p/ 31 alunos; trocar por agregação server-side (RPC `count` por matrícula ou view) quando a tabela passar de ~1.500 linhas |
| PERF-03 | BAIXA · monitorar | Relatórios: R04 `limit(5000)` em mensalidades ([relatorios.service.ts:588](src/services/relatorios.service.ts#L588)); vários tetos de 500 | Padrão dos relatórios é fetch-com-teto + merge (LICAO-026) — correto p/ 100–150 alunos. Aos ~400 alunos (5000/12 mensalidades), R04 trunca silenciosamente: logar aviso quando `data.length === limit` |
| PERF-04 | ✅ OK | `useMeusCursos` | Já batelado: 4 queries paralelas onde eram 32–40 (comentário no código). Sem N+1 remanescente nos hooks das telas novas (`useAlunoDashboard`, `useProfessorDashboard`, `usePendenciasSecretaria` fazem fetch paralelo com LIMIT) |

## 3.3 Os 9 joins aninhados `!fkey` (persistem apesar da LICAO-026)

Localização (Parte A P-02): `matriculas.service.ts:34` · `frequencia.service.ts:63,139,256` · `financeiro.service.ts:116` · `turmas.service.ts:123` · `notas.service.ts:199` · `academico.service.ts:312` · `matricula-academica.service.ts:79`.

**Risco real:** não é lentidão (PostgREST resolve embeds com joins eficientes; volumetria pequena) — é o **vazio silencioso sob RLS** já ocorrido duas vezes (BUG-RLS-001, LICAO-033). Todos os 9 funcionam **hoje** porque as duas pontas de cada join são legíveis pelo perfil que os usa (staff lê profiles; aluno lê as próprias matriculas). O perigo é **regressão futura**: qualquer endurecimento de policy (ex.: LGPD-01 tirando professor do P2 de profiles!) quebra em silêncio os embeds de `frequencia.service:63,139,256` e `notas.service:199` usados nas telas do professor. **Recomendação:** tratar a conversão desses 9 para query-separada+merge como **pré-requisito técnico** de qualquer mudança de RLS (amarrar no checklist do sprint que implementar SEC-01/LGPD-01).

## 3.4 Índices — ✅ cobertura completa

Inventário das migrations × colunas filtradas nos services: todas as colunas quentes têm índice — `matriculas(turma_id, curso_id)` + único parcial de `numero_matricula` (051); `matriculas_disciplina(matricula_id, disciplina_id, status)`; `notas_aluno(aluno_id, disciplina_id, turma_id)`; `frequencia(aluno_id, disciplina_id, (disciplina_id,aluno_id), data_aula, professor_id)`; `mensalidades(aluno_id, matricula_id, status, data_vencimento, mes_referencia)`; `convalidacoes/documentos/contratos/avaliacoes` idem; paginação da 006. **Nenhum índice faltante identificado nos caminhos de query atuais.** (Índice novo só será necessário se PERF-02 virar agregação por `matricula_id` — já coberto por `idx_mat_disc_matricula_id`.)

---

## ANEXO — Consolidado por severidade

**CRÍTICA (condicional — verificar ao vivo):** SEC-01 (grants da view `user_roles` — leitura de roles + possível escalação via UPDATE). **BLOQUEADOR.**

**ALTA:** PERF-01 (pré-requisitos: as duas vias quebradas por coluna inexistente/pseudo-subquery — **BLOQUEADOR funcional**, detona o portal do aluno pós-retroativo).

**MÉDIA:** SEC-03 (Storage SELECT amplo em materiais/manuais vs spec §4.2) · LGPD-01 (professor lê CPF/RG de todos) · LGPD-02 (exclusão stub + retenção não documentada) · PERF-02 (detector F1 trunca em 2000) · SEC-09/P-02-A (mistura de padrões + 9 embeds frágeis a mudanças de RLS).

**BAIXA:** SEC-02 (upsert morto na view — reclassificação do ERR-RISK-001; corrigir known-errors e a prioridade P1 da Parte A) · SEC-04 (escrita de buckets restritiva demais — professor/secretaria não sobem manual) · SEC-05 (`aluno_ve_disciplina` sem filtro de status) · SEC-06 (avatar sem validação client de tamanho) · SEC-07 (RPC executável por qualquer authenticated) · LGPD-03 (avatars de alunos públicos) · LGPD-04 (console.log de filtros/objetos de erro).

### Ordem sugerida (após aprovação deste relatório)
1. **SEC-01:** rodar as 2 queries de verificação + teste empírico do PATCH; se confirmado, migração de REVOKE imediata. *(minutos)*
2. **PERF-01:** corrigir o filtro do batch (join via `matriculas!inner`) + aposentar a single; teste com schema real. *(pequeno; antes do lançamento retroativo em produção)*
3. **Leva LGPD pré-agosto:** LGPD-01 (professor × PII) junto com a decisão do mecanismo de roles; LGPD-02 (runbook/Edge de exclusão + 1 página de retenção); SEC-03/SEC-04 (policies de Storage alinhadas à spec §4.2).
4. **Registrar reclassificações:** ERR-RISK-001 (SEC-02), F4 (falso positivo — policy da 035 confirmada), e o rebaixamento do item #1 do mapa de débito da Parte A.
5. **Melhoria futura:** SEC-05/06/07, LGPD-03/04, PERF-02/03, conversão dos 9 embeds.

---
*Relatório produzido em modo read-only. Nenhum código foi alterado. Aprovação do Hélio necessária antes de qualquer correção (protocolo do Agente 14).*
