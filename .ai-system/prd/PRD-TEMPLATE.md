# PRD — Product Requirements Document
**Versão:** 1.0
**Data:** [PREENCHER]
**Autor:** [PREENCHER]
**Status:** RASCUNHO | EM REVISÃO | APROVADO

---

## 1. Identidade do Projeto

| Campo | Valor |
|-------|-------|
| **Nome do projeto** | [ex: TaskFlow] |
| **Descrição em uma linha** | [ex: Plataforma de gestão de tarefas para equipes remotas] |
| **Domínio / Setor** | [ex: Produtividade B2B, EdTech, HealthTech, Marketplace, Fintech...] |
| **URL de produção** | [ex: https://taskflow.app] |
| **Responsável técnico** | [Nome + papel] |

> **Como preencher:** Seja direto. A descrição em uma linha deve responder
> "o que é o produto" sem jargões. O domínio ajuda os agentes a aplicar
> boas práticas específicas do setor (ex: LGPD em saúde, PCI-DSS em fintech).

---

## 2. Objetivo de Negócio

### 2.1 Problema que resolve
<!--
Descreva o problema real que o produto resolve. Uma ou duas frases.
Ex: "Equipes remotas perdem contexto de tarefas porque usam Slack,
e-mail e planilhas desconectados entre si."
-->
[PREENCHER]

### 2.2 Personas principais

| Persona | Papel | Necessidade principal |
|---------|-------|----------------------|
| [ex: Gerente de Projeto] | [ex: organiza o trabalho da equipe] | [ex: ver progresso sem reuniões] |
| [ex: Desenvolvedor] | [ex: executa as tarefas] | [ex: saber o que fazer primeiro] |
| [Adicionar linhas conforme necessário] | | |

### 2.3 Proposta de valor
<!--
Complete: "O [produto] ajuda [persona] a [objetivo] diferente de
[alternativa] porque [diferencial único]."
Ex: "O TaskFlow ajuda gerentes a acompanhar projetos em tempo real,
diferente de planilhas, porque integra chat, tarefas e entregas numa
única timeline visual."
-->
[PREENCHER]

### 2.4 Métrica de sucesso principal
<!--
O que significa "o produto está funcionando"? Uma métrica concreta.
Ex: "80% das equipes completam sprints no prazo após 30 dias de uso."
-->
[PREENCHER]

---

## 3. Stack Técnica

> **Como preencher:** Escolha uma opção por linha ou escreva a sua.
> Mantenha coerência: não misture frameworks conflitantes.

| Camada | Escolha | Alternativas comuns |
|--------|---------|---------------------|
| **Frontend** | [PREENCHER] | React 18, Next.js 14, Vue 3, SvelteKit |
| **Linguagem frontend** | [PREENCHER] | TypeScript (recomendado), JavaScript |
| **Estilização** | [PREENCHER] | Tailwind CSS, CSS Modules, Styled Components |
| **Componentes UI** | [PREENCHER] | Shadcn/ui, Radix UI, Material UI, Headless UI |
| **Backend / API** | [PREENCHER] | Supabase, Node+Express, FastAPI, NestJS, tRPC |
| **Banco de dados** | [PREENCHER] | PostgreSQL (Supabase), MySQL, MongoDB, SQLite |
| **Autenticação** | [PREENCHER] | Supabase Auth, Clerk, Auth.js, Firebase Auth |
| **Storage de arquivos** | [PREENCHER] | Supabase Storage, S3, Cloudflare R2 |
| **Deploy frontend** | [PREENCHER] | Vercel, Netlify, Cloudflare Pages |
| **Deploy backend** | [PREENCHER] | Supabase (BaaS), Railway, Fly.io, Render |
| **Gerenciador de pacotes** | [PREENCHER] | pnpm (recomendado), npm, yarn |
| **Pagamentos** | [PREENCHER] | Stripe, Asaas, Pagar.me, Mercado Pago, N/A |
| **E-mail transacional** | [PREENCHER] | Resend, SendGrid, Nodemailer, N/A |
| **IA / LLM** | [PREENCHER] | Claude API, OpenAI, Groq, N/A |
| **Monitoramento** | [PREENCHER] | Sentry, LogRocket, Datadog, N/A |

### 3.1 Decisões técnicas já confirmadas
<!--
Liste decisões irreversíveis ou com custo alto de mudança.
Ex: "Usaremos Supabase como BaaS — decisão final, não discutir alternativas."
-->
- [PREENCHER]

### 3.2 Restrições de infraestrutura
<!--
Ex: "Budget inicial: $0/mês (free tiers apenas)."
    "Não pode usar servidores fora do Brasil (LGPD)."
-->
- [PREENCHER]

---

## 4. Arquitetura Desejada

### 4.1 Padrão arquitetural

- [ ] **BaaS + Frontend only** — Ex: React + Supabase direto (simples, rápido)
- [ ] **Clean Architecture** — domain / application / interface / infrastructure / shared
- [ ] **Feature-based** — cada feature é uma pasta autocontida
- [ ] **Monolito modular** — módulos separados, deploy único
- [ ] **Microserviços** — serviços independentes (só se justificado)
- [ ] Outro: [DESCREVER]

### 4.2 Camada de serviços

<!--
Onde fica a lógica de negócio? Como os componentes acessam dados?
Ex: "Toda query ao banco passa por src/services/. Nenhum componente
acessa o Supabase diretamente."
-->
[PREENCHER]

### 4.3 Estrutura de pastas (esboço)

```
[PREENCHER — cole a estrutura desejada ou deixe em branco para o Claude sugerir]

Exemplo para React + Supabase:
src/
  components/      ← componentes reutilizáveis
  pages/           ← uma pasta por rota
  services/        ← toda lógica de banco aqui
  hooks/           ← custom hooks
  types/           ← tipos TypeScript compartilhados
  test/            ← testes Vitest
supabase/
  migrations/      ← migrações SQL numeradas
  seed/            ← dados de desenvolvimento
```

---

## 5. Bounded Contexts / Módulos Principais

<!--
Liste os grandes blocos funcionais do produto. Cada módulo vira um
conjunto de features, services e migrations.
-->

| # | Módulo | Descrição curta | Prioridade |
|---|--------|-----------------|------------|
| 1 | [ex: Autenticação] | [ex: Login, cadastro, reset de senha] | Alta |
| 2 | [ex: Dashboard] | [ex: Visão geral com KPIs e atalhos] | Alta |
| 3 | [ex: Tarefas] | [ex: CRUD de tarefas com status e responsável] | Alta |
| 4 | [ex: Equipes] | [ex: Convite e gestão de membros] | Média |
| 5 | [ex: Relatórios] | [ex: Exportar progresso em PDF/Excel] | Baixa |
| 6 | [Adicionar conforme necessário] | | |

---

## 6. Regras de Negócio Críticas

<!--
As regras que NUNCA podem ser violadas. Se quebrar, o sistema está errado.
Liste de 5 a 15. Seja específico — regras vagas não ajudam.

Formato: [Módulo] + [regra] + [consequência se violada]
-->

| # | Regra | Módulo |
|---|-------|--------|
| RN-001 | [ex: Um usuário só pode ver tarefas do seu workspace] | Tarefas |
| RN-002 | [ex: Apenas admin pode excluir um workspace] | Equipes |
| RN-003 | [ex: Tarefa concluída não pode voltar para "em progresso" sem permissão de gestor] | Tarefas |
| RN-004 | [PREENCHER] | |
| RN-005 | [PREENCHER] | |

---

## 7. Roles e Permissões

<!--
Quem são os tipos de usuário e o que cada um pode fazer?
Seja preciso — isso gera as policies de RLS no banco.
-->

| Role | Quem é | Pode fazer | Não pode fazer |
|------|--------|------------|----------------|
| `superadmin` | [ex: fundador/dev] | [ex: tudo] | — |
| `admin` | [ex: dono de workspace] | [ex: CRUD de membros, projetos, relatórios] | [ex: acessar outros workspaces] |
| `membro` | [ex: colaborador] | [ex: criar e completar tarefas próprias] | [ex: excluir projetos, ver relatórios] |
| `visitante` | [ex: cliente com acesso read-only] | [ex: visualizar progresso] | [ex: criar ou editar qualquer coisa] |
| [Adicionar conforme necessário] | | | |

### 7.1 Fallback de role
<!--
O que acontece se o usuário não tem role definida?
Ex: "Role padrão no cadastro: 'pendente' → redirecionar para tela de aguardo."
-->
[PREENCHER]

---

## 8. Requisitos Não-Funcionais

### 8.1 Segurança
- RLS ativo em todas as tabelas com dados de usuário: [Sim / Não / Parcial]
- Autenticação obrigatória para todas as rotas do dashboard: [Sim / Não]
- Tokens e chaves nunca no frontend: [Sim / Não]
- [Outros requisitos de segurança específicos do domínio]

### 8.2 LGPD / Privacidade
<!--
O produto coleta dados pessoais? Que dados? Como são tratados?
Ex: "Coletamos nome, e-mail e CPF. Usuário pode solicitar exclusão.
Dados não são compartilhados com terceiros."
-->
- Dados pessoais coletados: [PREENCHER]
- Política de retenção: [PREENCHER]
- Direito à exclusão implementado: [Sim / Não / Planejado]

### 8.3 Performance
- Tempo de carregamento aceitável: [ex: < 2s para dashboard]
- Paginação obrigatória a partir de: [ex: 50 registros]
- Índices obrigatórios em: [ex: todas as colunas usadas em filtros]

### 8.4 Disponibilidade
- SLA desejado: [ex: 99% uptime]
- Estratégia de backup: [ex: Supabase automático diário]
- Plano para cold start (Supabase Free pausa após 7 dias): [PREENCHER]

---

## 9. Restrições e Decisões Já Tomadas

<!--
Decisões que NÃO devem ser questionadas pelos agentes.
São faits accomplis — custos irrecuperáveis ou escolhas estratégicas firmes.
-->

| Restrição | Motivo |
|-----------|--------|
| [ex: Não usar npm — apenas pnpm] | [ex: Conflito de lockfile em CI] |
| [ex: Migrations sempre manuais via SQL Editor] | [ex: CLI do Supabase instável no ambiente] |
| [ex: Sem server-side rendering por ora] | [ex: Simplicidade — pode mudar na V2] |
| [PREENCHER] | |

---

## 10. Fora de Escopo (V1)

<!--
O que explicitamente NÃO será feito na primeira versão.
Isso evita feature creep e alinha expectativas.
-->

- [ ] [ex: App mobile — V2]
- [ ] [ex: Integração com Slack/Teams — V2]
- [ ] [ex: Multi-idioma — inglês apenas por ora]
- [ ] [ex: BI avançado — relatórios básicos só]
- [ ] [PREENCHER]

---

## Aprovação

| Papel | Nome | Data | Assinatura |
|-------|------|------|------------|
| Responsável técnico | [PREENCHER] | | ✅ / ⏳ |
| Stakeholder principal | [PREENCHER] | | ✅ / ⏳ |

---
*Template gerado pelo Kit de Agentes Portátil v2.0*
