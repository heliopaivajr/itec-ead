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

> As migrações 001–046 (numeração antiga) e as paradas em `migrations-manuais/` (038, 039, 046)
> seguem o histórico do `CLAUDE.md` do projeto e o backlog do Plano Mestre §9 — não duplicar aqui
> sem confirmação. Esta tabela cobre a fase atual (Núcleo Acadêmico).

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
