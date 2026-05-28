# Auditoria de Dashboard — CRUD e Funcionalidade
**Projeto:** ITEC EAD
**Auditor:** Agente 14
**Data:** 2026-05-27
**Escopo:** Todos os módulos do dashboard

---

## Tabela Completa de Módulos

| Módulo | Role | Criar | Editar | Deletar | Form | Banco | Status |
|--------|------|-------|--------|---------|------|-------|--------|
| **Usuarios.tsx** | admin | ❌ | ✅ | ❌ | ✅ modal | ✅ | 🟡 |
| **CursosAdmin.tsx** | admin | ❌ | ✅ | ❌ | ✅ modal | ✅ | 🟡 |
| **PainelAdmin.tsx** | admin | ❌ | ❌ | ❌ | ✅ rejeitar | ✅ | 🟡 |
| **Convalidacoes.tsx** | administracao | ✅ | ❌ | ❌ | ✅ modal | ✅ | 🟡 |
| **NovaMatricula.tsx** | administracao | ✅ | ❌ | ❌ | ✅ stepper | ✅ | 🟢 |
| **Matriculas.tsx** | administracao | ❌ | ✅ status | ❌ | ✅ modal | ✅ | 🟢 |
| **Financeiro.tsx** | administracao | ✅ gerar | ✅ pagar | ❌ | ✅ modal | ✅ | 🟢 |
| **Leads.tsx** | administracao | ❌ | ❌ | ❌ | ❌ | ✅ | 🟡 |
| **Avisos.tsx** | professor+ | ✅ | ❌ | ✅ | ✅ modal | ✅ | 🟡 |
| **ProfessorHome.tsx** | professor | ❌ | ❌ | ❌ | ❌ | ✅ leitura | 🟡 |
| **LancarFrequencia.tsx** | professor | ✅ | ✅ | ❌ | ✅ checklist | ✅ | 🟢 |
| **VerTurma.tsx** | professor | ❌ | ❌ | ❌ | ❌ | ✅ leitura | 🟢 |
| **ContratoForm.tsx** | professor | ❌ | ✅ | ❌ | ✅ campos | ✅ | 🟢 |
| **MeusCursos.tsx** | aluno | ❌ | ❌ | ❌ | ❌ | ✅ leitura | 🟢 |
| **Perfil.tsx** | todos | ❌ | ✅ | ❌ | ✅ campos | ✅ | 🟢 |
| **DashboardHome.tsx** | todos | ❌ | ❌ | ❌ | ❌ | ✅ KPIs | 🟢 |

### ComingSoon (placeholders sem função)
| Módulo | Role | Status |
|--------|------|--------|
| /dashboard/ao-vivo | aluno | 🔴 placeholder |
| /dashboard/comunidade | aluno | 🔴 placeholder |
| /dashboard/eventos | aluno | 🔴 placeholder |
| /dashboard/documentos | aluno | 🔴 placeholder |
| /dashboard/pagamentos | aluno | 🔴 placeholder |
| /dashboard/suporte | aluno | 🔴 placeholder |
| /dashboard/turmas | professor | 🔴 placeholder |
| /dashboard/materiais | professor | 🔴 placeholder |
| /dashboard/avaliacoes | professor | 🔴 placeholder |
| /dashboard/agenda | professor | 🔴 placeholder |
| /dashboard/notificacoes | admin | 🔴 placeholder |
| /dashboard/seguranca | admin | 🔴 placeholder |

---

## Detalhamento por módulo

### Usuarios.tsx 🟡
- **Editar:** ✅ modal com nome, telefone e role — conectado a `updateUsuario()` e `updateRole()`
- **Criar:** ❌ não há botão "Criar usuário" — novos usuários só entram via cadastro público
- **Deletar:** ❌ não há exclusão — correto por política (profiles são permanentes)
- **Detalhe:** sem paginação — `getUsuarios()` retorna todos sem LIMIT (DT-05 conhecido)

### CursosAdmin.tsx 🟡
- **Editar:** ✅ modal completo com nome, carga horária, área, tipo, pré-requisitos + rollback
- **Criar:** ❌ não há botão "Nova Disciplina" — disciplinas são da grade fixa (seed)
- **Deletar:** ❌ não há exclusão — correto (disciplinas fazem parte da estrutura acadêmica)
- **Fallback:** usa dados locais (`src/data/disciplinas.ts`) se banco não existir — banner amarelo

### PainelAdmin.tsx 🟡
- **Convalidações:** ✅ aprovar/rejeitar com modal de motivo obrigatório
- **Exceções pré-req:** ✅ aprovar/negar (visível apenas para superadmin)
- **Detalhe:** aprovação de convalidação também chama `atualizarStatusDisciplina('convalidado')` ✅
- **Faltando:** nomes reais dos alunos — exibe `disciplina_id` UUID em vez de nome da disciplina

### Convalidacoes.tsx 🟡
- **Criar:** ✅ modal com aluno (por email), disciplina (por código), instituição, carga horária
- **Encaminhar:** ✅ muda `coordenador_responsavel` para encaminhar ao admin
- **Faltando:** lista de alunos e disciplinas como select (hoje requer código/email manual)
- **Faltando:** rejeição pela secretaria (sem o motivo — só encaminhar)

### NovaMatricula.tsx 🟢
- **Criar:** ✅ stepper 3 etapas: dados, documentos, confirmação
- **Upload docs:** ✅ Supabase Storage
- **Conectado:** ✅ cria `matriculas` + `taxa_matricula` via services

### Matriculas.tsx 🟢
- **Aprovar/Rejeitar:** ✅ modal com observação + `updateStatusMatricula()`
- **Paginação:** ✅ 20/página por tab com filtro por status
- **Detalhe:** role do aluno não é alterado para `aluno` na aprovação — gap funcional

### Financeiro.tsx 🟢
- **Gerar mensalidades:** ✅ com mês, valor e vencimento
- **Registrar pagamento:** ✅ modal com data, upload comprovante
- **Inadimplentes:** ✅ lista com expandir para ver mensalidades atrasadas
- **E-mail de cobrança:** 🔴 botão existe mas é mock (sem envio real)

### Leads.tsx 🟡
- **Leitura:** ✅ paginado, busca server-side (ilike), exportar CSV da página atual
- **Criar:** ❌ não necessário (leads vêm do formulário público)
- **Deletar lead:** ❌ não há — correto por política LGPD

### Avisos.tsx 🟡
- **Criar:** ✅ modal completo com título, mensagem, destinatário, fixar, expiração
- **Editar:** ❌ não há edição após publicado
- **Deletar:** ✅ botão de exclusão por aviso

### ProfessorHome.tsx 🟡
- **Leitura:** ✅ lista disciplinas ativas com indicador de alunos em risco
- **Criar professor:** ❌ admin precisa criar via Usuarios.tsx — correto por fluxo
- **Detalhe:** botão "Meus Contratos" navega para rota genérica sem contratoId

### LancarFrequencia.tsx 🟢
- **Criar/Editar:** ✅ upsert por data — sobrescreve se já existe
- **Data picker:** ✅ `max=hoje` impede datas futuras
- **Nome aluno:** ✅ join com `profiles.full_name` (fix DT-08)

### VerTurma.tsx 🟢
- **Leitura:** ✅ tabela com filtros (todos/risco/ok), exportar CSV com nome real
- **Não editável:** correto — frequência é lançada na página dedicada

### ContratoForm.tsx 🟢
- **Preencher:** ✅ formulário com todos os campos do professor
- **PDF:** ✅ `PDFDownloadLink` com `@react-pdf/renderer` — 4 cláusulas, assinaturas
- **Status:** ✅ muda para `impresso` após download

### MeusCursos.tsx 🟢
- **Leitura:** ✅ disciplinas do módulo atual, frequência, materiais, alertas
- **Eletivas:** ✅ listadas separadamente
- **Pré-requisitos:** ✅ alerta de faltantes no card

### Perfil.tsx 🟢
- **Editar:** ✅ nome, telefone, bio — conectado a `updatePerfil()`
- **Avatar:** botão Camera existe mas upload não funciona (sem handler)

---

## 🔴 Crítico — sem isso não dá para operar

1. **Matriculas.tsx — aprovação não muda role para `aluno`**
   - Quando a secretaria aprova uma matrícula, `updateStatusMatricula('ativo')` é chamado
   - Mas o `profiles.role` do aluno permanece `'pendente'` → usuário fica em `/aguardando`
   - **Fix:** chamar `updateRole(alunoId, 'aluno')` após aprovar matrícula
   - Esforço: **30 minutos**

2. **PainelAdmin — exibe UUID em vez de nome da disciplina**
   - `conv.disciplina_id` é exibido direto — UUID ilegível para o admin
   - **Fix:** join com `disciplinas_v2` via `getDisciplinaPorCodigo` ou exibir código
   - Esforço: **1 hora**

---

## 🟠 Alto — importante para o fluxo principal

3. **Perfil.tsx — botão Camera sem função**
   - Upload de foto de perfil inexistente — botão visível mas sem handler
   - **Fix:** `supabase.storage.upload()` + atualizar `foto_url` no profile
   - Esforço: **2 horas**

4. **Avisos.tsx — sem edição após publicar**
   - Professor/admin publica aviso errado → não pode corrigir
   - **Fix:** botão editar + `updateAviso()` no `avisos.service`
   - Esforço: **2 horas**

5. **ProfessorHome — "Meus Contratos" navega para rota sem ID**
   - `/dashboard/professor/contrato` sem `:contratoId` → erro de parâmetro
   - **Fix:** listar contratos do professor e deixar usuário escolher
   - Esforço: **1 hora**

6. **Financeiro — e-mail de cobrança é mock**
   - Botão "E-mail" existe na lista de inadimplentes mas não envia
   - **Fix parcial:** integrar Resend ou mailto: link como fallback
   - Esforço: **1-4 horas** (depende do provider)

---

## 🟡 Médio — melhoria de UX

7. **Convalidacoes — requer código/email manual**
   - Formulário pede email do aluno e código da disciplina como texto livre
   - Melhor: select com autocomplete
   - Esforço: **3 horas**

8. **Usuarios.tsx — sem LIMIT** (DT-05 conhecido)
   - `getUsuarios()` retorna todos sem paginação
   - Esforço: **1 hora**

9. **Placeholders ComingSoon (12 módulos)**
   - Módulos acadêmicos do aluno (documentos, eventos, certificados)
   - Módulos do professor (turmas, materiais, avaliações, agenda)
   - Cada um: 4-16 horas de desenvolvimento

---

## Estimativa de esforço

| Prioridade | Item | Esforço |
|---|---|---|
| 🔴 | Aprovar matrícula → muda role para aluno | 30 min |
| 🔴 | PainelAdmin — nome da disciplina em vez de UUID | 1h |
| 🟠 | Upload de foto de perfil | 2h |
| 🟠 | Editar aviso | 2h |
| 🟠 | ProfessorHome → contratos (navegar para lista) | 1h |
| 🟠 | E-mail cobrança (mailto: fallback) | 1h |
| 🟡 | Paginação em Usuarios.tsx | 1h |
| 🟡 | Convalidações com autocomplete | 3h |
| **Total crítico + alto** | | **~10h** |
| **Total incluindo médio** | | **~21h** |

---

*Relatório gerado pelo Agente 14 — auditoria de dashboard CRUD*
*Nenhum arquivo de código foi modificado*
