# IDEAS-BACKLOG.md — ITEC-EAD
# Ideias e Melhorias Futuras
# Última atualização: 2026-06-10

Este documento registra todas as ideias, melhorias e funcionalidades discutidas durante as sessões de desenvolvimento que ainda não foram implementadas ou aprovadas para implementação imediata.

---

## 1. CALENDÁRIO ACADÊMICO

### 1.1 Eventos Recorrentes
**Descrição**: Permitir criação de eventos com repetição (diário, semanal, mensal, anual).  
**Exemplo**: Culto semanal toda quarta às 19h, reunião mensal de professores.  
**Prioridade**: Média  
**Versão alvo**: V2 (Setembro/Outubro 2026)  
**Status**: Planejado  

### 1.2 Eventos com Intervalo de Datas
**Descrição**: Evento com data_inicio + data_fim (atualmente só permite data única).  
**Exemplo**: Semana de provas (03/09 a 07/09), Retiro espiritual (15/11 a 17/11).  
**Prioridade**: Média  
**Versão alvo**: V2 (Setembro/Outubro 2026)  
**Status**: Planejado  

### 1.3 Duplicar Evento Existente
**Descrição**: Botão "Duplicar" para copiar evento existente e editar rapidamente.  
**Benefício**: Agiliza criação de eventos similares (ex: provas de módulos diferentes).  
**Prioridade**: Baixa  
**Versão alvo**: V3 (2027)  
**Status**: Planejado  

### 1.4 Seleção Múltipla de Datas
**Descrição**: Permitir selecionar múltiplas datas não consecutivas no calendário.  
**Exemplo**: Feriados municipais esparsos, datas de reposição de aula.  
**Prioridade**: Baixa  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  

---

## 2. PAINEL DE CONTROLE DE ACESSO

### 2.0 [SPRINT] Material do professor — tela + escrita restrita à cadeira do contrato
**Descrição**: Fecha a **outra metade do SEC-04** (report-B). Hoje professor só LÊ material (migração 055); a escrita é de admin/superadmin/administracao. Falta o professor **subir material e o manual da SUA cadeira**.
**Solução técnica**: (a) tela no painel do professor para gerir materiais das disciplinas dele; (b) policy de Storage de WRITE (`materiais-disciplina`) restrita à cadeira do **contrato ativo** — cruzar `contratos_professor`/`CONTRATO_ATIVO` (decisão C) com o `disciplinaId` do path (`foldername[1]`), via função SECURITY DEFINER análoga à `aluno_ve_disciplina`.
**Dependências**: contratos de professor cadastrados (ERR-DATA-F2) — mesma trava da migração 037 §2.
**Prioridade**: Média (não bloqueia agosto — admin/secretaria já sobem material)
**Versão alvo**: pós-agosto (sprint próprio, com UI)
**Status**: ✅ CONCLUÍDO (2026-07-08, migração 056 + PR `feat/material-professor`) — tela "Meus Materiais" + `professor_leciona_disciplina` + bucket `contratos-professor`. SEC-04 fechado por completo.
**Origem**: report-B SEC-04; migração 055 fez a parte de `administracao`.

### 2.05 [SPRINT — ALICERCE] Roster do professor: `get_alunos_operacional(disciplina_id)`
**Descrição**: **Não existe** nenhuma função que liste os alunos **matriculados** de uma disciplina com o nome. Cadeia necessária: `matriculas_disciplina` (não tem `aluno_id`) → `matriculas` (`aluno_id`) → `profiles` (nome). Hoje as telas de **Frequência** (`LancarFrequencia`) e **Notas** (`LancarNotas`/`VerTurma`) montam a lista de alunos a partir de **registros de frequência/nota já existentes** — então **turma nova abre VAZIA** (problema do ovo-e-galinha: precisa de registro para ver aluno, precisa ver aluno para criar registro).
**Solução técnica**: função `get_alunos_operacional(disciplina_id)` — SECURITY DEFINER, gateada por `professor_leciona_disciplina` (já existe, 056), retornando SÓ campos operacionais (`id, full_name, email, avatar_url`) dos alunos matriculados. Telas de Frequência/Notas/VerTurma passam a semear o roster por ela (LICAO-026: query separada + merge).
**Por que é o alicerce**: destrava **três** frentes de uma vez — (1) **Meus Alunos** do professor (roster real); (2) **Frequência/Notas usáveis** com dados reais (fim do "abre vazia"); (3) **LGPD-01 fase 1** (professor obtém nomes SEM acesso à PII de `profiles`, permitindo depois remover `professor` de `profiles_select_staff` na fase 2).
**Dependências**: migração (função). Dado: só mostra conteúdo após `matriculas_disciplina` populada (F1 — lançamento retroativo) e contratos de professor (F2).
**Prioridade**: ALTA — pré-requisito das ondas operacionais do professor + remediação LGPD-01.
**Versão alvo**: próxima onda do professor (antes de "Meus Alunos" e do endurecimento LGPD).
**Status**: Registrado — recomendação nº 1 do diagnóstico "Telas operacionais do professor" (2026-07-08).
**Origem**: diagnósticos LGPD-01 + Telas operacionais do professor.

### 2.06 [TELA] Meus Alunos do professor — construir do ZERO
**Descrição**: A tela **`MeusAlunos.tsx` NÃO existe** (em `src/pages/dashboard/` só há `Alunos.tsx`, que é a tela ADMIN de alunos, e `FichaAluno.tsx`). A rota `professor/alunos` é `ComingSoonPage`. Precisa ser **construída do zero** — não é reroteamento.
**Solução técnica**: tela que lista os alunos das disciplinas do professor via `get_alunos_operacional` (item 2.05) — com estado-vazio amigável quando não há matrícula na turma. Ponto de entrada: menu lateral (`Dashboard.tsx`) + card do `ProfessorHome`.
**Dependências**: **item 2.05** (`get_alunos_operacional`) é pré-requisito — sem ele, só daria para linkar ao `VerTurma` (que herda o mesmo gap de roster).
**Prioridade**: Média (depende do alicerce 2.05).
**Versão alvo**: onda do professor, após 2.05.
**Status**: Registrado — a "Onda 1 (reroteamento)" foi cancelada em 2026-07-08 porque a premissa ("tela já existe") era falsa; correto é construir com o roster.
**Origem**: diagnóstico Telas operacionais do professor (2026-07-08).

**Nota (menu Frequência):** o item de menu `professor/frequencia` (sem `:disciplinaId`) segue `ComingSoonPage` de propósito — o acesso real a `LancarFrequencia` já funciona pelo **card** do `ProfessorHome` (`professor/frequencia/:disciplinaId`). Uma tela-picker do menu só vale a pena junto do roster (2.05), senão abriria vazia. Decisão do Hélio (2026-07-08): deixar o menu como está por ora.

### 2.07 [ONDA — MIGRAÇÃO] Roster turma-aware para Notas
**Descrição**: A tela de Notas (`LancarNotas`) e o `getConsolidadoTurma` têm o mesmo gap de roster das telas de Frequência (turma sem nota lançada não mostra os alunos), **mas são escopo-TURMA** (`getConsolidadoTurma` filtra `turma_id`). O roster `get_alunos_operacional(disciplina_id)` (057) é **escopo-DISCIPLINA** — semear a tela de notas com ele **incluiria alunos de outra turma** da mesma disciplina.
**Solução técnica**: dar à função um `p_turma_id` (ou criar variante turma-aware) — filtrando pela cadeia `matriculas_disciplina → matriculas.turma_id`. Depois, semear `getConsolidadoTurma`/`LancarNotas` pelo roster (LICAO-026: merge por `aluno_id`). Cuidado: `getConsolidadoTurma` também alimenta `ConsolidadoNotas` — a mudança afeta as duas telas.
**Por que ficou de fora da onda "semear roster" (2026-07-09)**: LancarFrequencia/VerTurma são escopo-disciplina → o roster atual encaixou direto; Notas exige o filtro por turma, que é migração (novo parâmetro na função) — onda própria.
**Prioridade**: Média (o lançamento de notas ainda funciona para alunos que já têm nota; o gap é só o "abre vazia" da turma nova).
**Versão alvo**: onda do professor, com migração da função.
**Status**: ✅ **FEITO** (2026-07-11) — migração 058 (`p_turma_id DEFAULT NULL`) + código: `getConsolidadoTurma` refatorado para semear pelo roster turma-aware (`getAlunosOperacional(disciplinaId, turmaId)`); `LancarNotas`/`ConsolidadoNotas` intocados (mesmo shape `ConsolidadoAluno`). Turma sem nota deixa de abrir vazia. PR `feat/notas-turma-aware` merged. **Bônus LGPD-01 fase 2:** removido o embed `profiles!...` do `getConsolidadoTurma` — **caiu 1 dos 3 joins do professor a `profiles`; restam 2** (`frequencia.service:63` getFrequenciaByDisciplina e `frequencia.service:139` getAlunosAbaixoLimite).
**Origem**: SDD "Semear roster nas telas de Frequência/Notas" (2026-07-09) + Camada 1a (2026-07-11).

### 2.08 [MÓDULO] Frequência & Notas completo — fatiamento em Camadas 0/1/2/3
**Descrição**: Visão completa do Hélio: FREQUÊNCIA em grade tipo planilha (aluno × datas de aula, datas editáveis), marcação **PP/FP/FF** (presente / meia-falta / falta cheia), % automática, regra ITEC de faltas (>7 reprova; 4×FF=8), visão por turma E por cadeira (empilháveis), editável por professor/secretaria/coordenação, histórico desde o início, impressão. NOTAS: lista com colunas, média automática, impressão. Tudo acessível pelo MENU (seletor) além do card. Diagnóstico dimensionado em 2026-07-09.
**Estado atual (resumo do diagnóstico)**: registro por (aluno, disciplina, data) ✅ · PP/FP/FF ❌ (`presente` é BOOLEAN — precisa migração `tipo_presenca`) · tabela de "aulas" ❌ (a data vive no registro; `aulas_recorrentes` é agenda semanal, não instância) · consolidação de freq% sem trigger (manual/retroativo) · média simples no service (ponderada do D2 não implementada) · regra das 7 faltas ❌ (só a régua 75%) · **R02 Lista de Presença JÁ imprime grade alunos×datas (PDF/Excel, professor tem acesso)** · ConsolidadoNotas já é a lista com média · policies: professor SEM UPDATE de frequência (não corrige chamada); administracao SEM INSERT/UPDATE de nota; **SEC-06** (aluno pode inserir a própria nota — known-errors, 🔴 BLOQUEADOR).
**Fatiamento**:
- **Camada 0 — ✅ CONCLUÍDA (2026-07-10, migração 059)**: UPDATE de `frequencia` p/ professor (corrigir chamada / justificar falta) + `administracao` lança/corrige nota + **SEC-06 fechado** (aluno não insere mais a própria nota).
- **Camada 1 — ✅ COMPLETA (2026-07-12) — mínimo operável p/ AGOSTO (sem migração)**: Meus Alunos (roster 057) · Frequência/VerTurma semeadas pelo roster · **Notas turma-aware** (2.07, roster 058 no getConsolidadoTurma) · chamada por data + correção + % automática · **impressão R02** linkada no painel do professor (`feat/professor-imprimir-lista`) · **menu-picker** de disciplina p/ Frequência e Notas (`feat/professor-menu-picker` — os menus deixaram de ser ComingSoon). **→ O professor opera fim-a-fim: lança/corrige presença e nota, vê seus alunos, imprime a lista.**
- **Camada 2 — planilha completa (G; migração) — v1.1**: grade multi-data aluno×aulas com **PP/FP/FF** (`tipo_presenca` + backfill) + regra de faltas (✅ **D-FALTAS DEFINIDA** — Plano Mestre §10: **FF=2 · FP=1 · teto=7 (8+ reprova) · teto absoluto, % é derivada**) + datas editáveis (update em lote) + persistência do consolidado. **Destravada.**
- **Camada 3 — refino (M) — v1.1**: multi-turma/cadeira empilhadas · PDF de notas (reusa @react-pdf) · média ponderada configurável (D2) · vista histórica (2025 = consolidado do retroativo; por-aula só de 2026 em diante).
**Prioridade**: Camadas **0+1 = essencial para abrir (agosto) — ✅ ENTREGUES**; Camadas **2+3 = v1.1**.
**Dependências**: D-FALTAS (trava a Camada 2 — ✅ definida) · dados F1/F2 populados para conteúdo real.
**Status**: 🔵 Em andamento — **Camadas 0 e 1 ✅ concluídas (agosto coberto)**; Camadas 2/3 = v1.1.
**Origem**: visão do Hélio + diagnóstico "Módulo completo de Frequência e Notas" (2026-07-09).

### 2.09 [SEGURANÇA — LGPD] LGPD-01 fase 2 — tirar `professor` de `profiles_select_staff`
**Objetivo**: encerrar a exposição em que o professor lê **PII de TODOS os alunos** (CPF, RG, endereço, telefone…) diretamente de `profiles`, removendo o role `professor` da policy `profiles_select_staff` (migração 033). A **fase 1** (roster `get_alunos_operacional`, SECURITY DEFINER — nome/foto só dos alunos da cadeira) já está em produção e é o substituto seguro.

**⚠️ Escopo CORRIGIDO (diagnóstico 2026-07-12)**: o item estava dimensionado como *"2 embeds mortos + 1 migração"*. **É maior.** O RoleGuard do professor alcança **4 telas que leem `profiles` DIRETO** (não pelos 2 embeds). Remover `professor` do P2 hoje **quebra**:
| Tela | Origem | Colunas | Gravidade |
|---|---|---|---|
| **Ficha do Aluno** (`/dashboard/aluno/:id`) | `ficha-aluno.service:76` | **cpf, rg, endereço completo, telefone, observações internas** | 🔴 exposição central |
| **R06 Histórico** | `relatorios.service:1073` | full_name, codigo_itec, **cpf** | 🔴 puxa CPF |
| **R02 Lista de Presença** | `relatorios.service:416` | id, full_name, codigo_itec | 🟡 só nome+código |
| **R03 Disciplinas por Aluno** | `relatorios.service:911` | id, full_name, codigo_itec | 🟡 só nome+código |

Além dos **2 embeds MORTOS** (já substituídos pelo roster, remoção trivial): `frequencia.service:63` (`getFrequenciaByDisciplina` — VerTurma/LancarFrequencia já usam `al.full_name` do roster) e `frequencia.service:139` (`getAlunosAbaixoLimite` — consumidor `useProfessorDisciplinas` só usa `.length`).

**NÃO afeta**: admin/superadmin/administracao/financeiro (continuam no P2); leitura do **próprio** perfil do professor (`profiles_select_own`); e tudo que passa pelo roster (SECURITY DEFINER ignora a RLS do chamador). `getAlunosEmRiscoByTurma` (freq:256) é só `AdminView` — não é caminho do professor.

**Decisões do Hélio (2026-07-12)**:
1. Professor **NÃO** vê **Ficha do Aluno** (CPF/RG/endereço) nem **R06** (CPF) → **remover `professor` do RoleGuard** dessas rotas (`App.tsx:189` FichaAluno e `:148` R06).
2. **R02** (lista de presença): professor **VÊ**, **só das disciplinas que leciona** (contrato ativo) → **subir R02 para o roster** + escopar por `professor_leciona_disciplina`. Requer o roster expor **`codigo_itec`** (hoje só retorna full_name/avatar_url) — 1 ALTER na função.
3. **R03** (disciplinas por aluno): **é aluno-cêntrico cross-matéria** (lista TODAS as disciplinas de cada aluno, de todas as turmas) — **não escopável por disciplina**; escopá-lo ao professor o colapsaria no que ele já tem (ConsolidadoNotas + VerTurma da cadeira). **DECISÃO DO HÉLIO (2026-07-12): R03-B — remover `professor` do RoleGuard do R03** (não vira tela do roster). Diagnóstico Mov.2 (2026-07-12).
4. Secretaria/coordenação (**administracao/admin/superadmin**) veem **R02/R03 completos** — inalterado.

**Ordem segura (converter → só depois endurecer)**:
- **Mov.1** — ✅ **CONCLUÍDO (2026-07-12, PR #41)**: tirado `professor` do RoleGuard de **Ficha do Aluno + R06** (App.tsx). Sem migração.
- **Mov.2** — **R02 pelo roster + R03-B**: (a) ALTER `get_alunos_operacional` para retornar `codigo_itec` (DROP+CREATE, espelha 058); (b) refatorar **R02** para puxar a lista de alunos do roster (remove as queries de `profiles`; gate `professor_leciona_disciplina` já embutido) + escopar os selects de turma/disciplina por `useProfessorDisciplinas` quando `role='professor'`; (c) **R03**: só **remover `professor` do RoleGuard** (R03-B — trivial, mesmo padrão do Mov.1; **não** vai pro roster). Staff mantém R02/R03 completos (ramo `OR staff` do roster).
- **Mov.3** — remover os **2 embeds mortos** (freq:63, freq:139) + ajustar os 2 testes que assertam o shape do embed (`frequencia.service.test` :117 e :286) + **migração** removendo `professor` do `IN (...)` do `profiles_select_staff`.
- Só executar a migração da Mov.3 **depois** que Mov.1+Mov.2 estejam em produção (senão as telas quebram).

**Esforço**: 2 migrações (ALTER roster +codigo_itec na Mov.2; ALTER P2 na Mov.3) + código **S–M** (RoleGuards triviais + refactor **só do R02** pelo roster; R03 é 1 linha de RoleGuard; 2 embeds + 2 testes). R03-B derrubou o custo do R03 de M→trivial.
**Prioridade**: Média-Alta — não bloqueia agosto (exposição existe mas o acesso é autenticado e auditável), mas é remediação LGPD prioritária pós-lançamento.
**Status**: 🔵 Em andamento — **Mov.1 ✅ concluído (PR #41)**; Mov.2 especificado (R02 roster + R03-B) pronto p/ SDD; Mov.3 pendente (após Mov.2 em produção).
**Origem**: diagnóstico "LGPD-01 fase 2: endurecer profiles_select_staff" (2026-07-12). Fase 1 = item 2.05; bônus (embed de notas removido) = item 2.07.

### 2.10 [TELA] Impressão na tela de Notas do professor
**Descrição**: Botões **Imprimir / PDF / Excel** nas telas `LancarNotas` e `ConsolidadoNotas`, espelhando o **R02** (que já gera PDF/Excel/CSV da grade de presença). O professor imprime a planilha de notas da turma direto da tela onde lança.
**Solução técnica**: reusa `@react-pdf/renderer` + `xlsx` já no projeto e o padrão dos exporters do R02 (`excelExporter`, componente `*_PDF`).
**Esforço**: **P** (padrão pronto, é replicação).
**Prioridade**: após a integração (Fases B/C/E da auditoria de integração — aluno/secretaria/consolidado primeiro).
**Status**: Registrado — pedido do Hélio (2026-07-16).
**Origem**: QA do fluxo do professor pós-A1/A2 (fluxo lançar-nota funcional ponta a ponta).

### 2.11 [TELA] Planilha visual de Frequência no dashboard do professor
**Descrição**: Grade **aluno × datas de aula** (presente/falta) no dashboard do professor, com **cálculo de % automático** e **impressão no mesmo local** — a visão-planilha que hoje só existe no R02 impresso passa a ser tela operável.
**Solução técnica**: reusa a estrutura de grade do R02 (`R02_ListaPresenca` — tabela alunos×datas com sticky columns + resumo P/F/total/%). Fonte: roster + `frequencia` (mesmas do R02).
**Fatiamento**: esta é a **Etapa A da Camada 2** do módulo Freq/Notas (item 2.08) — só visual P/F, **sem migração**. A Etapa B (**PP/FP/FF** com `tipo_presenca` + regra D-FALTAS, exige migração) permanece **v1.1** como registrado no 2.08.
**Esforço**: **M**.
**Prioridade**: após a integração (Fases B/C/E).
**Status**: Registrado — pedido do Hélio (2026-07-16).
**Origem**: visão da Camada 2 (2.08) destravada por partes.

### 2.12 [AUDITORIA] Integração dos 4 dashboards — ✅ CONCLUÍDA (2026-07-17)
**Descrição**: A auditoria "os 4 dashboards devem falar a mesma língua" (professor/aluno/secretaria/coordenação) foi executada por fases e **fechada com QA de integração validado**:
- **Fase A — professor lança**: 061 (policies de `frequencia` restauradas — chamada salva) · **A1** (`professor_id` = profiles.id, LICAO-040) · **A2/A2b + 064** (turma das Notas pelo roster) · 062/063 (SELECT de notas + policies de avaliacoes/matriculas/profiles restauradas, LICAO-041).
- **Fase B — o elo**: **trigger 065** `recalcular_consolidado` (LICAO-042) — professor lança → `matriculas_disciplina` atualiza sozinho.
- **Fase C1 — aluno vê**: Minhas Notas + Minha Frequência reais (fim dos placeholders "Agosto 2026"), mesma fonte do Meu Histórico.
- **Fase C2 — porta da secretaria**: GestaoTurmas → Acompanhar (frequência/notas/chamada por disciplina, fallback sem grade) + RoleGuard nas 7 rotas de ação + staff salva chamada (fim do no-op silencioso).
- **Fase E — re-teste (2026-07-17)**: professor muda N2→9.0 → trigger consolida → **nota 8.30/aprovado**; **os 4 dashboards mostram o MESMO número** (aluno, secretaria via Acompanhar, coordenação via Ficha/R03).
- **E6 — higiene de links ✅ CONCLUÍDO (2026-07-19)**: cards das homes do professor (E6) e do aluno (E6b) apontam para as telas reais — Materiais/Frequência/Calendário do professor; Minha Frequência + card NOVO Minhas Notas + Calendário/Materiais do aluno. PR `fix/e6-links-professor` merged.
**Pendências que saíram da auditoria para a fila**: seção 12 (bug leads 12.0 — ✅ resolvido em 2026-07-18/19 via 066 + PR `fix/leads-log-erro`; restam 12.1 funil e 12.2 newsletter) · E5 já resolvido pela 065.
**Status**: ✅ **100% ENCERRADA (2026-07-19)** — todas as fases fechadas: **A** (professor lança) · **B** (trigger consolida) · **C1** (aluno vê) · **C2** (porta da secretaria) · **E** (QA validado: os 4 dashboards com o mesmo número) · **E6** (higiene de links).
**Origem**: auditoria de integração (2026-07-15) + QA Fase E (2026-07-17) + E6 (2026-07-19).

### 2.13 [TELA] Painel de Acompanhamento Acadêmico da secretaria/coordenação (visão consolidada)
**Descrição**: Hoje o staff navega Turmas → Acompanhar → escolhe disciplina → abre VerTurma/ConsolidadoNotas (**uma tela por disciplina**). Pedido do Hélio (2026-07-17): **dois painéis consolidados**, fáceis de acompanhar e **IMPRIMIR**:
- **(a) Painel de NOTAS do aluno por matéria** — todas as disciplinas do aluno numa grade só (matéria × N1/N2/média/status), sem precisar entrar disciplina por disciplina.
- **(b) Painel de PRESENÇA** — frequência por aluno/turma numa visão única (aluno × disciplina × % / faltas), com **destaque de quem está em risco**.
Ambos com impressão (**PDF/Excel**), reusando `@react-pdf` + `xlsx` do R02.
**Fonte**: `matriculas_disciplina` (consolidado **vivo** pós-trigger 065) — o dado já está certo e atualizado; é **UI de agregação, não regra nova** (LICAO-042).
**Relação com itens existentes**: o **R03** (Disciplinas por Aluno) já faz parte de (a) em formato de relatório — **avaliar no SDD se é evoluir o R03 ou tela nova**. **2.10** (impressão nas Notas) e **2.11** (planilha visual de frequência) são os equivalentes do professor — **verificar reuso de componentes**.
**Esforço**: **M**.
**Prioridade**: acabamentos (**após integração ✅, Auth, Financeiro**). **Não bloqueia agosto** — o staff já consegue ver tudo pelo Acompanhar.
**Status**: ✅ **EM ANDAMENTO/FEITO** — **2.13a** Grade de Notas inline (`PainelAcademicoTurma`, PR `feat/painel-acad-notas`) · **2.13b** aba Chamada aluno×data (PR `feat/painel-acad-chamada`) · **Frequência tela cheia + menu direto** (`FrequenciaChamada`, PR `feat/frequencia-tela-cheia`). Escrita no bruto (lancarNota/lancarFrequencia) + trigger 065; nada no consolidado direto.

### 2.13c [DÍVIDA TÉCNICA] Chamada duplicada — extrair `ChamadaGrid` compartilhado
**Descrição**: A grade aluno×data existe em **2 lugares** — aba Chamada do `PainelAcademicoTurma` (2.13b) + a tela cheia `FrequenciaChamada` (menu direto). Funciona, mas o **JSX foi replicado** (mesma lógica em 2 componentes). **Futuro**: extrair um `<ChamadaGrid turmaId disciplinaId/>` compartilhado (uma fonte só) reusado pelos dois.
**Esforço**: **P/M**. **Prioridade**: baixa (não urgente — só reduz manutenção). **Status**: Registrado (2026-08-01).

### 2.13d [FEATURE] Editar/mover data de chamada
**Descrição**: Hoje **não há UI** para corrigir uma **data lançada errada** (mover os registros de uma `data_aula` X → Y). Se o professor lança na data errada, corrige aluno a aluno, mas **não renomeia a coluna**. Criar um "editar data da chamada" (mover/renomear registros da data). Atenção do Hélio: datas de aula **podem mudar**.
**Fonte**: `frequencia.data_aula` (UPDATE por staff via RLS 061). **Esforço**: **M**. **Prioridade**: média (evita retrabalho). **Status**: Registrado (2026-08-01).

### 2.13e [FEATURE] Folha de chamada FUTURA em branco (PDF)
**Descrição**: Imprimir uma **folha com datas futuras vazias** para preencher à mão. O **R02** (Lista de Presença) só imprime **datas já lançadas** (aulas que aconteceram) — não gera colunas futuras. Novo gerador: recebe as datas futuras (ou um intervalo/semanas) → PDF aluno×data em branco. Reusa `@react-pdf`.
**Esforço**: **M**. **Prioridade**: média. **Status**: Registrado (2026-08-01).

### 2.13f [PARTE 2] Frequência FP — meia presença (3º estado F/P/FP)
**Descrição**: Adicionar um **3º estado** à chamada — **F (falta) / P (presente) / FP (meia presença)**. Hoje é só presente/falta (boolean).
**EXIGE (não é só front)**: **migração** (`frequencia.tipo_presenca` OU um `peso` numérico em vez do boolean `presente`) + **ajuste do trigger 065** (`recalcular_consolidado`) para contar **FP = 0,5 presença** no cálculo de faltas/frequência % + **a regra de reprovação por falta com FP definida pelo Hélio** (como a meia-falta pesa nos 75%). Régua **no banco** (LICAO-042/043) — o front só espelha.
**Esforço**: **M/G**. **Prioridade**: **aguarda a regra do Hélio** (não construir antes). **Status**: Registrado — Parte 2 (2026-08-01).

### 2.1 Gestão Dinâmica de Permissões
**Descrição**: Tela administrativa para superadmin gerenciar quais roles acessam quais módulos/rotas.  
**Solução técnica**: Criar tabela `permissoes_modulos` no banco + interface de configuração.  
**Benefício**: Eliminar hardcoded `allowedRoles` dos componentes `RoleGuard`.  
**Prioridade**: Baixa  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  
**Dependências**: Requer ADR sobre estratégia de permissões granulares.  

---

## 3. FLUXO DE ALUNOS

### 3.1 Convite via Magic Link
**Descrição**: Enviar email de convite para alunos com magic link do Supabase (sem senha inicial).  
**Fluxo**: Admin adiciona email → Supabase envia convite → Aluno clica link → completa perfil.  
**Prioridade**: Alta  
**Versão alvo**: V1 (antes do lançamento agosto 2026)  
**Status**: Aprovado — Semana 5 (Sprint RLS)  
**Dependências**: Resend configurado (Sprint K), Edge Function criar-aluno (Sprint L).  

### 3.2 Tela "Complete seu Perfil"
**Descrição**: Após primeiro login via magic link, aluno preenche dados pessoais obrigatórios.  
**Campos**: Nome completo, CPF, telefone, endereço, foto.  
**Prioridade**: Alta  
**Versão alvo**: V1 (antes do lançamento agosto 2026)  
**Status**: Aprovado — Semana 5 (Sprint RLS)  

### 3.3 Importação de Histórico via Excel
**Descrição**: Ferramenta para importar histórico acadêmico de ~30 alunos que já cursaram módulos anteriores.  
**Formato**: Excel com colunas: nome, CPF, turma, disciplinas cursadas, notas, status.  
**Prioridade**: Alta  
**Versão alvo**: V1 (antes do lançamento agosto 2026)  
**Status**: Aprovado — Semana 6 (após Sprint Financeiro)  
**Dependências**: Alunos já devem estar cadastrados no sistema.  

### 3.4 Coleta de Emails dos Alunos
**Descrição**: Hélio deve coletar emails válidos dos ~50 alunos atuais antes do lançamento.  
**Ação**: Contato via WhatsApp, formulário Google Forms, ou secretaria.  
**Prioridade**: CRÍTICA  
**Versão alvo**: V1 (antes do lançamento agosto 2026)  
**Status**: Pendente Hélio  
**Prazo**: Até 30/07/2026  

---

## 4. MONITORAMENTO

### 4.1 Sentry para Captura de Erros
**Descrição**: Integrar Sentry.io para monitorar erros em produção em tempo real.  
**Benefício**: Detectar bugs antes dos usuários reportarem, melhorar estabilidade.  
**Prioridade**: Alta  
**Versão alvo**: V1 (antes do lançamento agosto 2026)  
**Status**: Aprovado — Semana 6 (antes de convidar alunos piloto)  
**Custo**: $0/mês (plano gratuito até 5k eventos/mês)  

---

## 5. PLATAFORMA DE VÍDEO + COMUNIDADE (2027)

### 5.1 Aulas em Vídeo Dentro da Plataforma
**Descrição**: Migração de YouTube não listado para Cloudflare Stream ou Mux.  
**Recursos**: Upload direto, player customizado, rastreamento de progresso.  
**Prioridade**: Média  
**Versão alvo**: V3 (2027)  
**Status**: Planejado  
**Referência**: ADR-004 (estratégia de vídeos EAD)  

### 5.2 Comunidade por Turma
**Descrição**: Espaço de discussão estilo Discord/Notion para cada turma.  
**Recursos**: Comentários por aula, fórum de dúvidas, discussões assíncronas.  
**Prioridade**: Média  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  

### 5.3 Comentários e Discussões por Aula
**Descrição**: Alunos podem comentar em cada aula/vídeo, professores respondem.  
**Benefício**: Engajamento, suporte assíncrono, FAQ orgânico.  
**Prioridade**: Média  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  

### 5.4 Fórum Lateral + Conteúdo Central
**Descrição**: Layout estilo Notion — conteúdo da aula no centro, discussões/comentários na lateral.  
**Prioridade**: Baixa  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  

---

## 6. AUTOMAÇÃO E IA (Final 2026)

### 6.1 Automação de Processos
**Descrição**: Automatizar tarefas repetitivas.  
**Exemplos**:
- Geração automática de mensalidades no dia 1 de cada mês
- Envio automático de email de boas-vindas ao novo aluno
- Notificação de cobrança 5 dias antes do vencimento
- Alerta automático para secretaria quando aluno fica inadimplente

**Prioridade**: Média  
**Versão alvo**: V2/V3 (Setembro 2026 - 2027)  
**Status**: Em Discussão  

### 6.2 IA no Sistema
**Descrição**: Integração de inteligência artificial para suporte e insights.  
**Exemplos**:
- Sugestões automáticas de pré-requisitos cumpridos
- Alertas preditivos de risco de reprovação por falta/nota
- Chatbot de suporte para dúvidas comuns
- Análise de sentimento em feedbacks de alunos

**Prioridade**: Baixa  
**Versão alvo**: V3+ (2027/2028)  
**Status**: Em Discussão  

### 6.3 Integração APIs Externas
**Descrição**: Conectar plataforma com serviços externos.  
**Exemplos**:
- API CEP para preenchimento automático de endereço
- API CPF para validação
- API WhatsApp Business para notificações
- API Zoom para agendamento de aulas ao vivo

**Prioridade**: Média  
**Versão alvo**: V2/V3 (2026/2027)  
**Status**: Em Discussão  

---

## 7. EXPANSÃO ACADÊMICA

### 7.1 Pós-Graduação em Teologia
**Descrição**: Novo curso de especialização para graduados.  
**Carga horária**: 360h-420h  
**Prioridade**: Média  
**Versão alvo**: 2026 (após lançamento V1)  
**Status**: Em Discussão  
**Observação**: Requer estrutura acadêmica completa antes.  

### 7.2 MBA em Gestão de Ministérios
**Descrição**: Curso de gestão focado em líderes de igrejas e ministérios.  
**Público-alvo**: Pastores, líderes, gestores de ministérios.  
**Prioridade**: Baixa  
**Versão alvo**: 2027  
**Status**: Em Discussão  

### 7.3 MBA em IA & Tecnologia
**Descrição**: Parceria com ObraIA para MBA em Inteligência Artificial aplicada.  
**Público-alvo**: Profissionais de TI, gestores de tecnologia.  
**Prioridade**: Baixa  
**Versão alvo**: 2028  
**Status**: Ideia Preliminar  
**Observação**: Requer validação de mercado e parceria formal.  

---

## 8. FINANCEIRO

> ## ✅ MÓDULO FINANCEIRO — COMPLETO (2026-07-26)
> **Migrações 067–078 aplicadas e validadas por query.** Fluxo completo testado em produção
> (suspender → tela de bloqueio → aluno paga → confirmar → reativar). **Auth intocado** em todas.
> Régua de valor única no banco (`resolver_valor_efetivo`, LICAO-042); billing sagrado (LICAO-043).
>
> **Entregue:** E1 acesso Breno (067) · E2a preços editáveis (068) · E2b override por matrícula (069) ·
> E2c geração por valor efetivo + seletiva (070/071) · E2c.2 valor inline grava override (072) ·
> 2f confirmação de pagamento + bucket privado + status automático (073) · 2g Ficha Financeira do
> aluno + dia de vencimento por aluno (074) · 2h corrigir sem medo — estorno/cancelamento/guard/
> auditoria (075) · 2g.1 regenerar mês cancelado (076) · 2d o aluno vê/paga + PIX + comprovante (077) ·
> config PIX editável (staff/financeiro) · 2e Painel Visão Geral (lista + situação + export) ·
> **E5** travamento por inadimplência 30/90 (078) + telas (banner progressivo · tela de bloqueio ·
> suspender/reativar) · **E5.1** destravar fluido + inadimplente visível na lista/relatório + cobrança
> pronta (WhatsApp/e-mail, 2 modelos pastorais).
>
> **Backlog remanescente do módulo:** 8.7 (rápidas de agosto: recibo PDF · aviso de vencimento ·
> badge de comprovantes no sino) e 8.1/8.4 (gateway Asaas — boleto/cartão, futuro SaaS). O resto
> desta seção 8 abaixo é **histórico** das etapas (mantido para rastreabilidade).

### 8.0 [SEGURANÇA] Bucket `comprovantes-pagamento` — quebrado + risco de PII
**Descrição**: `Financeiro.tsx` faz `supabase.storage.from('comprovantes-pagamento').upload(...)` direto na page (viola services-only), mas o bucket **não existe em nenhuma migração** (sem policies versionadas). A feature provavelmente está quebrada; se o bucket existir criado à mão como **público**, comprovantes de pagamento (PII financeira do aluno) ficam acessíveis sem login.
**Agravantes**: usa `getPublicUrl` (não signed URL) e path **previsível** `comprovantes/{aluno_id}_{mes_referencia}_{nome}` (sem UUID, expõe `aluno_id`).
**O que fazer**: na revisão do módulo financeiro — criar bucket **PRIVADO** + policies (aluno vê o próprio; staff/financeiro tudo) + path com UUID (não expor `aluno_id`) + download por signed URL + mover o upload para um service. Confirmar antes se o bucket existe/é público (query B do diagnóstico de Storage).
**Origem**: achado correlato do report-B (diagnóstico Storage, 2026-07-06) — fora do escopo da migração 055.
**Prioridade**: ALTA (verificar já; correção junto da revisão financeira)
**Versão alvo**: V1 (antes de agosto) — pelo menos a verificação
**Status**: ✅ **RESOLVIDO (073, 2026-07-22)** — bucket `comprovantes-pagamento` recriado **PRIVADO** com 4 policies (aluno sobe/vê o próprio via `foldername[1]=aluno_id`; staff/financeiro tudo), download por **signed URL** (nunca `getPublicUrl`), upload movido para `financeiro.service` (`uploadComprovante`/`getComprovanteUrl`). O aluno anexa via RPC gated (077).

### 8.1 Gateway de Pagamento PIX/Boleto
**Descrição**: Integração com Asaas para pagamento online de mensalidades.  
**Recursos**: PIX, boleto, cartão de crédito.  
**Prioridade**: ALTA  
**Versão alvo**: V1 (Agosto 2026)  
**Status**: Aprovado — Sprint O (Financeiro) — Semanas 5-6  
**Dependências**: Conta Asaas criada e validada com Hugo.  

### 8.2 Emissão de Nota Fiscal
**Descrição**: Geração automática de nota fiscal após pagamento confirmado.  
**Prioridade**: Média  
**Versão alvo**: V2 (Setembro/Outubro 2026)  
**Status**: Pendente decisão do Hélio  
**Observação**: Verificar obrigatoriedade legal para instituição de ensino.  

### 8.3 Relatório Financeiro Completo
**Descrição**: Dashboard com KPIs financeiros (receita, inadimplência, projeções).  
**Métricas**: Receita mensal, taxa de inadimplência, previsão de recebimentos.  
**Prioridade**: Média  
**Versão alvo**: V2 (Setembro/Outubro 2026)  
**Status**: Planejado  

### 8.4 Sistema de Cobrança por Quantidade de Disciplinas
**Descrição**: Implementar tabela oficial de cobrança progressiva baseada na quantidade de disciplinas cursadas (não por disciplina individual).  
**Recursos**:
- Tabela Padrão (matrícula + mensalidade com acréscimo pós-vencimento)
- Tabela Família (desconto automático)
- Vencimento dia 10 (acréscimo automático após vencimento)
- Aprovação de descontos: financeiro (Breno) + superadmin
- Integração com Asaas para emissão automática de boleto/PIX

**Prioridade**: ALTA  
**Versão alvo**: V1 (Agosto 2026)  
**Status**: Aprovado — Sprint Financeiro (Semanas 5-6)  
**Dependências**: Conta Asaas configurada, tabelas de preços no banco.  
**Referência**: `.ai-system/memory/REGRAS-FINANCEIRO.md`  

### 8.5 [TELA] 2e — Painel de Gestão Financeira (dashboard financeiro/secretaria)
**Descrição**: Visão de **TODOS os alunos em grade** (linhas × colunas): aluno · curso/turma · valor · **status de cada mês** (pago/pendente/atrasado) · dias de atraso · total devido · contato. **Indicadores no topo**: total a receber, recebido no mês, inadimplência (%, R$, nº de alunos), previsão. **Filtros** (turma, status, mês). **Ordenável**. **Destaque visual de risco (30/90 dias)**. **Impressão/export (PDF/Excel — reusa R02)**. **TUDO editável** (valor, vencimento, status) mesmo iniciando com o padrão.
**Requisito do Hélio**: prático, visível, criativo, organizado — "algo melhor do que o atual".
**Fonte**: `mensalidades` + `resolver_valor_efetivo` (069). Sem regra nova de cálculo — é UI de agregação (LICAO-042).
**Depende de**: 2c geração ✅ (068–071) · **2d aluno paga** · **2f confirmação de pagamento** — sem eles não há "pago" para exibir.
**Relação**: é a evolução do 8.3 (Relatório Financeiro Completo) e complementa o painel consolidado acadêmico (2.13). Avaliar reuso no SDD.
**Esforço**: **M/G**.
**Prioridade**: Alta — mas **entra DEPOIS do fluxo pagar→confirmar (2d+2f) estar completo**.
**Status**: Registrado — requisito do Hélio (2026-07-21).

### 8.6 [DIRETRIZ — UX] Dashboard financeiro PRÁTICO (inline + navegação fluida)
**Descrição**: Diretriz transversal para TODAS as telas financeiras: **edições no lugar (inline)** sem pular de tela; **navegação fluida entre os menus** (geração ↔ valores ↔ inadimplência ↔ aluno).
**Requisito do Hélio**: "prático ao se mover e comunicar com os outros menus".
**Aplicar em**:
- **Geração de mensalidades**: editar valor na linha do preview (inline) → grava o override da matrícula (2c.2).
- **Painel 2e (8.5)**: edição inline de valor / vencimento / status na grade.
- **Confirmação de pagamento**: confirmar sem sair da lista de inadimplentes.
**Regra**: tudo editável mesmo iniciando com o padrão; o inline persiste na fonte única (`resolver_valor_efetivo`/`set_valores_matricula`, LICAO-042) — não é ajuste efêmero de tela.
**Status**: Registrado — diretriz do Hélio (2026-07-22).

### 8.7 [MELHORIAS] Financeiro pós-E5 — backlog priorizado
**Contexto**: registrado após a trilha 2a–2h + 2d (aluno) + config PIX. E5 (travamento por inadimplência 30/90) é o próximo grande item — estas são as melhorias que vêm depois/em paralelo.

**Agosto (rápidas)**:
1. **Recibo de pagamento confirmado** para o aluno baixar (PDF) — após `confirmar_pagamento`, o aluno vê/baixa um recibo do que foi pago (reusa `@react-pdf`, padrão do extrato 2g/R02).
2. **Aviso de vencimento próximo** na tela "Meu Financeiro" do aluno — banner "sua próxima mensalidade vence em X dias" (deriva de `proxima_mensalidade`). Base do aviso progressivo do E5.
3. **Badge "N comprovantes aguardando confirmação"** no menu Financeiro do staff — conta `mensalidades` com `comprovante_enviado_em` preenchido e status ainda em aberto (077). Dá visibilidade da fila 2f.

**v1.1**:
- **Extrato anual PDF** do aluno (para IR) — consolida o ano de mensalidades pagas.
- **Relatório de fluxo de caixa** do Breno — recebido × previsto por mês (evolução do 8.3).
- **Notificação automática** e-mail/WhatsApp (mensalidade gerada / vencimento próximo) — depende de provedor (Resend/WhatsApp; ver REGRA CRÍTICA de APIs externas).
- **Desconto por antecipação** (se o Hélio desejar) — política a definir.

**Futuro (SaaS)**:
- **Boleto/cartão** — decisão do Hélio: fica para o futuro no SaaS (gateway Asaas, ver 8.1/8.4). PIX + comprovante manual atende o lançamento.

**Status**: Registrado — melhorias do Hélio (2026-07-26).

### 8.8 [TELA] 2i — Relatório completo do aluno (dossiê acadêmico + financeiro, 1 PDF)
**Descrição**: Um **"dossiê do aluno"** imprimível reunindo, num só documento PDF, **vida acadêmica + financeira**:
- **Dados do aluno** (nome, código/nº de matrícula, contato) + **curso/turma**.
- **Situação financeira completa**: todas as mensalidades (pagas / em aberto / atrasadas), **total pago no ano**, e **histórico de estornos/cancelamentos** (usa a auditoria da 075: `estornado_por/data_estorno/motivo_estorno`, `motivo_cancelamento`).
- **Resumo acadêmico**: disciplinas, notas, frequência (lê o **consolidado** — LICAO-042; não recalcula).
**Fonte**: reusa `@react-pdf` (padrão do extrato 2g / R02 / declaração). Queries separadas sob RLS (LICAO-026).
**Acesso**: staff + financeiro (PII: é o dossiê completo — diferente do extrato PII-free 2g). Confirmar no SDD o que expor.
**Esforço**: **M**.
**Prioridade**: antes de fechar o módulo (acabamento) — não bloqueia agosto.
**Status**: Registrado — requisito do Hélio (2026-07-26).

### 8.9 [CADASTRO] Número de matrícula (`codigo_itec`) EDITÁVEL pela secretaria/staff
**Descrição**: O **número de matrícula** deve ser **editável** pela secretaria/staff (requisito do Hélio) — hoje é **gerado automático** e não há tela para corrigir.
**Investigar no SDD** (achado preliminar): o número mora em **`profiles.codigo_itec`** (TEXT UNIQUE nullable, migração 030) e é **gerado pela Edge Function `criar-aluno`** no cadastro. Confirmar se há também `matriculas.numero_matricula` (R1/051) e **qual é o "número de matrícula" que o Hélio quer editar** (o `codigo_itec` do perfil ou o `numero_matricula` da matrícula — provavelmente o `codigo_itec`).
**O que fazer**: edição inline na Ficha 360 / cadastro (staff), respeitando a **unicidade** (`UNIQUE`) — validar duplicata antes de salvar; via service (nunca `supabase.from` na page). RLS de `profiles` já permite staff editar (`profiles_update_staff`), mas **role/CPF continuam travados** — a edição do número não pode reabrir escalação (11-security-auditor validar o WITH CHECK).
**Esforço**: **P/M**.
**Prioridade**: requisito do Hélio — antes de fechar cadastro.
**Status**: Registrado — requisito do Hélio (2026-07-26).

### 8.10 [DIRETRIZ TRANSVERSAL] A Secretaria edita TUDO — inline, no lugar, fácil pelos menus
**Descrição**: A **secretaria é o braço direito do ITEC**. Princípio transversal para **todas as telas do staff** (não só financeiro): tudo que a secretaria precisa alterar deve ser **editável por ela de forma rápida e NO LUGAR** (inline, sem pular de tela), com **acesso fácil pelos menus**.
**Aplica-se a**: **notas · frequência · cadastro · matrícula · financeiro** (e o que vier).
**Relação**: é a generalização do 8.6 (que era só o dashboard financeiro). Ao construir/rever qualquer tela de staff, perguntar: "a secretaria consegue **corrigir isto aqui mesmo**, em 1–2 cliques, ou tem que pedir para alguém / pular de tela?". A régua de valor/consolidado continua no banco (LICAO-042/043) — inline persiste na fonte única, não é ajuste efêmero de tela.
**Status**: Registrado — diretriz do Hélio (2026-07-26).

---

## 9. OUTRAS IDEIAS

### 9.1 App Mobile Nativo
**Descrição**: Aplicativo iOS e Android nativo para alunos.  
**Recursos**: Acesso offline a materiais, notificações push, câmera para upload de docs.  
**Prioridade**: Média  
**Versão alvo**: V2 (Setembro/Outubro 2026)  
**Status**: Aprovado  
**Referência**: Roadmap em `.ai-system/ROADMAP-FUTURO.md`  

### 9.2 Sistema de Certificados Digitais
**Descrição**: Geração automática de certificados por módulo e final.  
**Recursos**: QR Code de verificação, assinatura digital, download PDF.  
**Prioridade**: Alta  
**Versão alvo**: V1/V2 (Agosto-Setembro 2026)  
**Status**: Planejado — Sprint O (Certificados)  
**Referência**: ADR-005  

### 9.3 Portal do Egresso
**Descrição**: Área exclusiva para alunos formados acompanharem carreira ministerial.  
**Recursos**: Oportunidades de ministério, networking, eventos exclusivos.  
**Prioridade**: Baixa  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  

### 9.4 Sistema de Bolsas Automático
**Descrição**: Fluxo de solicitação de bolsa pelo aluno + aprovação por comissão.  
**Recursos**: Formulário socioeconômico, análise automática de elegibilidade, aprovação multi-nível.  
**Prioridade**: Média  
**Versão alvo**: V2 (2026)  
**Status**: Em Discussão  

---

## 10. CAMADA ANALÍTICA DE DADOS

### 10.1 Dashboard Analítico Interno com Python + Streamlit
**Descrição**: Ferramenta de análise de dados interna para coordenação acadêmica, separada da plataforma principal.  
**Tecnologias**: Python, Streamlit, pandas, plotly, scikit-learn.  
**Prioridade**: Média  
**Versão alvo**: V3 (Pós-agosto 2026)  
**Status**: Em Discussão  

**Recursos planejados**:
- Dashboard interativo com métricas avançadas
- Gráficos e visualizações para tomada de decisão
- Análise de tendências históricas
- Exportação de relatórios customizados

**Observações importantes**:
- **NÃO substitui** o sistema React + Supabase (plataforma do aluno/secretaria)
- Streamlit serve apenas para **dashboards internos analíticos**
- Acesso restrito: coordenação acadêmica e direção
- Alinhado com transição de carreira do Hélio para área de dados
- **Valor triplo**: melhoria do projeto + aprendizado prático + portfólio

**Dependências**:
- Lançamento V1 concluído (agosto 2026)
- Dados históricos consolidados no Supabase
- Python 3.11+ instalado no ambiente de produção

### 10.2 ETL de Dados Históricos com pandas
**Descrição**: Pipeline de importação automática de dados históricos dos ~30 alunos que já cursaram módulos anteriores.  
**Formato de entrada**: Planilha Excel (.xlsx) com colunas padronizadas.  
**Processamento**: Validação, limpeza, transformação e carga no Supabase.  
**Prioridade**: Média  
**Versão alvo**: V3 (Pós-agosto 2026)  
**Status**: Em Discussão  

**Fluxo do ETL**:
1. **Extract**: Leitura de Excel com pandas
2. **Transform**: 
   - Validação de CPF, email, datas
   - Padronização de nomes e códigos
   - Cálculo de médias e status
   - Detecção de inconsistências
3. **Load**: Inserção via `supabase-py` ou SQL direto

**Benefícios**:
- Automação da importação (evita erros manuais)
- Validação de dados antes da inserção
- Log de erros e inconsistências
- Reutilizável para futuras migrações

### 10.3 Análise de Evasão, Retenção e Desempenho
**Descrição**: Relatórios analíticos avançados para identificar padrões e tendências.  
**Métricas**:
- Taxa de evasão por módulo/semestre
- Taxa de retenção (alunos que continuam até o final)
- Desempenho médio por turma/disciplina
- Comparativo entre turmas
- Identificação de disciplinas mais difíceis

**Prioridade**: Média  
**Versão alvo**: V3 (Pós-agosto 2026)  
**Status**: Em Discussão  

**Visualizações**:
- Gráficos de linha: evolução temporal de métricas
- Heatmaps: desempenho por disciplina × turma
- Funil de conversão: matrícula → conclusão
- Tabelas pivot interativas

### 10.4 IA Preditiva — Alerta de Risco de Reprovação
**Descrição**: Modelo de machine learning para prever risco de reprovação antes da avaliação final.  
**Tecnologias**: scikit-learn, XGBoost, ou modelos simples (Regressão Logística).  
**Prioridade**: Baixa  
**Versão alvo**: V3+ (2027)  
**Status**: Ideia Preliminar  

**Features do modelo**:
- Frequência acumulada até o momento
- Nota N1 (primeira avaliação)
- Histórico de notas em disciplinas anteriores
- Tempo médio de entrega de atividades EAD
- Engajamento na plataforma (acessos, materiais baixados)

**Output**:
- Score de risco: 0-100%
- Classificação: Baixo | Médio | Alto risco
- Ação recomendada: monitoria, reforço, conversa com coordenação

**Benefícios**:
- Intervenção precoce para evitar reprovações
- Melhoria da taxa de aprovação
- Suporte personalizado ao aluno

**Observação**: Requer volume mínimo de dados históricos (~100 alunos) para treinar o modelo com precisão aceitável.

### 10.5 Gráficos Avançados para Coordenação Acadêmica
**Descrição**: Visualizações interativas com Plotly/Streamlit para análise exploratória.  
**Prioridade**: Média  
**Versão alvo**: V3 (Pós-agosto 2026)  
**Status**: Em Discussão  

**Tipos de gráficos**:
- **Distribuição de notas**: histograma + boxplot
- **Frequência × Nota**: scatter plot com linha de tendência
- **Taxa de aprovação por professor**: comparativo
- **Evolução temporal**: linha do tempo de métricas-chave
- **Correlação entre variáveis**: matriz de correlação + heatmap

**Interatividade**:
- Filtros: turma, módulo, disciplina, período
- Drill-down: clicar em barra → ver detalhes
- Exportação: PNG, PDF, CSV

---

## 11. CENTRAL DE AJUDA & SUPORTE

### 11.0 [TELA] Manual do Aluno no dashboard do aluno
**Descrição**: O aluno precisa poder **LER e BAIXAR o manual do aluno pelo próprio dashboard**. A infraestrutura **já existe por completo**: bucket privado `manuais-aluno` (migração 050, leitura para qualquer authenticated) + coluna `cursos.manual_aluno_url` + `curso.service.getManualAlunoUrl()` (signed URL 1h). A secretaria já sobe/atualiza o handbook (055 deu escrita à `administracao`; UI no `ManualAlunoCard` do CursosAdmin). **O que falta é só o ponto de acesso NO dashboard do aluno**: card/seção "Manual do Aluno" → ler online (abrir o PDF na signed URL) + botão baixar.
**Solução técnica**: componente pequeno no dashboard do aluno (AlunoView/MeusCursos ou item de menu) consumindo `getManualAlunoUrl()` — estado vazio amigável se o curso ainda não tem manual.
**Reforço (2026-07-16, decisão do Hélio)**: a leitura online deve ser **organizada em PARTES** (seções/capítulos navegáveis, leitura fácil no dashboard — não só o PDF cru embutido) + **botão de download em PDF** do manual completo. Infra pronta (bucket `manuais-aluno` + signed URL); o conteúdo em partes é camada de apresentação sobre o mesmo manual.
**Esforço**: **P** (a infra está pronta; é UI + link; a organização em partes pode subir para P/M conforme o formato do conteúdo).
**Prioridade**: Média — **DEPOIS do Financeiro**, junto/antes da Central de Ajuda.
**Versão alvo**: pós-Financeiro; **precede/compõe a Central de Ajuda (item 11.1)** — vira a aba "Manual" dela.
**Status**: Registrado — pedido do Hélio (2026-07-10); reforçado em 2026-07-16 (partes + PDF).
**Origem**: visão da Central de Ajuda (11.1); infra das migrações 050/055.

### 11.1 [MÓDULO] Central de Ajuda & Suporte ITEC (todas as personas)
**Descrição**: Uma área acessível no dashboard de **cada persona** (aluno, professor, secretaria, coordenação) reunindo ajuda, documentação e canais de contato do ITEC.
**Recursos previstos**:
- **Manual**: ler online + baixar (aluno baixa o manual do aluno; professor o manual da cadeira/institucional). Reusa os buckets `manuais-aluno` / `materiais-disciplina` já existentes.
- **FAQ / Dúvidas frequentes**: perguntas e respostas já prontas, organizadas por tema.
- **"Pergunte ao ITEC"**: canal para novas dúvidas, com direcionamento (secretaria, coordenador ou reitor conforme o assunto).
- **Agendar atendimento**: marcar horário com coordenador (Prof. Andrea) ou reitor (Pr. Eliel).
- **Contato direto**: link de WhatsApp institucional.
- Conteúdo organizado/curado pelo ITEC (texto institucional a definir).
**Escopo a dimensionar em diagnóstico próprio quando chegar a vez** — envolve: modelo de dados de FAQ, roteamento de dúvidas, possível integração de agenda e link WhatsApp.
**Prioridade**: Média — **DEPOIS do Financeiro** (não é para agora; registro para não perder).
**Versão alvo**: pós-Financeiro (a definir).
**Status**: Registrado — aguarda diagnóstico próprio.
**Origem**: pedido do Hélio (2026-07-09).

---

## 12. CAPTAÇÃO & LANDING PAGE — 🔴 prioridade ALTA (matrículas de agosto)

### 12.0 [BUG] 🔴 Formulário "Reservar minha vaga" da LP falha ao enviar — leads perdidos em silêncio
**Descrição**: O formulário da landing page mostra **"Erro ao enviar. Tente novamente ou entre em contato pelo WhatsApp."** e o lead **NÃO é gravado** → o ITEC **perde interessados em silêncio** (a pessoa acha que enviou e vai embora). Evidência do outro lado: o dashboard da secretaria mostra **"Leads 0"** e "Leads por Curso: Nenhum lead ainda".
**Investigar**: a LP grava em qual tabela/endpoint? (`leads_cursos` existe; `leads.service` tem `createLead` + fallback localStorage). **Provável causa: RLS bloqueando INSERT de `anon`** na tabela de leads (padrão dos danos LICAO-041 — conferir policies de `leads_cursos` no levantamento pg_policies), ou endpoint quebrado.
**Impacto**: captação para AGOSTO — cada dia do bug é lead perdido.
**Prioridade**: 🔴 **ALTA** — entra **após a integração (Fases C2/E), antes do Financeiro**.
**Status**: Registrado — reportado pelo Hélio (2026-07-17).

### 12.1 [MELHORIA] Funil de leads no dashboard da secretaria
**Descrição**: O lead da LP deve chegar no painel (o menu "Leads" existe mas está zerado pelo bug 12.0). **Depois do fix**: visão de **funil** (interessado → contato feito → matriculado), **origem** (Instagram/indicação/etc.) e **curso de interesse**. Reusa os campos que a LP já coleta (nome, email, WhatsApp, cidade, curso, como conheceu, mensagem).
**Dependências**: 12.0 (sem o fix não há lead para exibir).
**Esforço**: **M**.
**Prioridade**: Alta (segue o 12.0).
**Status**: Registrado (2026-07-17).

### 12.2 [MELHORIA] Newsletter do rodapé da LP — separar do fluxo de matrícula
**Descrição**: Hoje o campo de e-mail do Newsletter **leva ao fluxo de reservar matrícula** — comportamento errado: quem quer newsletter não quer se matricular. Separar: newsletter grava **só o e-mail** numa lista própria, sem abrir o formulário de matrícula.
**Decidir**: destino do e-mail — tabela `newsletter` própria OU tag/origem em `leads_cursos` (decisão do Hélio no SDD).
**Esforço**: **P**.
**Prioridade**: Alta (mesma onda da captação).
**Status**: Registrado (2026-07-17).

---

## 13. OBSERVABILIDADE & ADMIN

### 13.1 [RÁPIDO] Relógio/data em todas as roles
**Descrição**: Exibir **data e hora atual** no dashboard de todos os usuários (aluno/professor/staff/financeiro). Cosmético.
**Nota**: as funções do banco já usam `now()`/`CURRENT_DATE` do Postgres (**data confiável do servidor**) — isto é **só exibição na UI**, não muda nenhuma regra de negócio nem cálculo de datas.
**Esforço**: **P**.
**Prioridade**: baixa (cosmético) — pode entrar a qualquer momento.
**Status**: Registrado — Hélio (2026-07-26).

### 13.2 [MÉDIO/GRANDE] Sistema de LOG administrativo (dev/superadmin)
**Descrição**: Observabilidade para operar com segurança pós-abertura. Dois logs:
- **(a) Log de ATIVIDADE** — quem entrou/saiu, quando, ações principais (auditoria de acesso). Painel visível **só ao dev/superadmin**.
- **(b) Log de ERROS** — quando ocorre erro (qualquer role: aluno/financeiro/staff), registrar `timestamp, usuário, rota, erro` e **alertar o dev SÓ quando há erro** (não ruído).
**Avaliar no SDD**: tabela de logs no Supabase? Serviço externo (**Sentry/Logflare**)? Edge Function? Em todos os casos **RLS restrita ao superadmin**.
**Esforço**: **M/G**.
**Prioridade**: **v1.1 (pós-abertura)** — não bloqueia agosto, mas importante para operar com segurança.
**⚠️ Relaciona com a REGRA CRÍTICA — APIs Externas** (se usar Sentry/Logflare/serviço externo → **avisar o Hélio antes**, conferir gratuidade/limite e o repositório de APIs disponíveis).
**Status**: Registrado — Hélio (2026-07-26).
**Relação**: complementa o 4.1 (Sentry para captura de erros, seção MONITORAMENTO) — consolidar no SDD para não duplicar.

---

## 14. CENTRAL DE RELATÓRIOS

> **Requisito do Hélio (2026-07-26):** a central deve ser **rica** (muitos relatórios, não 6), organizada,
> com **PDF e Excel em todos** e acesso fácil (diretriz 8.10). Diagnóstico completo abaixo.
> **Legenda de esforço:** 🟢 gerador já existe (só levar à central, esforço P) · 🟡 novo, fonte pronta · 🔴 novo, mais esforço.

### 14.0 Inventário atual (o que já existe — 6 relatórios, grade plana)
| ID | Mostra | Formatos | Fonte (`relatorios.service`) |
|---|---|---|---|
| **R01** Alunos por Turma | matriculados por turma | PDF · Excel · CSV | `getAlunosPorTurma` |
| **R02** Lista de Presença | presença por disciplina/período | PDF · Excel · CSV | `getListaPresencaRelatorio` |
| **R03** Disciplinas por Aluno | cursadas/andamento/pendentes | PDF · Excel · CSV | `getDisciplinasPorAlunoRelatorio` |
| **R04** Situação Financeira | status de pagamento | PDF · Excel · CSV | `getSituacaoFinanceiraRelatorio` |
| **R05** Inadimplentes | atrasos por aluno | PDF · Excel · CSV | `getInadimplentesRelatorio` |
| **R06** Histórico Acadêmico | histórico individual | **PDF só** (falta Excel) | `getHistoricoAcademicoR06` |

Infra pronta e reusável: `RelatorioLayout.tsx`, `exporters/excelExporter.ts` (xlsx + CSV), `pdf/R0x_PDF.tsx`, queries **LICAO-026** (separadas). **Gap do menu:** grade plana de 6 cards, sem categorias/busca/filtros globais.

### 14.1 [📚 ACADÊMICOS] a criar
| Relatório | Fonte (reusa) | Esforço | Prio |
|---|---|---|---|
| Boletim/Dossiê do aluno | 🟢 `DossieAlunoPDF` (2i) | P | Alta |
| Declaração de matrícula | 🟢 `DeclaracaoMatriculaPDF` (na ficha) | P | Alta |
| Notas por turma/disciplina | 🟡 `getConsolidadoTurma` | P/M | Alta |
| Frequência por turma | 🟡 `get_alunos_operacional`/VerTurma (064) | P/M | Alta |
| Alunos em risco (nota<7 / freq<75) | 🟡 consolidado 065 | P | Alta |
| Ata de resultados (turma×disciplina) | 🟡 `getConsolidadoTurma` | M | Média |
| Histórico escolar | ✅ R06 existe | — | — |

### 14.2 [💰 FINANCEIROS] a criar
| Relatório | Fonte (reusa) | Esforço | Prio |
|---|---|---|---|
| Extrato do aluno | 🟢 `ExtratoFinanceiroPDF` (2g) | P | Alta |
| Visão geral financeira | 🟢 `VisaoGeralFinanceiraPDF` (2e) | P | Alta |
| Recebimentos do mês | 🟡 `mensalidades` pagas/mês · `getKpisFinanceiro` | P/M | Alta |
| A receber / previsão | 🟡 `mensalidades` pendentes futuras | M | Média |
| Mensalidades por turma | 🟡 `mensalidades` + `matriculas.turma` | M | Média |
| Fluxo de caixa (recebido×previsto/mês) | 🔴 agregação `mensalidades` (= 8.7 v1.1) | M | Média |
| Inadimplência / Situação financeira | ✅ R05/R04 existem | — | — |

### 14.3 [🏫 GESTÃO] a criar
| Relatório | Fonte (reusa) | Esforço | Prio |
|---|---|---|---|
| Matrículas por período | 🟡 `matriculas` por `created_at` | M | Média |
| Leads / captação (funil) | 🟡 `leads_cursos` (ver 12.1) | M | Média |
| Professores / contratos | 🟡 `professores` + `contratos_professor` | M | Média |
| Visão geral da escola (KPIs: nº alunos/turmas, inadimplência %, média geral) | 🔴 agrega vários | M/G | Alta |
| Alunos por turma | ✅ R01 existe | — | — |

**Insight:** ~metade da "central rica" é **agregar geradores que já existem** (Dossiê 2i · Extrato 2g · Visão Geral 2e · Declaração) — esforço P, ganho alto. A outra metade tem **fonte pronta** (consolidado 065, mensalidades, leads).

### 14.4 Arquitetura da central
- **3 categorias** (📚 Acadêmicos · 💰 Financeiros · 🏫 Gestão) em **abas/seções de cards** + **busca** no topo (diretriz **8.10** — acesso fácil).
- **Cada relatório**: tela com **filtros** (turma / período / aluno / disciplina / situação, conforme o caso) + **sempre PDF e Excel** (meta: padronizar; adicionar Excel ao R06).
- **Reuso**: `RelatorioLayout` (casca) + `exporters` (xlsx/CSV) + padrão `@react-pdf` — um "kit de relatório" comum (layout + filtros + 2 botões).
- Geradores hoje escondidos em fichas (Dossiê/Extrato/Declaração) ganham **entrada também na central** — sem sair da ficha (dois caminhos).

### 14.5 Faseamento
- **Fase A (P):** reorganizar a central em categorias + **trazer Dossiê/Extrato/Visão Geral/Declaração** para lá + **Excel no R06**.
- **Fase B (M):** novos com fonte pronta — Notas/Frequência por turma, Alunos em risco, Recebimentos do mês, Matrículas por período.
- **Fase C (M/G):** Fluxo de caixa, Visão geral da escola, Leads, Professores/contratos.

### 14.6 Nota — duas fichas do aluno (decisão registrada)
**Manter separadas**, com o **dossiê disponível em ambas**:
- **Ficha do Aluno** (staff, `aluno/:id`) — COM PII (CPF/RG/endereço) + docs + obs internas + aprovar matrícula + lançamento retroativo + convalidações.
- **Ficha Financeira 2g** (staff + financeiro, `financeiro/aluno/:id`) — **PII-free** (fronteira 067: o Breno não vê CPF/RG).
**Não unificar** (uniria PII ao financeiro). Redução de duplicação futura = **componentizar blocos** compartilhados (`<HistoricoAlunoPanel>`, `<FinanceiroAlunoPanel>`), nunca fundir as telas. O botão "Dossiê completo (PDF)" já está nas **duas** (branch `feat/dossie-e-relatorios`).

**Status**: Registrado — diagnóstico do Hélio (2026-07-26).

---

## REGRA CRÍTICA — Camada Analítica

**APENAS avaliar após lançamento de agosto 2026.**

Razões:
1. **Foco**: Prioridade total no lançamento V1 (agosto)
2. **Dados**: Precisa de volume mínimo para análises significativas
3. **Stack**: Adicionar Python/Streamlit agora aumenta complexidade desnecessariamente
4. **Risco**: Desvio de foco em fase crítica do projeto

**Aprovação condicional**:
- ✅ Hélio pode estudar Python/pandas/Streamlit paralelamente (aprendizado pessoal)
- ✅ Pode criar protótipos locais com dados fictícios
- ❌ NÃO adicionar ao projeto oficial antes de agosto
- ❌ NÃO integrar com ambiente de produção antes de agosto

---

## LEGENDA DE PRIORIDADE

- **CRÍTICA**: Bloqueia lançamento agosto 2026
- **ALTA**: Necessária antes de escala (100+ alunos)
- **MÉDIA**: Melhoria significativa, não urgente
- **BAIXA**: Nice-to-have, pode aguardar V3+

## LEGENDA DE STATUS

- **Aprovado**: Hélio aprovou implementação
- **Planejado**: Incluído em roadmap oficial
- **Em Discussão**: Aguardando decisão do Hélio
- **Ideia Preliminar**: Necessita validação técnica/negócio
- **Pendente Hélio**: Aguardando ação/resposta do Hélio

---

## MATERIAIS DA DISCIPLINA

### Materiais — upgrade Opção B: signed URL via Edge Function (bucket 100% fechado)
**Descrição**: Hoje (R0.5.4, migração 049) o bucket `materiais-disciplina` é privado e o SELECT em `storage.objects` é liberado a qualquer `authenticated` (a granularidade de acesso por matrícula/disciplina fica na tabela `materiais_disciplina` via `aluno_ve_disciplina()`, não no objeto). A **Opção B** fecha o bucket por completo: o download passa por uma **Edge Function** que valida o acesso do usuário (aluno matriculado no curso da disciplina / staff / professor da cadeira) e devolve uma **signed URL** temporária. Assim nenhum `authenticated` lê o objeto direto.
**Benefício**: acesso ao arquivo físico fica alinhado 1:1 com a regra de negócio (não só ao registro), eliminando o vetor de "authenticated lê qualquer objeto do bucket".
**Dependências**: Edge Function (Supabase) + `createSignedUrl`; reusar a cadeia `matriculas.turma_id → turmas.curso_id → modulos.curso_id → disciplinas_v2` (ver `aluno_ve_disciplina`) e `contratos_professor` para professor da cadeira.
**Prioridade**: Média
**Versão alvo**: V2 (pós-agosto 2026)
**Status**: Planejado

### Consolidar barra de progresso do aluno com `materiais_disciplina`
**Descrição**: Hoje coexistem dois conceitos de "materiais": o **novo** `materiais_disciplina` (R0.5.4/PR #16 — aprovação, bucket privado, signed URL) e o **antigo** `materiais` + `progresso_aluno` (`material.service.ts`), que ainda alimenta a barra "Materiais XX% · N arquivos" no card do aluno (`useMeusCursos`). Unificar: migrar o rastreamento de progresso para `materiais_disciplina` (visualização/download) e aposentar a tabela `materiais` legada.
**Benefício**: fonte única de materiais; elimina duplicidade de modelo.
**Prioridade**: Média
**Versão alvo**: V2 (pós-agosto 2026)
**Status**: Planejado

### Script: migrar `disciplinas_v2.manual_url` legados → `materiais_disciplina`
**Descrição**: A coluna `disciplinas_v2.manual_url` (preenchida pelo fluxo antigo `uploadManualDisciplina`, já removido) não é mais exibida. Script opcional para varrer cadeiras com `manual_url` não-nulo e criar um registro em `materiais_disciplina` (origem `link` ou re-upload), depois limpar a coluna. Provável impacto nulo (a função antiga não tinha UI), mas garante que nada fique órfão.
**Prioridade**: Baixa
**Versão alvo**: V2 (pós-agosto 2026)
**Status**: Planejado

---

## LANÇAMENTO RETROATIVO (R2)

### 🔴 BLOQUEADOR — migração 053: `recuperacao` no CHECK de `matriculas_disciplina.status`
**Descrição**: O R2.2 passou a gravar `status='recuperacao'` (nota 5–6.9 e freq≥75) no lançamento retroativo, mas o **CHECK do banco** (migração 010) **não inclui `recuperacao`** (`cursando·aprovado·reprovado·reprovado_falta·convalidado·trancado`). Enquanto a migração 053 (`ALTER … ADD` ao CHECK) não rodar, lançar uma cadeira em recuperação **falha em runtime (23514)**. O código TS já está pronto.
**Ação**: criar migração 053 adicionando `recuperacao` ao CHECK (e avaliar incluir nos demais lugares que exibem status).
**Prioridade**: Alta (bloqueia o caminho de recuperação do R2.2)
**Versão alvo**: V1 — antes de usar lançamento em produção
**Status**: Pendente (migração a criar)

### G4 — Histórico Acadêmico deve preferir a frequência consolidada ✅ FEITO (R2.3, PR #20)
**Descrição**: `getHistoricoAluno` agora PREFERE os valores consolidados de `matriculas_disciplina` (nota/status/frequencia_percentual) quando existem; fallback p/ parciais. Vale para FichaAluno (staff) e a nova tela "Meu Histórico" (aluno).
**Status**: ✅ Concluído.

### MeusCursos (módulo atual) deve preferir matriculas_disciplina consolidado
**Descrição**: A tela `MeusCursos` (módulo corrente do aluno) ainda mostra freq/notas das **parciais** (`getResumoFrequenciaBatch` + `getNotasBatchByAluno`), não do consolidado. **Avaliar se `MeusCursos` deve preferir `matriculas_disciplina` consolidado quando as turmas 2026 começarem a lançar** — para o aluno ver o mesmo dado em "Meus Cursos" e "Meu Histórico". (Hoje só "Meu Histórico" usa o consolidado; G4.)
**Prioridade**: Média
**Versão alvo**: quando turmas 2026 iniciarem lançamentos
**Status**: Planejado

### Múltiplas matrículas por aluno no lançamento
**Descrição**: A tool de Lançamento Retroativo usa hoje a **matrícula ativa** (ou a primeira com turma). Quando houver 2º curso (ex.: Pós-graduação), o aluno terá mais de uma matrícula — revisitar a seleção (dropdown de matrícula) para lançar na correta.
**Prioridade**: Baixa
**Versão alvo**: quando existir 2º curso
**Status**: Planejado

### Refinamento de segurança (11): `notas_aluno` por contrato do professor
**Descrição**: As policies de `notas_aluno` (023/031) hoje permitem que **qualquer professor veja e lance nota de qualquer cadeira** (SELECT libera staff inteiro; INSERT/UPDATE exige só `lancado_por = self`, sem amarrar à disciplina lecionada). Restringir professor às **suas cadeiras** via `contratos_professor` (`status IN ('assinado','impresso')`) quando **F2 (contratos populados)** for resolvido. **Mesmo tema da migração 037 §2 adiada** (restrição professor em frequencia/materiais/matriculas_disciplina/etc.). Diagnosticado no R3.0; RLS de `notas_aluno` em si já está completa e funcionando (ver known-errors F3 ✅).
**Prioridade**: Média (segurança — pós-agosto, depende de contratos)
**Versão alvo**: quando F2 (contratos cadastrados) for resolvido
**Status**: Planejado

### Evoluir `KpiCard` para navegação SPA (`<Link>` em vez de `<a href>`)
**Descrição**: O `KpiCard` (`src/components/dashboard/KpiCard.tsx`) usa `<a href>` quando recebe `href` → **recarrega a página inteira** em vez de navegação React Router. Afeta os KPIs do AdminView e os novos KPIs do AlunoView (R3.1). Trocar por `<Link to>` para navegação SPA sem reload. Identificado no R3.1.
**Prioridade**: Baixa (UX — não bloqueante)
**Versão alvo**: R3.x ou refino de UI
**Status**: Planejado

### Paginar detector F1 do Painel de Pendências (R3.2)
**Descrição**: `getPendenciasSecretaria` monta o set de matrículas com lançamento via fetch global de `matriculas_disciplina` (`limit 2000`). No volume atual (~31 matrículas) é ok; se crescer muito, paginar/otimizar (ex.: agregação por `matricula_id` no banco, ou consultar só as matrículas ativas em questão). Identificado no R3.2 Leva 1.
**Prioridade**: Baixa (só relevante em escala)
**Versão alvo**: quando volume de lançamentos crescer
**Status**: Planejado

### Deep-link com hash para a aba Financeiro da FichaAluno (R3.2)
**Descrição**: Os cards de **Taxas** e **Documentos** do Painel de Pendências linkam para a FichaAluno (`/dashboard/aluno/:id`), mas caem no topo da ficha. Adicionar âncora/hash (ex.: `#financeiro`, `#documentos`) + scroll para a seção correspondente ao abrir. Identificado no R3.2 Leva 1.
**Prioridade**: Baixa (UX — navegação mais direta)
**Versão alvo**: R3.x ou refino de UI
**Status**: Planejado

### Auditoria completa de transições de status de matrícula (R3.2 Leva 2a)
**Descrição**: Hoje a mudança de status de matrícula não deixa trilha (quem/quando/de→para) — só o stamp `validado_por`/`validado_em` na aprovação (1 evento). Para auditoria real, criar **tabela de histórico de transições** (`matricula_status_log`: matricula_id, de, para, por, em, observacao) e gravar em `aprovarMatricula`/`mudarStatusMatricula`. **Exige migração.** Identificado no R3.2 Leva 2a.
**Prioridade**: Média (governança/segurança — pós-agosto)
**Versão alvo**: quando houver janela para migração de auditoria
**Status**: Planejado

### Auditoria de encerramento de contrato de professor (R3.3a)
**Descrição**: `contratos_professor` não tem `encerrado_em`/`encerrado_por` (só `solicitacoes_disciplina` tem). Ao encerrar um vínculo (status `encerrado`), não fica quem/quando. Adicionar colunas `encerrado_em`/`encerrado_por` + gravar em `updateStatusContrato`/handler de encerrar. **Exige migração.** Identificado no R3.3a.
**Prioridade**: Baixa (governança — pós-agosto)
**Versão alvo**: junto da janela de auditoria
**Status**: Planejado

### Reavaliar RLS professor-por-contrato (migração 037 §2) — agora há contratos
**Descrição**: A restrição RLS que limita o professor às **suas** cadeiras (notas_aluno/frequencia/materiais/matriculas_disciplina/etc.) via `contratos_professor` estava adiada por F2 (0 contratos). Com R3.3a destravando a criação de vínculos (`CONTRATO_ATIVO`), reavaliar aplicar a restrição — usando `status <> 'encerrado'` (não só `assinado`/`impresso`, conforme decisão C). **Exige migração** (policies). Pós-agosto, após popular contratos reais. Ver known-errors F3 (✅) e nota da 037 §2.
**Prioridade**: Média (segurança — pós-agosto)
**Versão alvo**: quando contratos reais estiverem cadastrados
**Status**: Planejado

### Avaliações pendentes por avaliação (definição "a") — ProfessorView (R3.3b)
**Descrição**: O KPI "Notas pendentes" do ProfessorView usa a definição **(b)** — alunos sem nota final em `matriculas_disciplina` (`nota IS NULL`/`cursando`). Quando a **criação de avaliações** (`avaliacoes`: N1/N2/rec/trabalho/extra) estiver em uso, avaliar trocar/complementar pela definição **(a)**: por avaliação definida, comparar `notas_aluno` lançadas vs nº de alunos matriculados → "avaliações com notas faltando". Mais preciso, porém multi-query e só útil com avaliações criadas. Identificado no R3.3b.
**Prioridade**: Baixa (só relevante quando avaliações forem usadas)
**Versão alvo**: quando a criação de avaliações estiver em uso
**Status**: Planejado

### Ficha 360 — nome da disciplina ITEC de destino na convalidação (R3.4)
**Descrição**: A seção Convalidações da FichaAluno exibe `disciplina_origem` (origem), pois `getConvalidacoesByAluno` faz `select('*')` sem join. Para mostrar também a **disciplina ITEC de destino** (`disciplinas_v2` via `convalidacoes.disciplina_id`), fazer merge por query separada (LICAO-026) — em `getConvalidacoesByAluno` ou no loader da ficha. Polish opcional. Identificado no R3.4.
**Prioridade**: Baixa (UX — refino)
**Versão alvo**: refino de ficha
**Status**: Planejado

### BLOCO AUDITORIA + QA — pós-R3.4 (gate: só após R3.4 mergeado)
**Descrição**: Com o Núcleo Acadêmico completo (R0→R4), travar mudanças e auditar antes de novas features. Ordem obrigatória:
1. **MODO AUDITORIA** — Agente 14 (protocolo 9 etapas) + 15-debt + 11-security + 17-lgpd → relatório em `.ai-system/audit/[data]/report.md`. **Não modificar código** até aprovação do Hélio.
2. **QA** — Agente 10-test: cobrir regras de domínio (funil de status/acesso [LICAO-039], nota≥7 E freq≥75%, pré-requisitos, convalidação, lançamento retroativo, vínculo de professor [decisão C]). ✅ As 9 falhas pré-existentes foram TODAS resolvidas (1 academico no PERF-01; 8 ProtectedRoute em 2026-07-19 — **suíte 335/335 verde**, `fix/auth-testes-verde`).
3. **Caça a bugs** — varredura por persona (aluno/professor/secretaria/coordenação) nas rotas profundas. (Parcialmente coberta pelo QA Fase E da auditoria de integração, 2026-07-17.)
4. ~~Sprint de AUTH dedicado~~ — **✅ JÁ CONCLUÍDO (jun/2026) — item removido da fila (diagnóstico auth 2026-07-19)**: o "sprint" aconteceu em 18-19/06 (PRs `fix/auth-timeout-minimo` + `fix/auth-provider-unico`, ambos 100% no main; branches deletados). ERR-AUTH-002 = ✅ RESOLVIDO (ver known-errors). Auth está **estável e coberto por testes** (ProtectedRoute 7 + AuthProvider 6). Não há sprint pendente.
**Prioridade**: Alta (qualidade pré-lançamento)
**Versão alvo**: imediatamente após R3.4
**Status**: Planejado (gate: R3.4 mergeado) — detalhe também no Tracker §7 do PLANO-MESTRE-v2_1

---

## 15. BUGS ABERTOS

### 15.1 [BUG] 🔴 Data de nascimento exibe 1 dia a menos (fuso horário UTC-3)
**Descrição**: Cadastra-se o aluno com 15/03/1990 e a ficha mostra **14/03/1990**.
**Diagnóstico (2026-08-03 — concluído)**: o bug é **só de EXIBIÇÃO**; o dado no banco está **correto**.
- **Coluna**: `profiles.data_nascimento` e `professores.data_nascimento` são **`DATE` puro** (migrations 021 e 009) — sem fuso. ✅
- **Gravação — OK**: `<Input type="date">` entrega `'YYYY-MM-DD'`; `sanitizeDate` (`src/utils/sanitize.ts:3`) devolve a string **intacta** quando casa o regex ISO. Nenhum caminho de escrita usa `new Date()`/`toISOString()` (NovoAlunoModal:59, usuarios.service:218, ProfessorModal:71/92, NovaMatricula:154).
- **Exibição — CAUSA**: `fmt()` em `FichaAluno.tsx:57-59` e `FichaProfessor.tsx:14-16` faz `new Date(iso).toLocaleDateString('pt-BR')`. Por ECMA-262, string **date-only** é interpretada como **UTC midnight**; em UTC-3 volta para o dia anterior → **-1 dia**.
- **O padrão correto JÁ EXISTE no projeto** (~15 pontos): `new Date(iso + 'T12:00')` — meio-dia local, imune a fuso de ±12h. Ex.: `DayPanel:35`, `DossieAlunoPDF:65`, `FichaFinanceiraAluno:46`, `MeuFinanceiro:30`, `GestaoTurmas:32`, `FrequenciaChamada:37`. Os dois `fmt()` das fichas ficaram fora do padrão.

**⚠️ O bug é MAIOR que data de nascimento**: o mesmo `fmt()` também formata **`data_vencimento` e `data_pagamento`** (`FichaAluno.tsx:591-592`) — que também são **`DATE`** (migration 012) → **vencimentos financeiros exibem 1 dia a menos**. Prova cruzada: o **mesmo campo** aparece **certo** em `FichaFinanceiraAluno` (usa `+T12:00`) e **errado** em `FichaAluno` — duas telas, dias diferentes.

**Correção recomendada (NÃO aplicada)**: um helper único de formatação que **detecta date-only** e só então ancora ao meio-dia local:
- se `/^\d{4}-\d{2}-\d{2}$/` → `new Date(iso + 'T12:00')`;
- senão (timestamptz com hora/Z) → `new Date(iso)` **sem alteração**.
⚠️ **Não** aplicar `+ 'T12:00'` cegamente: o mesmo `fmt()` também recebe **timestamps** (`created_at`, `criado_em`, `enviado_em`, `solicitado_em`), que hoje estão **corretos** e quebrariam. Centralizar num util compartilhado (ex.: `src/utils/date.ts`) e trocar os dois `fmt()` locais.
**Extra (cosmético, sem -1 dia)**: `ContratoPDF.tsx:56` imprime `data_nascimento` **crua** (`1990-03-15`) em vez de `15/03/1990`.
**Pontos que tocam `data_nascimento`**: NovoAlunoModal · Alunos (edição) · NovaMatricula · ProfessorModal · ContratoForm · ContratoPDF · FichaAluno · FichaProfessor · ficha-aluno.service · usuarios.service · professor.service · use-profile · relatorios.service (tipo).
**Impacto**: dado exibido errado em ficha de aluno/professor **e em vencimentos financeiros**.
**Prioridade**: 🔴 **ALTA** (dado errado na tela). **Esforço**: **P** (um util + 2 trocas).
**Status**: Diagnosticado, **correção pendente** — reportado pelo Hélio (2026-08-03).

---

## COMO USAR ESTE BACKLOG

1. **Novas ideias**: Adicionar no final da categoria correspondente
2. **Aprovação**: Mover de "Em Discussão" → "Aprovado" após decisão do Hélio
3. **Implementação**: Quando implementada, mover para `CHANGELOG.md` e remover daqui
4. **Arquivamento**: Ideias rejeitadas → mover para seção "IDEIAS ARQUIVADAS" no final

---

## IDEIAS ARQUIVADAS

(Nenhuma ideia arquivada ainda)
