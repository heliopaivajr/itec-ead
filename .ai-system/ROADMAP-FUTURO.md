# Roadmap Futuro — ITEC-EAD
**Planejamento pós-Sprint P (após agosto 2026)**
Data: 2026-06-02
Aprovado por: Hélio Paiva Jr.

> Os sprints L-P constam em `.ai-system/ROADMAP-SPRINTS.md`.
> Este documento cobre o que vem depois do lançamento.

---

## Visão Geral de Fases

| Fase | Nome | Período | Foco |
|------|------|---------|------|
| **Q** | Lançamento e Estabilização | Agosto-Setembro 2026 | Uso real + correções |
| **R** | Automação e IA | 2º semestre 2026 | Processos automáticos + IA |
| **S** | EAD Completo | 2027 | Vídeo, quizzes, ao vivo |
| **T** | Expansão | 2027-2028 | Multi-campus, marketplace |

---

## FASE Q — Lançamento e Estabilização (Agosto-Setembro 2026)

### Q1 — Testes com usuários reais (2 semanas pós-lançamento)

- [ ] Camila (secretaria) usa o sistema em produção por 2 semanas
- [ ] Professores lançam notas e faltas reais das turmas ativas
- [ ] Alunos acessam histórico acadêmico e notas
- [ ] Coletar feedback estruturado (formulário ou reunião semanal com Camila)
- [ ] Cadastrar todos os alunos retroativos de 2025 (turma TEO-2025-1)
- [ ] Verificar se `codigo_itec` está sendo gerado corretamente para novos cadastros

### Q2 — Sprint de Correções Pós-Lançamento

- [ ] Bugs reportados pela Camila e professores (prioridade máxima)
- [ ] Ajustes de UX baseados no uso real (não no que imaginamos)
- [ ] **RLS em `profiles`** (TODO-SPRINT-L-002 — CRÍTICO, não pode ficar para depois)
- [ ] Performance se necessário (monitorar Supabase → Logs → Slow queries)
- [ ] Upload de documentos do aluno (TODO-SPRINT-L-001)

### Critério de conclusão da Fase Q
> O sistema está estável quando Camila consegue trabalhar 1 semana completa
> sem acionar o Hélio para nenhum problema operacional.

---

## FASE R — Automação e IA (2º semestre 2026)

### R1 — Automação de Processos

| Feature | Descrição | Dependência |
|---------|-----------|-------------|
| Boletins mensais automáticos | Gerados e enviados por email no fechamento do mês | Emails configurados (Resend) |
| Alerta de aluno em risco | Email automático para aluno + secretaria quando frequência < 75% | Sprint M concluído |
| Declarações automáticas | Aluno solicita, sistema gera e envia por email | Sprint P concluído |
| Notificações push (PWA) | Alertas de notas, avisos, faltas | PWA configurada |
| Relatórios para diretoria | PDF automático mensal: resumo de turmas, inadimplência, frequência | Sprint P concluído |
| Renovação semestral | Matrícula automática para próximo semestre (com aprovação secretaria) | Calendário Sprint N |
| Cobrança automática | PIX via Asaas — boleto gerado automaticamente por aluno | Conta Asaas (Hélio pendente) |

### R2 — IA Aplicada ao ITEC

| Feature | Descrição | Complexidade |
|---------|-----------|-------------|
| Assistente IA para alunos | Chat para tirar dúvidas sobre matérias, horários, notas | M — Claude API |
| Análise preditiva de evasão | Identificar alunos com padrão de risco antes que abandonem | G — modelo de ML simples |
| Recomendação de conteúdo | Sugerir materiais extras baseado no desempenho por disciplina | M — embeddings |
| Correção automática | Avaliações objetivas (múltipla escolha) corrigidas automaticamente | M |
| Resumos de aula com IA | Professor grava → IA gera resumo texto para alunos | G — transcrição + sumarização |
| Transcrição automática | Aulas gravadas → texto + timestamps para busca | G — Whisper ou similar |

> **Nota Hélio:** Verificar APIs disponíveis em `github.com/heliopaivajr/public-apis`
> antes de contratar qualquer serviço de IA ou automação.

---

## FASE S — EAD Completo (2027)

### S1 — Infraestrutura de Vídeo

> Decisão de tecnologia segue ADR-004 (Vídeos EAD — proposto).
> Usar YouTube não listado no início (fase gratuita), Cloudflare Stream depois.

| Feature | Descrição |
|---------|-----------|
| Player de vídeo integrado | Aulas gravadas com player próprio (sem YouTube interface) |
| Upload de aulas por professores | Interface de upload + compressão automática |
| Controle de progresso | Aluno assistiu X% da aula → registrado em `progresso_aluno` |
| Quiz vinculado à aula | Perguntas aparecem em momentos específicos do vídeo |

### S2 — Interação e Comunicação

| Feature | Descrição |
|---------|-----------|
| Fórum por disciplina | Dúvidas assíncronas por disciplina (professor responde) |
| Chat em tempo real | Durante aulas ao vivo |
| Videoconferência integrada | Jitsi Meet (gratuito) ou similar — **consultar APIs do Hélio antes** |
| Aulas ao vivo agendadas | Integrado ao calendário (Sprint N) |

### S3 — Modelos de Ensino

```
Presencial (atual)
  ↓ adicionar vídeos complementares
Híbrido (presencial + vídeos)
  ↓ aumentar carga EAD
EAD Puro (100% online)
```

Cada curso pode ter modelo diferente. A tabela `disciplinas_v2`
já tem `carga_horaria_presencial` e `carga_horaria_ead`.

### S4 — Mobile

- [ ] App React Native/Expo (iOS + Android)
- [ ] Funcionalidades básicas: notas, frequência, materiais, avisos, calendário
- [ ] Notificações push nativas
- [ ] Modo offline para materiais baixados

---

## FASE T — Expansão (2027-2028)

### T1 — Multi-Campus

- [ ] Isolamento de dados por unidade (row-level por `campus_id`)
- [ ] Dashboard central para a diretoria (visão consolidada)
- [ ] Cada campus tem sua própria secretaria
- [ ] Cursos e disciplinas compartilhados ou independentes

### T2 — Marketplace de Cursos

- [ ] Cursos livres online avulsos (sem matrícula formal)
- [ ] Venda unitária ou por assinatura
- [ ] Gateway de pagamento (Stripe ou Asaas)
- [ ] Certificado de conclusão de curso livre

### T3 — Comunidade

- [ ] Rede de egressos do ITEC
- [ ] Grupos por turma (comunicação pós-conclusão)
- [ ] Mural de oportunidades ministeriais
- [ ] Perfil público do egresso

---

## Decisões Já Tomadas (referência)

| Decisão | Arquivo |
|---------|---------|
| ADR-006 — user_roles para RLS | `.ai-system/adr/ADR-006-...md` |
| ADR-007 — Calendário híbrido | `.ai-system/adr/ADR-007-...md` |
| TODO-SPRINT-L-002 — RLS antes de agosto | `known-errors.md` |
| TODO-SPRINT-L-001 — Upload docs | `known-errors.md` |
| DECISAO-PRODUTO-001 — Upload adiado | `lessons-learned.md` |
| ADR-004 — Vídeos EAD (proposto) | `.ai-system/adr/ADR-004-...md` |
| ADR-005 — Certificados (proposto) | `.ai-system/adr/ADR-005-...md` |

---

## Pré-requisitos Externos Pendentes (Hélio fazer)

| Item | Quando | Para que |
|------|--------|---------|
| Conta Resend (email transacional) | Antes de Sprint R1 | Alertas automáticos, declarações por email |
| Conta Asaas com CNPJ | Antes de Sprint R1 | Cobrança automática PIX |
| Aprovação mockup certificado | Antes de Sprint O | Certificado PDF com layout correto |
| Assinaturas PNG (Pr. Eliel + Hélio) | Antes de Sprint O | Certificado com assinatura digital |
| Decisão de plataforma de vídeo | Antes de Sprint S1 | YouTube não listado vs Cloudflare Stream |

---

## Princípios para o Futuro

1. **Camila primeiro** — toda feature nova passa pelo teste: "a Camila consegue usar sem treinamento extenso?"
2. **APIs externas → consultar repositório do Hélio primeiro** — `github.com/heliopaivajr/public-apis`
3. **IA como assistente, não substituição** — professores e secretaria continuam no controle
4. **Lançar cedo, iterar sempre** — MVP sólido em agosto, melhorar com feedback real
5. **Segurança não é opcional** — RLS antes de escalar, LGPD em toda feature nova com dados pessoais

---
*Roadmap Futuro ITEC-EAD · Hélio Paiva Jr. · 2026-06-02*
*Revisado a cada sprint com base na realidade do uso*
