# REGRAS-FINANCEIRO.md — ITEC-EAD
# Sistema de Cobrança por Quantidade de Disciplinas
# Aprovado pela Direção Acadêmica em: 2026-06-11

---

## 📋 VISÃO GERAL

O ITEC-EAD utiliza um **modelo de cobrança progressivo baseado na quantidade de disciplinas cursadas simultaneamente**, não por disciplina individual.

**Princípio**: Quanto mais disciplinas o aluno cursar no semestre, menor o custo médio por disciplina.

**Benefício**: Incentiva dedicação integral ao curso e reduz o custo por crédito para alunos comprometidos.

---

## 💰 TABELA PADRÃO (Valores em R$)

| Qtd. Disciplinas | Taxa Matrícula<br>(até 15/01) | Taxa Matrícula<br>(após 15/01) | Mensalidade<br>(até dia 10) | Mensalidade<br>(após dia 10) |
|:----------------:|:-----------------------------:|:------------------------------:|:---------------------------:|:----------------------------:|
| **1** | R$ 50,00 | R$ 125,00 | R$ 125,00 | R$ 135,00 |
| **2** | R$ 100,00 | R$ 210,00 | R$ 210,00 | R$ 230,00 |
| **3** | R$ 150,00 | R$ 265,00 | R$ 265,00 | R$ 300,00 |
| **4** | R$ 200,00 | R$ 340,00 | R$ 340,00 | R$ 370,00 |

**Observação**: Mensalidade única mensal — independente do número de disciplinas.

---

## 👨‍👩‍👧‍👦 TABELA FAMÍLIA (Valores com Desconto)

Aplicável quando **2 ou mais membros da mesma família** estão matriculados simultaneamente no ITEC.

| Qtd. Disciplinas | Taxa Matrícula<br>(até 15/01) | Taxa Matrícula<br>(após 15/01) | Mensalidade<br>(até dia 10) | Mensalidade<br>(após dia 10) |
|:----------------:|:-----------------------------:|:------------------------------:|:---------------------------:|:----------------------------:|
| **1** | R$ 50,00 | R$ 115,00 | R$ 115,00 | R$ 125,00 |
| **2** | R$ 100,00 | R$ 190,00 | R$ 190,00 | R$ 210,00 |
| **3** | R$ 150,00 | R$ 235,00 | R$ 235,00 | R$ 270,00 |
| **4** | R$ 200,00 | R$ 300,00 | R$ 300,00 | R$ 330,00 |

**Critérios de elegibilidade**:
- Comprovação de parentesco (certidão de casamento, nascimento ou declaração)
- Ambos os membros devem estar com matrículas ativas
- Desconto aplicado automaticamente após aprovação da secretaria

---

## 📊 COMPARATIVO DE ECONOMIA

### Exemplo 1: Aluno cursando 4 disciplinas

| Modalidade | Taxa Matrícula<br>(até 15/01) | Mensalidade<br>5 meses | Total Semestre |
|------------|-------------------------------|------------------------|----------------|
| **Padrão** | R$ 200,00 | 5 × R$ 340,00 = R$ 1.700,00 | **R$ 1.900,00** |
| **Família** | R$ 200,00 | 5 × R$ 300,00 = R$ 1.500,00 | **R$ 1.700,00** |
| **Economia** | — | R$ 200,00 | **R$ 200,00** (10,5%) |

### Exemplo 2: Custo médio por disciplina (4 disciplinas)

| Modalidade | Total Semestre | Qtd. Disciplinas | Custo/Disciplina |
|------------|----------------|------------------|------------------|
| **Padrão** | R$ 1.900,00 | 4 | **R$ 475,00** |
| **Família** | R$ 1.700,00 | 4 | **R$ 425,00** |

---

## 🔒 REGRAS DE NEGÓCIO

### 1. Vencimento e Acréscimos
- **Vencimento padrão**: Todo dia 10 de cada mês
- **Pagamento até dia 10**: Valor normal
- **Pagamento após dia 10**: Acréscimo automático conforme tabela
- **Tolerância**: Nenhuma — sistema deve aplicar acréscimo automaticamente no dia 11

### 2. Taxa de Matrícula
- **Cobrança única por semestre** (não mensal)
- **Matrícula até 15/01**: Valor promocional
- **Matrícula após 15/01**: Valor padrão (mais alto)
- **Não reembolsável** após confirmação da matrícula

### 3. Mensalidades
- **5 mensalidades por semestre** (fevereiro a junho OU agosto a dezembro)
- **Valor fixo mensal** baseado na quantidade de disciplinas cursadas
- **Não há cobrança proporcional** — aluno que trancar/desistir após dia 10 deve pagar a mensalidade do mês

### 4. Descontos
- **Desconto Família**: Automático após comprovação
- **Outros descontos**: Editáveis via sistema (campo `percentual_desconto` em `matriculas`)
- **Aprovação obrigatória**: 
  - Financeiro (Breno) — análise e recomendação
  - Superadmin (Hélio) — aprovação final
- **Registro**: Todo desconto aprovado deve ter `observacao_financeira` preenchida com justificativa

### 5. Bolsas e Isenções
- **Bolsa integral (100%)**: `tipo_financiamento = 'bolsa_integral'`
- **Bolsa parcial (50%, 75%, etc.)**: `percentual_desconto` preenchido
- **Aprovação**: Apenas superadmin pode conceder bolsas
- **Critérios**: Análise socioeconômica, desempenho acadêmico, comprometimento ministerial

---

## 🛠️ IMPLEMENTAÇÃO TÉCNICA

### Campos no Banco (tabela `matriculas`)

```sql
-- Migration 036 (já aplicada)
ALTER TABLE matriculas ADD COLUMN tipo_financiamento VARCHAR(50) DEFAULT 'integral';
ALTER TABLE matriculas ADD COLUMN percentual_desconto INTEGER DEFAULT 0 CHECK (percentual_desconto >= 0 AND percentual_desconto <= 100);
ALTER TABLE matriculas ADD COLUMN observacao_financeira TEXT;
```

**Valores válidos `tipo_financiamento`**:
- `'integral'` — pagamento completo
- `'bolsa_integral'` — 100% de desconto
- `'bolsa_parcial'` — desconto definido em `percentual_desconto`
- `'familia'` — desconto automático da Tabela Família

### Cálculo Automático no Sistema

```typescript
// Pseudocódigo — lógica de cálculo
function calcularMensalidade(qtdDisciplinas: number, dataMatricula: Date, dataPagamento: Date, tipoFinanciamento: string, percentualDesconto: number): number {
  // 1. Buscar valor base na tabela
  let valorBase = getTabelaPrecos(qtdDisciplinas, dataMatricula, tipoFinanciamento);
  
  // 2. Aplicar acréscimo se pagamento após dia 10
  if (dataPagamento.getDate() > 10) {
    valorBase = getValorComAcrescimo(qtdDisciplinas, dataMatricula, tipoFinanciamento);
  }
  
  // 3. Aplicar desconto se existir
  if (percentualDesconto > 0) {
    valorBase = valorBase * (1 - percentualDesconto / 100);
  }
  
  return valorBase;
}
```

### Tabela de Preços no Banco

Criar tabela `tabela_precos` (Sprint Financeiro):

```sql
CREATE TABLE tabela_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('padrao', 'familia')),
  qtd_disciplinas INTEGER NOT NULL CHECK (qtd_disciplinas BETWEEN 1 AND 4),
  taxa_matricula_ate_15jan DECIMAL(10,2) NOT NULL,
  taxa_matricula_apos_15jan DECIMAL(10,2) NOT NULL,
  mensalidade_ate_dia10 DECIMAL(10,2) NOT NULL,
  mensalidade_apos_dia10 DECIMAL(10,2) NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tipo, qtd_disciplinas, vigencia_inicio)
);
```

---

## 💳 MÉTODO DE PAGAMENTO ATUAL VS. META

### Hoje (Junho 2026)
✅ **PIX manual via WhatsApp**
- Aluno solicita chave PIX no grupo do WhatsApp
- Secretaria envia chave PIX do ITEC
- Aluno faz transferência e envia comprovante
- Secretaria confirma manualmente no sistema

### Meta (Agosto 2026)
🎯 **Integração Asaas (Sprint Financeiro)**
- Sistema gera boleto/PIX automaticamente
- Aluno recebe link de pagamento por email/WhatsApp
- Webhook confirma pagamento automaticamente
- Baixa automática na plataforma
- Notificação ao aluno e secretaria

---

## 📧 FLUXO DE COBRANÇA (Automático)

### Semana antes do vencimento (dia 3)
📩 Email/WhatsApp: "Sua mensalidade vence em 7 dias"

### 3 dias antes do vencimento (dia 7)
📩 Email/WhatsApp: "Sua mensalidade vence em 3 dias"

### Dia do vencimento (dia 10)
📩 Email/WhatsApp: "Hoje é o último dia para pagar sem acréscimo"

### 1 dia após vencimento (dia 11)
🚨 Email/WhatsApp: "Mensalidade em atraso — valor com acréscimo: R$ XXX,XX"

### 5 dias após vencimento (dia 15)
🚨 Email/WhatsApp: "Atenção: 5 dias de atraso — regularize para manter acesso à plataforma"

### 10 dias após vencimento (dia 20)
⚠️ Sistema: Suspensão automática de acesso (aluno não consegue acessar materiais/aulas)

---

## 🔐 PERMISSÕES E RESPONSABILIDADES

| Ação | superadmin | admin | administracao | financeiro | aluno |
|------|------------|-------|---------------|------------|-------|
| **Visualizar própria situação financeira** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Visualizar situação de todos os alunos** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Gerar boleto/PIX** | ✅ | ✅ | ✅ | ✅ | ✅ (apenas próprio) |
| **Lançar pagamento manualmente** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Conceder desconto até 20%** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Conceder desconto > 20%** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Conceder bolsa integral** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Alterar tabela de preços** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Exportar relatório financeiro** | ✅ | ✅ | ✅ (somente leitura) | ✅ | ❌ |

**Responsável financeiro atual**: Breno (role `financeiro`)

---

## 📝 EXEMPLOS PRÁTICOS

### Exemplo 1: Aluno Regular — 3 Disciplinas
- Matrícula: 10/01/2026 (antes de 15/01)
- Quantidade de disciplinas: 3
- Tipo financiamento: integral (padrão)

**Cobrança**:
- Taxa de matrícula: R$ 150,00 (única)
- Mensalidade (fev a jun): 5 × R$ 265,00 = R$ 1.325,00
- **Total semestre**: R$ 1.475,00

Se pagar até dia 10: R$ 265,00/mês  
Se pagar após dia 10: R$ 300,00/mês

---

### Exemplo 2: Família — Casal Cursando 2 Disciplinas Cada
- Matrícula: 20/01/2026 (após 15/01)
- João: 2 disciplinas
- Maria: 2 disciplinas
- Tipo financiamento: familia

**João**:
- Taxa de matrícula: R$ 100,00
- Mensalidade: 5 × R$ 190,00 = R$ 950,00
- **Total**: R$ 1.050,00

**Maria**:
- Taxa de matrícula: R$ 100,00
- Mensalidade: 5 × R$ 190,00 = R$ 950,00
- **Total**: R$ 1.050,00

**Total casal**: R$ 2.100,00

**Economia vs. Tabela Padrão**:
- Padrão: 2 × R$ 1.260,00 = R$ 2.520,00
- Família: R$ 2.100,00
- **Economia**: R$ 420,00 (16,6%)

---

### Exemplo 3: Bolsista 50% — 4 Disciplinas
- Matrícula: 05/01/2026
- Quantidade de disciplinas: 4
- Tipo financiamento: bolsa_parcial
- Percentual desconto: 50%

**Cobrança**:
- Taxa de matrícula: R$ 200,00 × 50% = R$ 100,00
- Mensalidade: R$ 340,00 × 50% = R$ 170,00
- **Total semestre**: R$ 100,00 + (5 × R$ 170,00) = R$ 950,00

---

## 🎯 ROADMAP DE IMPLEMENTAÇÃO

### Sprint Financeiro (Semanas 5-6 — Julho 2026)

**Backend**:
- [ ] Criar tabela `tabela_precos` com valores oficiais
- [ ] Criar função `calcularMensalidade()` em `financeiro.service.ts`
- [ ] Criar função `gerarBoletoAsaas()` em `asaas.service.ts`
- [ ] Criar webhook `/api/asaas-webhook` para confirmação de pagamento
- [ ] Criar função `suspenderAcessoInadimplente()` (executa dia 20 de cada mês)

**Frontend**:
- [ ] Tela "Situação Financeira" no dashboard do aluno
- [ ] Botão "Gerar Boleto/PIX" com preview de valor
- [ ] Lista de mensalidades (pagas/pendentes/atrasadas)
- [ ] Dashboard financeiro para admin/financeiro (KPIs)
- [ ] Tela de aprovação de descontos (workflow)

**Integrações**:
- [ ] Asaas: criar cobrança
- [ ] Asaas: webhook de confirmação
- [ ] Resend: email de cobrança automático
- [ ] WhatsApp Business API (opcional — avaliar custo)

**Testes**:
- [ ] Teste de cálculo com todas as combinações de tabela
- [ ] Teste de acréscimo após dia 10
- [ ] Teste de desconto família
- [ ] Teste de webhook Asaas
- [ ] Teste de suspensão automática

---

## 📚 REFERÊNCIAS

- **Migration 036**: `20260608_036_matriculas_financiamento.sql`
- **Tabela matriculas**: campos `tipo_financiamento`, `percentual_desconto`, `observacao_financeira`
- **Asaas API Docs**: https://docs.asaas.com/
- **Ideas Backlog**: `.ai-system/memory/IDEAS-BACKLOG.md` → Seção 8.4

---

## 🔄 HISTÓRICO DE ALTERAÇÕES

| Data | Versão | Alteração | Responsável |
|------|--------|-----------|-------------|
| 2026-06-11 | 1.0 | Criação do documento com tabelas oficiais aprovadas | Hélio Paiva Jr. |

---

**Aprovado por**: Pr. Hélio Paiva Jr. (Superadmin)  
**Próxima revisão**: Agosto/2026 (após lançamento V1)
