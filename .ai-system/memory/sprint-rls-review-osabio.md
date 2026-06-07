---
name: sprint-rls-review-osabio
description: Revisão crítica do agente-Osabio sobre o Sprint RLS Segurança
metadata:
  type: project
  reviewer: agente-Osabio
  sprint: RLS Segurança
  date: 2026-06-06
---

# Sprint RLS Segurança — Revisão Pós-Sprint
**Revisor:** agente-Osabio  
**Data:** 2026-06-06  
**Status do Sprint:** ✅ CONCLUÍDO E DEPLOYADO

---

## 🎯 AVALIAÇÃO GERAL

### Score Técnico: 9.0/10

**Pontos Fortes:**
- ✅ Arquitetura correta (VIEW sem RLS para evitar recursão)
- ✅ 20 policies implementadas com granularidade adequada
- ✅ Rollbacks criados antes do deploy
- ✅ Bugs encontrados e corrigidos durante o sprint
- ✅ Processo ERR-INFRA-001 funcionou perfeitamente
- ✅ Diagnóstico eficiente via logs

**Pontos de Melhoria:**
- ⚠️ Poderia ter previsto o problema de join aninhado antes de deployar (simulação local)
- ⚠️ BUG-UI-001 deveria ter sido detectado em sprints anteriores (QA gap)
- ⚠️ Falta documentação em CLAUDE.md sobre o padrão RLS (aguarda Sprint RLS Fase 2)

---

## 📊 QUALIDADE DAS DECISÕES TÉCNICAS

### 1. VIEW `user_roles` sem RLS — EXCELENTE ✅

**Decisão:** Criar VIEW que projeta `(user_id, role)` de `profiles` SEM RLS.

**Análise:** Solução canônica e correta. Alternativas consideradas (JWT claims, função PostgreSQL) seriam mais complexas e menos performáticas. A VIEW é a recomendação oficial do Supabase para esse padrão.

**Risco:** Baixo. VIEW sem RLS é read-only e não expõe dados sensíveis além do role.

**Recomendação:** Manter. Documentar esse padrão para uso em todas as futuras policies.

---

### 2. 8 Policies para `profiles` — MUITO BOM ✅

**Decisão:** Granularidade alta (8 policies) em vez de policies genéricas.

| Policy | Justificativa |
|--------|---------------|
| `profiles_select_own` | Usuário vê próprio perfil |
| `profiles_select_staff` | Staff vê todos |
| `profiles_insert_own` | Signup autônomo |
| `profiles_insert_staff` | Criar aluno via Edge Function |
| `profiles_update_own` | Aluno atualiza dados (EXCETO role) ✅ |
| `profiles_update_admin` | Admin atualiza tudo (INCLUINDO role) |
| `profiles_update_administracao` | Secretaria atualiza dados (EXCETO role) |
| `profiles_delete_superadmin` | Só Hélio pode deletar |

**Análise:** Granularidade correta. A separação `update_own` vs `update_admin` vs `update_administracao` é essencial para evitar escalação de privilégios.

**Proteção de `role`:**
```sql
WITH CHECK (
  role = (SELECT role FROM public.profiles WHERE id = auth.uid())
)
```
Correto! Impede que usuário mude próprio role via UPDATE malicioso.

**Risco:** Baixo. Policies cobrem todos os casos de uso identificados.

**Recomendação:** Manter. Adicionar testes automatizados de RLS (Vitest simulando auth.uid()) no Sprint RLS Fase 2.

---

### 3. Storage RLS para `avatars` — BOM ✅

**Decisão:** Público pode ler avatares, mas upload/update/delete são restritos.

**Análise:** Correto para o caso de uso (professores aparecem na área pública). Se no futuro surgir necessidade de avatares privados, criar bucket separado.

**Risco:** Baixo. Avatares não são dados sensíveis segundo LGPD (não são biométricos).

**Recomendação:** Manter. Monitorar se alunos fazem upload de fotos inadequadas (moderação manual se necessário).

---

### 4. Correção BUG-RLS-001 (join aninhado) — EXCELENTE ✅

**Decisão:** Queries separadas + merge manual em vez de join aninhado.

**Análise:** Solução correta e pragmática. Alternativas (desabilitar RLS temporariamente, usar view materializada) seriam mais arriscadas. O merge manual tem custo de 2 queries em vez de 1, mas é negligível no contexto (PAGE_SIZE = 20).

**Impacto de Performance:**
- Antes: 1 query com join
- Depois: 2 queries separadas
- Overhead: ~10-20ms por requisição (aceitável)

**Recomendação:** Manter. Documentar esse padrão em CLAUDE.md como "joins aninhados + RLS = queries separadas".

---

### 5. ERR-INFRA-001 (migrations via SQL Editor) — PERFEITO ✅

**Decisão:** Migrations aplicadas manualmente via SQL Editor, nunca via CLI.

**Análise:** Processo funcionou perfeitamente no Sprint RLS (4 migrations aplicadas sem erro). Controle total do Hélio, zero erros de permissão, zero bugs de formato.

**Alternativas consideradas:**
- Renomear migrations para formato YYYYMMDDHHMMSS → rejeito: requer reescrita de histórico
- Usar CLI localmente e SQL Editor remotamente → rejeito: inconsistência de processo

**Recomendação:** Manter indefinidamente. Documentar em CLAUDE.md como "ERR-INFRA-001: migrations remotas SEMPRE via SQL Editor".

---

## 🐛 ANÁLISE DOS BUGS ENCONTRADOS

### BUG-RLS-001 — Alta Gravidade, Diagnóstico Rápido ✅

**Tempo de detecção:** Imediato (teste manual pós-deploy)  
**Tempo de correção:** ~1h (diagnóstico + refactor + teste)  
**Impacto:** Feature crítica quebrada, mas detectada antes de alunos reais

**Por que não foi previsto?**
- Join aninhado + RLS é limitação não-óbvia do Supabase/PostgREST
- Testes SQL diretos (service_role) bypassam RLS → não reproduzem o problema

**Como prevenir no futuro?**
- Checklist: "Se migration ativa RLS, testar TODOS os services que usam a tabela"
- Testes automatizados com mock de RLS (simular auth.uid() no Vitest)

**Severidade:** Alta, mas mitigada por detecção rápida.

---

### BUG-RLS-002 — Média Gravidade, Fácil de Corrigir ✅

**Tempo de detecção:** Durante diagnóstico do BUG-RLS-001  
**Tempo de correção:** ~5min (adicionar 1 linha de log)  
**Impacto:** Diagnóstico 30min mais lento, mas não afetou usuário final

**Por que existia?**
- Código legado de sprints anteriores não previa RLS
- Padrão "silenciar erro + fallback" era aceitável para erros de rede

**Como prevenir no futuro?**
- Regra global: NUNCA `if (error) return fallback` sem `console.error()` antes
- Adicionar ao SKILL.md do Agente 05

**Severidade:** Média. Não quebrou feature, apenas dificultou debug.

---

### BUG-UI-001 — Média Gravidade, Débito Técnico ⚠️

**Tempo de detecção:** Teste manual pós-deploy  
**Status:** PENDENTE (não faz parte do Sprint RLS)  

**Por que existia?**
- `FichaAluno.tsx` criado no Sprint M, rota nunca registrada
- Possível gap entre criação do componente e registro da rota

**Como prevenir no futuro?**
- Checklist: "Componente de página criado? Registrar rota imediatamente."
- Adicionar ao SKILL.md do Agente 06

**Severidade:** Média. Feature existe mas não é acessível.

**Recomendação:** Corrigir no próximo sprint (Sprint PDF ou Sprint Financeiro, o que vier primeiro).

---

## 📚 LIÇÕES APRENDIDAS — 6 NOVAS

Adicionadas em `lessons-learned.md`:

1. **LICAO-025** — VIEW sem RLS é solução canônica
2. **LICAO-026** — Joins aninhados + RLS = queries separadas
3. **LICAO-027** — Erros NÃO devem ser silenciados
4. **LICAO-028** — Testes manuais na UI após RLS são obrigatórios
5. **LICAO-029** — Rollbacks antes da implementação, não depois
6. **LICAO-030** — ERR-INFRA-001 funciona: SQL Editor > CLI

**Impacto:** Essas lições reduzirão significativamente o risco de bugs similares no Sprint RLS Fase 2 (25 tabelas restantes).

---

## 🔧 MELHORIAS IDENTIFICADAS PARA PRÓXIMO SPRINT

### Processo de Deploy

**Melhoria 1: Simulação local de RLS antes do deploy**

Criar script que simula RLS localmente:
```sql
-- test_rls.sql
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"UUID_ALUNO_TESTE"}';
-- testar queries críticas
```

**Benefício:** Detectar problemas de join antes de aplicar em produção.

---

### Cobertura de Testes

**Melhoria 2: Testes automatizados de RLS**

Criar testes Vitest que simulam diferentes roles:
```typescript
// rls.test.ts
describe('RLS em profiles', () => {
  it('aluno NÃO pode ver perfil de outro aluno', async () => {
    mockAuth({ uid: 'aluno-1', role: 'aluno' });
    const result = await getProfile('aluno-2');
    expect(result.error).toBe('Permission denied');
  });
  
  it('admin PODE ver perfil de qualquer aluno', async () => {
    mockAuth({ uid: 'admin-1', role: 'admin' });
    const result = await getProfile('aluno-2');
    expect(result.data).toBeDefined();
  });
});
```

**Benefício:** Detectar regressões de RLS em CI/CD antes de deploy.

---

### Documentação

**Melhoria 3: Adicionar seção RLS em CLAUDE.md**

Conteúdo sugerido:
```markdown
## RLS (Row Level Security)

### Padrão Estabelecido
- VIEW `user_roles` sem RLS para verificação de roles
- Joins aninhados + RLS = queries separadas
- SEMPRE logar erros de query antes de fallback
- Rollbacks criados antes de deploy
- Testes manuais na UI após ativar RLS

### Quando Usar Queries Separadas
Se AMBAS tabelas têm RLS E query precisa de join → queries separadas.
Exemplo: getAlunos() busca profiles + matriculas separadamente.
```

**Benefício:** Agentes futuros seguirão o padrão sem precisar redescobrir.

---

## 🎯 SUGESTÕES PARA SPRINT RLS FASE 2 (25 TABELAS)

### Priorização (validada) ✅

1. **Alta:** `frequencia`, `notas_aluno`, `avaliacoes` (dados sensíveis)
2. **Média:** `mensalidades`, `taxa_matricula` (financeiro)
3. **Baixa:** `cursos`, `modulos`, `disciplinas_v2` (estrutura — geralmente pública)

**Justificativa:** Correta. Focar em dados sensíveis primeiro minimiza risco LGPD.

---

### Estratégia Recomendada

**Opção A — Incremental (recomendado):**
- Sprint RLS Fase 2: prioridade Alta (3 tabelas)
- Sprint RLS Fase 3: prioridade Média (2 tabelas)
- Sprint RLS Fase 4: prioridade Baixa (20 tabelas em batch)

**Opção B — Big Bang:**
- Sprint RLS Fase 2: todas as 25 tabelas de uma vez

**Recomendação:** **Opção A**. Incremental reduz risco e permite validação progressiva.

---

### Checklist Aprimorado para Fase 2

**Antes de implementar:**
- [ ] Listar TODOS os services que acessam a tabela
- [ ] Verificar se há joins aninhados com outras tabelas RLS
- [ ] Criar migration + rollback
- [ ] Criar script de teste local de RLS

**Durante implementação:**
- [ ] Aplicar migration via SQL Editor (service_role)
- [ ] Testar queries SQL no Editor primeiro
- [ ] Rodar script de teste local

**Após deploy:**
- [ ] Login como usuário real (não service_role)
- [ ] Testar TODAS as telas que acessam a tabela
- [ ] Verificar DevTools Console por erros
- [ ] Monitorar logs de erro por 24h

---

## 📊 MÉTRICAS DE QUALIDADE

| Métrica | Valor | Meta | Status |
|---------|-------|------|--------|
| Bugs encontrados | 3 | < 5 | ✅ |
| Bugs corrigidos | 2 | 100% críticos | ✅ |
| Rollbacks criados | 4/4 | 100% | ✅ |
| Testes manuais | Sim | Sim | ✅ |
| Tempo total | ~4h | < 6h | ✅ |
| Lições registradas | 6 | > 3 | ✅ |
| Documentação atualizada | Sim | Sim | ✅ |

**Score de Processo:** 9.5/10

**Único ponto de melhoria:** BUG-UI-001 deveria ter sido detectado antes (gap de QA em sprints anteriores).

---

## ✅ APROVAÇÕES E PENDÊNCIAS

### Aprovado ✅
- [x] Arquitetura técnica (VIEW + policies)
- [x] Processo de deploy (SQL Editor manual)
- [x] Correção de bugs encontrados
- [x] Lições registradas
- [x] Documentação de erros conhecidos

### Pendências ⚠️
- [ ] BUG-UI-001 — rota `/dashboard/alunos/:id` (próximo sprint)
- [ ] Documentação RLS em CLAUDE.md (Sprint RLS Fase 2)
- [ ] Testes automatizados de RLS (Sprint RLS Fase 2)
- [ ] 25 tabelas restantes (Sprint RLS Fase 2-4)

---

## 🏆 CONCLUSÃO

**O Sprint RLS Segurança foi um SUCESSO TÉCNICO.**

### Destaques:
- ✅ Arquitetura correta implementada (VIEW sem RLS)
- ✅ Bugs detectados e corrigidos antes de afetar alunos reais
- ✅ Processo ERR-INFRA-001 validado como confiável
- ✅ 6 lições aprendidas registradas para uso futuro
- ✅ Rollbacks prontos para qualquer emergência

### Riscos Mitigados:
- ✅ Escalação de privilégios (aluno não pode virar admin)
- ✅ Acesso não autorizado a dados de outros usuários
- ✅ Recursão infinita em policies (VIEW sem RLS resolve)

### Próxima Ação Crítica:
**Sprint RLS Fase 2** — priorizar `frequencia`, `notas_aluno`, `avaliacoes` antes de agosto/2026.

---

**Assinado:** agente-Osabio  
**Data:** 2026-06-06  
**Status:** ✅ APROVADO
