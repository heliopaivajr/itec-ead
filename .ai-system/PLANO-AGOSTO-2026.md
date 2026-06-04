# PLANO DE LANÇAMENTO — AGOSTO 2026
Data: 2026-06-02
Prazo: 8 semanas
Desenvolvedor: Hélio Paiva Jr.
Status: EM EXECUÇÃO

---

## Cronograma

| Semana | Sprint | Foco | Entrega |
|--------|--------|------|---------|
| 1 | Sprint M ✅ | Histórico + Turmas + Declaração | Camila opera completo |
| 2 | Sprint N ✅ | Calendário UI editável | Grade de aulas visível |
| 3 | Sprint RLS | RLS + correções críticas | Segurança antes de alunos reais |
| 4 | Sprint PDF | PDFs essenciais | Documentos impressos |
| 5-6 | Financeiro + Asaas | PIX, cobranças, portal do aluno | Rev. Breno e Camila operam financeiro |
| 7 | Testes + Deploy | Qualidade + lançamento | GO LIVE |
| 8+ | App Mobile v1 (**V2**) | React Native + Expo | **Setembro/outubro** — pós-lançamento |

---

## O que entra em agosto (escopo fechado)

### Sistema Web
- ✅ Histórico acadêmico completo (notas N1/N2/Rec, faltas %, aprovação/reprovação)
- ✅ Declaração de Matrícula PDF
- ✅ Lista de alunos por turma imprimível
- Calendário UI editável (secretaria edita, todos visualizam)
- ✅ Aprovação de matrícula (pendente → ativa)
- ✅ Alerta de alunos em risco no dashboard da secretaria
- ✅ RLS em `profiles` + policies notas/frequencia/avaliacoes migradas para user_roles
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

## Pré-requisitos antes do Sprint Financeiro (semana 5)

- [ ] Rev. Breno Lima responde FINANCEIRO-PERGUNTAS.md
- [ ] Conta Asaas criada com CNPJ do ITEC + validada por Hugo
- [ ] Sprints M, N e RLS concluídos (base segura antes de dados financeiros reais)

> **App Mobile movido para V2 pós-agosto.**
> Motivo: Financeiro é mais crítico para a operação — sem cobrança automatizada,
> Camila gasta horas por mês em cobranças manuais via WhatsApp.

---

## ~~Risco principal — App Mobile~~ (V2 pós-agosto)

~~App mobile em 3 semanas — mínimo viável~~

Movido para setembro/outubro. Ver ROADMAP-FUTURO.md → App Mobile v1.

## Risco principal — Sprint Financeiro (semana 5-6)

Se a semana 7 chegar com escopo incompleto:
- **Manter:** login, notas, frequência
- **Cortar:** calendário app, materiais app

---

## Regra de ouro do sprint

**NUNCA adicionar escopo novo durante uma semana de sprint.**
Se surgir ideia nova → registrar em `.ai-system/ROADMAP-FUTURO.md` → avaliar para V2.

---
*Plano fechado 2026-06-02 · Hélio Paiva Jr.*
