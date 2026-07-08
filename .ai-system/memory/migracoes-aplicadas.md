# Migrações aplicadas — FONTE DA VERDADE
## ITEC-EAD · estado real do banco de produção

> ⚠️ **LEIA ANTES DE DIZER QUE UMA MIGRAÇÃO ESTÁ "PENDENTE".**
> O Supabase MCP **NÃO enxerga** o projeto ITEC (conta diferente). Logo, o estado real
> do banco **não é verificável por ferramenta** — esta lista é a única fonte da verdade
> sobre o que já rodou. Sempre consultar este arquivo antes de afirmar status de migração.
>
> Quem aplica: **somente o Hélio**, no SQL Editor (ERR-INFRA-001). Claude Code cria o `.sql`, nunca roda.
> Atualizado: 2026-06-20.

---

## Convenção
- **APLICADA** = já rodada por Hélio no SQL Editor e validada. **NÃO reexecutar.**
- **CRIADA (aguardando run)** = arquivo `.sql` existe no repo, mas Hélio ainda não rodou.
- Em caso de dúvida, perguntar ao Hélio — não assumir.

---

## Núcleo Acadêmico (trilha R0 → R4)

| Migração | Status | Quando | Validação |
|----------|--------|--------|-----------|
| `supabase/migrations/20260619_047_r0_reconciliacao_prerequisitos.sql` | ✅ **APLICADA** | 2026-06-19/20 | 24/24/24 (códigos v2 alinhados; 24 pré-req re-apontados para `disciplinas_v2`). **NÃO reexecutar.** |
| `supabase/migrations/20260620_048_r0_5_consolida_curriculo_v2.sql` | ✅ **APLICADA** | 2026-06-20 | `prerequisitos_v2` repopulada: **13 `prerequisito` + 11 `recomendado`**; coluna `disciplinas_v2.ativo` criada; CHECK ampliado com `recomendado`. **NÃO reexecutar.** |
| `supabase/migrations/20260622_049_materiais_disciplina.sql` | ✅ **APLICADA** | 2026-06-22 | R0.5.4: tabela `materiais_disciplina` + RLS, função `aluno_ve_disciplina()`, bucket privado `materiais-disciplina` + policies. Versionada no `main` (PR #16 merged). **NÃO reexecutar.** |
| `supabase/migrations/20260622_050_manual_aluno.sql` | ✅ **APLICADA** | 2026-06-22 | Manual do Aluno (handbook): coluna `cursos.manual_aluno_url` + bucket privado `manuais-aluno` (read authenticated; write admin/superadmin). Validada 1/1/4 (coluna + bucket + 4 policies). Versionada no `main` (PR #17 merged). **NÃO reexecutar.** |
| `supabase/migrations/20260623_051_r1_schema_retroativo.sql` | ✅ **APLICADA** | 2026-06-23 | R1: `matriculas.numero_matricula` (nullable + índice único parcial) + CHECK do funil ADITIVO (7+5 valores) + função `gerar_numero_matricula()` (advisory lock + ano via `lpad`). `matriculas_disciplina` ganha `faltas`, `frequencia_percentual`, `observacao` e `convalidacao_*` (5 col). Validada: colunas criadas; CHECK aditivo; `gerar_numero_matricula()` testada (2025→`ITEC25T001`, 2026→`ITEC26T001`). **NÃO reexecutar.** ⚠️ Os 5 `convalidacao_*` foram **removidos pela 052** (redundantes). 📌 **Versionada em 2026-07-05** (branch `chore/versionar-migrations-pendentes`) — estava aplicada mas SEM cópia no repositório (achado da auditoria 2026-07-05, Ressalva 0). |
| `supabase/migrations/20260627_052_r2_professor_id_drop_convalidacao.sql` | ✅ **APLICADA** | 2026-06-27 | R2 (G1+G2): `matriculas_disciplina.professor_id` UUID FK→`professores`; **DROP** dos 5 `convalidacao_*` da 051 (redundantes — convalidação canônica = tabela `convalidacoes`). Validada: `professor_id` criado=1; `convalidacao_*` restantes=0. **NÃO reexecutar.** |
| `supabase/migrations/20260627_053_recuperacao_status_check.sql` | ✅ **APLICADA** | 2026-06-27 | R2.2: adiciona `'recuperacao'` ao CHECK de `matriculas_disciplina.status` (aditivo — 6 atuais + recuperacao). Validada: CHECK agora inclui `recuperacao`; lançamento retroativo de cadeiras em recuperação destravado. Versionada no branch do R2.2. **NÃO reexecutar.** |
| `supabase/migrations/20260706_054_sec01_revoke_user_roles.sql` | ✅ **APLICADA** | 2026-07-06 | **SEC-01 (report-B, BLOQUEADOR) — RESOLVIDO:** REVOKE de INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER na VIEW `user_roles` p/ anon+authenticated e REVOKE SELECT p/ anon — fecha a escalação de privilégio via UPDATE na view (que executava como dona e bypassava o RLS de profiles). ⚠️ `security_invoker=true` foi **excluído de propósito** — reintroduziria a recursão infinita do ADR-006 (P2 de profiles consulta user_roles). Validada: `anon` sem nenhum privilégio na view; `authenticated` só com `SELECT` (policies continuam funcionando). **NÃO reexecutar.** Versionada via PR `fix/sec01-user-roles`. |
| `supabase/migrations/20260707_055_storage_rls_hardening.sql` | ✅ **APLICADA** | 2026-07-07 | **SEC-03 + SEC-05 + SEC-04 parcial + manual do aluno editável (report-B).** Buckets privados com 0 objetos (sem risco). (1) `aluno_ve_disciplina` agora exige `status IN ('ativa','concluida')` — **SEC-05 fechado**. (2) `materiais_obj_select` gate por disciplina via `foldername[1]::uuid` + staff/professor leem tudo — **SEC-03 fechado**. (3) escrita de materiais inclui `administracao` — **SEC-04 parcial** (professor fica p/ o sprint com UI). (4) `manuais_aluno_write/update/delete` incluem `administracao` (secretaria/coordenação sobem e revisam handbook). Validada: policies vigentes conferidas; writes com `administracao`; função com filtro de status. **NÃO reexecutar.** Rollback (recria 049/050) no próprio arquivo. Versionada via PR `fix/storage-055-rls`. |

| `supabase/migrations/20260707_056_material_professor.sql` | 🟡 **CRIADA** (aguardando run do Hélio) | 2026-07-08 | **Sprint Material do Professor (SEC-04 metade 2 + gap da 055).** (1) Funções `professor_leciona_disciplina` (contrato ativo) e `professor_dono_contrato` — SECURITY DEFINER. (2) Tabela `materiais_disciplina`: policies do professor (SELECT/INSERT/UPDATE/DELETE na cadeira do contrato) + `administracao` no `staff_all` (**fecha o gap da 055**: administracao subia arquivo mas a linha falhava). (3) Storage materiais: ramo do professor no write/update/delete. (4) Bucket privado `contratos-professor` + policies (professor lê/sobe o PDF do próprio contrato; staff tudo; delete só staff). (5) `contratos_professor`: professor faz UPDATE da própria linha com WITH CHECK travando status/professor_id/disciplina_id (só `pdf_url` muda — quem marca 'assinado' é a secretaria). Verificação + rollback no arquivo. |

> As migrações 001–046 (numeração antiga) e as paradas em `migrations-manuais/` (038, 039, 046)
> seguem o histórico do `CLAUDE.md` do projeto e o backlog do Plano Mestre §9 — não duplicar aqui
> sem confirmação. Esta tabela cobre a fase atual (Núcleo Acadêmico).
>
> 📌 **2026-07-05:** `migrations-manuais/` (038, 039, 046 — aplicadas manualmente via SQL Editor) foi
> **versionado no repositório** junto com o PASSO 1 da 039 (Edge Function `criar-aluno` enviando
> `email` no `user_metadata`) — branch `chore/versionar-migrations-pendentes`. Fecha parte do
> backlog §9 do Plano Mestre ("versionar migrations 038-046 + Edge Function criar-aluno").

---

## Efeito no estado do banco (pós-047/048)
- `disciplinas_v2.codigo` = código v2 compacto (`B1ATG`…), `UNIQUE`. 46 cadeiras.
- `disciplinas_v2.ativo` existe (default `true`).
- `prerequisitos_v2` é a fonte de pré-requisitos consumida pela UI (CursosAdmin via `cursos.service`):
  24 linhas (13 `prerequisito` + 11 `recomendado`).
- Tabelas legadas `disciplinas` / `prerequisitos_disciplinas` ainda existem (serão depreciadas/derrubadas
  em etapa futura do R0.5 — ver [[known-errors]] ERR-DEBT-002, marcado QUITADO no código).

---
*Mantido por agente-Osabio · ITEC-EAD · 2026-06-20*
