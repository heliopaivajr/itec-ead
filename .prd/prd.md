# PRD — Product Requirements Document
# ITEC-EAD — Plataforma de Ensino a Distância
# Instituto de Teologia Cristã — Janga, Paulista/PE
# Versão: 2.1 | Atualizado: 2026-05-26

---

## STATUS ATUAL — 2026-05-26

**Score auditoria:** 7.8/10 🟢
**Última auditoria:** 2026-05-26 (pós-Sprint D)
**Relatório:** `.ai-system/audit/2026-05-pos-sprint-d/report.md`

### ✅ Concluído e em produção

**INFRAESTRUTURA**
- React 18 + TypeScript + Vite + Tailwind + Shadcn UI
- Deploy GitHub → Vercel (itecedu.com)
- 8 headers de segurança (CSP atualizado)
- Code splitting + paginação server-side

**BANCO DE DADOS — 19 tabelas com RLS**
- `profiles`, `leads_cursos`, `matriculas`, `avisos`
- `equipe_itec`
- `cursos`, `modulos`, `disciplinas_v2`
- `prerequisitos_v2`, `excecoes_prerequisito`
- `professores`, `contratos_professor`
- `documentos_aluno`, `matriculas_disciplina`
- `frequencia`, `materiais`, `progresso_aluno`
- `taxa_matricula`, `mensalidades`, `convalidacoes`
- Seed: Graduação em Teologia, 6 módulos, 40 disciplinas, 22 pré-requisitos reais

**SERVICES — 14 (zero `supabase.from` em pages/components)**
- auth, profile, leads, avisos
- dashboard, cursos, usuarios, matriculas
- academico, professor, frequencia
- matricula-academica, financeiro, material

**TESTES**
- 48 testes passando (Vitest + Testing Library)
- Cobertura: ProtectedRoute, ReservarVaga, leads, auth, profile, avisos, dashboard, cursos

**LANDING PAGE — 8.5/10**
- `/reservar-vaga` com LGPD
- `/privacidade` com conteúdo real
- Zero 404s, zero botões sem função

**DASHBOARD — ALUNO**
- MeusCursos: disciplinas, frequência, materiais, alertas, eletivas

**DASHBOARD — PROFESSOR**
- ProfessorHome: disciplinas ativas + alunos em risco
- LancarFrequencia: chamada por data, nome real do aluno
- VerTurma: tabela com filtros + exportar CSV
- ContratoForm: preenchimento + status

**DASHBOARD — SECRETARIA**
- NovaMatricula: stepper 3 etapas + upload docs
- Matriculas: aba pendentes + aprovar/rejeitar
- Financeiro: inadimplentes, pagamentos, mensalidades
- Convalidacoes: listar, encaminhar, nova solicitação

**SEGURANÇA**
- RLS em todas as tabelas
- ProtectedRoute bloqueia role `pendente`
- `VITE_SUPERADMIN_EMAIL` removido do bundle
- CSP sem domínios de prototipagem

### 🔲 Pendente (próximos sprints)
- Testes dos 6 novos services (Sprint T3)
- Encapsular `supabase.from` em NovaMatricula.tsx e Convalidacoes.tsx
- LIMIT em 3 services (academico, professor, material)
- Geração de PDF do contrato do professor
- Painel admin: aprovar convalidações e exceções de pré-requisito
- E-mail automático (cobrança, alertas, confirmação de matrícula)
- Financeiro automático (PIX/boleto via Asaas)
- Certificado de conclusão em PDF com QR Code
- Vídeos EAD com progresso real
- SETEB e Ministerial para Mulheres

---

## 1. VISÃO DO PRODUTO

Plataforma EAD institucional do ITEC para gestão acadêmica completa
do curso de Graduação em Teologia — matrícula, frequência, materiais,
contratos de professores, financeiro e convalidações.

**Site:** https://www.itecedu.com
**Staging:** https://itec-ead.vercel.app
**Stack:** React 18 + TypeScript + Vite + Tailwind + Shadcn UI + Supabase

---

## 2. CURSO ATIVO

### Graduação em Teologia
- **Duração:** 3 anos — 6 módulos semestrais
- **Carga horária:** 1850h — 185 créditos
- **Turma:** 20–30 alunos
- **Dias:** Seg/Qua/Sex 18h45–22h (regulares) · Ter/Qui (eletivas)
- **Início próxima turma:** Agosto/2026
- **Modalidade:** Híbrida (presencial + EAD gravado futuro)

### Estrutura de módulos

| Módulo | Período | Ano |
|--------|---------|-----|
| 1 | Fev–Jun | 1º ano |
| 2 | Ago–Dez | 1º ano |
| 3 | Fev–Jun | 2º ano |
| 4 | Ago–Dez | 2º ano |
| 5 | Fev–Jun | 3º ano |
| 6 | Ago–Dez | 3º ano |

### Eletivas
- 10 disponíveis no total
- Aluno escolhe 5 gratuitamente (Hebraico I obrigatória)
- Outras 5 pagas por crédito

### Codificação de disciplinas
Padrão: `[Área][Ano][Sigla3letras][E se eletiva]`
- B = Bíblia | T = Teologia | P = Prática Ministerial
- Exemplo: B1ATG = Bíblia, 1º ano, Antigo Testamento Geral

---

## 3. CURSOS FUTUROS (apenas LP por enquanto)

- **SETEB** — Educação Teológica Básica
  Presencial · Terças 19h–20h · 3 anos
  → Interessados: entrar em contato com a secretaria

- **Ministerial para Mulheres**
  Presencial · Quintas 19h–22h · 7 disciplinas/ano
  → Interessados: entrar em contato com a secretaria

**Regra:** Nenhum destes cursos entra no banco agora.
Apenas apresentados na LP com CTA de contato.

---

## 4. ROLES E PERMISSÕES

### Roles ativos

| Role | Quem | Acesso |
|------|------|--------|
| `superadmin` | Hélio Paiva Jr. | Tudo — configurações, aprovações, exceções |
| `admin` | Diretor Acadêmico / Educador Teológico | Gestão acadêmica completa |
| `administracao` | Secretaria | Alunos, matrículas, docs, financeiro, e-mails |
| `professor` | Docentes | Frequência, contrato, manual da disciplina |
| `aluno` | Alunos matriculados | Dashboard próprio |
| `pendente` | Novo cadastro | Tela de aguardo apenas |

### Roles sugeridos (fase 2)

| Role | Quem | Acesso |
|------|------|--------|
| `coordenacao` | Pr. Helio + Prof. Andrea | Convalidações, pré-requisitos |
| `reitoria` | Pr. Eliel + Rev. Alan | Relatórios, visão geral |
| `juridico` | Adv. Hugo | Leitura de contratos |
| `financeiro` | Rev. Breno | Gestão financeira completa |

---

## 5. FLUXO COMPLETO DO ALUNO

### 5.1 Captação
```
Online: /reservar-vaga → lead salvo
Presencial: secretaria cadastra lead
→ Secretaria entra em contato → convite para matrícula
```

### 5.2 Matrícula
```
Online ou presencial →
Preenche formulário + anexa documentos →
Status: PENDENTE →
Aluno vai ao ITEC fisicamente (validação obrigatória) →
Secretaria confere documentos →
Aluno paga taxa de matrícula →
Secretaria registra pagamento →
Status: ATIVA →
Role muda: pendente → aluno →
Acesso ao dashboard liberado
```

**Documentos obrigatórios:**
- RG e CPF (cópias)
- Certidão de nascimento ou casamento
- Histórico + certificado ensino médio
- 2 fotos 3x4
- Comprovante de residência
- Carta de indicação pastoral
- Comprovante de pagamento da taxa de matrícula

### 5.3 Durante o curso
- Ver disciplinas do módulo atual
- Acompanhar frequência com alertas de limite
- Acessar e baixar materiais por disciplina
- Ver situação financeira (mensalidades)
- Solicitar convalidação via secretaria
- Solicitar exceção de pré-requisito via coordenação

### 5.4 Situações especiais

**Convalidação:**
```
Aluno solicita → Secretaria registra docs →
Coordenador analisa → Superadmin aprova →
Disciplina = "convalidada" no histórico
```

**Exceção de pré-requisito:**
```
Aluno solicita → Coordenador recomenda →
Superadmin aprova → Sistema libera + registra
```

**Cancelamento:**
```
Multa 1,5 mensalidade + quitação de pendências +
documentos retidos até quitação total
```

---

## 6. FLUXO DO PROFESSOR
```
Admin cadastra professor →
Professor recebe convite + preenche perfil →
Admin vincula professor a disciplina →
Sistema gera formulário de contrato →
Professor preenche dados na plataforma →
Sistema gera PDF →
Secretaria imprime → ambos assinam fisicamente →
Professor acessa manual da disciplina →
Professor lança frequência por aula →
Fim do contrato: vínculo encerra, cadastro permanece
```

**Contrato por disciplina:**
- Um contrato por disciplina lecionada
- Status: pendente → preenchido → impresso → assinado
- Futuro: assinatura digital online

**Manual da disciplina:**
- Upload pelo superadmin ou admin
- Status: pendente / disponível
- Professor faz download antes de iniciar

---

## 7. FINANCEIRO

**Estrutura:**
- Taxa de matrícula: paga uma vez na entrada
- Mensalidades: cobradas mensalmente
- Eletivas extras: cobradas por crédito (além das 5 gratuitas)
- Multa cancelamento: 1,5 mensalidade vigente

**Secretaria gerencia:**
- Registrar pagamentos
- Ver inadimplentes
- Enviar e-mail de cobrança (manual agora)
- Aplicar isenção/bolsa com justificativa
- Relatório de inadimplência

**Futuro (não implementar agora):**
- Cobrança automática PIX/boleto (Asaas)
- E-mail automático de cobrança
- IA financeira
- Nota fiscal eletrônica

---

## 8. PRÉ-REQUISITOS DAS DISCIPLINAS

- NT I → NT II → NT III → NT IV
- AT I → AT II → AT III → AT IV
- Teol. Sist. I → II → III → Escatologia
- Grego I → Grego II (co-req Exegese NT)
- Hebraico I → Hebraico II (co-req Exegese AT)
- Bibliologia → Hermenêutica
- Homilética I → Homilética II
- Aconselhamento I → Aconselhamento II
- Missiologia I → II → III → IV
- História Igreja I → II

**Exceção:** Somente superadmin aprova.
**Registro obrigatório:** disciplina, aluno, aprovador, motivo, data.

---

## 9. SCHEMA DO BANCO (Sprint D)

### Tabelas a criar
- `equipe_itec`
- `cursos` · `modulos` · `disciplinas`
- `prerequisitos_disciplinas` · `excecoes_prerequisito`
- `professores` · `contratos_professor`
- `matriculas` (expandir) · `documentos_aluno`
- `matriculas_disciplina` · `convalidacoes`
- `frequencia` · `materiais` · `progresso_aluno`
- `taxa_matricula` · `mensalidades`

### Tabelas existentes (manter)
- `profiles` · `leads_cursos` · `matriculas` · `avisos`

---

## 10. FORA DO ESCOPO AGORA

- 🔲 Assinatura digital de contratos
- 🔲 Cobrança automática PIX/boleto
- 🔲 E-mail automático
- 🔲 Vídeos EAD com progresso
- 🔲 SETEB e Ministerial para Mulheres
- 🔲 IA financeira e educacional
- 🔲 Biblioteca virtual
- 🔲 App mobile
- 🔲 Pós-graduação
