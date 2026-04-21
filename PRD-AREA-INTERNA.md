# PRD — Área Interna ITEC EAD
## Blueprint de Integração EDUC → ITEC

**Versão:** 1.0  
**Data:** 2026-04-21  
**Objetivo:** Especificar em detalhes toda a área interna pós-login da plataforma ITEC EAD,  
aproveitando ao máximo as ideias, layouts, fluxos e módulos do template EduDash (EDUC).

---

## 1. VISÃO GERAL

### O que é a Área Interna
A área interna é o coração da plataforma — acessada após login por **alunos**, **professores** e **admins**. É onde acontece toda a vida acadêmica digital do ITEC.

### Referência Principal (EDUC / EduDash)
O template **EduDash** (`e:\_HELIOJR\SAAS\EDUC`) é um dashboard administrativo Vue.js com:
- 5 variantes de dashboard (escola, aluno, professor, responsável, LMS)
- 249 componentes reutilizáveis
- 164 rotas completas
- Módulos: alunos, professores, exames, taxas, frequência, biblioteca, RH, certificados, contabilidade, comunicação

**Importante:** EDUC é Vue.js — não pode ser copiado diretamente. Toda lógica, layout e UX deve ser **reimplementada em React + TypeScript + Tailwind + Shadcn UI**.

### Stack ITEC EAD
- React 18 + TypeScript + Vite
- Tailwind CSS + Shadcn UI (Radix)
- Supabase (Auth + PostgreSQL + Storage)
- TanStack Query v5
- React Hook Form + Zod
- Lucide React (ícones)
- Recharts (gráficos)
- React Router v6

---

## 2. ARQUITETURA DA ÁREA INTERNA

### Layout Base (`/dashboard`)
Estrutura em duas colunas: sidebar fixa + conteúdo principal.

```
┌─────────────────────────────────────────────┐
│  SIDEBAR                  CONTEÚDO PRINCIPAL │
│  ──────────               ───────────────── │
│  [Logo ITEC]              [Header: busca,   │
│  [Nome + Role]             notificações,    │
│                            tema toggle]     │
│  Menu por Role:                             │
│  • Dashboard              [Breadcrumb]      │
│  • Módulos...                               │
│                           [Página atual]   │
│  ──────────                                 │
│  [Avatar + Nome]                            │
│  [Sair]                                    │
└─────────────────────────────────────────────┘
```

### Componente Layout (já existe: `src/pages/Dashboard.tsx`)
Melhorias a adicionar:
- Breadcrumb dinâmico baseado na rota
- Badge de notificações no header (contador)
- Busca global rápida no header
- Botão de ajuda/suporte no footer da sidebar
- Indicador visual na sidebar do item ativo

---

## 3. DASHBOARD HOME POR ROLE

### 3.1 Dashboard do Aluno
**Referência EDUC:** `src/pages/index/index2.vue` (Dashboard Aluno)

```
┌──────────────────────────────────────────────────────┐
│  Olá, [Nome]! 👋   Seg, 21 de Abril de 2026          │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ Cursos   │ │Frequência│ │  Notas   │ │Avisos    ││
│  │ 2 ativos │ │   92%    │ │  8.5     │ │ 3 novos  ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                       │
│  PRÓXIMAS AULAS              ÚLTIMOS AVISOS           │
│  ┌────────────────────┐     ┌────────────────────┐   │
│  │ Teologia Livre     │     │ Prova de Exegese    │   │
│  │ Quinta 19h–22h     │     │ 25/04 – Prof. João  │   │
│  │ Prof. João Silva   │     │                     │   │
│  │ [Acessar ▸]        │     │ Recesso: 01/05      │   │
│  └────────────────────┘     └────────────────────┘   │
│                                                       │
│  MEU PROGRESSO               CALENDÁRIO              │
│  Teologia Livre: ████░ 68%   [Mini calendário]        │
│  SETEB: ██░░░░░ 34%                                   │
└──────────────────────────────────────────────────────┘
```

**Componentes a criar:**
- `DashboardAlunoHome.tsx` — container principal
- `KpiCardAluno.tsx` — cards com ícone + número + título
- `ProximasAulas.tsx` — lista das próximas aulas da semana
- `ProgressoCurso.tsx` — barra de progresso por curso
- `MiniCalendario.tsx` — calendário compacto com eventos marcados
- `UltimosAvisos.tsx` — lista dos avisos mais recentes

---

### 3.2 Dashboard do Professor
**Referência EDUC:** `src/pages/index/index3.vue` (Dashboard Professor)

```
┌──────────────────────────────────────────────────────┐
│  Bem-vindo, Prof. [Nome]                              │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ Turmas   │ │  Alunos  │ │Avaliações│ │ Aulas    ││
│  │    3     │ │    47    │ │ Pendentes│ │Esta semana││
│  │          │ │          │ │    2     │ │    5     ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                       │
│  AGENDA DA SEMANA           FREQUÊNCIA GERAL          │
│  ┌────────────────────┐    ┌────────────────────┐    │
│  │ Seg 19h – Teologia │    │ Teologia: 89%       │    │
│  │ Qui 19h – SETEB    │    │ SETEB: 94%          │    │
│  │ Sex 18h – Turma C  │    │ Gráfico pizza       │    │
│  └────────────────────┘    └────────────────────┘    │
│                                                       │
│  AVALIAÇÕES PARA CORRIGIR                             │
│  [Tabela: Aluno | Avaliação | Entregue em | Ação]     │
└──────────────────────────────────────────────────────┘
```

**Componentes a criar:**
- `DashboardProfessorHome.tsx`
- `AgendaSemana.tsx` — aulas da semana com dia/hora/turma
- `FrequenciaGeral.tsx` — gráfico de pizza por turma (Recharts)
- `AvaliacoesPendentes.tsx` — tabela de trabalhos/provas para corrigir

---

### 3.3 Dashboard do Admin
**Referência EDUC:** `src/pages/index/index1.vue` (Dashboard Escola)

```
┌──────────────────────────────────────────────────────┐
│  Painel Administrativo — ITEC                         │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ Alunos   │ │Professores│ │  Leads  │ │  Receita ││
│  │   142    │ │     8    │ │   267    │ │ R$18.400 ││
│  │ +12 mês  │ │          │ │ +43 mês  │ │ +8% mês  ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                       │
│  RECEITA x DESPESA (12 meses)  LEADS POR CURSO       │
│  ┌───────────────────────────┐ ┌────────────────────┐│
│  │ Gráfico de barras         │ │ Pizza: Teologia,   ││
│  │ (Recharts BarChart)       │ │ SETEB, Ministerial ││
│  └───────────────────────────┘ └────────────────────┘│
│                                                       │
│  MATRÍCULAS RECENTES          ÚLTIMOS LEADS           │
│  [Tabela: Aluno | Curso | Data | Status | Ação]       │
└──────────────────────────────────────────────────────┘
```

**Componentes a criar:**
- `DashboardAdminHome.tsx` — refatorar o atual
- `KpiCardAdmin.tsx` — card com valor, delta e ícone
- `ReceitaVsDespesa.tsx` — gráfico barras Recharts
- `LeadsPorCurso.tsx` — gráfico pizza Recharts
- `MatriculasRecentes.tsx` — tabela com 5 últimas matrículas
- `UltimosLeads.tsx` — tabela com 5 últimos leads

---

## 4. MÓDULOS POR ROLE — ESPECIFICAÇÃO DETALHADA

---

### 4.1 MÓDULO: MEUS CURSOS (Aluno)
**Rota:** `/dashboard/cursos`  
**Referência EDUC:** `src/pages/students/StudentDetails.vue`, `src/components/index/index2/`

#### Layout
```
Meus Cursos
Acompanhe seu progresso e acesse o conteúdo das aulas

┌─────────────────────────────────┐
│ [Tabs: Em Andamento | Concluídos]│
└─────────────────────────────────┘

Card de Curso:
┌──────────────────────────────────────┐
│ ██████ TEOLOGIA LIVRE          ativo │
│ ──────────────────────────────────── │
│ 📅 Seg, Qua, Sex — 18h45 às 22h      │
│ 📚 Módulo atual: Hermenêutica (3/6)  │
│ ──────────────────────────────────── │
│ Progresso: ████████░░░░ 68%          │
│ ──────────────────────────────────── │
│ [Ver Conteúdo ▸] [Frequência] [Notas]│
└──────────────────────────────────────┘
```

#### Subpágina: Conteúdo do Curso (`/dashboard/cursos/:id`)
```
Teologia Livre — Hermenêutica

MÓDULOS:
▼ Módulo 1: Introdução à Teologia        ✅ Concluído
▼ Módulo 2: Hermenêutica                 📖 Atual
  ├── Aula 1: Introdução (✅)
  ├── Aula 2: Métodos de Interpretação (✅)
  ├── Aula 3: Tipologia (🔓 Disponível)
  └── Aula 4: Aplicação Prática (🔒 Bloqueado)
▼ Módulo 3: Teologia Sistemática         🔒 Bloqueado
```

**Tabelas Supabase necessárias:**
```sql
cursos (id, nome, descricao, carga_horaria, horario, duracao, cor_tema)
modulos (id, curso_id, nome, ordem, descricao)
aulas (id, modulo_id, nome, ordem, tipo, conteudo_url, duracao_minutos)
progresso_aluno (id, aluno_id, aula_id, concluido, assistido_em)
```

**Componentes a criar:**
- `CursoCard.tsx` — card expandido com progresso
- `CursoDetalhe.tsx` — página com módulos/aulas
- `ModuloAccordion.tsx` — accordion de módulos
- `AulaItem.tsx` — item de aula com status
- `ProgressBar.tsx` — barra de progresso reutilizável

---

### 4.2 MÓDULO: FREQUÊNCIA (Aluno + Professor + Admin)
**Rota Aluno:** `/dashboard/frequencia`  
**Rota Professor:** `/dashboard/turmas/:id/frequencia`  
**Referência EDUC:** `src/pages/attendance/`, `src/components/attendance/`

#### View do Aluno — Minha Frequência
```
Minha Frequência

Teologia Livre: ████████░░ 80%  [badge: Regular]
SETEB:          ██████████ 95%  [badge: Excelente]

Histórico (Teologia Livre):
┌────────────────────────────────────────────┐
│ Data       │ Aula              │ Status     │
│ 17/04/2026 │ Hermenêutica 2    │ ✅ Presente │
│ 15/04/2026 │ Hermenêutica 1    │ ✅ Presente │
│ 10/04/2026 │ Tipologia         │ ❌ Falta    │
│ 08/04/2026 │ Intro à Exegese   │ ✅ Presente │
└────────────────────────────────────────────┘
```

#### View do Professor — Lançar Frequência
```
Frequência — Teologia Livre — Aula de 21/04/2026

[Buscar aluno...]   [Marcar todos presentes]

┌───────────────────────────────────────────┐
│ # │ Aluno              │ Presença          │
│ 1 │ Ana Silva          │ [●Presente ○Falta]│
│ 2 │ Carlos Mendes      │ [●Presente ○Falta]│
│ 3 │ Maria Santos       │ [○Presente ●Falta]│
└───────────────────────────────────────────┘
[Salvar Frequência]
```

**Tabela Supabase:**
```sql
frequencia (id, aluno_id, aula_id, professor_id, status, observacao, created_at)
```

**Componentes:**
- `FrequenciaAluno.tsx` — view do aluno com histórico
- `LancarFrequencia.tsx` — formulário do professor
- `FrequenciaChart.tsx` — gráfico de presença ao longo do tempo
- `StatusBadgeFrequencia.tsx` — badge colorido (Excelente/Regular/Crítico)

---

### 4.3 MÓDULO: NOTAS E AVALIAÇÕES (Aluno + Professor)
**Referência EDUC:** `src/pages/examination/`, `src/components/examination/`

#### View do Aluno — Minhas Notas
```
Minhas Notas

┌────────────────────────────────────────────────┐
│ Teologia Livre                                 │
│ ──────────────────────────────────────────── │
│ Disciplina        │ N1  │ N2  │ Média │ Situ. │
│ Hermenêutica      │ 8.0 │ 9.0 │  8.5  │  ✅   │
│ Teologia Sist.    │ 7.0 │  -  │  7.0  │  📝   │
│ Interpretação     │  -  │  -  │   -   │  🔒   │
└────────────────────────────────────────────────┘
Média Geral: 8.5   Status: Aprovado ✅
```

#### View do Professor — Lançar Notas
```
Lançar Notas — Hermenêutica — N1

[Buscar aluno...]

┌──────────────────────────────────────┐
│ Aluno         │ Nota N1  │ Observação│
│ Ana Silva     │ [____]   │ [_______] │
│ Carlos Mendes │ [____]   │ [_______] │
└──────────────────────────────────────┘
[Salvar Notas]
```

**Tabelas Supabase:**
```sql
avaliacoes (id, modulo_id, nome, tipo, peso, data_entrega)
notas (id, aluno_id, avaliacao_id, professor_id, nota, observacao, lancado_em)
```

**Componentes:**
- `NotasAluno.tsx` — tabela de notas por curso
- `LancarNotas.tsx` — formulário do professor
- `BoletimModal.tsx` — modal com boletim completo do aluno

---

### 4.4 MÓDULO: MATERIAIS DE AULA (Professor + Aluno)
**Referência EDUC:** `src/pages/library/`, `src/components/library/`

#### View do Professor — Gerenciar Materiais
```
Materiais de Aula

[+ Novo Material]

┌─────────────────────────────────────────────────┐
│ Nome             │ Tipo    │ Aula      │ Ações   │
│ Apostila Herm.   │ 📄 PDF  │ Herm. 1   │ ✏️ 🗑️  │
│ Slides Intro.    │ 📊 PPT  │ Intro. 1  │ ✏️ 🗑️  │
│ Video Aula 3     │ 🎬 Link │ Herm. 3   │ ✏️ 🗑️  │
└─────────────────────────────────────────────────┘
```

#### Upload de Material
```
Modal: Adicionar Material
──────────────────────────
Título: [__________________]
Tipo:   [PDF ▾]
Aula:   [Hermenêutica 1 ▾]
Arquivo: [Escolher arquivo]  ← Supabase Storage
         ou
Link:   [https://...]
[Salvar]
```

**Tabela Supabase:**
```sql
materiais (id, aula_id, professor_id, titulo, tipo, url, storage_path, created_at)
```

**Componentes:**
- `MateriaisLista.tsx` — tabela de materiais com filtro
- `MaterialUploadModal.tsx` — modal de upload/link
- `MaterialCard.tsx` — card para aluno acessar material

---

### 4.5 MÓDULO: MATRÍCULAS (Admin)
**Rota:** `/dashboard/matriculas`  
**Referência EDUC:** `src/pages/students/`, `src/components/students/`

#### Interface Admin
```
Matrículas

[Tabs: Pendentes (12) | Ativas | Trancadas | Concluídas]

Filtros: [Curso ▾] [Período ▾] [Buscar por nome...]

┌──────────────────────────────────────────────────────────┐
│ Aluno         │ Curso           │ Data    │ Stat │ Ações │
│ João da Silva │ Teologia Livre  │ 20/04   │ Pend │ ✅ ❌ │
│ Maria Santos  │ SETEB           │ 19/04   │ Pend │ ✅ ❌ │
│ Ana Costa     │ Ministerial     │ 18/04   │ Ativa│ 👁️ ✏️ │
└──────────────────────────────────────────────────────────┘
```

#### Modal de Detalhe da Matrícula
```
Matrícula — João da Silva

Curso: Teologia Livre
Aluno: João da Silva | joao@email.com | (81) 9 9999-9999
Cadastro: 20/04/2026 | Origem: Cadastro Web

Documentos enviados: Nenhum (pendente)
Observações: [_____________________]

[Aprovar Matrícula] [Recusar] [Fechar]
```

**Tabela Supabase (já existe: `matriculas`):**
```sql
-- Adicionar campos:
ALTER TABLE matriculas ADD COLUMN observacao TEXT;
ALTER TABLE matriculas ADD COLUMN aprovado_por UUID REFERENCES profiles(id);
ALTER TABLE matriculas ADD COLUMN aprovado_em TIMESTAMPTZ;
```

**Componentes:**
- `MatriculasTabela.tsx` — tabela com filtros e abas
- `MatriculaDetalheModal.tsx` — modal de aprovação/recusa
- `MatriculaStatusBadge.tsx` — badge colorido por status

---

### 4.6 MÓDULO: COMUNICAÇÃO (Todos os Roles)

#### 4.6.1 Mural de Avisos (`/dashboard/avisos`)
**Referência EDUC:** `src/pages/noticeBoard/`, `src/components/noticeBoard/`

```
Mural de Avisos

[+ Novo Aviso]  (apenas professor/admin)

┌──────────────────────────────────────────────┐
│ 📌 PROVA DE EXEGESE — 25/04                  │
│ Prof. João Silva | Para: Teologia Livre       │
│ A prova será às 19h no formato dissertativo. │
│                                 há 2 dias    │
├──────────────────────────────────────────────┤
│ 📅 RECESSO — 01/05 (Feriado)                 │
│ Administração | Para: Todos                   │
│ Não haverá aulas em 01/05/2026.               │
│                                 há 5 dias    │
└──────────────────────────────────────────────┘
```

**Tabela Supabase:**
```sql
avisos (id, titulo, conteudo, autor_id, role_destino, curso_id, fixado, criado_em, expira_em)
-- role_destino: 'todos' | 'alunos' | 'professores' | 'admin'
```

#### 4.6.2 Notificações In-App (Header)
- Badge com contador no ícone Bell (header)
- Dropdown com últimas 5 notificações
- Marcar como lida
- Link para a notificação completa

**Tabela Supabase:**
```sql
notificacoes (id, usuario_id, titulo, mensagem, lida, link, criado_em)
```

**Componentes:**
- `AvisoCard.tsx` — card de aviso com fixado, autor, data
- `NovoAvisoModal.tsx` — formulário criar aviso
- `NotificacoesDropdown.tsx` — dropdown do header
- `NotificacaoBadge.tsx` — contador no ícone Bell

---

### 4.7 MÓDULO: DOCUMENTOS E CERTIFICADOS (Admin + Aluno)
**Referência EDUC:** `src/pages/certificate/`, `src/components/certificate/`

#### View do Aluno — Meus Documentos
```
Meus Documentos

┌───────────────────────────────────────────┐
│ 📜 Certificado de Conclusão               │
│    Teologia Livre — Módulo 1              │
│    Emitido em: 15/03/2026   [Baixar PDF]  │
├───────────────────────────────────────────┤
│ 📋 Declaração de Matrícula                │
│    Teologia Livre — Ano 2026              │
│    Emitido em: 10/01/2026   [Baixar PDF]  │
└───────────────────────────────────────────┘
```

#### View do Admin — Emitir Certificado
```
Emitir Certificado

Aluno:   [Buscar aluno... ▾]
Curso:   [Teologia Livre ▾]
Tipo:    [Conclusão de Módulo ▾]
Data:    [__/__/____]

Preview do certificado:
┌─────────────────────────────────────┐
│  [Logo ITEC]                        │
│  CERTIFICADO DE CONCLUSÃO           │
│  Certificamos que JOÃO DA SILVA     │
│  concluiu o Módulo 1 de             │
│  Teologia Livre em 15/04/2026.      │
│  [Assinatura]  [Carimbo]            │
└─────────────────────────────────────┘
[Gerar PDF]  [Salvar no Histórico]
```

**Tabela Supabase:**
```sql
certificados (id, aluno_id, curso_id, modulo_id, tipo, emitido_por, emitido_em, codigo_validacao, pdf_url)
```

**Componentes:**
- `DocumentosAluno.tsx` — lista de documentos disponíveis
- `CertificadoTemplate.tsx` — template visual do certificado
- `EmitirCertificadoForm.tsx` — formulário admin para emissão
- `CertificadoValidacao.tsx` — página pública de validação por código

---

### 4.8 MÓDULO: FINANCEIRO/PAGAMENTOS (Admin + Aluno)
**Referência EDUC:** `src/pages/fees/`, `src/pages/accounts/`

#### View do Aluno — Meus Pagamentos
```
Mensalidades

┌────────────────────────────────────────────┐
│ Mês       │ Vencimento │ Valor  │ Status    │
│ Abril/26  │ 05/04/2026 │ R$120  │ ✅ Pago   │
│ Maio/26   │ 05/05/2026 │ R$120  │ ⏳ Em aberto│
│ Junho/26  │ 05/06/2026 │ R$120  │ 🔒 Futuro │
└────────────────────────────────────────────┘
```

#### View do Admin — Gestão Financeira
```
Financeiro

KPIs: Receita do Mês | Inadimplência | Descontos Ativos | A Receber

[Tabs: Mensalidades | Receitas | Despesas | Relatório]

Mensalidades em Aberto:
┌─────────────────────────────────────────────┐
│ Aluno        │ Curso      │ Venc.  │ Ações   │
│ João Silva   │ Teologia   │ 05/04  │ [Baixar]│
│ Maria Santos │ SETEB      │ 05/04  │ [Baixar]│
└─────────────────────────────────────────────┘
```

**Tabelas Supabase:**
```sql
mensalidades (id, aluno_id, curso_id, mes_referencia, vencimento, valor, desconto_id, status, pago_em)
descontos (id, nome, percentual, motivo)
receitas (id, descricao, valor, categoria, data, admin_id)
despesas (id, descricao, valor, categoria, data, admin_id)
```

**Componentes:**
- `PagamentosAluno.tsx` — tabela de mensalidades do aluno
- `FinanceiroAdmin.tsx` — painel financeiro admin com KPIs
- `ReceitaDespesaChart.tsx` — gráfico Recharts linha/barra
- `MensalidadesTabela.tsx` — tabela com filtros e status

---

### 4.9 MÓDULO: GESTÃO DE CURSOS (Admin)
**Rota:** `/dashboard/cursos-admin`  
**Referência EDUC:** `src/pages/class/`, `src/components/class/`

#### Interface CRUD de Cursos
```
Gestão de Cursos

[+ Novo Curso]

┌─────────────────────────────────────────────────────┐
│ Curso                  │ Alunos │ Status  │ Ações   │
│ Teologia Livre         │   45   │ Ativo   │ ✏️ 👁️ 🗑️│
│ SETEB                  │   38   │ Ativo   │ ✏️ 👁️ 🗑️│
│ Ministerial p/ Mulheres│   22   │ Ativo   │ ✏️ 👁️ 🗑️│
└─────────────────────────────────────────────────────┘
```

#### Modal de Edição de Curso
```
Editar Curso: Teologia Livre
──────────────────────────────────
Nome:         [Teologia Livre     ]
Descrição:    [___________________]
Carga Horária:[___] horas
Duração:      [3 anos / 6 módulos ]
Horário:      [Seg, Qua e Sex — 18h45]
Cor Tema:     [🔴 vermelho ▾]
Status:       [Ativo ▾]

MÓDULOS:
+ Módulo 1: [Introdução à Teologia    ] [↑↓] [🗑️]
+ Módulo 2: [Hermenêutica             ] [↑↓] [🗑️]
[+ Adicionar Módulo]

[Salvar]
```

**Componentes:**
- `CursosAdminTabela.tsx` — tabela de gestão
- `CursoForm.tsx` — formulário de criação/edição
- `ModulosOrdenavel.tsx` — lista reordenável de módulos

---

### 4.10 MÓDULO: AGENDA / CALENDÁRIO (Todos os Roles)
**Referência EDUC:** Usa FullCalendar no template original

#### Interface
```
Calendário Acadêmico — Abril 2026

[< Anterior]  Abril 2026  [Próximo >]  [Semana | Mês | Lista]

┌────┬────┬────┬────┬────┬────┬────┐
│ Dom│ Seg│ Ter│ Qua│ Qui│ Sex│ Sab│
│    │  6 │  7 │  8 │  9 │ 10 │ 11 │
│    │    │    │    │🟣AL│    │    │
│    │    │    │    │    │    │    │
│ 12 │ 13 │ 14 │ 15 │ 16 │ 17 │ 18 │
│    │🔴TL│    │🔴TL│🔵SB│🔴TL│    │
│ 19 │ 20 │ 21 │ 22 │ 23 │ 24 │ 25 │
│    │🔴TL│    │🔴TL│🔵SB│📝PR│    │
└────┴────┴────┴────┴────┴────┴────┘

Legenda: 🔴 Teologia  🔵 SETEB  🟣 Ministerial  📝 Prova
```

**Biblioteca recomendada:** `react-big-calendar` ou `@fullcalendar/react`

**Tabela Supabase:**
```sql
eventos_academicos (id, titulo, descricao, tipo, curso_id, data_inicio, data_fim, criado_por)
-- tipo: 'aula' | 'prova' | 'evento' | 'feriado' | 'recesso'
```

**Componentes:**
- `CalendarioAcademico.tsx` — calendário interativo
- `EventoCard.tsx` — popover com detalhes do evento
- `NovoEventoModal.tsx` — formulário para criar evento (professor/admin)

---

## 5. DESIGN SYSTEM — INSPIRAÇÕES DO EDUC

### 5.1 Cards de KPI (Dashboards)
Inspirado nos widgets do EDUC (index1, index2, index3):

```tsx
// KpiCard.tsx — Padrão para todos os dashboards
interface KpiCardProps {
  titulo: string
  valor: string | number
  delta?: string        // ex: "+12% este mês"
  deltaPositivo?: boolean
  icone: React.ElementType
  corIcone?: string     // Tailwind class: "text-itec-blue", "text-itec-gold", etc.
  href?: string         // Link opcional
}
```

Visual:
```
┌──────────────────────────────┐
│ [Ícone azul]  ALUNOS         │
│               142            │
│               +12 este mês ↑ │
└──────────────────────────────┘
```

### 5.2 Tabelas de Dados
Padrão consistente para todas as tabelas da área interna:

```tsx
// DataTable.tsx — Tabela padronizada com:
// - Input de busca no topo
// - Select de filtros (quantos necessários)
// - Botão de ação primária (criar/exportar)
// - Linhas com zebra-striping
// - Paginação
// - Estado vazio com ícone + mensagem
// - Estado de loading com skeleton

interface DataTableProps<T> {
  colunas: ColunaDef<T>[]
  dados: T[]
  carregando?: boolean
  onBuscar?: (termo: string) => void
  acaoLabel?: string
  onAcao?: () => void
}
```

### 5.3 Formulários Passo a Passo (Multi-step)
Para cadastros complexos (matrícula, novos cursos):
- Inspirado em `src/components/students/addNewStudent/` do EDUC (11 etapas)
- Implementar com tabs/steps e `react-hook-form`

```
[1.Dados Pessoais] → [2.Contato] → [3.Curso] → [4.Documentos] → [5.Revisão]
```

### 5.4 Paleta de Cores por Role (EDUC-inspired)
```css
/* Usar as variáveis já definidas no tailwind.config.ts do ITEC */
Aluno:    itec-blue   (#1A365D) → tons de azul
Professor: verde      (#16a34a) → tons de verde
Admin:     itec-gold  (#C19A6B) → tons de dourado
```

### 5.5 Badges de Status
```
Ativo       → bg-green-100  text-green-800  • verde
Pendente    → bg-yellow-100 text-yellow-800 • amarelo
Trancado    → bg-orange-100 text-orange-800 • laranja
Concluído   → bg-blue-100   text-blue-800   • azul
Reprovado   → bg-red-100    text-red-800    • vermelho
```

### 5.6 Ícones (Lucide React — já instalado)
Mapeamento de módulos para ícones:
```
Dashboard:    LayoutDashboard
Cursos:       Book / BookOpen
Módulos:      Layers
Aulas:        PlayCircle
Frequência:   ClipboardCheck
Notas:        Award / GraduationCap
Materiais:    FileText / Download
Avaliações:   ClipboardList
Agenda:       CalendarDays
Comunidade:   Users / MessageCircle
Pagamentos:   CreditCard / DollarSign
Certificados: Award / Medal
Documentos:   FileText / Folder
Avisos:       Bell / Megaphone
Suporte:      HelpCircle / LifeBuoy
Configurações:Settings / ShieldAlert
```

---

## 6. BANCO DE DADOS — SCHEMA COMPLETO

```sql
-- === ESTRUTURA ACADÊMICA ===

CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  carga_horaria INTEGER,
  duracao TEXT,
  horario TEXT,
  cor_tema TEXT DEFAULT 'blue',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID REFERENCES modulos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  tipo TEXT DEFAULT 'presencial', -- 'presencial' | 'video' | 'leitura'
  conteudo_url TEXT,
  duracao_minutos INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === PROGRESSO ===

CREATE TABLE progresso_aluno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE,
  concluido BOOLEAN DEFAULT false,
  assistido_em TIMESTAMPTZ,
  UNIQUE(aluno_id, aula_id)
);

-- === FREQUÊNCIA ===

CREATE TABLE frequencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES profiles(id),
  aula_id UUID REFERENCES aulas(id),
  professor_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL, -- 'presente' | 'falta' | 'justificada'
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aluno_id, aula_id)
);

-- === AVALIAÇÕES ===

CREATE TABLE avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID REFERENCES modulos(id),
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'prova', -- 'prova' | 'trabalho' | 'participacao'
  peso DECIMAL(3,2) DEFAULT 1.0,
  data_entrega DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES profiles(id),
  avaliacao_id UUID REFERENCES avaliacoes(id),
  professor_id UUID REFERENCES profiles(id),
  nota DECIMAL(4,2),
  observacao TEXT,
  lancado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aluno_id, avaliacao_id)
);

-- === MATERIAIS ===

CREATE TABLE materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID REFERENCES aulas(id),
  professor_id UUID REFERENCES profiles(id),
  titulo TEXT NOT NULL,
  tipo TEXT DEFAULT 'pdf', -- 'pdf' | 'slides' | 'video' | 'link'
  url TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === COMUNICAÇÃO ===

CREATE TABLE avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT,
  autor_id UUID REFERENCES profiles(id),
  role_destino TEXT DEFAULT 'todos', -- 'todos' | 'alunos' | 'professores'
  curso_id UUID REFERENCES cursos(id), -- NULL = para todos
  fixado BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  expira_em TIMESTAMPTZ
);

CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES profiles(id),
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  link TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- === FINANCEIRO ===

CREATE TABLE descontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  percentual DECIMAL(5,2),
  motivo TEXT
);

CREATE TABLE mensalidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES profiles(id),
  curso_id UUID REFERENCES cursos(id),
  mes_referencia DATE NOT NULL,
  vencimento DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  desconto_id UUID REFERENCES descontos(id),
  status TEXT DEFAULT 'em_aberto', -- 'em_aberto' | 'pago' | 'atrasado' | 'isento'
  pago_em TIMESTAMPTZ
);

CREATE TABLE receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2),
  categoria TEXT,
  data DATE,
  admin_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2),
  categoria TEXT,
  data DATE,
  admin_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === CERTIFICADOS ===

CREATE TABLE certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES profiles(id),
  curso_id UUID REFERENCES cursos(id),
  modulo_id UUID REFERENCES modulos(id),
  tipo TEXT DEFAULT 'conclusao_modulo',
  emitido_por UUID REFERENCES profiles(id),
  emitido_em TIMESTAMPTZ DEFAULT NOW(),
  codigo_validacao TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  pdf_url TEXT
);

-- === EVENTOS ===

CREATE TABLE eventos_academicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'aula', -- 'aula' | 'prova' | 'evento' | 'feriado' | 'recesso'
  curso_id UUID REFERENCES cursos(id), -- NULL = para todos
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  criado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === ATUALIZAÇÃO DA TABELA MATRÍCULAS (existente) ===
-- ALTER TABLE matriculas ADD COLUMN IF NOT EXISTS observacao TEXT;
-- ALTER TABLE matriculas ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES profiles(id);
-- ALTER TABLE matriculas ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ;

-- === ATUALIZAÇÃO DA TABELA PROFILES (existente) ===
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS especialidade TEXT; -- para professores
```

---

## 7. ARQUITETURA DE COMPONENTES

### Estrutura de Pastas Proposta
```
src/
├── pages/
│   └── dashboard/
│       ├── DashboardHome.tsx          (refatorar — dividir por role)
│       ├── Perfil.tsx                 (✅ existe)
│       ├── Leads.tsx                  (✅ existe)
│       ├── Usuarios.tsx               (✅ existe)
│       ├── MeusCursos.tsx             (🟡 melhorar)
│       ├── CursoDetalhe.tsx           (criar)
│       ├── Frequencia.tsx             (criar)
│       ├── Notas.tsx                  (criar)
│       ├── Materiais.tsx              (criar)
│       ├── Matriculas.tsx             (criar)
│       ├── CursosAdmin.tsx            (criar)
│       ├── Avisos.tsx                 (criar)
│       ├── Calendario.tsx             (criar)
│       ├── Documentos.tsx             (criar)
│       ├── Financeiro.tsx             (criar)
│       └── ComingSoon.tsx             (✅ existe — usar temporariamente)
│
├── components/
│   ├── ui/                            (✅ Shadcn — manter)
│   │
│   ├── dashboard/                     (criar pasta nova)
│   │   ├── KpiCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── EmptyState.tsx
│   │   └── PageHeader.tsx
│   │
│   ├── cursos/
│   │   ├── CursoCard.tsx
│   │   ├── ModuloAccordion.tsx
│   │   ├── AulaItem.tsx
│   │   └── ProgressoCurso.tsx
│   │
│   ├── frequencia/
│   │   ├── FrequenciaChart.tsx
│   │   ├── LancarFrequencia.tsx
│   │   └── HistoricoFrequencia.tsx
│   │
│   ├── notas/
│   │   ├── TabelaNotas.tsx
│   │   ├── LancarNotas.tsx
│   │   └── BoletimModal.tsx
│   │
│   ├── avisos/
│   │   ├── AvisoCard.tsx
│   │   ├── AvisosFeed.tsx
│   │   └── NovoAvisoModal.tsx
│   │
│   ├── financeiro/
│   │   ├── MensalidadesTabela.tsx
│   │   ├── ReceitaDespesaChart.tsx
│   │   └── KpiFinanceiro.tsx
│   │
│   └── certificados/
│       ├── CertificadoTemplate.tsx
│       └── EmitirCertificadoForm.tsx
```

---

## 8. ROADMAP DE IMPLEMENTAÇÃO

### Sprint 3 — Dashboard por Role + Módulos Core (Em andamento)

| # | Tarefa | Status |
|---|--------|--------|
| 1 | Refatorar `DashboardHome` → 3 views separadas por role | ✅ Concluído |
| 2 | Criar `KpiCard.tsx` reutilizável (admin, professor, aluno) | ✅ Concluído |
| 3 | Criar `Matriculas.tsx` com aprovação/recusa e modal de detalhe | ✅ Concluído |
| 4 | Criar `Avisos.tsx` + `AvisoCard` + `NovoAvisoModal` + RLS Supabase | ✅ Concluído |
| 5 | SQL: tabela `avisos` com políticas RLS completas | ✅ Concluído |
| 6 | Implementar `MeusCursos` com progresso real (barras, módulos, aulas) | 🟡 Próximo |
| 7 | SQL: tabelas `cursos`, `modulos`, `aulas`, `progresso_aluno` | 🟡 Próximo |

### Sprint 4 — Módulos Acadêmicos Avançados (Semanas 5–8)

| # | Tarefa | Status |
|---|--------|--------|
| 8  | `Frequencia.tsx` — view aluno (histórico) + lançamento professor | 🔴 Pendente |
| 9  | `Notas.tsx` — tabela de notas aluno + formulário professor | 🔴 Pendente |
| 10 | `CursosAdmin.tsx` — CRUD completo com módulos reordenáveis | 🔴 Pendente |
| 11 | `Materiais.tsx` — upload para Supabase Storage | 🔴 Pendente |
| 12 | `NotificacoesDropdown` — badge no header + dropdown de não lidas | 🔴 Pendente |

### Sprint 5 — Calendário, Financeiro e Certificados (Semanas 9–12)

| # | Tarefa | Status |
|---|--------|--------|
| 13 | `Calendario.tsx` com react-big-calendar | 🔴 Pendente |
| 14 | `Certificados.tsx` com geração em PDF + código de validação | 🔴 Pendente |
| 15 | `Financeiro.tsx` / `Pagamentos.tsx` com Recharts | 🔴 Pendente |
| 16 | Busca global no header | 🔴 Pendente |

### Sprint 6 — Pós-lançamento

| # | Tarefa | Status |
|---|--------|--------|
| 17 | Chat/Comunidade em tempo real (Supabase Realtime) | 🔴 Pendente |
| 18 | PWA + notificações push | 🔴 Pendente |
| 19 | Relatórios exportáveis (PDF/Excel) | 🔴 Pendente |
| 20 | App mobile (React Native / Expo) | 🔴 Pendente |

---

## 9. CHECKLIST DE O QUE COPIAR DO EDUC

| Módulo EDUC | Arquivo Vue | Equivalente ITEC | Status |
|---|---|---|---|
| Dashboard Aluno | `index2.vue` | `DashboardHome → AlunoView` | ✅ Feito |
| Dashboard Professor | `index3.vue` | `DashboardHome → ProfessorView` | ✅ Feito |
| Dashboard Admin | `index1.vue` | `DashboardHome → AdminView` | ✅ Feito |
| KPI Widgets | `index1/Widget.vue` | `KpiCard.tsx` | ✅ Feito |
| Matrículas | `StudentList.vue` | `Matriculas.tsx` | ✅ Feito |
| Mural Avisos | `NoticeBoard.vue` | `Avisos.tsx` + `AvisoCard.tsx` | ✅ Feito |
| Meus Cursos | `StudentDetails.vue` | `MeusCursos.tsx` / `CursoDetalhe.tsx` | 🟡 Parcial |
| Gestão de Cursos | `ClassList.vue` | `CursosAdmin.tsx` | 🟡 Parcial |
| Frequência Aluno | `StudentAttendance.vue` | `Frequencia.tsx` | 🔴 Pendente |
| Lançar Notas | `ExamResult.vue` | `Notas.tsx` | 🔴 Pendente |
| Materiais | `Library.vue` | `Materiais.tsx` | 🔴 Pendente |
| Calendário | `Event.vue` | `Calendario.tsx` | 🔴 Pendente |
| Certificados | `Certificate.vue` | `Certificados.tsx` | 🔴 Pendente |
| Financeiro Admin | `FeesCollection.vue` | `Financeiro.tsx` | 🔴 Pendente |
| Horários | `TeacherTimetable.vue` | `Agenda.tsx` | 🔴 Pendente |
| Gráficos | `RevenueStatic.vue` | `ReceitaDespesaChart.tsx` | 🔴 Pendente |
| Tabelas | `StudentTable.vue` | `DataTable.tsx` (reutilizável) | 🔴 Pendente |

---

## 10. DECISÕES DE DESIGN

### Por que Shadcn UI em vez de Bootstrap (EDUC)?
- Já instalado no ITEC
- Headless — mais flexível com Tailwind
- TypeScript-first
- Componentes acessíveis (ARIA)
- Estética mais moderna

### Por que Recharts em vez de ApexCharts (EDUC)?
- Já instalado no ITEC
- React-native — sem jQuery
- Mais leve
- API declarativa (JSX)

### Por que Supabase Storage em vez de S3?
- Já configurado no projeto
- Interface unificada com o banco
- Gratuito até 1GB (suficiente para PDFs e apostilas)
- S3 pode ser integrado via Supabase custom storage se necessário no futuro

### Por que manter React (não migrar para Vue)?
- ITEC já tem base sólida em React
- Equipe já conhece a stack
- Shadcn UI não existe para Vue
- Migrar agora seria retrabalho sem benefício

---

*Documento criado em 2026-04-21 como guia de integração EDUC → ITEC EAD.*  
*Referência: `e:\_HELIOJR\SAAS\EDUC` (template fonte) + `E:\_HELIOJR\ITEC\itec-ead` (projeto destino)*
