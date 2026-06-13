# Runbook — Deploy em Produção
# Procedimento passo a passo para deploy seguro

> **Quando usar:** Sempre antes de fazer qualquer deploy em produção.
> **Tempo estimado:** 15-30 minutos
> **Responsável:** Desenvolvedor principal + revisão do Agente 09
>
> (Comandos abaixo usam pnpm/Vercel/Supabase como exemplo — adapte à sua stack.)

---

## ✅ PRÉ-DEPLOY — Checklist Obrigatório

### Código
```
[ ] Todos os testes passando localmente (pnpm test)
[ ] Sem erros de TypeScript (pnpm type-check)
[ ] Sem warnings de linting (pnpm lint)
[ ] PR revisado pelo Agente 12 (code-reviewer) se mudança significativa
[ ] Checklist de segurança executado (Agente 11) se mudança em auth/billing
```

### Banco de Dados
```
[ ] Se há migration: testada em banco local e staging
[ ] Rollback da migration documentado e testado
[ ] Backup do banco de produção confirmado (Supabase faz diariamente,
    mas verificar o último)
[ ] RLS policies testadas com usuários de tenant diferente
```

### Variáveis de Ambiente
```
[ ] Novas env vars adicionadas no Vercel (production)
[ ] .env.example atualizado se nova variável foi adicionada
[ ] Secrets rotacionados se algum pode ter vazado
```

### Comunicação
```
[ ] Time avisado do deploy (se houver mais de 1 pessoa)
[ ] Janela de deploy escolhida (evitar horário de pico)
[ ] Plano de rollback comunicado
```

---

## 🚀 EXECUÇÃO DO DEPLOY

### 1. Executar testes finais
```bash
pnpm test
pnpm type-check
pnpm build # garantir que o build não quebra
```

### 2. Merge para main (trigger do CI/CD)
```bash
git checkout main
git merge --no-ff feature/[nome-da-branch]
git push origin main
# O Vercel e GitHub Actions disparam automaticamente
```

### 3. Monitorar o pipeline
```
- Acompanhar GitHub Actions: github.com/[repo]/actions
- Acompanhar Vercel deploy: vercel.com/dashboard
- Tempo esperado: 2-5 minutos
```

### 4. Aplicar migration (se necessário) — MANUAL (ver REG-001)

Migrations NÃO são aplicadas por CLI. Após o deploy:
1. Abra o SQL Editor do painel do banco (role de serviço)
2. Cole e execute o SQL da migration
3. Verifique o resultado com uma query real
   (ex: `SELECT` em `pg_policies` / `pg_tables`)

---

## ✔️ PÓS-DEPLOY — Verificação

```
[ ] Acessar a URL de produção e verificar que carrega
[ ] Fazer login com conta de teste real
[ ] Executar o fluxo principal da funcionalidade deployada
[ ] Verificar logs no Vercel (sem erros 500)
[ ] Verificar Sentry/Monitoring (sem novos erros)
[ ] Se billing: testar com cartão de teste do Stripe
```

---

## ⏱️ MONITORAMENTO (primeiras 2 horas)

```
Verificar a cada 30 minutos:
[ ] Taxa de erro (Vercel Analytics / Sentry)
[ ] Tempo de resposta médio
[ ] Logs de webhook (se billing foi modificado)
[ ] Feedbacks de usuários (Slack, email, suporte)
```

---
*Kit de Agentes Portátil v2.0*
