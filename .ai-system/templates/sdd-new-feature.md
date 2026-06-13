# TEMPLATE SDD — Nova Feature
# Preencher completamente antes de enviar ao Claude

> **Como usar:**
> 1. Copie este arquivo para `.ai-system/specs/YYYY-MM-DD-[nome-da-feature]/`
> 2. Preencha TODOS os campos (substitua os [colchetes])
> 3. Envie para o Claude com o agente correspondente ativado
> 4. Aguarde a spec técnica e plano de execução antes de aprovar implementação

---

## 🏷️ Identificação

```
Feature:     [nome claro da feature — ex: "Sistema de convite de membros"]
Data:        [YYYY-MM-DD]
Solicitante: [quem pediu — você, cliente, etc.]
Agente:      [qual agente vai liderar — ex: 05-backend-engineer]
Projeto:     [nome do projeto]
Prioridade:  [ALTA | MÉDIA | BAIXA]
```

---

## 📋 ESPECIFICAÇÃO FUNCIONAL

### O Que Deve Ser Feito
[Descreva em linguagem de negócio, sem termos técnicos]
[Exemplo: "O usuário admin do workspace deve poder convidar outros usuários por email.
O convidado recebe um email com link de aceite. Após aceitar, entra no workspace com
a role de 'membro'. O admin pode definir a role no momento do convite."]

### Para Quem
```
Persona:   [quem vai usar esta feature — ex: Admin do workspace]
Contexto:  [quando e por que usaria — ex: "ao precisar adicionar um colega"]
```

### Regras de Negócio
```
RN-001: [ex: Um admin pode convidar no máximo X pessoas por dia (limite do plano)]
RN-002: [ex: Convites expiram em 48 horas]
RN-003: [ex: Não é possível convidar um email que já está no workspace]
RN-004: [adicionar todas as regras necessárias]
```

### Fluxo Principal (Happy Path)
```
1. [Admin acessa a página de membros]
2. [Clica em "Convidar membro"]
3. [Preenche email e seleciona role]
4. [Sistema envia email com link único]
5. [Convidado clica no link, cria conta ou faz login]
6. [Entra no workspace com a role definida]
7. [Admin vê o novo membro na lista]
```

### Fluxos de Erro
```
Erro 1: Email já cadastrado no workspace → [o que acontece?]
Erro 2: Limite de convites atingido → [o que acontece?]
Erro 3: Convite expirado → [o que acontece?]
Erro 4: [adicionar outros cenários de erro]
```

---

## 🚫 RESTRIÇÕES (o que NÃO deve ser feito)

```
NÃO criar:
  - [ex: Sistema de grupos/times — fora do escopo desta feature]
  - [ex: Permissões granulares por recurso — escopo futuro]

NÃO modificar:
  - [ex: A lógica de auth existente]
  - [ex: O schema da tabela users]

NÃO incluir:
  - [ex: Integração com Slack para notificar o convite]
```

---

## ✅ CRITÉRIOS DE ACEITE

```
[ ] Admin consegue convidar por email com seleção de role
[ ] Email de convite é enviado com link único e com prazo
[ ] Convidado consegue aceitar e entra no workspace correto
[ ] Convite expirado mostra mensagem clara de erro
[ ] Admin vê convites pendentes na lista de membros
[ ] Limite de convites por plano é respeitado
[ ] [adicionar todos os critérios verificáveis]
```

---

## 📎 CONTEXTO ADICIONAL

```
Arquivos relacionados:
  - [ex: src/domain/tenant/ — bounded context de tenant]
  - [ex: src/infrastructure/email/ — serviço de email existente]

ADRs relevantes:
  - [ex: ADR-002 — Estratégia de multi-tenancy]

Dependências externas:
  - [ex: Resend para envio de email]
  - [ex: Supabase Auth para criação de usuário no aceite]
```

---

## 📝 PARA O CLAUDE (não preencher — campo do agente)

Após receber este template preenchido, o agente deve:

1. **Criar Spec Técnica** em `.ai-system/specs/[data]-[feature]/technical.md`
   - Stack envolvida
   - Arquivos a criar/modificar (apenas os necessários)
   - Contratos de API (endpoints, payloads, tipos)
   - Schema de banco (se necessário)
   - Fluxo de dados

2. **Criar Plano de Execução** na mesma pasta
   - Etapas em ordem de dependência
   - Estimativa de complexidade por etapa
   - Pontos de verificação

3. **Aguardar aprovação** antes de implementar

4. **Implementar** dentro dos limites da spec

5. **Entregar Resumo** do que foi feito e como testar

---
*Kit de Agentes Portátil v2.0*
