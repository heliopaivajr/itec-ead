# Runbook — Rollback de Emergência
# Procedimento para reverter um deploy problemático

> **Quando usar:** Quando um deploy causou erros em produção e precisa ser revertido.
> **Tempo de execução:** 5-10 minutos
> **Objetivo:** Voltar ao estado estável anterior o mais rápido possível.

---

## 🚨 SINAIS DE QUE PRECISA DE ROLLBACK

```
- Taxa de erro > 5% nas últimas 5 minutos
- Usuários reportando que não conseguem fazer login
- Webhooks de pagamento falhando
- CPU/Memória anormalmente alta
- Qualquer erro 500 em rota crítica (auth, billing, core)
```

---

## ⚡ ROLLBACK RÁPIDO — Vercel (< 2 minutos)

O Vercel guarda os últimos deploys. Rollback imediato:

```
1. Acessar: vercel.com/[seu-usuario]/[projeto]/deployments
2. Encontrar o último deploy estável (antes do problemático)
3. Clicar nos 3 pontos → "Promote to Production"
4. Confirmar — o deploy anterior vai para produção em segundos
```

---

## 🗄️ ROLLBACK DE MIGRATION DE BANCO (se aplicável)

```bash
# ATENÇÃO: Só executar se a migration causou o problema
# e se o rollback foi documentado antes do deploy

# 1. Verificar migration aplicada
npx supabase migration list

# 2. Executar SQL de rollback
# (deve estar em: .ai-system/specs/[data]-[feature]/db-rollback.sql)
psql [PRODUCTION_DB_URL] < .ai-system/specs/[data]-[feature]/db-rollback.sql

# 3. Verificar que o banco voltou ao estado anterior
npx supabase db diff
```

> **ATENÇÃO:** Rollback de migration com dados já inseridos pode causar perda de dados.
> Avaliar o impacto antes de executar. Em caso de dúvida, chamar o Agente 16 (migration-planner).

---

## 📝 PÓS-ROLLBACK

```
[ ] Confirmar que o sistema está estável (verificar por 15 minutos)
[ ] Notificar o time do rollback executado
[ ] Criar issue/ticket com a causa raiz
[ ] NÃO tentar o deploy novamente sem corrigir o problema
[ ] Documentar o incidente em .ai-system/audit/incidentes/YYYY-MM-DD.md
```

---
*Sistema de Agentes IA para SaaS — Hélio Paiva Jr. — ObraIA 2025*
