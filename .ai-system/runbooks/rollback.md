# Runbook — Rollback de Emergência
# Procedimento para reverter um deploy problemático

> **Quando usar:** Quando um deploy causou erros em produção e precisa ser revertido.
> **Tempo de execução:** 5-10 minutos
> **Objetivo:** Voltar ao estado estável anterior o mais rápido possível.
>
> (Comandos abaixo usam Vercel/Supabase como exemplo — adapte à sua stack.)

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

## 🗄️ ROLLBACK DE MIGRATION DE BANCO (se aplicável) — MANUAL (ver REG-001)

> Só execute se a migration causou o problema e se o rollback foi
> documentado antes do deploy.

1. Abra o SQL Editor do painel do banco (role de serviço)
2. Cole e execute o SQL de rollback (versionado junto à migration,
   ex: `.ai-system/specs/[data]-[feature]/db-rollback.sql`)
3. Verifique que o banco voltou ao estado anterior com uma query real

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
*Kit de Agentes Portátil v2.0*
