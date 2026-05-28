# TEMPLATE SDD — Correção de Bug
# Use quando algo que funcionava parou de funcionar

---

## 🐛 Identificação do Bug

```
Título:      [descrição clara do bug — ex: "Webhook do Stripe não atualiza plano"]
Data:        [YYYY-MM-DD]
Severidade:  [CRÍTICO | ALTO | MÉDIO | BAIXO]
Ambiente:    [produção | staging | local]
Agente:      [qual agente vai corrigir — ex: 08-billing-engineer]
```

---

## 📊 Comportamento Atual vs. Esperado

```
COMPORTAMENTO ATUAL (o que está acontecendo):
[Descreva exatamente o que está errado. Seja específico.]
Exemplo: "Após pagamento confirmado no Stripe, o usuário continua vendo
a mensagem 'Assine para acessar' mesmo após refresh da página."

COMPORTAMENTO ESPERADO (o que deveria acontecer):
[Descreva o comportamento correto.]
Exemplo: "Após pagamento confirmado, o usuário deve ter acesso imediato
a todas as funcionalidades do plano contratado."
```

---

## 🔍 Como Reproduzir

```
1. [passo 1 — ex: Fazer login com conta de teste]
2. [passo 2 — ex: Ir para /pricing e clicar em "Assinar Pro"]
3. [passo 3 — ex: Completar o checkout com cartão 4242 4242 4242 4242]
4. [passo 4 — ex: Observar que o acesso não foi liberado]
```

---

## 🔎 Hipótese de Causa

```
[Onde você acha que está o problema?]
Exemplo: "Suspeito que o webhook handler não está sendo chamado,
ou que está falhando silenciosamente. Verificar logs do Stripe
e da aplicação para o evento checkout.session.completed."
```

---

## 📎 Contexto

```
Logs relevantes:   [cole aqui qualquer log de erro disponível]
Arquivos suspeitos: [ex: src/infrastructure/payments/stripe-webhook.ts]
Quando começou:    [ex: após deploy de ontem às 14h]
Frequência:        [ex: 100% dos casos | apenas em produção]
```

---

## ✅ Critérios de Aceite da Correção

```
[ ] Comportamento esperado está funcionando
[ ] Teste unitário ou de integração cobre o cenário do bug
[ ] Logs adequados adicionados para detectar recorrência
[ ] Sem regressão em funcionalidades relacionadas
```

---

## 📝 Para o Claude

Após receber este template:

1. **Diagnosticar** — identificar a causa raiz com evidências
2. **Propor solução** — antes de implementar, descrever o que vai mudar
3. **Aguardar aprovação** se a solução envolve mudança de arquitetura
4. **Implementar** a correção mínima necessária
5. **Escrever teste** que provaria o bug e verifica a correção
6. **Entregar resumo** com: causa raiz, o que foi corrigido, como testar

---
*Sistema de Agentes IA para SaaS — Hélio Paiva Jr. — ObraIA 2025*
