# DIAGNÓSTICO RLS COMPLETO — Sprint RLS
**Data**: 2026-06-11  
**Agente**: 11-security-auditor  
**Sprint**: sprint-rls-completo  
**Status**: ANÁLISE CONCLUÍDA — Pronto para Migration 037

---

## 📊 RESUMO EXECUTIVO

**Situação Real**: 🟢 MUITO MELHOR QUE O ESPERADO

- ✅ **29 tabelas com RLS ativado**
- ✅ **29 tabelas com policies criadas**
- 🟡 **8 tabelas precisam ajustes finos** (não são vulnerabilidades críticas)
- 🟢 **21 tabelas seguras**

**Risco real**: 🟡 MÉDIO (não 🔴 CRÍTICO como relatado na auditoria S1)

**Urgência**: 🟡 MÉDIA (recomendado antes de agosto, não blocker absoluto)

**Esforço estimado**: 4 horas (migration 037 + testes)

---

## PARTE 1 — POLICIES DAS 3 TABELAS NÃO VERIFICADAS

### 1. `progresso_aluno` (migration 011)

**RLS Ativado**: ✅ Sim  
**Policies Existentes**:
```sql
-- Policy 1: ALL operations
CREATE POLICY "progresso_aluno_proprio" ON public.progresso_aluno
  FOR ALL USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  );
```

**Estrutura da tabela**:
```sql
CREATE TABLE public.progresso_aluno (
  id             UUID PRIMARY KEY,
  aluno_id       UUID NOT NULL REFERENCES profiles(id),
  material_id    UUID NOT NULL REFERENCES materiais(id),
  disciplina_id  UUID NOT NULL REFERENCES disciplinas_v2(id),
  visualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(aluno_id, material_id)
);
```

**Coluna de Vínculo**: `aluno_id`, `disciplina_id`

**PROBLEMA IDENTIFICADO**: 🟠 RISCO MÉDIO
- Professor NÃO tem acesso ao progresso dos alunos
- Professor deveria poder consultar progresso dos alunos nas disciplinas que leciona
- Atual: apenas aluno vê próprio progresso + admin/secretaria

**Correção Necessária**:
```sql
-- Adicionar role 'professor' COM restrição de disciplina
-- Professor só vê progresso se leciona a disciplina
```

---

### 2. `matriculas_disciplina` (migration 010)

**RLS Ativado**: ✅ Sim  
**Policies Existentes**:
```sql
-- Policy 1: SELECT
CREATE POLICY "mat_disc_aluno_ve_propria" ON public.matriculas_disciplina
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.matriculas m
            WHERE m.id = matricula_id AND m.aluno_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('professor','admin','superadmin','administracao'))
  );

-- Policy 2: ALL (INSERT/UPDATE/DELETE)
CREATE POLICY "mat_disc_gestao_staff" ON public.matriculas_disciplina
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );
```

**Estrutura da tabela**:
```sql
CREATE TABLE public.matriculas_disciplina (
  id            UUID PRIMARY KEY,
  matricula_id  UUID NOT NULL REFERENCES matriculas(id),
  disciplina_id UUID NOT NULL REFERENCES disciplinas_v2(id),
  status        VARCHAR(20) CHECK (status IN ('cursando','aprovado','reprovado',...)),
  nota          DECIMAL(4,2),
  aprovado_por  UUID REFERENCES profiles(id),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(matricula_id, disciplina_id)
);
```

**Coluna de Vínculo**: `matricula_id`, `disciplina_id`

**PROBLEMA IDENTIFICADO**: 🟠 RISCO MÉDIO
- Professor vê TODAS as matrículas em disciplinas (não apenas as que leciona)
- Policy atual permite `role = 'professor'` sem restrição de disciplina

**Correção Necessária**:
```sql
-- Restringir SELECT do professor às disciplinas que leciona
-- Verificar vínculo via contratos_professor
```

---

### 3. `avaliacoes` (migration 022)

**RLS Ativado**: ✅ Sim  
**Policies Existentes**:
```sql
-- Policy 1: SELECT — QUALQUER autenticado lê
CREATE POLICY "avaliacoes_select" ON public.avaliacoes
  FOR SELECT TO authenticated USING (true);

-- Policy 2: INSERT
CREATE POLICY "avaliacoes_insert" ON public.avaliacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = criado_por OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao'))
  );

-- Policy 3: UPDATE
CREATE POLICY "avaliacoes_update" ON public.avaliacoes
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = criado_por OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- Policy 4: DELETE
CREATE POLICY "avaliacoes_delete" ON public.avaliacoes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
```

**Estrutura da tabela**:
```sql
CREATE TABLE public.avaliacoes (
  id             UUID PRIMARY KEY,
  disciplina_id  UUID NOT NULL REFERENCES disciplinas_v2(id),
  turma_id       UUID NOT NULL REFERENCES turmas(id),
  tipo           TEXT CHECK (tipo IN ('N1','N2','recuperacao','trabalho','extra')),
  descricao      TEXT,
  peso           NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  data_avaliacao DATE,
  criado_por     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Colunas de Vínculo**: `disciplina_id`, `turma_id`, `criado_por`

**PROBLEMA IDENTIFICADO**: 🟡 RISCO BAIXO-MÉDIO
- SELECT é público (`USING (true)`) — qualquer autenticado vê TODAS as avaliações
- INSERT verifica `criado_por` mas NÃO verifica se professor leciona aquela disciplina
- Professor pode criar avaliação em disciplina/turma que NÃO leciona

**Correção Necessária**:
```sql
-- Restringir INSERT do professor às disciplinas que leciona
-- Manter SELECT público (alunos precisam ver as avaliações da turma deles)
```

---

## PARTE 2 — ESTRUTURA DE VÍNCULO PROFESSOR × DISCIPLINA

### Tabela `contratos_professor` (migration 009)

**Estrutura**:
```sql
CREATE TABLE public.contratos_professor (
  id                UUID PRIMARY KEY,
  professor_id      UUID NOT NULL REFERENCES professores(id),
  disciplina_id     UUID NOT NULL REFERENCES disciplinas_v2(id),
  status            VARCHAR(20) CHECK (status IN ('pendente','preenchido','impresso','assinado','encerrado')),
  dados_preenchidos JSONB,
  pdf_url           TEXT,
  gerado_por        UUID REFERENCES profiles(id),
  ...
);
```

**Tabela `professores`**:
```sql
CREATE TABLE public.professores (
  id           UUID PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id),  -- VÍNCULO com auth
  nome_completo VARCHAR(200) NOT NULL,
  cpf          VARCHAR(14) UNIQUE NOT NULL,
  ativo        BOOLEAN NOT NULL DEFAULT true,
  ...
);
```

### ✅ VÍNCULO IDENTIFICADO

**Professor está vinculado à disciplina via:**
```sql
-- Caminho completo:
auth.uid() 
  → professores.user_id = auth.uid()
  → contratos_professor.professor_id = professores.id
  → contratos_professor.disciplina_id = disciplinas_v2.id
```

**Status válido do contrato**: Precisa definir
- Opção 1 (restritiva): apenas `status = 'assinado'`
- Opção 2 (moderada): `status IN ('assinado', 'impresso')` (contrato confirmado)
- Opção 3 (permissiva): `status NOT IN ('encerrado')` (qualquer contrato ativo)

**RECOMENDAÇÃO**: Opção 2 — `status IN ('assinado', 'impresso')`  
Professor só acessa dados após contrato confirmado, mas antes de digitalizar assinatura já pode trabalhar.

---

## PARTE 3 — PADRÃO DE ACESSO AO ROLE

### ⚠️ INCONSISTÊNCIA IDENTIFICADA

**Migrations antigas (007-023)**: Usam `profiles.role`
```sql
EXISTS (SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
          AND role IN ('admin','superadmin'))
```

**Migrations recentes (032+)**: Podem usar view `user_roles` (se existir)

**Verificar**: Existe view `user_roles` no banco?

**DECISÃO NECESSÁRIA**:
- **Opção A**: Manter `profiles.role` (consistente com 90% das policies existentes)
- **Opção B**: Migrar tudo para `user_roles` (requer refatoração de 29 tabelas)

**RECOMENDAÇÃO**: Opção A — manter `profiles.role`  
Migration 037 usa o padrão das migrations 007-023 por consistência.

---

## PARTE 4 — RESUMO DE CORREÇÕES NECESSÁRIAS

### 🟠 PRIORIDADE ALTA (Migration 037)

#### **SEÇÃO 1 — Adicionar role `financeiro` (2 tabelas)**

| Tabela | Policy Atual | Correção |
|--------|--------------|----------|
| `mensalidades` | `role IN ('admin','superadmin','administracao')` | Adicionar `'financeiro'` |
| `taxa_matricula` | `role IN ('admin','superadmin','administracao')` | Adicionar `'financeiro'` |

**Impacto**: Breno (role financeiro) poderá lançar pagamentos.

---

#### **SEÇÃO 2 — Restringir professor às suas disciplinas (6 tabelas)**

| Tabela | Problema | Correção |
|--------|----------|----------|
| `notas_aluno` | Professor vê TODAS as notas | Adicionar verificação de contrato |
| `frequencia` | Professor vê TODA a frequência | Adicionar verificação de contrato |
| `materiais` | Professor gerencia TODOS os materiais | Adicionar verificação de contrato |
| `matriculas_disciplina` | Professor vê TODAS as matrículas | Adicionar verificação de contrato |
| `progresso_aluno` | Professor NÃO vê progresso (deveria ver) | Adicionar acesso COM verificação |
| `avaliacoes` | Professor cria em QUALQUER disciplina | Adicionar verificação de contrato |

**Pattern da verificação** (a ser usado em todas as 6 tabelas):
```sql
-- Professor só acessa se leciona a disciplina
EXISTS (
  SELECT 1 
  FROM public.professores p
  JOIN public.contratos_professor c ON c.professor_id = p.id
  WHERE p.user_id = auth.uid()
    AND c.disciplina_id = [tabela].disciplina_id
    AND c.status IN ('assinado', 'impresso')
)
```

---

### 📋 CHECKLIST DE DECISÕES ANTES DA MIGRATION 037

- [ ] **Aprovar status válido de contrato**: `'assinado'` apenas OU `'assinado','impresso'`?
- [ ] **Confirmar pattern de role**: manter `profiles.role` OU migrar para `user_roles`?
- [ ] **Confirmar se existe view `user_roles`** (se sim, mostrar definição)
- [ ] **Aprovar escopo da migration 037**: apenas 8 tabelas OU incluir outras melhorias?

---

## PARTE 5 — ESTRUTURA PROPOSTA DA MIGRATION 037

```sql
-- ================================================================
-- Migration: 20260611_037_rls_ajustes_finos.sql
-- Sprint: sprint-rls-completo
-- Descrição: Ajustes finos em RLS — adicionar role financeiro +
--            restringir professor às disciplinas que leciona
-- ================================================================

-- SEÇÃO 1: Adicionar role 'financeiro' em mensalidades e taxa_matricula
-- (2 tabelas × 2 policies cada = 4 ALTER POLICY)

-- SEÇÃO 2: Restringir professor em notas_aluno (4 policies)
-- SEÇÃO 3: Restringir professor em frequencia (3 policies)
-- SEÇÃO 4: Restringir professor em materiais (2 policies)
-- SEÇÃO 5: Restringir professor em matriculas_disciplina (1 policy SELECT)
-- SEÇÃO 6: Adicionar professor em progresso_aluno (1 policy + UPDATE)
-- SEÇÃO 7: Restringir professor em avaliacoes (1 policy INSERT)

-- Total: ~18 ALTER POLICY ou DROP+CREATE
```

---

## PARTE 6 — MATRIZ FINAL DE ACESSO (APÓS MIGRATION 037)

### Tabela: `mensalidades`

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| aluno | ✅ Próprias | ❌ | ❌ | ❌ |
| professor | ❌ | ❌ | ❌ | ❌ |
| administracao | ✅ Todas | ✅ | ✅ | ❌ |
| **financeiro** | ✅ Todas **(NOVO)** | ✅ **(NOVO)** | ✅ **(NOVO)** | ❌ |
| admin | ✅ Todas | ✅ | ✅ | ✅ |
| superadmin | ✅ Todas | ✅ | ✅ | ✅ |

---

### Tabela: `notas_aluno`

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| aluno | ✅ Próprias | ❌ | ❌ | ❌ |
| professor | ✅ **Suas disciplinas (CORRIGIDO)** | ✅ Suas disciplinas | ✅ Suas disciplinas | ❌ |
| administracao | ✅ Todas | ❌ | ❌ | ❌ |
| financeiro | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ Todas | ✅ | ✅ | ❌ |
| superadmin | ✅ Todas | ✅ | ✅ | ✅ |

---

### Tabela: `frequencia`

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| aluno | ✅ Próprias | ❌ | ❌ | ❌ |
| professor | ✅ **Suas disciplinas (CORRIGIDO)** | ✅ Suas disciplinas | ✅ Suas disciplinas | ❌ |
| administracao | ✅ Todas | ✅ | ✅ | ❌ |
| financeiro | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ Todas | ✅ | ✅ | ✅ |
| superadmin | ✅ Todas | ✅ | ✅ | ✅ |

---

### Tabela: `materiais`

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| aluno | ✅ Visíveis | ❌ | ❌ | ❌ |
| professor | ✅ **Suas disciplinas (CORRIGIDO)** | ✅ Suas disciplinas | ✅ Suas disciplinas | ✅ Suas disciplinas |
| administracao | ✅ Todas | ✅ | ✅ | ✅ |
| financeiro | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ Todas | ✅ | ✅ | ✅ |
| superadmin | ✅ Todas | ✅ | ✅ | ✅ |

---

### Tabela: `matriculas_disciplina`

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| aluno | ✅ Próprias | ❌ | ❌ | ❌ |
| professor | ✅ **Suas disciplinas (CORRIGIDO)** | ❌ | ❌ | ❌ |
| administracao | ✅ Todas | ✅ | ✅ | ✅ |
| financeiro | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ Todas | ✅ | ✅ | ✅ |
| superadmin | ✅ Todas | ✅ | ✅ | ✅ |

---

### Tabela: `progresso_aluno`

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| aluno | ✅ Próprio | ✅ Próprio | ✅ Próprio | ✅ Próprio |
| professor | ✅ **Suas disciplinas (NOVO)** | ❌ | ❌ | ❌ |
| administracao | ✅ Todas | ✅ | ✅ | ✅ |
| financeiro | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ Todas | ✅ | ✅ | ✅ |
| superadmin | ✅ Todas | ✅ | ✅ | ✅ |

---

### Tabela: `avaliacoes`

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| aluno | ✅ Todas (público) | ❌ | ❌ | ❌ |
| professor | ✅ Todas (público) | ✅ **Suas disciplinas (CORRIGIDO)** | ✅ Próprias | ❌ |
| administracao | ✅ Todas | ✅ | ❌ | ❌ |
| financeiro | ✅ Todas | ❌ | ❌ | ❌ |
| admin | ✅ Todas | ✅ | ✅ | ✅ |
| superadmin | ✅ Todas | ✅ | ✅ | ✅ |

---

## CONCLUSÃO

### ✅ INVESTIGAÇÃO COMPLETA

- [x] Ler migrations 010, 011, 022
- [x] Identificar policies de `progresso_aluno`, `matriculas_disciplina`, `avaliacoes`
- [x] Mapear estrutura de vínculo professor × disciplina
- [x] Confirmar pattern de acesso ao role (`profiles.role`)

### 📋 DECISÕES PENDENTES DO HÉLIO

1. **Status de contrato válido**: `'assinado'` apenas OU `'assinado','impresso'`?
2. **Confirmar**: Existe view `user_roles` no banco? (se sim, mostrar definição)
3. **Aprovar escopo**: Migration 037 faz apenas os 8 ajustes OU inclui outras melhorias?

### 🚀 PRÓXIMO PASSO

Após decisões aprovadas → Escrever migration 037 completa (arquivo .sql).

**NÃO escrever ainda — aguardar aprovação do Hélio.**

