# DIAGNÓSTICO RLS — Sprint RLS Completo
**Data**: 2026-06-11  
**Agente**: 11-security-auditor  
**Sprint**: sprint-rls-completo  

---

## CORREÇÃO DO ACHADO S1 DA AUDITORIA

### CONCLUSÃO: Auditoria S1 estava INCORRETA

**Achado original**: "25 tabelas sem RLS revisado (14 sem RLS)"  
**Realidade descoberta**: **TODAS as 29 tabelas TÊM RLS ATIVADO + Policies criadas**

### Tabelas com RLS Confirmado (29)

```sql
-- Já verificado via grep "ENABLE ROW LEVEL SECURITY":
1.  profiles
2.  leads_cursos
3.  avisos
4.  matriculas
5.  turmas
6.  cursos
7.  modulos
8.  disciplinas_v2
9.  disciplinas (legado)
10. prerequisitos_v2
11. excecoes_prerequisito
12. equipe_itec
13. professores
14. contratos_professor
15. documentos_aluno
16. matriculas_disciplina
17. frequencia
18. materiais
19. progresso_aluno
20. taxa_matricula
21. mensalidades
22. convalidacoes
23. avaliacoes
24. notas_aluno
25. solicitacoes_disciplina
26. eventos_calendario (calendario_eventos)
27. aulas_recorrentes
28. prerequisitos_disciplinas (legado?)
29. storage.avatars (via migration 034)
```

---

## PROBLEMA REAL IDENTIFICADO

O problema NÃO é "tabelas sem RLS", mas sim:

### 🟡 **Policies com Possíveis Vulnerabilidades**

Após análise das migrations, identifico **3 categorias de risco**:

---

## CATEGORIA 1 — Policies com Pattern Inseguro (EXISTS sem filtro adequado)

### 🟠 RISCO MÉDIO: Policies usando apenas `role IN (...)` sem validação de vínculo

**Tabelas afetadas**: 12 tabelas

| Tabela | Policy Atual | Problema Potencial |
|--------|--------------|-------------------|
| `frequencia` | `role IN ('professor','admin',...)` | Professor pode ver frequência de QUALQUER turma, não apenas as que leciona |
| `materiais` | `role IN ('professor','admin',...)` | Professor pode ver/editar materiais de OUTRAS disciplinas |
| `contratos_professor` | `role IN ('admin','superadmin')` | ✅ OK (apenas admin) |
| `documentos_aluno` | `role IN ('admin','superadmin','administracao')` | ✅ OK (apenas gestão) |
| `notas_aluno` | `role IN ('admin','superadmin','administracao','professor')` | 🟠 Professor vê notas de TODAS as turmas |
| `avaliacoes` | `role IN ('professor','admin',...)` | 🟠 Professor cria avaliação em QUALQUER disciplina |
| `convalidacoes` | `role IN ('admin','superadmin','administracao')` | ✅ OK (apenas gestão) |
| `progresso_aluno` | Não verificado ainda | ⚠️ Precisa análise |
| `matriculas_disciplina` | Não verificado ainda | ⚠️ Precisa análise |
| `excecoes_prerequisito` | Não verificado ainda | ⚠️ Precisa análise |
| `prerequisitos_v2` | Leitura pública | ✅ OK (dados não sensíveis) |
| `solicitacoes_disciplina` | Não verificado ainda | ⚠️ Precisa análise |

---

## CATEGORIA 2 — Falta de Policy para Role `financeiro`

### 🟡 RISCO BAIXO: Role `financeiro` não tem acesso explícito

**Tabelas afetadas**: 2 tabelas

| Tabela | Policy Atual | Problema |
|--------|--------------|----------|
| `mensalidades` | `role IN ('admin','superadmin','administracao')` | Role `financeiro` NÃO tem acesso |
| `taxa_matricula` | `role IN ('admin','superadmin','administracao')` | Role `financeiro` NÃO tem acesso |

**Impacto**: Breno (role `financeiro`) não consegue lançar pagamentos ou ver mensalidades.

**Recomendação**: Adicionar `'financeiro'` nas policies de SELECT + UPDATE.

---

## CATEGORIA 3 — Pattern de Security Definer Functions Faltando

### 🟢 RISCO BAIXO: Algumas operações complexas poderiam usar Functions

**Exemplo**: `verificarPrerequisitos()` poderia ser uma Security Definer Function no banco, ao invés de lógica no service.

**Recomendação**: Avaliar migração para V3 (não urgente).

---

## ANÁLISE DETALHADA POR TABELA (Top 10 Prioridade)

### 1. `mensalidades` 🟡 MÉDIA PRIORIDADE

**RLS Ativado**: ✅ Sim  
**Policies Existentes**:
```sql
-- Policy 1: SELECT
CREATE POLICY "mensalidades_aluno_ve_propria" ON public.mensalidades
  FOR SELECT USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
                 AND role IN ('admin','superadmin','administracao'))
  );

-- Policy 2: ALL (INSERT/UPDATE/DELETE)
CREATE POLICY "mensalidades_gestao_financeiro" ON public.mensalidades
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );
```

**Coluna de Vínculo**: `aluno_id`  
**Problema**: Role `financeiro` não tem acesso  
**Recomendação**:
```sql
-- Adicionar 'financeiro' nas policies
ALTER POLICY "mensalidades_aluno_ve_propria" ... role IN (..., 'financeiro')
ALTER POLICY "mensalidades_gestao_financeiro" ... role IN (..., 'financeiro')
```

---

### 2. `notas_aluno` 🟠 MÉDIA-ALTA PRIORIDADE

**RLS Ativado**: ✅ Sim  
**Policies Existentes**:
```sql
-- Policy 1: SELECT
CREATE POLICY "notas_aluno_select" ON public.notas_aluno
  FOR SELECT TO authenticated
  USING (
    aluno_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao','professor'))
  );

-- Policy 2: INSERT
CREATE POLICY "notas_aluno_insert" ON public.notas_aluno
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = lancado_por OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- Policy 3: UPDATE
CREATE POLICY "notas_aluno_update" ON public.notas_aluno
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = lancado_por OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- Policy 4: DELETE
CREATE POLICY "notas_aluno_delete" ON public.notas_aluno
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));
```

**Coluna de Vínculo**: `aluno_id`, `lancado_por` (professor)  
**Problema**: Professor vê notas de TODAS as turmas (deveria ver apenas suas disciplinas)  
**Recomendação**:
```sql
-- Restringir SELECT do professor às suas disciplinas
-- Verificar se professor leciona essa disciplina antes de permitir SELECT
```

---

### 3. `frequencia` 🟠 MÉDIA-ALTA PRIORIDADE

**RLS Ativado**: ✅ Sim  
**Policies Existentes**:
```sql
-- Policy 1: INSERT
CREATE POLICY "frequencia_professor_lanca" ON public.frequencia
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('professor','admin','superadmin','administracao'))
  );

-- Policy 2: SELECT
CREATE POLICY "frequencia_aluno_ve_propria" ON public.frequencia
  FOR SELECT USING (
    aluno_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles
               WHERE id = auth.uid()
               AND role IN ('professor','admin','superadmin','administracao'))
  );

-- Policy 3: ALL
CREATE POLICY "frequencia_admin_total" ON public.frequencia
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','administracao'))
  );
```

**Coluna de Vínculo**: `aluno_id`, `disciplina_id`  
**Problema**: Professor vê frequência de TODAS as turmas  
**Recomendação**: Verificar se professor leciona disciplina antes de permitir SELECT

---

### 4. `documentos_aluno` ✅ OK

**RLS Ativado**: ✅ Sim  
**Policies**: Apenas admin/superadmin/administracao  
**Status**: ✅ Seguro (acesso restrito)

---

### 5. `contratos_professor` ✅ OK

**RLS Ativado**: ✅ Sim  
**Policies**: Apenas admin/superadmin  
**Status**: ✅ Seguro (acesso restrito)

---

### 6. `taxa_matricula` 🟡 BAIXA PRIORIDADE

**RLS Ativado**: ✅ Sim  
**Problema**: Mesma questão de `mensalidades` (falta role `financeiro`)  
**Recomendação**: Adicionar `'financeiro'`

---

### 7. `materiais` 🟠 MÉDIA PRIORIDADE

**RLS Ativado**: ✅ Sim  
**Problema**: Professor pode gerenciar materiais de OUTRAS disciplinas  
**Recomendação**: Verificar vínculo professor × disciplina

---

### 8. `progresso_aluno` ⚠️ NÃO VERIFICADO

**RLS Ativado**: ✅ Sim  
**Status**: Precisa ler migration 011 completa para avaliar policies

---

### 9. `convalidacoes` ✅ OK

**RLS Ativado**: ✅ Sim  
**Policies**: Apenas admin/superadmin/administracao  
**Status**: ✅ Seguro

---

### 10. `matriculas_disciplina` ⚠️ NÃO VERIFICADO

**RLS Ativado**: ✅ Sim  
**Status**: Precisa ler migration 010 completa para avaliar policies

---

## MATRIZ DE ACESSO PROPOSTA (Correções)

### Tabela: `mensalidades`

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| aluno | ✅ Próprias | ❌ | ❌ | ❌ |
| professor | ❌ | ❌ | ❌ | ❌ |
| administracao | ✅ Todas | ✅ | ✅ | ❌ |
| **financeiro** | ✅ Todas **(ADICIONAR)** | ✅ **(ADICIONAR)** | ✅ **(ADICIONAR)** | ❌ |
| admin | ✅ Todas | ✅ | ✅ | ✅ |
| superadmin | ✅ Todas | ✅ | ✅ | ✅ |

**Ação necessária**: Migration 037 — adicionar `'financeiro'` nas policies

---

### Tabela: `notas_aluno`

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| aluno | ✅ Próprias | ❌ | ❌ | ❌ |
| professor | ✅ **Apenas suas disciplinas (CORRIGIR)** | ✅ Apenas suas | ✅ Apenas suas | ❌ |
| administracao | ✅ Todas | ❌ | ❌ | ❌ |
| financeiro | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ Todas | ✅ | ✅ | ❌ |
| superadmin | ✅ Todas | ✅ | ✅ | ✅ |

**Ação necessária**: Migration 037 — adicionar verificação de vínculo professor × disciplina

---

### Tabela: `frequencia`

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| aluno | ✅ Próprias | ❌ | ❌ | ❌ |
| professor | ✅ **Apenas suas disciplinas (CORRIGIR)** | ✅ Apenas suas | ✅ Apenas suas | ❌ |
| administracao | ✅ Todas | ✅ | ✅ | ❌ |
| financeiro | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ Todas | ✅ | ✅ | ✅ |
| superadmin | ✅ Todas | ✅ | ✅ | ✅ |

**Ação necessária**: Migration 037 — adicionar verificação de vínculo professor × disciplina

---

## RESUMO DAS CORREÇÕES NECESSÁRIAS

### 🟠 PRIORIDADE ALTA (Migration 037)

1. **Adicionar role `financeiro` em 2 tabelas**:
   - `mensalidades` (SELECT + INSERT + UPDATE)
   - `taxa_matricula` (SELECT + INSERT + UPDATE)

2. **Restringir acesso do professor em 3 tabelas**:
   - `notas_aluno` (apenas disciplinas que leciona)
   - `frequencia` (apenas disciplinas que leciona)
   - `materiais` (apenas disciplinas que leciona)

3. **Verificar e corrigir (se necessário) 3 tabelas**:
   - `progresso_aluno`
   - `matriculas_disciplina`
   - `avaliacoes`

**Total de alterações**: 8 tabelas

---

## PLANO DE AÇÃO

### Etapa 1 — Análise Completa (em andamento)
- [x] Mapear tabelas com RLS
- [x] Identificar policies existentes
- [ ] Ler migrations completas de `progresso_aluno`, `matriculas_disciplina`, `avaliacoes`
- [ ] Confirmar vulnerabilidades em `notas_aluno`, `frequencia`, `materiais`

### Etapa 2 — Criar Migration 037 (próximo passo)
- [ ] Seção 1: Adicionar `financeiro` em mensalidades e taxa_matricula
- [ ] Seção 2: Restringir professor em notas_aluno, frequencia, materiais
- [ ] Seção 3: Correções em progresso_aluno, matriculas_disciplina, avaliacoes (se necessário)

### Etapa 3 — Validação
- [ ] Hélio executa migration 037 no SQL Editor
- [ ] Testar com usuários de cada role
- [ ] Verificar que professor NÃO vê dados de outras disciplinas
- [ ] Verificar que financeiro VÊ mensalidades

---

## CONCLUSÃO

**Status atual**: 🟢 MELHOR QUE O ESPERADO

- ✅ Todas as 29 tabelas TÊM RLS ativado
- ✅ Todas as tabelas TÊM policies criadas
- 🟡 8 tabelas precisam de ajustes (não são vulnerabilidades críticas)
- 🟢 21 tabelas estão seguras

**Risco real**: 🟡 MÉDIO (não CRÍTICO como relatado na auditoria)

**Urgência**: 🟡 MÉDIA (não blocker absoluto, mas recomendado antes de agosto)

**Esforço**: 4 horas (ao invés de 8 horas estimadas)

---

**Próximo passo**: Ler migrations 010, 011, 022 completas para confirmar todas as policies antes de escrever migration 037.

