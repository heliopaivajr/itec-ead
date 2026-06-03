# Plano de Lançamento — Agosto 2026
**Aprovado por:** Hélio Paiva Jr.
**Data:** 2026-06-02
**Prazo:** 8 semanas (junho + julho)
**Desenvolvedor:** 1 (Hélio)

---

## O que entra e o que sai

### ✅ ENTRA no lançamento de agosto

**Web App:**
- Histórico acadêmico completo na ficha do aluno (notas, frequência, status)
- Declaração de Matrícula em PDF (documento mais solicitado)
- Lista de alunos por turma imprimível
- Calendário acadêmico editável (secretaria edita, todos visualizam)
- Aprovação de matrícula pendente → ativa
- Alerta de aluno em risco no dashboard da secretaria
- RLS em `profiles` (obrigatório antes de ter alunos reais)
- Ficha do professor com disciplinas ativas

**App Mobile v1 (novo projeto):**
- Login com email e senha
- Dashboard do aluno: notas, frequência, avisos
- Calendário da turma (somente leitura)
- Download de materiais/apostilas

### ❌ SAI para V2 (pós-agosto)

| Feature | Por quê saiu | Sprint previsto |
|---------|-------------|----------------|
| Certificados (Sprint O) | Depende de dados validados por meses; emitir antes é risco institucional | Setembro/Outubro |
| Relatórios avançados (Sprint P) | Declaração cobre a necessidade imediata; relatórios são V2 | Outubro |
| Upload real de documentos | Checklist visual cobre o lançamento | Sprint L+ |
| Lançamento de notas/faltas pelo app | Feito pelo web — app é somente consulta | App v2 |
| Gestão/admin no app | App v1 é só para alunos | App v2 |
| Upload de foto pelo app | Web já tem — app pode esperar | App v2 |

---

## Cronograma das 8 Semanas

### Semana 1 — Sprint M: Histórico + Turmas + Declaração
**Branch:** `sprint-m-historico`

| Item | Complexidade | Critério de aceite |
|------|-------------|-------------------|
| Histórico acadêmico na FichaAluno (notas N1/N2/Rec, %, status) | G | Secretaria vê histórico completo do aluno |
| Rendimento médio por módulo e geral | P | Médias calculadas corretamente |
| Alerta de aluno em risco no dashboard secretaria | M | Badge vermelho aparece quando frequência < 75% |
| Gestão de turmas: aba "Alunos Matriculados" | M | Lista de alunos por turma visível |
| Lista imprimível de alunos por turma | P | `window.print()` ou PDF funcional |
| Aprovação de matrícula: pendente → ativa | P | Fluxo completo sem SQL manual |
| **Declaração de Matrícula PDF** | M | PDF gerado com dados corretos do aluno |
| Ficha do professor: disciplinas ativas | M | Seção aparece na ficha |

Serviços já prontos: `notas.service.ts`, `frequencia.service.ts`, `calcularResultado()` ✅

---

### Semana 2 — Sprint N: Calendário Acadêmico
**Branch:** `sprint-n-calendario`

| Item | Complexidade | Critério de aceite |
|------|-------------|-------------------|
| Calendário mensal/semanal visual | G | Secretaria vê o mês com aulas e eventos |
| Criar/editar aulas recorrentes (grade semanal) | M | Secretaria cadastra "toda terça 19h" |
| Criar/editar eventos (feriados, cancelamentos) | M | Feriado aparece e cancela aula do dia |
| Visão do professor (somente leitura) | P | Professor vê seu próprio calendário |
| Visão do aluno (somente leitura) | P | Aluno vê calendário da sua turma |
| Feriados nacionais 2026 pré-cadastrados | P | Aparecem automaticamente no calendário |
| Impressão do calendário mensal | P | `window.print()` funcional |

Banco já criado: tabelas `aulas_recorrentes` + `eventos_calendario` (migration 029) ✅

**Nota sobre biblioteca de calendário:** Antes de implementar, verificar
`github.com/heliopaivajr/public-apis` e confirmar com Hélio qual biblioteca usar.
Opções sem aviso: construir com CSS Grid próprio (sem dependência). Opções que requerem aviso: FullCalendar, React Big Calendar etc.

---

### Semana 3 — RLS + Infraestrutura Crítica
**Branch:** `sprint-rls-profiles`

| Item | Complexidade | Critério de aceite |
|------|-------------|-------------------|
| RLS ativo em `profiles` (ADR-006 / migration 028) | G | Aluno não consegue ver dados de outro aluno via Supabase client |
| Corrigir ERR-RISK-001 (`user_roles.upsert` sem erro handling) | P | Erro logado se upsert falhar |
| Testes de RLS com curl (não Studio) | M | 3 cenários testados: próprio perfil ✅, perfil alheio ❌, staff ✅ |
| Verificação backfill `user_roles` completo | P | `SELECT COUNT(*) = 0` na query de orphans |
| Ajustes de bugs identificados no Sprint M | variável | Bugs críticos corrigidos |

---

### Semana 4 — Sprint P-reduzido: PDFs Essenciais
**Branch:** `sprint-p-pdfs`

Escopo reduzido: apenas os documentos que a Camila usa toda semana.

| Item | Complexidade | Critério de aceite |
|------|-------------|-------------------|
| Boletim de Notas PDF | M | PDF com histórico completo do aluno |
| Situação Financeira PDF | M | PDF com mensalidades e status |
| Relatório de turma básico | M | Lista de alunos com notas e frequência |

Os outros PDFs (Relatório Final, Histórico completo) ficam como botões com "Em breve" — já existem na ficha via Sprint K.

---

### Semanas 5-7 — App Mobile v1
**Projeto novo:** `itec-mobile` (repositório separado ou monorepo)

**Stack:** React Native + Expo + Expo Router

**Semana 5 — Setup + Autenticação:**
- [ ] `npx create-expo-app itec-mobile`
- [ ] Configurar Supabase client no mobile
- [ ] Tela de Login (email + senha)
- [ ] Tela de Aguardando aprovação (role = pendente)
- [ ] Navegação base (Tab Navigator: Início, Notas, Calendário, Materiais)

**Semana 6 — Telas Principais:**
- [ ] Dashboard do aluno: resumo de notas e frequência
- [ ] Tela de Notas: histórico por disciplina (N1, N2, Rec, média, status)
- [ ] Tela de Frequência: % por disciplina, status (ok/alerta/reprovado)
- [ ] Tela de Avisos: lista de avisos do ITEC (tabela `avisos`)

**Semana 7 — Calendário + Materiais + Polimento:**
- [ ] Tela de Calendário: mês com aulas e eventos da turma
- [ ] Tela de Materiais: lista por disciplina + download PDF
- [ ] Push notifications básicas (Expo Notifications)
- [ ] Testes em iOS e Android (Expo Go)
- [ ] Ajustes de UI e dark mode básico

---

### Semana 8 — Testes Integrados + Deploy
| Item | Critério |
|------|---------|
| Camila testa o sistema completo por 2 dias | Sem bugs bloqueantes |
| Professor testa lançamento de notas/faltas | Fluxo funcionando |
| Aluno testa app (testar com aluno1@itecedu.com) | Todas as telas funcionando |
| Build de produção: `pnpm build` limpo | Zero erros |
| Deploy web: Vercel (automático via push main) | Site no ar |
| Build app: Expo EAS Build | APK/IPA gerado |
| Publicação app: Expo Go link ou lojas | Link disponível |

---

## O que Camila tem no Dia 1

| Funcionalidade | Status |
|---------------|--------|
| Cadastrar aluno diretamente (sem signup) | ✅ Sprint L |
| Ver ficha completa do aluno com histórico | Sprint M |
| Imprimir declaração de matrícula na hora | Sprint M + P |
| Ver lista de alunos por turma | Sprint M |
| Aprovar matrículas pendentes | Sprint M |
| Ver e editar calendário acadêmico | Sprint N |
| Imprimir boletim de notas | Sprint P |
| Gerenciar professores com 4 status | ✅ Sprint L |
| Upload de foto do aluno | ✅ Sprint L |
| Código ITEC-AAAA-NNN para cada aluno | ✅ Sprint L |

## O que o Aluno tem no App no Dia 1

| Funcionalidade | Status |
|---------------|--------|
| Login com email e senha | Semana 5 |
| Ver suas notas (N1, N2, média, status aprovado/reprovado) | Semana 6 |
| Ver sua frequência por disciplina | Semana 6 |
| Ler avisos do ITEC | Semana 6 |
| Ver calendário da sua turma | Semana 7 |
| Baixar materiais/apostilas | Semana 7 |

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| App mobile leva mais de 3 semanas | Alta | Alto | Cortar calendário e materiais do app v1; entregar só login + notas + frequência |
| Biblioteca de calendário web complexa | Média | Médio | Implementar com CSS Grid próprio — sem dependência externa |
| Bugs de RLS bloqueiam login dos alunos | Baixa | Crítico | Testar com curl antes de ativar em produção |
| Dados históricos inconsistentes impedem o histórico | Média | Alto | Testar com seed (aluno1-5@itecedu.com) antes de considerar Sprint M concluído |
| EAS Build / publicação nas lojas demora | Alta | Médio | Usar Expo Go para lançamento; lojas são V2 |

---

## O que DEFINITIVAMENTE NÃO entra em agosto

- Certificados (Sprint O) — emitir antes de ter dados validados é risco institucional
- Relatórios avançados — declaração cobre agosto
- Lançamento de notas pelo app — fica no web
- EAD / vídeos — V2 2027
- Multi-campus — V2 2027-2028
- Pagamento PIX automático — aguardando conta Asaas

---

## Pré-requisitos Externos (Hélio fazer antes das semanas indicadas)

| Item | Prazo | Para que |
|------|-------|---------|
| Definir biblioteca de calendário (ou confirmar CSS Grid) | Antes semana 2 | Sprint N |
| Expo account + EAS configurado | Antes semana 5 | App mobile |
| Definição do ícone e splash screen do app | Antes semana 5 | Identidade do app |
| Testar Expo Go em celular pessoal | Antes semana 5 | Ambiente de desenvolvimento mobile |
| Aprovação do layout da Declaração de Matrícula | Antes semana 4 | Sprint P |

---
*Plano aprovado 2026-06-02 · Revisto semanalmente · Hélio Paiva Jr.*
