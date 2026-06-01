# Runbook — Seed de Dados de Teste

## Pré-requisitos

Execute nesta ordem no Supabase SQL Editor (role: `service_role`):

1. Migration 014 — disciplinas e módulos
2. Migration 018 — turmas
3. Migration 022 — CHECK constraint de matriculas.status
4. Migration 023 — avaliacoes + notas_aluno
5. Migration 024 — solicitacoes_disciplina
6. **seed_testes.sql** — 5 professores + 10 alunos

## Como executar

Abrir o SQL Editor em `supabase.com/dashboard` → projeto ITEC-EAD → SQL Editor.
Selecionar role `service_role` antes de rodar.
Colar o conteúdo de `seed_testes.sql` e executar.

## Credenciais criadas

Todos os usuários usam a senha: **Itec@2026**

| Email | Role | Observação |
|-------|------|-----------|
| prof1@itecedu.com | professor | Tem disciplina, frequência e notas lançadas |
| prof2–5@itecedu.com | professor | Têm contrato, sem alunos vinculados |
| aluno1@itecedu.com | aluno | N1=8.0, N2=8.5 — Aprovado direto |
| aluno2@itecedu.com | aluno | N1=7.5, N2=7.0 — Aprovado direto |
| aluno3@itecedu.com | aluno | N1=6.0, N2=6.5, Rec=7.5 — Aprovado na recuperação |
| aluno4@itecedu.com | aluno | N1=5.0, N2=4.5 — Reprovado por nota |
| aluno5@itecedu.com | aluno | N1=4.0, N2=3.0 — Reprovado nota+falta (70%) |
| aluno6–10@itecedu.com | aluno | Turma TEO-2025-1, sem notas |

## Erros conhecidos e soluções

### ERR-SUPABASE-001 — ON CONFLICT em auth.identities
```
ERROR: 42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification
```
**Causa:** Tentativa de `ON CONFLICT (provider, user_id)` — a PK real é `(id)`.
**Solução:** Usar `ON CONFLICT (id) DO NOTHING` (já corrigido no seed_testes.sql).

### ERR-SUPABASE-002 — Login retorna HTTP 500
```
"Database error querying schema"
```
**Causa:** Usuário existe em `auth.users` mas não em `auth.identities`.
**Solução:** Rodar este SQL para corrigir usuários existentes sem identity:
```sql
INSERT INTO auth.identities (id, user_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT id, id AS user_id, 'email' AS provider,
  json_build_object('sub', id::text, 'email', email) AS identity_data,
  NOW(), NOW(), NOW()
FROM auth.users
WHERE email LIKE '%@itecedu.com'
ON CONFLICT (id) DO NOTHING;
```

### Coluna NOT NULL sem valor padrão
Se aparecer erro de NOT NULL constraint, verificar quais colunas foram adicionadas em migrations recentes e garantir que o seed as inclua.

## Limpeza após os testes

Quando o Hélio aprovar que os dados de teste podem ser removidos:

```sql
-- Limpa em cascata (RLS desativado com service_role)
DELETE FROM auth.users WHERE email LIKE '%@itecedu.com';
DELETE FROM public.profiles WHERE email LIKE '%@itecedu.com';
```

O primeiro DELETE cuida de auth.users + auth.identities (FK com CASCADE).
O segundo cuida de profiles + todas as tabelas que fazem FK com profiles.
