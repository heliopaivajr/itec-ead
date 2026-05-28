# CLAUDE.md — ITEC-EAD
# Lido automaticamente pelo Claude Code
# Atualizado: 2026-05-26

## Projeto
Plataforma EAD do Instituto de Teologia Cristã
Site: https://www.itecedu.com
Dev: Hélio Paiva Jr. (superadmin)
Score atual: **7.8/10** 🟢

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
pnpm test:run   # deve sempre passar 86/86
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
- Última: 2026-05-26 pós-Sprint D
- Score: 7.8/10
- Relatório: `.ai-system/audit/2026-05-pos-sprint-d/report.md`
- Próxima meta: 8.5/10

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

### Pendente — Simulação
- [ ] Testar professor (frequência, contrato PDF)
- [ ] Testar financeiro (registrar pagamento)
- [ ] Testar fluxo Nova Matrícula completo
- [ ] Testar ficha do aluno pelo superadmin

### Sprint J — Gestão Acadêmica
- Upload materiais por disciplina
- Criar/editar módulos e disciplinas
- Gerenciar pré-requisitos visualmente

### Sprint K — Vídeos EAD
- Campo YouTube URL por disciplina/material
- Player embedado no dashboard do aluno
- Marcar vídeo como "assistido"
- Progresso conta para certificado

### Sprint L — Certificados
- Verificação automática de conclusão
  (frequência ≥ 75% + disciplinas aprovadas
   + sem débitos financeiros)
- Geração PDF com @react-pdf/renderer
- QR Code de verificação
- Página pública: itecedu.com/verificar/[codigo]
- Download pelo aluno
- Emissão manual pela secretaria
- Registro único com número sequencial

### Sprint M — Melhorias EAD (futuro)
- Fórum por disciplina
- Chat com professor
- Provas online
- Biblioteca digital (PDFs apostilas)

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
