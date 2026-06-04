# Matriz de Acessos por Role — ITEC-EAD
**Gerado por:** Agentes 14 (Auditor) + 19 (Analista de Produto) + 18 (Doc Writer)
**Data:** 2026-06-04
**Versão do sistema:** pós-Sprint N

---

## Como ler esta matriz

- ✅ **Implementado e funcional**
- 🔜 **ComingSoon (rota existe, conteúdo em desenvolvimento)**
- ❌ **Sem acesso / não listado no menu**
- ⚠️ **Acessível por URL direta mesmo sem menu** (risco — ver Seção 3)
- 🔒 **Protegido por RLS no banco — dados filtrados automaticamente**

---

## Seção 1 — Menus visíveis por role (sidebar)

| Menu / Funcionalidade | superadmin | admin | administracao | financeiro | professor | aluno |
|---|---|---|---|---|---|---|
| Dashboard | ✅ completo | ✅ completo | ✅ completo | ✅ limitado | ✅ limitado | ✅ limitado |
| **Gestão de Alunos** | | | | | | |
| Alunos (lista + ficha) | ❌ menu | ❌ menu | ✅ | ❌ | ❌ | ❌ |
| Ficha do Aluno | ❌ menu | ❌ menu | ✅ via lista | ❌ | ❌ | ❌ |
| Nova Matrícula | ❌ menu | ❌ menu | ✅ | ❌ | ❌ | ❌ |
| Matrículas | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Convalidações | ❌ menu | ❌ menu | ✅ | ❌ | ❌ | ❌ |
| **Gestão Acadêmica** | | | | | | |
| Turmas | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cursos (admin) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Painel Admin | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Gestão de Professores** | | | | | | |
| Professores | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Equipe ITEC | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Calendário** | | | | | | |
| Calendário Acadêmico | ✅ editável | ✅ editável | ✅ editável | ❌ | ✅ leitura | ✅ leitura |
| **Financeiro** | | | | | | |
| Financeiro | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Leads / Marketing** | | | | | | |
| Leads | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Usuários e Segurança** | | | | | | |
| Gestão de Usuários | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Notificações | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Segurança & LGPD | ✅ 🔜 | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Professor (área própria)** | | | | | | |
| Minhas Disciplinas | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Meus Alunos | ❌ | ❌ | ❌ | ❌ | 🔜 | ❌ |
| Frequência | ❌ | ❌ | ❌ | ❌ | 🔜 | ❌ |
| Notas (professor) | ❌ | ❌ | ❌ | ❌ | 🔜 | ❌ |
| Materiais de Aula | ❌ | ❌ | ❌ | ❌ | 🔜 | ❌ |
| Avaliações (professor) | ❌ | ❌ | ❌ | ❌ | 🔜 | ❌ |
| Meus Contratos | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Aluno (área própria)** | | | | | | |
| Meus Cursos | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Minhas Notas | ❌ | ❌ | ❌ | ❌ | ❌ | 🔜 |
| Minha Frequência | ❌ | ❌ | ❌ | ❌ | ❌ | 🔜 |
| Meus Certificados | ❌ | ❌ | ❌ | ❌ | ❌ | 🔜 |
| Documentos | ❌ menu | ✅ via ficha | ❌ menu | ❌ | ❌ | 🔜 |
| Pagamentos | ❌ | ❌ | ❌ | ❌ | ❌ | 🔜 |
| Suporte | ❌ | ❌ | ❌ | ❌ | ❌ | 🔜 |
| **Comunicação** | | | | | | |
| Avisos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatórios | ❌ | ❌ | 🔜 | ❌ | ❌ | ❌ |
| **Perfil** | | | | | | |
| Configurações / Perfil | ✅ | ❌ menu | ✅ | ✅ | ✅ | ✅ |

---

## Seção 2 — Ações visíveis por role nas páginas principais

| Ação / Botão | superadmin | admin | administracao | professor | aluno |
|---|---|---|---|---|---|
| **Calendário** | | | | | |
| Ver eventos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar/editar evento | ✅ | ✅ | ✅ | ❌ | ❌ |
| Excluir evento | ✅ | ✅ | ✅ | ❌ | ❌ |
| Adicionar ao Google Calendar | ✅ | ✅ | ✅ | ✅ | ✅ |
| Filtro por turma | ✅ | ✅ | ✅ | ❌ (auto) | ✅ |
| **Ficha do Aluno** | | | | | |
| Ver dados pessoais | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver histórico acadêmico | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver observações internas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver documentos/impressões | ✅ | ✅ | ✅ | ❌ | ❌ |
| Aprovar matrícula | ✅ | ✅ | ✅ | ❌ | ❌ |
| Editar observações | ✅ | ✅ | ✅ | ❌ | ❌ |
| Upload/trocar foto | ✅ | ✅ | ✅ | ❌ | ❌ |
| Declaração de Matrícula PDF | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Turmas (Gestão)** | | | | | |
| Criar/editar turma | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver alunos da turma | ✅ | ✅ | ✅ | ❌ | ❌ |
| Imprimir lista de alunos | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Dashboard KPIs** | | | | | |
| Widget alunos em risco | ✅ | ✅ | ✅ | ❌ | ❌ |
| KPIs completos | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Gestão de Usuários** | | | | | |
| Trocar role de qualquer usuário | ✅ | ✅¹ | ✅¹ | ❌ | ❌ |
| Solicitar exclusão | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver fila de exclusões | ✅ | ❌ | ❌ | ❌ | ❌ |

¹ Limitado por `getRolesPermitidas()` — admin/administracao não pode trocar role para superadmin.

---

## Seção 3 — Inconsistências encontradas

### 🔴 CRÍTICO

| # | Problema | Role afetado | Severidade | Fix sugerido |
|---|---|---|---|---|
| I-01 | **Sem proteção por role nas rotas** — qualquer usuário autenticado pode acessar `/dashboard/financeiro`, `/dashboard/usuarios`, `/dashboard/alunos` digitando a URL. O `ProtectedRoute` apenas verifica autenticação, não role. | Todos | 🔴 ALTO | Adicionar guarda de role nas rotas sensíveis ou dentro dos componentes |
| I-02 | **Rota duplicada** — `App.tsx` define `/dashboard/financeiro` duas vezes (linha 129: `FinanceiroPage` e linha 135: `ComingSoon`). A segunda nunca é atingida. | admin/financeiro | 🟡 MÉDIO | Remover a linha 135 (ComingSoon de financeiro) |

### 🟠 ALTO

| # | Problema | Role afetado | Severidade | Fix sugerido |
|---|---|---|---|---|
| I-03 | **superadmin não tem "Alunos" no menu** — tem "Usuários" mas não "Alunos" (`/dashboard/alunos` com ficha completa). Precisa digitar a URL. | superadmin | 🟠 ALTO | Adicionar "Alunos" ao menu do superadmin (ou remapear "Usuários" para incluir fichas) |
| I-04 | **admin não tem "Alunos" no menu** — mesma situação do superadmin. | admin | 🟠 ALTO | Adicionar "Alunos" ao menu do admin |
| I-05 | **Rol `financeiro` sem proteção de conteúdo** — usuário financeiro pode digitar `/dashboard/alunos` e ver a lista de alunos. RLS protege os dados sensíveis (CPF, etc.) mas a UI é visível. | financeiro | 🟠 ALTO | Criar `FinanceiroDashboard` dedicado ou adicionar guards nos componentes sensíveis |

### 🟡 MÉDIO

| # | Problema | Role afetado | Severidade | Fix sugerido |
|---|---|---|---|---|
| I-06 | **"Minhas Notas" no menu do aluno → ComingSoon** — aluno clica e vê "em breve". O histórico acadêmico existe mas só na ficha do aluno (área da secretaria, não do aluno). | aluno | 🟡 MÉDIO | Sprint P: criar `/dashboard/minhas-notas` com visão do próprio histórico |
| I-07 | **"Minha Frequência" → ComingSoon** — igual ao I-06. O dado existe mas não há tela para o aluno. | aluno | 🟡 MÉDIO | Sprint P: criar visão de frequência própria |
| I-08 | **"Documentos" no menu do aluno → ComingSoon** — mas está no menu. Transmite expectativa que não é atendida. | aluno | 🟡 MÉDIO | Remover do menu do aluno até estar pronto, ou implementar no Sprint P |
| I-09 | **"Pagamentos" → ComingSoon** — aluno vê no menu. | aluno | 🟡 MÉDIO | Remover do menu ou implementar mensagem mais honesta |
| I-10 | **"Suporte" → ComingSoon** — aluno vê no menu. | aluno | 🟢 BAIXO | Pode ser email/WhatsApp da secretaria por ora |
| I-11 | **`/dashboard/notas/:turmaId/:disciplinaId` — rota existe mas sem menu** — ConsolidadoNotas para admin não tem link de entrada. | admin/superadmin | 🟡 MÉDIO | Adicionar botão no GestaoTurmas ou FichaAluno (LICAO-005) |
| I-12 | **"Configurações" ausente do menu `admin`** — superadmin tem, administracao tem, professor tem, aluno tem — admin não tem. | admin | 🟡 MÉDIO | Adicionar `/dashboard/perfil` ao menu do admin |
| I-13 | **`administracao` tem "Gestão de Usuários"** — secretaria pode trocar roles de qualquer usuário. Pode ser poder excessivo para a Camila. | administracao | 🟡 MÉDIO | Avaliar se Camila deve poder mudar roles ou apenas ver. Considerar remover do menu `administracao` |

### 🟢 BAIXO

| # | Problema | Role afetado | Severidade | Fix sugerido |
|---|---|---|---|---|
| I-14 | **Professor vê menu "Meus Alunos", "Frequência", "Notas", "Materiais", "Avaliações" — todos ComingSoon** | professor | 🟢 BAIXO | Sprints futuros; manter ComingSoon informativo |
| I-15 | **"Relatórios" no menu administracao → ComingSoon** — ok para agosto (Sprint P) | administracao | 🟢 BAIXO | Sprint P: implementar |
| I-16 | **"Meus Certificados" → ComingSoon** | aluno | 🟢 BAIXO | Sprint O |

---

## Seção 4 — RLS vs UI (verificação de consistência)

| Verificação | Status | Observação |
|---|---|---|
| Aluno vê só seus dados | ✅ | RLS em `profiles`, `matriculas`, `notas_aluno`, `frequencia` filtra por `auth.uid()` |
| Professor vê só suas turmas no calendário | ✅ | `getAulasRecorrentes(undefined, professorId)` filtra no banco |
| Professor pode lançar frequência de outras turmas? | ⚠️ | RLS permite professor lançar em qualquer disciplina — não restringe por contrato |
| `administracao` pode editar dados de qualquer aluno | ✅ | Por design — secretaria precisa desse acesso |
| Financeiro vê mensalidades de todos os alunos | ✅ | Por design — precisa para controle financeiro |
| Aluno pode ver dados de outros alunos? | ✅ Não | RLS bloqueia no banco; UI não tem tela para isso |
| `financeiro` pode acessar dados acadêmicos via URL | ⚠️ | I-05 acima — UI acessível mas RLS limita dados |

---

## Seção 5 — Credenciais de teste disponíveis

| Role | Email | Senha | Existe no banco? |
|---|---|---|---|
| superadmin | heliopaiva@gmail.com | (própria) | ✅ |
| administracao | secretaria@itecedu.com | Itec@2026 | ✅ criada via SQL (agente-Osabio) |
| professor | prof1@itecedu.com até prof5@ | Itec@2026 | ✅ seed_testes.sql |
| aluno | aluno1@itecedu.com até aluno10@ | Itec@2026 | ✅ seed_testes.sql |
| admin | ❌ não existe | — | ❌ **FALTA** |
| financeiro | ❌ não existe | — | ❌ **FALTA** |

---

## Seção 6 — Resumo executivo (linguagem simples)

### O que cada role pode fazer hoje

**superadmin (Hélio):** Acesso total. Vê e faz tudo. Único que pode solicitar exclusão de usuários e ver fila de exclusões. **Gap:** não tem "Alunos" no menu (só "Usuários") — para chegar à ficha do aluno precisa digitar a URL.

**admin (Diretoria):** Quase tudo — igual ao superadmin exceto: não pode excluir usuários, não vê Equipe ITEC. **Gap:** não tem "Alunos" no menu, não tem "Configurações" no menu.

**administracao / Camila (secretaria):** Foco operacional — alunos, matrículas, turmas, professores, financeiro, calendário, leads. Pode aprovar matrículas, gerar declaração PDF, ver histórico do aluno. **Gap:** "Relatórios" ainda em desenvolvimento.

**financeiro (Hugo):** Menu muito limitado — apenas Dashboard + Financeiro + Avisos. Pode gerenciar mensalidades. Sem acesso a dados acadêmicos pelo menu (mas pode via URL — ver I-05).

**professor:** Vê suas disciplinas, alunos, contratos e o calendário (somente leitura). A maioria das features de lançamento (notas, frequência) exibe "em breve" — requer acesso à URL específica com `disciplinaId`/`turmaId`. **Gap principal:** não há lista de disciplinas ativas com links diretos para lançar notas/frequência (WARN-UX-003).

**aluno:** Vê seus cursos matriculados. Boa parte das features (Minhas Notas, Minha Frequência, Certificados, Documentos, Pagamentos) ainda exibe "em breve". O histórico acadêmico existe mas só a secretaria/professor consegue ver.

### Prioridade de fixes (antes do lançamento de agosto)

| Prioridade | Fix | Por que importa |
|---|---|---|
| 🔴 P0 | I-01: Adicionar guards de role em rotas sensíveis | Qualquer aluno pode acessar `/dashboard/financeiro` pela URL |
| 🔴 P0 | I-02: Remover rota duplicada de financeiro | Bug silencioso no Router |
| 🟠 P1 | I-03 + I-04: Adicionar "Alunos" ao menu de superadmin e admin | Hélio e diretoria não conseguem acessar fichas pelo menu |
| 🟠 P1 | I-12: Adicionar "Configurações" ao menu admin | Admin não consegue atualizar o próprio perfil |
| 🟡 P2 | I-06 + I-07: Criar visão de notas/frequência para o aluno | Aluno precisa ver seus dados — hoje são ComingSoon |
| 🟡 P2 | I-08 + I-09: Remover do menu do aluno o que ainda é ComingSoon | Reduz frustração do aluno com "em breve" em tudo |
| 🟢 P3 | I-13: Avaliar se secretaria deve ter "Gestão de Usuários" | Decisão do Hélio |

---

*Gerado pelos Agentes 14, 19 e 18 · ITEC-EAD · 2026-06-04*
*Próxima revisão: pós-Sprint RLS*
