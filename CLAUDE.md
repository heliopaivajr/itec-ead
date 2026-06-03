# CLAUDE.md — ITEC-EAD
# Lido automaticamente pelo Claude Code
# Atualizado: 2026-05-28

## Projeto
Plataforma EAD do Instituto de Teologia Cristã
Site: https://www.itecedu.com
Dev: Hélio Paiva Jr. (superadmin)
Score atual: **9.2/10** 🟢

## Comandos

```bash
pnpm dev           # Dev server http://localhost:8080
pnpm build         # Build de produção
pnpm lint          # ESLint
pnpm test:run      # 48 testes (one-shot)
pnpm test          # modo watch
pnpm test:coverage # relatório de cobertura
```

## Stack
- React 18 + TypeScript + Vite + Tailwind CSS + Shadcn UI
- Supabase (Auth + PostgreSQL + Storage + Realtime)
- Vercel (deploy automático via GitHub)
- pnpm (NUNCA usar npm — conflito no lockfile)

## Regras absolutas
- NUNCA usar npm — sempre pnpm
- NUNCA commitar .env ou .env.local
- NUNCA `supabase.from()` em `pages/` ou `components/` → SEMPRE usar `src/services/`
- NUNCA inserir usuários de teste via INSERT manual isolado em `auth.users` → SEMPRE usar `supabase/seed/seed_testes.sql` (inclui auth.identities obrigatório). Ver `supabase/seed/RUNBOOK.md`
- NUNCA especificar opções de status em dropdown/InlineStatusSelect sem antes verificar o CHECK constraint da tabela no banco
- Para edição inline de status em tabelas → SEMPRE usar `InlineStatusSelect` de `src/components/dashboard/`
  ⚠️ EXCEÇÃO REMANESCENTE: `Convalidacoes.tsx` — 2 lookups por email/código (encapsular — Sprint F)
  ✅ NovaMatricula.tsx migrado para matriculas.service (getAlunoByEmail, createMatricula, createTaxaMatricula)
- NUNCA magic strings de role — usar `UserRole` de `profile.service`
- RLS obrigatório em toda tabela com dados de usuário
- TypeScript strict — sem `any` implícito

## Arquitetura — Área Pública vs Dashboard

Duas áreas distintas no mesmo React Router:
- **Público** (`/`, `/cursos`, `/sobre`, `/reservar-vaga`, etc.) — sem auth
- **Dashboard** (`/dashboard/*`) — protegido pelo `ProtectedRoute`

`ProtectedRoute` verifica sessão + role. `pendente` → `/aguardando`. Role desconhecido → `/login`.

## Services (src/services/) — 14 total

### Com testes ✅ (8)
| Service | Responsabilidade |
|---|---|
| `auth.service.ts` | signIn, signOut, reset — erros em PT-BR |
| `profile.service.ts` | getRole (fallback `'pendente'`), getProfile, upsert |
| `leads.service.ts` | createLead + fallback localStorage |
| `avisos.service.ts` | CRUD de avisos + noTable detection |
| `dashboard.service.ts` | KPIs + listas paginadas |
| `cursos.service.ts` | disciplinas + syncPrerequisitos (rollback) |
| `usuarios.service.ts` | perfis admin — getUsuarios, updateRole, updatePerfil |
| `matriculas.service.ts` | getMatriculas paginado, getMinhasMatriculas, updateStatus |

### Sem testes — Sprint T3 pendente ⚠️ (6)
| Service | Responsabilidade |
|---|---|
| `academico.service.ts` | cursos, módulos, disciplinas, verificarPrerequisitos |
| `professor.service.ts` | CRUD professores + contratos (5 status) |
| `frequencia.service.ts` | lançamento batch, resumo ok/alerta/reprovado, join profiles |
| `matricula-academica.service.ts` | disciplinas, convalidações, exceções pré-req |
| `financeiro.service.ts` | mensalidades, inadimplentes, gerarMensalidadesMes |
| `material.service.ts` | materiais, progresso, uploadManualDisciplina |

`index.ts` — barrel export de todos os 14 services.

## Roles do sistema (completo)

| Role | Quem | Acesso principal |
|------|------|-----------------|
| superadmin | Hélio Paiva Jr. | Tudo |
| admin | Diretoria | Gestão acadêmica completa |
| administracao | Secretaria (Camila) | Matrículas, docs, financeiro básico |
| professor | Docentes | Frequência, contrato, materiais |
| aluno | Alunos matriculados | Dashboard próprio |
| pendente | Novo cadastro | Tela de aguardo |

Fallback seguro: `getRole()` retorna `'pendente'` se erro ou perfil não existir.
Role `superadmin` definido diretamente no banco (migration 004).

## Turmas
```
TEO-2025-1 → 1ª turma (Módulo 2 em 2026)
TEO-2026-1 → 2ª turma (Módulo 1 em 2026)
TEO-2026-2 → 3ª turma planejada (Ago/2026)
```

## Próximo Sprint
Sprint I:
- Tabela turmas + vincular matriculas (migrations 018-019)
- Ficha completa do aluno (secretaria)
- Gestão de turmas no dashboard

## Banco de dados — 19 tabelas (RLS em todas)

### Existentes
`profiles` · `leads_cursos` · `matriculas` · `avisos`

### Sprint D (migrations 007-014)
`equipe_itec` · `cursos` · `modulos` · `disciplinas_v2`
`prerequisitos_v2` · `excecoes_prerequisito`
`professores` · `contratos_professor`
`documentos_aluno` · `matriculas_disciplina`
`frequencia` · `materiais` · `progresso_aluno`
`taxa_matricula` · `mensalidades` · `convalidacoes`

## Migrations aplicadas (supabase/migrations/)
| # | Arquivo | Conteúdo |
|---|---|---|
| 001 | 20260525_001_rls_leads_cursos | RLS leads_cursos |
| 002 | 20260525_002_rls_matriculas | RLS matriculas |
| 003 | 20260525_003_rls_avisos_fix | RLS avisos (role fix) |
| 004 | 20260525_004_superadmin_role_db | Role superadmin via banco |
| 005 | 20260525_005_disciplinas_schema | Disciplinas retroativa + seed |
| 006 | 20260526_006_indices_paginacao | 6 índices paginação |
| 007 | 20260526_007_equipe_itec | equipe_itec + seed 8 membros |
| 008 | 20260526_008_estrutura_academica | cursos, módulos, disciplinas_v2, prereqs, exceções |
| 009 | 20260526_009_professores_contratos | professores + contratos |
| 010 | 20260526_010_matriculas_documentos | ALTER matriculas + documentos + matriculas_disciplina |
| 011 | 20260526_011_frequencia_materiais | frequencia + materiais + progresso_aluno |
| 012 | 20260526_012_financeiro | taxa_matricula + mensalidades |
| 013 | 20260526_013_convalidacoes | convalidacoes |
| 014 | 20260526_014_seed_itec | Teologia: 6 módulos, 40 disciplinas, 22 prereqs |

## Testes
```bash
pnpm test:run   # deve sempre passar 163/163
```
- Vitest + Testing Library + jsdom
- Mock global do Supabase em `src/test/setup.ts` (fluent builder)
- Testes em `src/test/` — services e componentes críticos
- ⚠️ 6 services Sprint D sem cobertura — ver Sprint T3
- ✅ DT-03 resolvido: LIMIT em todos os services (Sprint F2)

## ADRs
- ADR-001: decisões iniciais de arquitetura
- ADR-002: camada de serviços — **IMPLEMENTADO** (14 services)
- ADR-003: sistema de turmas — **IMPLEMENTADO** (Sprint I)
- ADR-004: estratégia de vídeos EAD — PROPOSTA
- ADR-005: sistema de certificados — PROPOSTA

## Auditoria
- Última: 2026-05-28 pós-Sprint I
- Score: 9.2/10
- Relatório: `.ai-system/audit/2026-05-dashboard-performance/report.md`
- Próxima meta: 9.5/10

## .ai-system/ — contexto separado
A pasta `.ai-system/` é um sistema documental independente
que roda no Claude.ai (Projetos), não no Claude Code.
Contém agentes, specs, auditorias e ADRs do projeto.
Não misturar com o código da plataforma web.

## Roadmap de Features

### Concluído
- Sprint A1-A5: bugs menores
- Sprint G+H: CRUD professores + equipe ITEC
- Sprint I: turmas + ficha aluno + role financeiro
- Sprint F2: performance N+1 + rotas + LIMITs

### Ordem dos Próximos Sprints (aprovado 2026-05-28)

| Sprint | Tema | Migrations | Status |
|--------|------|-----------|--------|
| **J** | Sistema de Notas e Avaliações | 022-023 | 🔴 Próximo — CRÍTICO |
| **K** | Documentos PDF + E-mail (Resend) | 022b | 🔜 |
| **L** | Vídeos EAD + Upload Materiais | 024 | 🔜 |
| **M** | Certificados + Portal Egresso | 025-026 | 🔜 |
| **N** | Calendário Acadêmico + Devocional | 027-028 | 🔜 |
| **O** | Financeiro PIX (Asaas) | 029 | 🔜 Requer conta Asaas |

Plano completo: `.ai-system/specs/plano-execucao-sprints-j-o.md`

### Pré-requisitos pendentes (Hélio fazer antes dos sprints)
- [ ] Criar conta Resend (resend.com) + configurar DNS → antes Sprint K
- [ ] Escanear assinaturas PNG (Pr. Eliel + Pr. Hélio) → antes Sprint M
- [ ] Aprovar mockup do certificado → antes Sprint M
- [ ] Abrir conta Asaas com CNPJ + validar com Hugo → antes Sprint O

### Regra de qualidade (obrigatória em TODO sprint)
Ciclo: `SPEC (19)` → `PLANO (20)` → `IMPL (05/06)` → `TESTES (10)` →
       `REVIEW (12)` → `SEGURANÇA (11)` → `AUDITORIA (14)` → `DOCS (18)` → `DEPLOY (09)`

- `pnpm test:run` deve passar 100% antes de qualquer commit
- Agente 14 (auditoria rápida) ao final de todo sprint
- Score meta: 9.5/10

## Infraestrutura — Plano de Evolução

### Agora (desenvolvimento)
Supabase Free + Vercel Free = $0/mês

### Lançamento (100-150 alunos)
Supabase Pro ($25) + Vercel Pro ($20) = $45/mês
- Sem pausas no banco
- Google OAuth reabilitado
- Backups automáticos

### Crescimento (150-500 alunos)
Supabase Pro + Vercel Pro + Cloudflare CDN
= ~$70/mês

### Escala (500-1000 alunos)
Avaliar migração para GCP
Cloud SQL + Firebase Auth + BigQuery
= ~$150/mês

### Grande escala (1000+ alunos)
GCP completo ou AWS
= $300-500/mês

## Vídeos EAD — Decisão Técnica

Estratégia em fases:
1. YouTube não listado (agora) — $0
   → Professor sobe vídeo no YouTube
   → Link adicionado no material
   → Aluno assiste via iframe no dashboard

2. Cloudflare Stream (150+ alunos) — $5/1000min
   → Upload direto no sistema
   → Player com logo ITEC
   → Rastreamento básico

3. Mux (300+ alunos) — $0.015/min
   → Rastreamento completo
   → Analytics de visualização
   → Qualidade adaptativa

## Certificados — Decisão Técnica

Tecnologia: @react-pdf/renderer (já instalado)
Padrão: mesmo do ContratoForm.tsx

Conteúdo do certificado:
- Nome completo e CPF do aluno
- Curso: Graduação em Teologia Livre
- Carga horária: 185 créditos
- Data de conclusão
- Assinatura: Pr. Eliel (Reitor)
- Assinatura: Pr. Hélio Paiva Jr. (Diretor)
- QR Code de verificação
- Número de registro único

Verificação pública:
itecedu.com/verificar/[codigo]
→ Mostra nome, curso, data, "Certificado válido ✅"

## Agentes Estratégicos (19 e 20)

### Quando usar

Use Agente 19 (product-analyst) quando:
- "O que está faltando na plataforma?"
- "O fluxo está correto para o ITEC?"
- "Quais campos preciso neste formulário?"
- Qualquer pergunta sobre O QUÊ e POR QUÊ

Use Agente 20 (project-manager) quando:
- "Como implementar isso sem bagunçar?"
- "Por onde começo?"
- "Qual a ordem das tarefas?"
- Qualquer pergunta sobre COMO e EM QUE ORDEM

### Fluxo padrão

1. Agente 20 classifica a demanda
2. Agente 19 analisa o negócio (se funcional)
3. Hélio aprova o plano
4. Agentes técnicos executam
5. Agente 19 valida o resultado
6. Agente 18 documenta
7. Push + deploy

### Regra de ouro

Agente 19 = O QUÊ e POR QUÊ
Agente 20 = COMO e EM QUE ORDEM
Hélio = decisão final sempre

## Roadmap de Sprints (2026)

Sprints planejados em ordem de execução (aprovados 2026-06-02):

| Sprint | Foco | Obrigatório agosto? |
|--------|------|---------------------|
| **L** | RLS + Edge Function + Foto + DB Calendário | 🔴 Sim |
| **M** | Histórico Acadêmico + Turmas + Declaração PDF | 🔴 Sim |
| **N** | Calendário UI editável completo | 🟡 Básico |
| **O** | Certificados por módulo e final | 🟢 Setembro |
| **P** | Impressões e relatórios completos | 🟡 Parcial |

Plano completo: `.ai-system/ROADMAP-SPRINTS.md`

**Antes de implementar qualquer feature nova:**
1. Verificar se já existe sprint planejado para ela em `ROADMAP-SPRINTS.md`
2. Verificar dependências entre sprints
3. Consultar ADR-007 para qualquer coisa relacionada ao calendário
4. Calendário é EDITÁVEL pela secretaria/admin/superadmin
5. Professor vê calendário em somente leitura
6. RLS deve estar ativo (Sprint L) antes de qualquer nova tabela de dados sensíveis

## REGRA CRÍTICA — APIs Externas e Bibliotecas Novas

ANTES de usar qualquer API externa, biblioteca nova ou recurso MCP não existente no projeto:

1. **PARAR e avisar o Hélio**
2. Informar:
   - Nome da API/biblioteca
   - Por que é necessária
   - Se é gratuita ou paga
   - Se tem limite de uso
   - Alternativa sem dependência externa (se existir)
3. **AGUARDAR aprovação explícita do Hélio**

Repositório de APIs disponíveis do Hélio:
https://github.com/heliopaivajr/public-apis.git
→ Consultar ANTES de sugerir APIs externas — pode já existir algo disponível

**Exemplos que requerem aviso obrigatório:**
- Biblioteca de calendário (FullCalendar, React Big Calendar, etc.)
- API de feriados nacionais
- Biblioteca de PDF diferente do `@react-pdf/renderer`
- Qualquer `npm install` de pacote não existente no `package.json`
- Qualquer MCP novo não conectado

**Exceções (não precisam de aviso):**
- `@react-pdf/renderer` — já instalado
- Todas as bibliotecas listadas no `package.json` atual
- Shadcn/ui components — já configurado
- Lucide React icons — já instalado
- Recharts — já instalado

## PRAZO CRÍTICO

**Lançamento:** Agosto 2026
**Hoje:** Junho 2026
**Tempo restante:** ~8 semanas

Plano completo semana a semana: `.ai-system/PLANO-AGOSTO-2026.md`

**Sprints restantes para o lançamento:**
- Semana 1: Sprint M — Histórico + Turmas + Declaração PDF
- Semana 2: Sprint N — Calendário Acadêmico UI
- Semana 3: RLS + Infraestrutura crítica
- Semana 4: Sprint P-reduzido — PDFs essenciais
- Semanas 5-7: **App Mobile v1** (React Native + Expo)
- Semana 8: Testes integrados + deploy

**O que SAI do lançamento (V2):** Certificados, relatórios avançados, upload real de documentos.

---

## Visão de Futuro ITEC-EAD

Planejamento completo pós-Sprint P: `.ai-system/ROADMAP-FUTURO.md`

| Fase | Foco | Período |
|------|------|---------|
| **Q** | Lançamento e estabilização | Agosto-Setembro 2026 |
| **R** | Automação de processos + IA | 2º semestre 2026 |
| **S** | EAD completo (vídeo, ao vivo, mobile) | 2027 |
| **T** | Multi-campus, marketplace, comunidade | 2027-2028 |

Antes de implementar qualquer feature das fases R-T:
- Verificar APIs em `github.com/heliopaivajr/public-apis`
- Confirmar que os Sprints L-P estão concluídos
- RLS ativo (TODO-SPRINT-L-002) antes de qualquer expansão
