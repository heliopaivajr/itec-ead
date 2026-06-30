# ITEC-EAD — Plano Mestre v2.1 (Núcleo Acadêmico + Gestão de Matrículas)

**Disciplinas · Currículo · Matrículas como Processo · Manuais · Convalidação · Notas · Frequência · Financeiro · Portais**
**Personas: Aluno · Professor · Secretaria · Coordenador/Direção**

> Documento de planejamento SDD (spec antes de código). Nada aqui é código.
> Versão 2.1 — 19/06/2026 · Sprint Semana 5/8 · Meta: lançamento Agosto/2026.
> Substitui a v2.0. Incorpora: diagnóstico Bloco 0 confirmado, reconciliação de currículo com o Manual ITEC (rev.02/25), e as decisões do Hélio.
> **Regra de ouro:** um bloco/sprint por vez. Cada sprint = SDD completa (spec → aprovação → auditoria → execução → testes → validação → PR/merge → Osábio).

---

## 0. CHANGELOG v2.0 → v2.1 (o que o Claude Code precisa saber que mudou)

| # | Mudança |
|---|---------|
| 1 | **Bloco 0 fechado.** Schema real confirmado (ver §2). |
| 2 | **D1 resolvido:** `status` de `matriculas` = **feminino** (já é no banco). Migração de status vira **aditiva** (sem migrar gênero). |
| 3 | **D2 resolvido:** `notas_aluno` = parciais; `matriculas_disciplina.nota` = final. Final **configurável: média simples OU ponderada** (`avaliacoes.peso`). **Nota de corte = 7,0**. Frequência mínima = **75%**. |
| 4 | **D3 resolvido:** `disciplinas_v2` é cópia fiel do Manual (46 cadeiras). Códigos da v2 ≠ Manual → **padronizar v2 = código do Manual** e **re-apontar os 24 pré-requisitos** para `disciplinas_v2`. |
| 5 | **Roadmap reordenado:** popular antes de visualizar. Nova trilha **R0 → R0.5 → R1 → R2 → R3 → R4**, depois Blocos 4/7/8/9 do v2.0. |
| 6 | **Currículo flexível (novo):** Coordenador faz **CRUD total** de cadeiras (código, CH, área, tipo, pré/co-req) — todas as colunas editáveis. |
| 7 | **Manuais (novo):** manual da cadeira (professor) + manual do aluno (institucional). Reuso de schema, **sem tabela nova**. Aprovação via `status_manual`. Versionamento. |
| 8 | **Convalidação (novo):** fluxo completo reusando `status='convalidado'` em `matriculas_disciplina` + colunas. |
| 9 | **Número de matrícula (novo):** formato **`ITEC25T001`**. |
| 10 | **Lançamento Retroativo (novo):** ferramenta para a secretaria encaixar, aluno por aluno, cadeiras + notas + faltas + professor + observações (dados 2025). |

---

## 1. DECISÕES TRAVADAS (lock-in)

| Dec. | Resolução |
|------|-----------|
| **D1 — Gênero do status** | `matriculas.status` **feminino** (`pendente·ativa·inativa·trancada·evadida·concluida·suspensa`, já no CHECK). Expandir com funil (aditivo): `pre_matricula·aguardando_documentos·aguardando_pagamento·aguardando_aprovacao·cancelada`. |
| **D2 — Notas** | `notas_aluno` = parciais (por `avaliacoes`, ponderadas por `peso`); `matriculas_disciplina.nota` = final. Final = **média simples (padrão) ou ponderada** (config por cadeira/turma). **Aprovação: média ≥ 7,0 E presença ≥ 75%.** |
| **D3 — Códigos** | Padronizar `disciplinas_v2.codigo` = código do Manual; re-apontar `prerequisitos_disciplinas` (FK) para `disciplinas_v2`; depreciar a tabela legada `disciplinas`. |
| **Nomes** | Sistema usa **nomes abreviados** (padrão v2). |
| **Nº matrícula** | Formato **`ITEC25T001`** (`ITEC` + ano 2 díg + `T` curso + 3 díg sequenciais). |

---

## 2. SCHEMA ACADÊMICO REAL v1 (confirmado — Bloco 0)

### Tabelas-núcleo e FKs reais
- `cursos`(uuid) ← `turmas`(curso_id) ← `matriculas`(turma_id) ; **`matriculas.curso_id` é TEXT sem FK** (dívida técnica #5).
- `cursos` ← `modulos`(curso_id) ← `disciplinas_v2`(modulo_id).
- `matriculas`(aluno_id→profiles) ← `matriculas_disciplina`(matricula_id; disciplina_id→**disciplinas_v2**).
- `notas_aluno`(avaliacao_id→**avaliacoes**; aluno_id→profiles; disciplina_id→disciplinas_v2; turma_id→turmas).
- `avaliacoes`(disciplina_id→disciplinas_v2; turma_id→turmas; tipo CHECK `N1·N2·recuperacao·trabalho·extra`; **peso** default 1.0).
- `solicitacoes_disciplina` = **professor↔disciplina↔turma** (gera contrato) — NÃO é escolha do aluno.
- `prerequisitos_disciplinas`(disciplina_codigo, prerequisito_codigo, tipo `formal|recomendado`) → FK para **`disciplinas` LEGADA** (corrigir em R0).

### CHECKs reais
- `matriculas.status`: pendente·ativa·inativa·trancada·evadida·concluida·suspensa (feminino).
- `matriculas_disciplina.status`: cursando·aprovado·reprovado·reprovado_falta·convalidado·trancado.
- `disciplinas_v2.tipo`: regular·eletiva·obrigatoria · `.area`: B·T·P · `.status_manual`: pendente·disponivel.
- `taxa_matricula.status`: pendente·pago·isento · `notas_aluno.nota`: 0–10.

### Achados (estado dos dados)
| # | Achado | Ação |
|---|--------|------|
| F1 | `matriculas_disciplina` = **0 linhas** → 31 alunos "ativo sem disciplina" | Lançamento Retroativo (R2) |
| F2 | `contratos_professor`=0, `solicitacoes_disciplina`=0 → nenhum professor vinculado | Vincular na entrada retroativa |
| F3 | **`notas_aluno` sem policy RLS** (deny-all); `avaliacoes` só SELECT | Criar policies (R3) |
| F4 | `matriculas` sem policy "aluno vê própria" (só `is_staff()`) | Adicionar no portal do aluno (R3) |
| F5 | `matriculas.curso_id` TEXT sem FK | Dívida técnica (futuro) |
| F6 | `disciplinas_v2.codigo` ≠ Manual; legada = Manual | Padronizar (R0) |

### Volumetria
cursos 1 · turmas 3 (TEO-2025-1=24, TEO-2026-1=7, TEO-2026-2=0) · modulos 6 · disciplinas_v2 46 · disciplinas(legada) 46 · prerequisitos 24 · professores 10 (8 ativos) · matriculas 31 (ativa 28/trancada 2/evadida 1).

---

## 3. CURRÍCULO OFICIAL (fonte: Manual ITEC rev.02/25 + planilha `ITEC_Fluxo_Disciplinas_v1.xlsx`)

185 créditos · 3 anos · 6 módulos · 1 crédito = 10h · CH = presencial + EAD.

### Matriz (46 cadeiras) — `cód_manual | cód_v2 | nome | área | tipo | pres/EAD/total | créd`

**1º Módulo**
- B1-ANT01 | B1ATG | Introdução ao AT I (Pentateuco) | B | regular | 30/10/40 | 4
- P1-ESPCR | P1ESC | Espiritualidade Cristã | P | regular | 30/10/40 | 4
- B1-BIBLI | B1BIB | Introdução Bíblica: Bibliologia | B | regular | **30/30/60** | 6
- B1-NOVO1 | B1NTG | Introdução ao NT I (Evangelhos) | B | regular | 30/10/40 | 4
- T1-TEOS1 | T1DOG | Teologia Sistemática I (Deus/Antropologia) | T | regular | 30/30/60 | 6
- P1-MISS1 | T1MIS | Missiologia I (Introdução) | **P** | regular | 30/30/60 | 6

**2º Módulo**
- B1-ANT02 | B1ATH | Introdução ao AT II (Históricos) | B | regular | 30/10/40 | 4
- T1-INTER-E | B1PIE | Período Interbíblico | **B** | eletiva | 30/10/40 | 4
- T1-HIST1 | T1HIG | História da Igreja I | T | regular | 30/30/60 | 6
- T1-TEOS2 | T1CRI | Teologia Sistemática II (Cristologia) | T | regular | 30/30/60 | 6
- B1-GREK1 | B1GRG | Língua Grega I | B | regular | 30/10/40 | 4
- T1-FILOS-E | T1FIE | Introdução à Filosofia | T | eletiva | 30/10/40 | 4
- B1-NOVO2 | B1NTA | Introdução ao NT II (Atos) | B | regular | 30/10/40 | 4
- T1-HIST2 | T1HIM | História da Igreja II | T | regular | 30/30/60 | 6

**3º Módulo**
- B2-GREK2 | B2GRK | Língua Grega II | B | regular | 30/10/40 | 4
- T2-HBRAS-E | T2HIB | História da Igreja do Brasil | T | eletiva | 30/10/40 | 4
- B2-ANT03 | B2ATP | Introdução ao AT III (Proféticos) | B | regular | 30/10/40 | 4
- T2-TEOS3 | T2SOT | Teologia Sistemática III (Soteriologia/Pneumatologia) | T | regular | 30/30/60 | 6
- B2-NOVO3 | B2NTP | Introdução ao NT III (Cartas Paulinas) | B | regular | 30/10/40 | 4
- T2-ARQCB-E | T2ARQ | Arqueologia e Costumes Bíblicos | T | eletiva | 30/30/60 | 6
- T2-ETICA | T2ETC | Ética Cristã | T | regular | 30/10/40 | 4
- T2-MISS2 | T2MIS | Missiologia II (Evangelismo) | **P*** | regular | 30/10/40 | 4

**4º Módulo**
- T2-HERMB | B2HER | Hermenêutica Bíblica | B | regular | 30/30/60 | 6
- B2-HEBR1-E | B2HEB | Língua Hebraica I | B | **obrigatoria** | 30/10/40 | 4
- B2-ANT04 | B2ATQ | Introdução ao AT IV (Poéticos) | B | regular | 30/10/40 | 4
- T2-MISS3 | T2MIH | Missiologia III (História em Missões) | **P*** | regular | 30/10/40 | 4
- B2-EXENT | B2EXT | Exegese do NT | B | regular | 30/10/40 | 4
- B2-HEBR2-E | B2HE2 | Língua Hebraica II | B | eletiva | 30/10/40 | 4
- T2-ESCTO | T2ESC | Escatologia | T | regular | 30/10/40 | 4
- B2-NOVO4 | B2NTG | Introdução ao NT IV (Cartas Gerais) | B | regular | 30/10/40 | 4

**5º Módulo**
- T3-MISS4 | T3MIP | Missiologia IV (Implantação) | **P*** | regular | **30/10/40** | 4
- B3-EXEAT-E | B3EAT | Exegese do AT | B | eletiva | 30/10/40 | 4
- P3-ACOS1 | P3ACO | Aconselhamento Bíblico I | P | regular | 30/30/60 | 6
- P3-ACOS2 | P3AC2 | Aconselhamento Bíblico II | P | regular | 30/30/60 | 6
- P3-HOMIT | P3HOM | Homilética I (Teoria) | P | regular | 30/30/60 | 6
- T3-TEOCO | T3TCO | Teologia Contemporânea | T | eletiva | 30/10/40 | 4
- P3-HOMIP | P3HO2 | Homilética II (Oratória/Prática) | P | regular | 30/10/40 | 4
- P3-LIDMI | P3LDM | Liderança Ministerial | P | regular | 30/30/60 | 6

**6º Módulo**
- P3-LITCU | P3LIT | Liturgia do Culto Cristão | P | regular | 30/10/40 | 4
- P3-CAPEL-E | P3CAV | Capelania e Visitação | P | eletiva | 30/10/40 | 4
- T3-APOLO | T3APO | Apologética | T | regular | 30/10/40 | 4
- B3-TEAT | T3GEO | Teologia do Antigo Testamento | **T** | regular | 30/30/60 | 6
- P3-PRATM | P3PRM | Prática Ministerial e Adoração | P | regular | 30/30/60 | 6
- T3-SEITA-E | T3SEI | Seitas e Heresias | T | eletiva | 30/10/40 | 4
- B3-TENT | T3TNT | Teologia do Novo Testamento | **T** | regular | 30/30/60 | 6
- P3-EDUCA | P3ECD | Educação Cristã e Discipulado | P | regular | 30/30/60 | 6

> `*` Missiologia II/III/IV: área **P** seguindo a diretriz "Missiologia = P" (ajustável pelo Coordenador). Código e área são independentes.

### Pré-requisitos (formal = trava) e Co-requisitos (recomendado = não trava) — em código v2
**Formais:** B1ATH←B1ATG · B2ATP←B1ATH · B2ATQ←B2ATP · B1NTA←B1NTG · B2NTP←B1NTA · B2NTG←B2NTP · T1CRI←T1DOG · T2SOT←T1CRI · T1HIM←T1HIG · B2GRK←B1GRG · B2HE2←B2HEB · P3HO2←P3HOM · P3AC2←P3ACO.
**Recomendados (co-req):** B2HER←{B1BIB, B1GRG, T1DOG} · B2EXT←{B2GRK, B2HER} · B3EAT←{B2HE2, B2HER} · T2ESC←T2SOT · T2MIS←T1MIS · T2MIH←T2MIS · T3MIP←T2MIH.

### Regra das eletivas (Manual §4b)
Aluno escolhe **5 de 10** eletivas, **incluindo Hebraico I (obrigatória)**. Eletivas extras = cobradas por crédito.

### Convenção do código v2 (para o Coordenador criar/revisar)
`ÁREA(1) + ANO(1) + ABREV(3)` = 5 caracteres, maiúsculas, único, sem hífen.
- Área: B=Bíblica · T=Teológica · P=Prática · Ano: 1·2·3 · Abrev: 3 letras; sequência troca a última letra por número (HEB→HE2, ACO→AC2, HOM→HO2).
- Ex.: `B1ATG`, `T2SOT`, `P3HO2`. Código é só rótulo (FKs usam `id`); mudar área não obriga mudar código.

---

## 4. ESPECIFICAÇÕES NOVAS (v2.1)

### 4.1 Número de matrícula
Formato **`ITEC25T001`** = `ITEC` + ano de ingresso (2 díg) + `T` (curso Teologia) + sequencial (3 díg). Reuso: coluna `matriculas.numero_matricula` (ALTER, sem tabela nova). Geração automática por ano; único.

### 4.2 Manuais (sem tabela nova)
| Manual | Armazenamento | Sobe/edita | Baixa | RLS |
|--------|---------------|------------|-------|-----|
| **Da cadeira** | `disciplinas_v2.manual_url` (já existe) + bucket **privado** `manuais-cadeira` | Coordenador, professor da cadeira | Coord/secretaria/professor da cadeira | Aluno **bloqueado no Storage** |
| **Do aluno** (institucional) | nova coluna `cursos.manual_aluno_url` + bucket `manuais-aluno` | Coordenador/secretaria | **Todos os matriculados** | leitura p/ aluno |

**Aprovação e versionamento (usa `status_manual`):**
1. Coordenador sobe → `status_manual='pendente'`.
2. Professor baixa → ajusta → re-sobe **nova versão** (`pendente`); **a antiga é mantida** no bucket.
3. Hélio/Coordenador **aprova** → `status_manual='disponivel'`; professor passa a usar a aprovada.
4. Coordenador **deleta a antiga** quando quiser (ou mantém como histórico). Toda troca → log de auditoria (Bloco 6).

### 4.3 Convalidação (Manual §9) — reuso de `matriculas_disciplina`
Objetivo: aluno vindo de outra instituição **não paga** a cadeira e **transfere a nota** para o ITEC.
- Status: `matriculas_disciplina.status='convalidado'` (já existe) · `nota` = nota transferida · `aprovado_por`.
- **Colunas novas** (ALTER em `matriculas_disciplina`, sem tabela nova): `convalidacao_instituicao` (text), `convalidacao_ch_origem` (int), `convalidacao_bate_ch` (bool), `convalidacao_justificativa` (text), `convalidacao_doc_url` (text — ementa/histórico anexado no Storage).
- **Tela (aba na Ficha 360 / dashboard):** lista as 46 cadeiras → por cadeira marca "convalidar", instituição de origem, CH origem × CH ITEC (bate?), nota transferida, justificativa, **anexo do documento**, quem aprovou. Filtro "alunos com status convalidado".
- **Regras (Manual §9):** não convalida **Estágios/TCC**; mínimo **30% dos créditos** cursados no ITEC; convalidada **não gera cobrança** (Bloco 8 entende `convalidado`). Quem faz: **secretaria ou coordenador**.

### 4.4 Pré-requisito / Co-requisito + override flexível
- Motor de elegibilidade: `formal` **bloqueia** matrícula; `recomendado` **não bloqueia** (mostra aviso).
- **Override:** secretaria/coordenador pode **liberar** (inclusive cursar dois ao mesmo tempo) **com justificativa** → registra como `recomendado/liberado` no aluno + **auditoria**.
- Tudo **editável** pelo Coordenador (add/mudar/deletar tipo `formal`/`recomendado`/`corequisito`). Se for preciso "cursar junto obrigatório", adicionar o tipo `corequisito`.

### 4.5 Notas e Frequência
- Final em `matriculas_disciplina.nota`: **média simples (padrão)** ou **ponderada** por `avaliacoes.peso` (config por cadeira/turma).
- **Aprovação:** média ≥ **7,0** E presença ≥ **75%**. Presença < 75% → `reprovado_falta` automático.
- Retroativo (2025): consolidado — número de `faltas`/`frequencia_percentual` em `matriculas_disciplina` (sem chamada por data). Chamada por data (Bloco 4) só para turmas ao vivo 2026.

---

## 5. MATRIZ DE PERMISSÕES (4 personas)

| Capacidade | Aluno | Professor | Secretaria | Coordenador |
|------------|:-----:|:---------:|:----------:|:-----------:|
| Ver próprias notas/faltas/cadeiras/relatórios | ✅ | — | ✅ | ✅ |
| Baixar **manual do aluno** | ✅ | ✅ | ✅ | ✅ |
| Ver/baixar/re-subir **manual da cadeira** | — | ✅ (própria) | ✅ | ✅ |
| Aprovar manual da cadeira | — | — | — | ✅ (+ Hélio) |
| Fazer convalidação | — | — | ✅ | ✅ |
| **CRUD currículo** (cadeiras, CH, código, área, pré/co-req — tudo editável) | — | — | 👁️ vê | ✅ edita |
| Lançar/editar notas e faltas | — | ✅ | ✅ (correção) | ✅ |
| Aprovar matrícula / vincular turma e disciplinas | — | — | ✅ | ✅ |
| Override de pré-requisito (justificado/auditado) | — | — | ✅ | ✅ |

> RLS separa as visões sobre as **mesmas** tabelas (LICAO-026: query separada + merge, nunca join aninhado).

---

## 6. ROADMAP REORDENADO (uma sprint por vez)

> Justificativa do reorder (ADR): sistema em produção + dados retroativos 2025 → **popular antes de visualizar**. Mantém todos os blocos do v2.0.

| Sprint | Objetivo | Schema (.sql que o Hélio executa) | Agentes | DoD-chave |
|--------|----------|-----------------------------------|---------|-----------|
| **R0 — Reconciliação** | Padronizar `disciplinas_v2.codigo`=Manual; re-apontar 24 pré-req p/ v2; depreciar legada | UPDATE codigo; re-FK prerequisitos | 14·02·04 | 46/46 alinhados; pré-req resolvem em v2 |
| **R0.5 — Gestão de Currículo** | CRUD total de cadeiras (código/CH/área/tipo) + pré/co-req + **upload manual da cadeira** + manual do aluno | buckets Storage + RLS; `cursos.manual_aluno_url` | 04·05·06·11 | Coordenador edita tudo; manuais sobem/baixam c/ RLS |
| **R1 — Schema retroativo + status** | Campos retroativos + dimensões de status + nº matrícula | ALTER matriculas (numero_matricula, status_financeiro/acesso/documentacao, CHECK funil); ALTER matriculas_disciplina (faltas, frequencia_percentual, observacao, convalidacao_*) | 02·04·11 | schema pronto; NOTIFY pgrst |
| **R2 — Lançamento Retroativo** | Secretaria encaixa aluno×cadeira: nota(s)+média, faltas, situação, professor, observação, convalidação | — (usa R1) | 05·06·12 | 1 aluno lançado ponta-a-ponta |
| **R3 — Ficha 360 + Dashboards + RLS** | Visões aluno/professor/secretaria; **policies de `notas_aluno`** + Storage; dashboards apresentáveis | RLS notas_aluno (aluno/professor/staff) | 06·05·11·17 | cada persona vê só o seu; telas apresentáveis (navy/dourado) |
| **R4 — Dashboard de Matrículas** | Bloco 1 do v2.0, já com dados reais | — | 02·05·06·11 | 7 áreas da tela; cards corretos |
| **B4·B7·B8·B9** | Chamada ao vivo 2026 · Escolha de disciplinas (aluno) · Financeiro Asaas · Relatórios | conforme v2.0 | conforme v2.0 | conforme v2.0 |

---

## 7. SPRINT TRACKER (o Claude Code DEVE manter atualizado)

> Legenda: ✅ feito · 🔵 em andamento · 🟡 pendente (decisão/input) · ⬜ não iniciado.

| Sprint | Spec | Auditoria prévia | Migration .sql | Implementação | Testes | RLS/Seg | PR/merge | Osábio | Status |
|--------|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:------:|
| Bloco 0 | — | ✅ | — | — | — | — | — | ✅ | **✅ FECHADO** |
| R0 | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | ✅ | **✅ FECHADO** (PR #13 merged; migração 047 **APLICADA** e validada 24/24/24) |
| R0.5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **✅ CONCLUÍDO** — R0.5.1 ✅ migração 048 · R0.5.2 ✅ adapter CursosAdmin v2 (PR #14) · R0.5.3 ✅ CRUD do Coordenador (PR #15) · Materiais da Disciplina ✅ (migração 049, PR #16) · Manual do Aluno ✅ (migração 050, PR #17). Próximo da trilha: **R1** |
| R1 | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | **✅ CONCLUÍDO** — schema retroativo (migração 051 APLICADA: numero_matricula + funil aditivo + gerar_numero_matricula + faltas/frequencia_percentual/observacao/convalidacao_*) + R1.2 tipos (interface `Matricula` alinhada, `StatusMatricula` union, observacao→observacoes, PR #18). Próximo: **R2** |
| R2 | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | **✅ CONCLUÍDO** — R2.2 ✅ Lançamento Retroativo (migrações 052/053, PR #19) + R2.3 ✅ Visão do Aluno (G4: histórico consolidado de `matriculas_disciplina`; tela "Meu Histórico" + PDF + progresso; PR #20 merged). Próximo: **R3** |
| R3 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 🔵 próximo — **REDEFINIDO como FRONTEND** (não-RLS). Diagnóstico R3.0 (2026-06-30): RLS de `notas_aluno` **já completa** (023/031, F3 ✅); refinamento professor-por-contrato adiado (F2). Sub-passos: **R3.1 AlunoView** (KPIs reais: cursos/freq/média) · **R3.2 ProfessorView** (dados reais: turmas/alunos/avaliações) · **R3.3 Painel da Secretaria** (pendências: matrículas a aprovar + docs) · **R3.4 Ficha 360** (convalidação + nº matrícula na ficha). Polir navy #1F3864 / dourado #BF9000. |
| R4 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 8. REGRAS INVIOLÁVEIS (consolidadas)

- **ERR-INFRA-001:** migrations só por `.sql` que o **Hélio** executa no SQL Editor. Claude Code cria o arquivo, nunca roda CLI.
- **LICAO-026:** sob RLS → query separada + merge em memória. Nunca join aninhado.
- **PADRAO-001:** `as unknown as X[]` é o padrão correto p/ joins Supabase — não "corrigir".
- **Soft delete** sempre p/ histórico acadêmico/financeiro.
- **Build 0 erros TS** (`tsc -p tsconfig.app.json`) antes de qualquer commit.
- **`NOTIFY pgrst 'reload schema'`** após todo ALTER TABLE.
- **Git:** push → PR → merge → `git checkout main` → `git pull` → `git branch -d`.
- **Supabase MCP é READ-ONLY** (diagnóstico). **pnpm** exclusivamente.
- **Auditoria** em toda mutação: quem · o quê · antigo→novo · quando · por quê.
- **Toda saída de agente exige aprovação humana** antes de publicar. **Osábio propõe, nunca aplica** sem OK do Hélio.

---

## 9. INSTRUÇÕES PARA O CLAUDE CODE (Antigravity)

1. **Leia este arquivo no início de toda sessão.** Ele é a fonte da verdade da fase atual.
2. **Atualize o §7 (Sprint Tracker)** ao concluir cada etapa de cada sprint — não deixar desatualizar.
3. **Espelhe** em `.ai-system/memory/`: salve este doc como `PLANO-MESTRE-v2_1.md`; atualize `ROADMAP-SPRINTS.md` com R0→R4; registre em `lessons-learned.md` as decisões D1/D2/D3 e a convenção de código v2; registre em `known-errors.md` os achados F1–F6 e os erros antigos (trigger recursivo `trg_sync_user_roles`, embed ambíguo PGRST201, enum feminino/masculino).
4. **Currículo:** importe a matriz do §3 (ou a planilha `ITEC_Fluxo_Disciplinas_v1.xlsx`) como referência de `disciplinas_v2`.
5. **SDD obrigatório:** nenhuma linha de código antes da spec do sprint aprovada pelo Hélio.
6. **Trabalhe um sprint por vez**, na ordem do §6. Ao abrir um sprint: spec → auditoria prévia → `.sql` (se houver) → implementação → testes → RLS/segurança → PR/merge → Osábio → marcar §7.
7. **Backlog parado** (resolver depois dos blocos de matérias): bug de login/sessão; versionar migrations 038-046 + Edge Function `criar-aluno`; corrigir dados (Fátima nasc. 2064, Icaro nasc. 2013, coluna Sexo Turma 01); decisão upgrade Supabase Free→Pro.

---

## 10. PENDÊNCIAS ABERTAS (aguardando Hélio)

- Missiologia II/III/IV: área **P** (assumido) ou **T**? — confirmar.
- Tipo `corequisito` (cursar junto obrigatório): criar agora ou só `formal`/`recomendado` por enquanto?
- Upgrade Supabase Pro (elimina cold start do bug de login): quando?

**Fim do Plano Mestre v2.1.** Trabalhar um sprint por vez. Cada sprint: spec → auditoria → execução → testes → validação → PR/merge → Osábio → atualizar o Tracker.
