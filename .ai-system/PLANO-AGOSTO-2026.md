# PLANO DE LANÇAMENTO — AGOSTO 2026
Data: 2026-06-02
Prazo: 8 semanas
Desenvolvedor: Hélio Paiva Jr.
Status: EM EXECUÇÃO

---

## Cronograma

| Semana | Sprint | Foco | Entrega |
|--------|--------|------|---------|
| 1 | Sprint M | Histórico + Turmas + Declaração | Camila opera completo |
| 2 | Sprint N | Calendário UI editável | Grade de aulas visível |
| 3 | Sprint RLS | RLS + correções críticas | Segurança antes de alunos reais |
| 4 | Sprint PDF | PDFs essenciais | Documentos impressos |
| 5-7 | App Mobile v1 | React Native + Expo | Aluno no celular |
| 8 | Testes + Deploy | Qualidade + lançamento | GO LIVE |

---

## O que entra em agosto (escopo fechado)

### Sistema Web
- Histórico acadêmico completo (notas N1/N2/Rec, faltas %, aprovação/reprovação)
- Declaração de Matrícula PDF
- Lista de alunos por turma imprimível
- Calendário UI editável (secretaria edita, todos visualizam)
- Aprovação de matrícula (pendente → ativa)
- Alerta de alunos em risco no dashboard da secretaria
- RLS em `profiles` (segurança obrigatória com alunos reais)
- Boletim de Notas PDF
- Relatório de Turma PDF

### App Mobile v1
- Login com email e senha
- Dashboard do aluno (notas, frequência)
- Avisos do ITEC
- Calendário da turma
- Materiais/apostilas para download

---

## O que SAI (V2 — setembro/outubro)

- Certificados por módulo e final
- Upload real de documentos (checklist visual cobre agosto)
- Relatórios avançados
- Lançamento de notas/faltas pelo app
- EAD (vídeos, player, fórum, ao vivo)
- Multi-campus

---

## Pré-requisitos antes do App Mobile (semana 5)

- [ ] Conta Expo criada em expo.dev
- [ ] Ícone do app ITEC EAD (PNG 1024×1024)
- [ ] Decisão: biblioteca de calendário ou CSS Grid próprio (⚠️ avisar Hélio antes)
- [ ] Sprints M e N concluídos (APIs prontas para o mobile consumir)

---

## Risco principal

App mobile em 3 semanas — mínimo viável:

| Feature | Status |
|---------|--------|
| Login | **OBRIGATÓRIO** — não cortar |
| Notas | **OBRIGATÓRIO** — não cortar |
| Frequência | **OBRIGATÓRIO** — não cortar |
| Avisos | IMPORTANTE — cortar só se necessário |
| Calendário | PODE CORTAR se semana 7 atrasar |
| Materiais | PODE CORTAR se semana 7 atrasar |

## Regra de corte (semana 7)

Se a semana 7 chegar com escopo incompleto:
- **Manter:** login, notas, frequência
- **Cortar:** calendário app, materiais app

---

## Regra de ouro do sprint

**NUNCA adicionar escopo novo durante uma semana de sprint.**
Se surgir ideia nova → registrar em `.ai-system/ROADMAP-FUTURO.md` → avaliar para V2.

---
*Plano fechado 2026-06-02 · Hélio Paiva Jr.*
