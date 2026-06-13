# Checklist Padrão — Todo Sprint
**Usar no início e fim de cada sprint**
**Agente responsável: 20-project-manager**

---

## ANTES DE INICIAR

```
- [ ] /clear no Claude Code (contexto limpo)
- [ ] Colar contexto: CLAUDE.md + SYSTEM.md + plano do sprint
- [ ] Ler o plano do sprint atual em .ai-system/specs/ (ex: plano-do-sprint.md)
- [ ] Confirmar pré-requisitos atendidos (migrations anteriores aplicadas)
- [ ] {{STACK_PACOTES}} test:run → todos passando antes de começar
- [ ] Verificar se há bugs críticos pendentes do sprint anterior
```

---

## DURANTE O SPRINT

### Fase Banco de Dados (Agente 04)
```
- [ ] Schema revisado antes de aplicar
- [ ] RLS habilitado em TODA tabela nova
- [ ] Políticas de SELECT, INSERT, UPDATE, DELETE definidas
- [ ] Índices criados para foreign keys e campos de busca
- [ ] Migration testada em ambiente local antes
- [ ] Commit: feat(db): migration XXX — [descrição]
```

### Fase Backend / Services (Agente 05)
```
- [ ] Service criado em src/services/
- [ ] Exportado no src/services/index.ts
- [ ] Nenhum acesso direto ao banco (ex: supabase.from()) em pages/ ou components/ — sempre via service
- [ ] TypeScript strict — sem `any` implícito
- [ ] LIMIT em todas as queries de listagem
- [ ] Commit: feat(service): [nome].service.ts — [descrição]
```

### Fase Frontend (Agente 06)
```
- [ ] Componente/page criado com loading state (Skeleton ou Loader2)
- [ ] Navegação via <Link> ou useNavigate — NUNCA <a href>
- [ ] Role checks corretos (usar os helpers de role do projeto)
- [ ] Responsivo (mobile-first com Tailwind)
- [ ] {{STACK_PACOTES}} test:run após cada componente novo
- [ ] Commit: feat(frontend): [nome] — [descrição]
```

### Testes (Agente 10)
```
- [ ] Testes escritos junto com a implementação (não depois)
- [ ] Casos-limite cobertos (valores exatos de fronteira)
- [ ] Mocks configurados para APIs externas (ex: email, pagamento)
- [ ] Cobertura mínima: 80% nos services novos
- [ ] {{STACK_PACOTES}} test:run → 100% passando
- [ ] Commit: test([escopo]): [descrição dos casos testados]
```

---

## AO FINALIZAR O SPRINT

### Qualidade (executar NESTA ORDEM)

```
1. [ ] {{STACK_PACOTES}} test:run   → todos passando (número/número)
2. [ ] {{STACK_PACOTES}} build      → build limpo, zero erros de tipo
3. [ ] Agente 14 (auditoria)  → auditoria rápida do sprint
4. [ ] Agente 11 (segurança)  → RLS das tabelas novas auditado
5. [ ] Agente 12 (review)     → code review services + pages
```

### Documentação (Agente 18)
```
- [ ] CLAUDE.md atualizado:
      - Sprint concluído movido para "Concluído"
      - Próximo sprint atualizado
      - Score atualizado
      - Migrations adicionadas à tabela
      - Contagem de testes atualizada
- [ ] STACK.md atualizado (se nova lib adicionada)
- [ ] .ai-system/SYSTEM.md atualizado com estado atual
```

### Commit e Deploy
```
- [ ] git add (arquivos específicos — não git add -A)
- [ ] Commit semântico com descrição completa
- [ ] git push origin main
- [ ] Deploy confirmado (verificar o dashboard do provedor, ex: Vercel)
- [ ] Testar em produção: fluxo principal do sprint
```

### Encerramento
```
- [ ] Relatório do sprint registrado (ver formato no SKILL.md do Agente 20)
- [ ] Bugs encontrados classificados e registrados
- [ ] Pré-requisitos do próximo sprint conferidos
- [ ] /clear → sessão encerrada
```

---

## FORMATO DO COMMIT FINAL DE SPRINT

```bash
git commit -m "feat(sprint-[letra]): [resumo em 1 linha]

- migration XXX: [o que criou]
- [nome].service.ts: [funções principais]
- [NomePage].tsx: [o que implementou]
- Testes: N novos casos, N/N passando"
```

---

## ESCALA DE SEVERIDADE DE BUGS

| Severidade | Critério | Ação |
|-----------|----------|------|
| 🔴 Crítico | Segurança, dados expostos, sistema quebrado | Para tudo — bug fix agora |
| 🟠 Alto | Funcionalidade errada, cálculo incorreto | P0 no próximo sprint |
| 🟡 Médio | UX ruim, performance degradada | Backlog de débito técnico |
| 🟢 Baixo | Cosmético, texto errado | Registra, não bloqueia |

---

## REFERÊNCIAS RÁPIDAS

```
Plano de sprints:    .ai-system/specs/ (plano do sprint atual)
Análise de produto:  .ai-system/specs/ (análise de produto)
Regras de qualidade: .ai-system/agents/20-project-manager/SKILL.md
Auditoria atual:     .ai-system/audit/ (relatório mais recente)
```

---

*Kit de Agentes Portátil v2.0 — Checklist Padrão de Sprint*
