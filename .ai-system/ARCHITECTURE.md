# ARCHITECTURE.md — Decisões Arquiteturais
# Documento vivo — atualizar a cada ADR aprovado

---

## 🏛️ Visão Geral da Arquitetura

Este projeto segue **Clean Architecture + DDD + CQRS + Event-Driven Architecture**.

```
┌─────────────────────────────────────────────────────────────────┐
│                        MUNDO EXTERNO                           │
│  Browser / Mobile App / API Consumers / Webhooks               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                    INTERFACE LAYER                              │
│  API Routes · Controllers · Presenters · Middleware            │
│  Responsabilidade: adaptar o mundo externo para a aplicação    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Commands / Queries (DTOs)
┌──────────────────────────▼──────────────────────────────────────┐
│                   APPLICATION LAYER                            │
│  Use Cases · Command Handlers · Query Handlers · DTOs          │
│  Responsabilidade: orquestrar o domínio para casos de uso      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Entities / Value Objects
┌──────────────────────────▼──────────────────────────────────────┐
│                     DOMAIN LAYER  (núcleo)                     │
│  Entities · Value Objects · Domain Events · Repo Interfaces    │
│  Responsabilidade: regras de negócio puras — zero dependências │
└──────────────────────────┬──────────────────────────────────────┘
                           │ implements
┌──────────────────────────▼──────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                          │
│  Supabase · Stripe · Claude API · Email · Storage · Cache      │
│  Responsabilidade: implementações concretas e IO externo       │
└─────────────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                    AI / AGENTS LAYER                           │
│  Skills · Parsers · Orchestrators · LLM Adapters              │
│  Responsabilidade: comunicação com LLMs, output → DTO         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📐 Regra de Dependência (INVIOLÁVEL)

```
✅ Permitido (dependência aponta para dentro):
   Infrastructure → Application → Domain
   Interface      → Application → Domain
   AI/Agents      → Infrastructure

❌ Proibido (nunca):
   Domain → qualquer outra camada
   Application → Infrastructure (apenas via interface/porta)
   AI → Domain diretamente
```

---

## 🗂️ Bounded Contexts e Fronteiras

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Identity/Auth  │     │ Tenant/Workspace │     │    Billing      │
│                 │────▶│                 │────▶│                 │
│ User, Session   │     │ Tenant, Member  │     │ Sub, Invoice    │
│ Permission, Role│     │ Plan, Limits    │     │ Payment, Coupon │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      CORE DOMAIN        │
                    │  [específico do produto] │
                    │                         │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐   ┌──────────▼──────────┐  ┌────────▼────────┐
│  Notifications  │   │  Audit/Compliance   │  │   Analytics     │
│                 │   │                     │  │                 │
│ Email, Push     │   │ AuditLog, LGPD      │  │ Event, Metric   │
└─────────────────┘   └─────────────────────┘  └─────────────────┘
```

**Regra de comunicação entre contexts:**
- Comunicação via **Domain Events** (assíncrono) ou **Application Service** (síncrono)
- Nunca acesso direto às entidades de outro context
- Anti-Corruption Layer quando necessário (ex: integração com SINAPI externo)

---

## ⚡ CQRS: Separação de Leitura e Escrita

```
COMMANDS (escrita — modifica estado):
  CriarUsuarioCommand       → CriarUsuarioHandler
  AssinarPlanoCommand       → AssinarPlanoHandler
  ProcessarDocumentoCommand → ProcessarDocumentoHandler

QUERIES (leitura — apenas lê):
  BuscarPerfilQuery         → BuscarPerfilHandler
  ListarProjetosQuery       → ListarProjetosHandler
  ObterDashboardQuery       → ObterDashboardHandler

DOMAIN EVENTS (fatos ocorridos):
  UsuarioCriadoEvent        → dispara: email boas-vindas, analytics
  AssinaturaAtivadaEvent    → dispara: acesso liberado, notificação
  PagamentoFalhouEvent      → dispara: email cobrança, período de graça
```

---

## 🔒 Multi-tenancy: Estratégia de Isolamento

**Estratégia escolhida:** Row-Level Security (RLS) via Supabase

```sql
-- Toda tabela de usuário tem:
tenant_id UUID NOT NULL REFERENCES tenants(id)

-- Policy padrão de isolamento:
CREATE POLICY "tenant_isolation" ON [tabela]
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships
    WHERE user_id = auth.uid()
  ));

-- Verificação no use case (dupla proteção):
if (entity.tenantId !== currentUser.tenantId) {
  throw new UnauthorizedError('Acesso negado');
}
```

---

## 📋 ADRs (Architecture Decision Records)

| # | Decisão | Data | Status |
|---|---------|------|--------|
| [ADR-001] | [Decisão inicial de arquitetura] | [data] | [aceita] |
| [ADR-002] | [Estratégia de multi-tenancy] | [data] | [aceita] |
| [ADR-003] | [Escolha do gateway de pagamento] | [data] | [aceita] |

> Ver arquivos completos em `.ai-system/adr/`

---

## 🔄 Fluxo de uma Request (do Browser ao Banco)

```
1. Browser → GET /api/projetos
2. Middleware de Auth → valida JWT → resolve tenant
3. Interface Layer → ProjectController.list()
4. Application Layer → ListarProjetosQuery → ListarProjetosHandler
5. Handler valida permissões → chama IProjectRepository.findByTenant()
6. Infrastructure → SupabaseProjectRepository.findByTenant()
7. Query SQL com RLS ativo → retorna rows
8. Handler mapeia rows → ProjectListDTO[]
9. Controller serializa → Response JSON
10. Browser recebe resposta
```

---

*Sistema de Agentes IA para SaaS — Hélio Paiva Jr. — ObraIA 2025*
