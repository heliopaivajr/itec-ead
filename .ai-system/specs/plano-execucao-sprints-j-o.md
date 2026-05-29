# Plano de Execução — Sprints J a O
**Agente:** 20-project-manager
**Data:** 2026-05-28
**Solicitante:** Hélio Paiva Jr.
**Tipo de Demanda:** Mista (funcional + técnica — análise do Agente 19 já aprovada)
**Base:** analise-produto-completa-2026.md + decisões aprovadas pelo Hélio

---

## Resumo Executivo

6 sprints planejados em sequência de valor crescente:

| Sprint | Nome | Tema | Estimativa | Risco |
|--------|------|------|-----------|-------|
| J | Notas + Avaliações | Acadêmico crítico | 8-12h | Alto (nova tabela central) |
| K | Documentos + E-mail | Operação secretaria | 6-8h | Médio (Resend API externa) |
| L | Vídeos EAD + Materiais | EAD real | 4-6h | Baixo |
| M | Certificados + Egresso | Produto final | 8-10h | Alto (verificação complexa) |
| N | Calendário + Devocional | Diferenciação teológica | 6-8h | Baixo |
| O | Financeiro PIX (Asaas) | Automação financeira | 6-8h | Alto (API externa, $ real) |

**Regra de ouro:** Nenhum sprint avança sem os testes do sprint anterior passando.
**Commit obrigatório** ao final de cada sprint antes de /clear.

---

## Análise de Riscos Global

| Risco | Sprint | Impacto | Mitigação |
|-------|--------|---------|-----------|
| Tabela `notas_aluno` mal desenhada compromete histórico | J | Alto | Revisar schema com Agente 04 antes de implementar |
| Regra de aprovação implementada errada no service | J | Alto | Testes unitários obrigatórios para todos os casos-limite |
| Resend quota excedida (3k/mês) | K | Médio | Logar todos os envios; alerta ao atingir 2.5k |
| PDF de certificado não aceito por banco/cartório | M | Médio | Validar layout com Hélio antes de codificar |
| Asaas webhook falha silenciosamente | O | Alto | Implementar retry + log de webhooks em tabela |
| Performance: getResumoFrequencia N+1 ainda não corrigido | J | Alto | Fix N+1 é pré-requisito do Sprint J (ver auditoria) |
| Aluno vê notas de colega por bug de RLS | J | Crítico | Agente 11 deve auditar RLS antes do deploy |

---

---

# SPRINT J — Sistema de Notas e Avaliações

**Tipo:** Mista (regras de negócio aprovadas + implementação)
**Estimativa:** 8-12h
**Risco:** Alto
**Pré-requisito OBRIGATÓRIO:** Fix N+1 em `LancarFrequencia` e `VerTurma` (auditoria 2026-05-28)

---

## Decisões de Negócio Aprovadas (Hélio, 2026-05-28)

| Regra | Valor |
|-------|-------|
| Fórmula | Média = (N1 + N2) / 2 |
| Aprovado | Média ≥ 7.0 E frequência ≥ 75% |
| Recuperação | Média entre 5.0 e 6.9 (vai para recuperação) |
| Reprovado por nota | Média < 5.0 (sem recuperação) |
| Reprovado por falta | Frequência < 75% (independente da nota) |
| Quem lança | Professor da disciplina |
| Quem altera | Professor que lançou OU superadmin |
| Visibilidade | Aluno vê próprias notas; secretaria/admin vê todas por turma |

---

## Riscos Identificados

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| N+1 não corrigido afeta LancarNotas | Alto | Fix N+1 é pré-requisito — não iniciar Sprint J sem ele |
| RLS errado expõe nota de outro aluno | Crítico | Agente 11 audita antes do deploy |
| Cálculo automático em JS vs. banco | Médio | Calcular no service (JS), não trigger SQL — mais testável |
| Schema de notas rígido demais | Médio | Schema flexível: notas são rows separadas por tipo |

---

## Pré-requisito: Fix de Performance (antes do Sprint J)

**Estimativa:** 2h · Agente 13 (Performance) + Agente 05 (Backend)

- [ ] **P1** — `getResumoFrequenciaBatch(turmaId)` em `frequencia.service.ts`
  Substitui o loop `Promise.all(alunos.map(a => getResumoFrequencia(a.id)))`.
  Uma única query `WHERE aluno_id IN (...)` retornando todos os alunos da turma.
- [ ] **P2** — Atualizar `LancarFrequencia.tsx` para usar a nova função batch
- [ ] **P3** — Atualizar `VerTurma.tsx` para usar a nova função batch
- [ ] **P4** — Adicionar `.limit(50)` em `getTurmas()` · `turmas.service.ts`
- [ ] **P5** — Adicionar `.limit(100)` em `getEquipe()` · `equipe.service.ts`
- [ ] **Commit:** `fix(performance): batch frequência + LIMITs preventivos`

---

## Fase 1 — Banco de Dados (Agente 04)

### Migration 022 — Tabela `avaliacoes`

```sql
-- Define os tipos de avaliação configuráveis por disciplina
CREATE TABLE avaliacoes (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  disciplina_id uuid NOT NULL REFERENCES disciplinas_v2(id) ON DELETE CASCADE,
  turma_id      uuid NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  tipo          text NOT NULL CHECK (tipo IN ('N1','N2','recuperacao','trabalho','extra')),
  descricao     text,
  peso          numeric(4,2) DEFAULT 1.0,
  data_avaliacao date,
  criado_por    uuid REFERENCES profiles(id),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
-- Leitura: qualquer autenticado pode ler (professor, admin, secretaria)
CREATE POLICY "avaliacoes_select" ON avaliacoes FOR SELECT TO authenticated USING (true);
-- Insert/Update: professor da disciplina OU admin/superadmin
CREATE POLICY "avaliacoes_insert" ON avaliacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = criado_por OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao')
  ));
CREATE POLICY "avaliacoes_update" ON avaliacoes FOR UPDATE TO authenticated
  USING (auth.uid() = criado_por OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')
  ));

CREATE INDEX idx_avaliacoes_disciplina ON avaliacoes(disciplina_id);
CREATE INDEX idx_avaliacoes_turma ON avaliacoes(turma_id);
```

### Migration 023 — Tabela `notas_aluno`

```sql
-- Nota individual: um aluno, uma avaliação, uma nota
CREATE TABLE notas_aluno (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id  uuid NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
  aluno_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  disciplina_id uuid NOT NULL REFERENCES disciplinas_v2(id),
  turma_id      uuid NOT NULL REFERENCES turmas(id),
  nota          numeric(4,1) CHECK (nota >= 0 AND nota <= 10),
  lancado_por   uuid REFERENCES profiles(id),
  lancado_em    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(avaliacao_id, aluno_id)
);

ALTER TABLE notas_aluno ENABLE ROW LEVEL SECURITY;
-- Aluno vê apenas as próprias notas
CREATE POLICY "notas_aluno_select_proprio" ON notas_aluno FOR SELECT TO authenticated
  USING (
    aluno_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao','professor'))
  );
-- Insert/Update: professor que lançou OU admin/superadmin
CREATE POLICY "notas_aluno_insert" ON notas_aluno FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = lancado_por OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );
CREATE POLICY "notas_aluno_update" ON notas_aluno FOR UPDATE TO authenticated
  USING (
    auth.uid() = lancado_por OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

CREATE INDEX idx_notas_aluno_aluno ON notas_aluno(aluno_id);
CREATE INDEX idx_notas_aluno_disciplina ON notas_aluno(disciplina_id);
CREATE INDEX idx_notas_aluno_turma ON notas_aluno(turma_id);
CREATE INDEX idx_notas_aluno_avaliacao ON notas_aluno(avaliacao_id);
```

**Commit migration:** `feat(db): migrations 022-023 — avaliacoes + notas_aluno com RLS`

---

## Fase 2 — Backend (Agente 05)

### `src/services/notas.service.ts` (novo)

Funções obrigatórias:

```typescript
// Criar avaliação (N1, N2, recuperacao) para uma disciplina/turma
createAvaliacao(disciplinaId, turmaId, tipo, descricao?, dataAvaliacao?)

// Listar avaliações de uma disciplina/turma
getAvaliacoesByDisciplina(disciplinaId, turmaId): Promise<Avaliacao[]>

// Lançar nota individual
lancarNota(avaliacaoId, alunoId, disciplinaId, turmaId, nota, lancadoPor)

// Atualizar nota existente
atualizarNota(notaId, nota, lancadoPor)

// Buscar notas de um aluno em uma disciplina
getNotasByAlunoDisciplina(alunoId, disciplinaId): Promise<NotaAluno[]>

// Calcular média e status de aprovação
// REGRA CRÍTICA — implementar exatamente como aprovado:
calcularResultado(alunoId, disciplinaId, turmaId): Promise<ResultadoDisciplina>
// Retorna: { n1, n2, recuperacao, media, status: 'aprovado'|'recuperacao'|'reprovado_nota'|'reprovado_falta'|'cursando' }

// Consolidado por turma para admin/secretaria
getConsolidadoTurma(turmaId, disciplinaId?): Promise<ConsolidadoAluno[]>

// Consolidado para o painel do professor
getNotasByTurmaAndDisciplina(turmaId, disciplinaId): Promise<NotaTurma[]>
```

**Regra de negócio no service (não no banco):**
```typescript
function calcularStatus(media: number, frequencia: number): StatusNota {
  if (frequencia < 75) return 'reprovado_falta';      // falta independe de nota
  if (media >= 7.0)    return 'aprovado';
  if (media >= 5.0)    return 'recuperacao';
  return 'reprovado_nota';
}
```

**Commit service:** `feat(service): notas.service.ts — CRUD notas + cálculo de aprovação`

---

## Fase 3 — Frontend (Agente 06)

### Tela 1: `LancarNotas.tsx` (professor)

Localização: `src/pages/dashboard/LancarNotas.tsx`
Rota: `/dashboard/notas/:turmaId/:disciplinaId`
Role: professor, admin, superadmin

Layout:
- Header: nome da disciplina + turma
- Selector de avaliação (N1 / N2 / Recuperação)
- Tabela de alunos com campo de nota inline (input 0-10, step 0.5)
- Botão "Salvar todas as notas" (batch)
- Status automático calculado (aprovado / recuperação / reprovado) como badge readonly
- Alerta se aluno tem frequência < 75% → badge "reprovado por falta" mesmo que nota ≥ 7

### Tela 2: Notas no painel do aluno (`MeusCursos.tsx` — extensão)

Extensão do `CardDisciplina` existente:
- Adicionar seção "Notas" abaixo de "Frequência"
- Exibir: N1, N2, Média, Status (badge colorido)
- Se em recuperação: mostrar nota de recuperação quando disponível
- Se não há notas ainda: "— Aguardando lançamento"

### Tela 3: Consolidado de Notas (`GestaoTurmas.tsx` ou nova aba)

Para admin/secretaria:
- Por turma: lista de alunos com N1, N2, Média, Frequência, Status
- Filtro por disciplina
- Export CSV (simples — window.open com data:text/csv)
- Badge de contagem: X aprovados / Y recuperação / Z reprovados

**Commit frontend:** `feat(frontend): LancarNotas + notas no painel aluno + consolidado turma`

---

## Fase 4 — Qualidade

- [ ] **Agente 10:** Testes unitários para `calcularResultado` (todos os casos-limite)
  - média exatamente 7.0 → aprovado
  - média 6.9 → recuperação
  - média 5.0 → recuperação
  - média 4.9 → reprovado_nota
  - frequência 74.9% + nota 10 → reprovado_falta
  - frequência 75.0% + nota 7.0 → aprovado
- [ ] **Agente 11:** Auditar RLS de `notas_aluno` — aluno NÃO pode ver nota de colega
- [ ] **Agente 12:** Code Review de `notas.service.ts` e `LancarNotas.tsx`

**Commit testes:** `test(notas): casos-limite de aprovação/reprovação — 100% coverage`

---

## Critérios de Aceite do Sprint J

- [ ] Professor consegue lançar N1 e N2 para todos os alunos de uma disciplina
- [ ] Sistema calcula status automaticamente (aprovado/recuperação/reprovado)
- [ ] Aluno vê suas próprias notas no painel — não vê as de colegas
- [ ] Secretaria/admin vê consolidado por turma com todas as notas
- [ ] Caso-limite testado: frequência < 75% = reprovado por falta, mesmo nota 10
- [ ] Nenhum teste anterior quebrado (163 + novos todos passando)

**Commit final Sprint J:**
```
feat(sprint-j): sistema de notas e avaliações completo

- migrations 022-023: avaliacoes + notas_aluno com RLS
- notas.service.ts com cálculo de aprovação
- LancarNotas.tsx para professor
- Notas no painel do aluno (MeusCursos)
- Consolidado por turma para admin
- Fix N+1 LancarFrequencia + VerTurma (pré-req)
```

---

---

# SPRINT K — Documentos PDF + E-mail Automático

**Tipo:** Técnica (decisões aprovadas pelo Hélio)
**Estimativa:** 6-8h
**Risco:** Médio (Resend é API externa)
**Pré-requisito:** Sprint J concluído (histórico escolar depende de notas)

---

## Decisões de Negócio Aprovadas

| Item | Decisão |
|------|---------|
| Provedor e-mail | Resend (free 3k/mês) |
| Trigger e-mail | Mudança de status matrícula → "ativa" |
| Documentos gerados | Declaração de matrícula + Histórico escolar |
| Quem gera declaração | Secretaria na ficha do aluno; aluno no próprio painel |
| Numeração | Sequencial automático (formato: ITEC-DEC-2026-0001) |
| Biblioteca PDF | @react-pdf/renderer (já instalado) |

---

## Riscos Identificados

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| RESEND_API_KEY não configurada no Vercel | Alto | Documentar variável de ambiente obrigatória |
| Quota Resend 3k/mês atingida | Médio | Log de envios + alerta em dashboard admin |
| PDF de declaração rejeitado por banco | Médio | Validar layout com Hélio antes de codificar |
| Histórico escolar sem notas (Sprint J não feito) | Médio | Histórico exibe "— Aguardando" se notas ausentes |

---

## Configuração Resend (pré-implementação)

**Passo a passo obrigatório antes de codificar:**

1. Criar conta em resend.com com e-mail institucional (contato@itecedu.com)
2. Criar API Key → copiar para `.env.local`: `RESEND_API_KEY=re_xxxx`
3. Configurar domínio `itecedu.com` no painel Resend (DNS: SPF + DKIM)
4. Adicionar `RESEND_API_KEY` nas variáveis de ambiente do Vercel (Settings → Environment)
5. Testar envio manual via cURL antes de integrar ao código

**Variável de ambiente:**
```
RESEND_API_KEY=re_xxxx           # Resend API key
RESEND_FROM=no-reply@itecedu.com # Remetente
```

---

## Fase 1 — Banco de Dados (Agente 04)

Nenhuma migration nova de tabela.
Apenas coluna nova em `matriculas`:

```sql
-- Migration 022b: sequencial de declarações (sem tabela nova — campo em matriculas)
-- Tabela auxiliar de documentos emitidos
CREATE TABLE documentos_emitidos (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo          text NOT NULL CHECK (tipo IN ('declaracao_matricula','historico_escolar','declaracao_frequencia')),
  numero        text NOT NULL UNIQUE, -- ITEC-DEC-2026-0001
  aluno_id      uuid NOT NULL REFERENCES profiles(id),
  gerado_por    uuid REFERENCES profiles(id),
  gerado_em     timestamptz DEFAULT now()
);

ALTER TABLE documentos_emitidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs_select" ON documentos_emitidos FOR SELECT TO authenticated
  USING (aluno_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao')
  ));
CREATE POLICY "docs_insert" ON documentos_emitidos FOR INSERT TO authenticated WITH CHECK (true);

CREATE SEQUENCE seq_declaracoes_itec START 1;
```

**Commit:** `feat(db): tabela documentos_emitidos + sequencial declarações`

---

## Fase 2 — Backend (Agente 05)

### `src/services/documentos.service.ts` (novo)

```typescript
// Gerar número sequencial: ITEC-DEC-2026-0001
gerarNumeroDeclaracao(): Promise<string>

// Registrar documento emitido
registrarDocumento(tipo, alunoId, geradoPor): Promise<{ numero: string }>

// Buscar histórico de documentos do aluno
getDocumentosEmitidos(alunoId): Promise<DocumentoEmitido[]>
```

### `src/services/email.service.ts` (novo)

```typescript
import { Resend } from 'resend'; // pnpm add resend

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

// E-mail de boas-vindas após matrícula aprovada
enviarBoasVindas(aluno: { nome, email, turma, curso }): Promise<void>

// E-mail de aviso de mensalidade vencida
enviarAvisoCobranca(aluno: { nome, email }, mensalidade: { mes, valor }): Promise<void>

// Reenviar e-mail de boas-vindas manualmente (secretaria)
reenviarBoasVindas(alunoId): Promise<void>
```

**Trigger no service de matrículas:**
Em `matriculas.service.ts`, na função `updateStatus`, quando status muda para `'ativa'`:
```typescript
await enviarBoasVindas({ nome, email, turma, curso });
```

**Atenção arquitetural:** E-mail via SDK no frontend/service (não Edge Function por ora).
Edge Function pode ser migração futura (Sprint P) se houver necessidade de serverless.

**Commit service:** `feat(service): email.service.ts (Resend) + documentos.service.ts`

---

## Fase 3 — PDF (Agente 06)

### Componentes PDF (@react-pdf/renderer)

Padrão já existente: `CoursePdfTemplate.tsx` e `ContratoForm.tsx`.

#### `DeclaracaoMatriculaPdf.tsx`

Conteúdo obrigatório:
- Logo ITEC (PNG, já na pasta public/)
- Título: "DECLARAÇÃO DE MATRÍCULA"
- Número do documento: ITEC-DEC-2026-0001
- Nome completo, CPF, curso, turma, data de matrícula, status atual
- Texto padrão institucional: "Declaramos que o(a) Sr(a). [nome]..."
- Data de emissão, local (Paulista/PE)
- Campo de assinatura: Pr. Hélio Paiva Jr. — Diretor Acadêmico
- Rodapé: ITEC · CNPJ · Endereço · itecedu.com

#### `HistoricoEscolarPdf.tsx`

Conteúdo obrigatório:
- Cabeçalho idêntico à declaração
- Tabela por módulo → disciplinas → N1, N2, Média, Frequência, Status
- Carga horária total e créditos
- Se notas não disponíveis: coluna exibe "—"
- Rodapé com assinatura

### Botão "Gerar Declaração" em `FichaAluno.tsx`

- Botão secundário no header da ficha
- Ao clicar: registrar na tabela `documentos_emitidos`, gerar PDF inline, abrir em nova aba
- Log no painel da secretaria: "Declaração #ITEC-DEC-2026-0001 gerada por Camila em 28/05/2026"

**Commit frontend:** `feat(pdf): DeclaracaoMatriculaPdf + HistoricoEscolarPdf + botão FichaAluno`

---

## Fase 4 — Qualidade

- [ ] **Agente 10:** Teste do `email.service.ts` com mock do Resend SDK
- [ ] **Agente 10:** Teste do trigger em `updateStatus` — mockar enviarBoasVindas
- [ ] **Agente 12:** Code Review dos dois services novos
- [ ] **Validação manual:** Hélio abre PDF de declaração no browser e aprova layout

**Commit testes:** `test(email+docs): mocks Resend + trigger matrícula`

---

## Critérios de Aceite do Sprint K

- [ ] Ao aprovar matrícula, aluno recebe e-mail de boas-vindas em até 5 min
- [ ] Secretaria gera declaração de matrícula em PDF com 1 clique na FichaAluno
- [ ] Declaração tem número sequencial único (ITEC-DEC-2026-XXXX)
- [ ] Histórico escolar exibe notas se Sprint J implementado, "—" se não
- [ ] Secretaria pode reenviar e-mail de boas-vindas manualmente
- [ ] Resend configurado no Vercel com domínio verificado

**Commit final Sprint K:**
```
feat(sprint-k): documentos PDF + e-mail automático Resend

- documentos.service.ts: declaração + histórico escolar
- email.service.ts: Resend SDK + boas-vindas + cobrança
- DeclaracaoMatriculaPdf + HistoricoEscolarPdf
- Trigger automático na aprovação de matrícula
- Tabela documentos_emitidos com sequencial
```

---

---

# SPRINT L — Vídeos EAD + Upload de Materiais

**Tipo:** Técnica
**Estimativa:** 4-6h
**Risco:** Baixo
**Pré-requisito:** Sprint K concluído

---

## Decisões de Negócio Aprovadas

| Item | Decisão |
|------|---------|
| Estratégia vídeo | YouTube não listado (iframe embed) por ora |
| Upload materiais | Supabase Storage (bucket `materiais-disciplina`) |
| Formatos aceitos | PDF, PPT, PPTX, DOCX, MP3 (máx 50MB) |
| Quem faz upload | Professor da disciplina, admin, superadmin |
| Marcar assistido | Aluno marca vídeo → conta para progresso EAD |
| Frequência EAD | Não substitui lançamento do professor por ora |

---

## Fase 1 — Banco de Dados (Agente 04)

```sql
-- Migration 024: video_url e upload em materiais
ALTER TABLE materiais ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE materiais ADD COLUMN IF NOT EXISTS arquivo_url text;
ALTER TABLE materiais ADD COLUMN IF NOT EXISTS arquivo_nome text;
ALTER TABLE materiais ADD COLUMN IF NOT EXISTS arquivo_tamanho_kb integer;

-- Tabela de progresso de vídeos
CREATE TABLE IF NOT EXISTS progresso_video (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id   uuid NOT NULL REFERENCES materiais(id) ON DELETE CASCADE,
  assistido     boolean DEFAULT false,
  assistido_em  timestamptz,
  UNIQUE(aluno_id, material_id)
);

ALTER TABLE progresso_video ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progresso_video_select" ON progresso_video FOR SELECT TO authenticated
  USING (aluno_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','professor')
  ));
CREATE POLICY "progresso_video_upsert" ON progresso_video FOR INSERT TO authenticated
  WITH CHECK (aluno_id = auth.uid());
CREATE POLICY "progresso_video_update" ON progresso_video FOR UPDATE TO authenticated
  USING (aluno_id = auth.uid());
```

**Storage bucket:**
```sql
-- Via Supabase Dashboard ou migration:
INSERT INTO storage.buckets (id, name, public) VALUES ('materiais-disciplina', 'materiais-disciplina', false);
```

**Commit:** `feat(db): migration 024 — video_url + arquivo em materiais + progresso_video`

---

## Fase 2 — Backend (Agente 05)

Extensão de `material.service.ts` (existente):

```typescript
// Upload de arquivo para Supabase Storage
uploadMaterial(disciplinaId, file: File, nomeDisplay): Promise<{ url, nome, tamanhoKb }>

// Vincular URL de vídeo a um material existente
adicionarVideoUrl(materialId, videoUrl): Promise<void>

// Marcar vídeo como assistido
marcarAssistido(materialId, alunoId): Promise<void>

// Buscar progresso de vídeos de uma disciplina
getProgressoVideos(alunoId, disciplinaId): Promise<ProgressoVideo[]>

// Resumo EAD: X de Y vídeos assistidos na disciplina
getResumoEAD(alunoId, disciplinaId): Promise<{ total, assistidos, percentual }>
```

**Commit service:** `feat(service): material.service.ts — upload + vídeo + progresso`

---

## Fase 3 — Frontend (Agente 06)

### Player de Vídeo em `MeusCursos.tsx`

No `CardDisciplina`, abaixo de Frequência e Notas:
- Se material tem `video_url`: exibir iframe YouTube responsivo (16:9)
- Botão "Marcar como assistido" abaixo do player
- Badge de progresso: "3/5 vídeos assistidos"

### Upload de Material (nova interface no painel do professor)

Extensão de `ProfessorHome.tsx` ou nova aba na disciplina:
- Input de URL de YouTube (com validação de URL)
- OU botão "Upload de arquivo" (drag and drop)
- Lista de materiais existentes com status (com vídeo / apenas arquivo / sem conteúdo)

**Commit frontend:** `feat(frontend): player vídeo EAD + upload materiais + progresso`

---

## Critérios de Aceite do Sprint L

- [ ] Professor vincula URL de YouTube a um material
- [ ] Aluno vê vídeo embedado no painel sem sair da plataforma
- [ ] Aluno marca vídeo como assistido com 1 clique
- [ ] Progresso de vídeos exibe "X/Y assistidos" por disciplina
- [ ] Professor faz upload de PDF/PPT via painel
- [ ] Arquivo disponível para download pelo aluno

**Commit final Sprint L:**
```
feat(sprint-l): vídeos EAD + upload materiais

- migration 024: video_url + arquivo + progresso_video
- material.service.ts: upload Supabase Storage + marcar assistido
- Player YouTube embed no painel do aluno
- Upload de arquivos no painel do professor
- Badge de progresso EAD por disciplina
```

---

---

# SPRINT M — Certificados + Portal do Egresso

**Tipo:** Mista
**Estimativa:** 8-10h
**Risco:** Alto (verificação de conclusão é regra de negócio crítica)
**Pré-requisito:** Sprints J, K e L concluídos (certificado depende de notas + materiais)

---

## Decisões de Negócio Aprovadas

| Item | Decisão |
|------|---------|
| Assinatura | PNG escaneada por ora (migrar para digital pós-formalização) |
| Verificação automática | Frequência ≥ 75% + média ≥ 7.0 em TODAS as disciplinas + sem pendência financeira |
| QR Code | Obrigatório — aponta para itecedu.com/verificar/[codigo] |
| Numeração | ITEC-CERT-2026-0001 (sequencial) |
| Emissão manual | Secretaria pode emitir e bloquear (inadimplência) |
| Portal egresso | Junto com Sprint M — após certificado emitido |

---

## Riscos Identificados

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Aluno com disciplinas não lançadas → conclusão errada | Crítico | Verificar: se houver disciplina sem nota → status "em andamento" (não "concluído") |
| PDF certificado não passa no cartório | Médio | Validar layout com Hélio ANTES de codificar — mostrar mockup |
| Página pública de verificação indexada pelo Google | Baixo | Adicionar meta robots noindex na rota /verificar |

---

## Fase 1 — Banco de Dados (Agente 04)

### Migration 025 — Tabela `certificados`

```sql
CREATE TABLE certificados (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  curso_id        uuid REFERENCES cursos(id),
  numero          text NOT NULL UNIQUE, -- ITEC-CERT-2026-0001
  codigo_qr       text NOT NULL UNIQUE, -- UUID aleatório para URL pública
  data_conclusao  date NOT NULL,
  data_emissao    timestamptz DEFAULT now(),
  emitido_por     uuid REFERENCES profiles(id),
  bloqueado       boolean DEFAULT false,
  motivo_bloqueio text,
  carga_horaria   integer DEFAULT 1850,
  arquivo_url     text -- URL do PDF no Storage
);

ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;
-- Aluno vê próprio certificado; admin/secretaria vê todos
CREATE POLICY "cert_select" ON certificados FOR SELECT TO authenticated
  USING (aluno_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao')
  ));
-- Somente admin/superadmin emite
CREATE POLICY "cert_insert" ON certificados FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao')
  ));

CREATE INDEX idx_certificados_aluno ON certificados(aluno_id);
CREATE INDEX idx_certificados_codigo ON certificados(codigo_qr);
CREATE SEQUENCE seq_certificados_itec START 1;
```

### Migration 026 — Tabela `egressos`

```sql
CREATE TABLE egressos (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id        uuid NOT NULL REFERENCES profiles(id) UNIQUE,
  certificado_id  uuid REFERENCES certificados(id),
  foto_url        text,
  ministerio_atual text,
  cargo_atual     text,
  igreja_atual    text,
  cidade_atual    text,
  denominacao     text,
  especialidade   text[], -- array: ['Teologia Sistemática', 'Missões']
  depoimento      text,
  visivel         boolean DEFAULT false, -- admin aprova
  ano_formacao    integer,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE egressos ENABLE ROW LEVEL SECURITY;
-- Perfis visíveis são públicos (sem auth necessária)
CREATE POLICY "egressos_public_select" ON egressos FOR SELECT USING (visivel = true);
-- Autenticado vê o próprio, admin vê todos
CREATE POLICY "egressos_auth_select" ON egressos FOR SELECT TO authenticated
  USING (aluno_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')
  ));
CREATE POLICY "egressos_insert" ON egressos FOR INSERT TO authenticated
  WITH CHECK (aluno_id = auth.uid());
CREATE POLICY "egressos_update" ON egressos FOR UPDATE TO authenticated
  USING (aluno_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')
  ));
```

**Commit:** `feat(db): migrations 025-026 — certificados + egressos com RLS`

---

## Fase 2 — Backend (Agente 05)

### `src/services/certificados.service.ts` (novo)

```typescript
// Verificar se aluno tem direito ao certificado
verificarElegibilidade(alunoId): Promise<{
  elegivel: boolean;
  pendencias: string[]; // lista de motivos se não elegível
  frequenciaOk: boolean;
  notasOk: boolean;
  financeiroOk: boolean;
}>

// Emitir certificado (secretaria/admin)
emitirCertificado(alunoId, emitidoPor): Promise<Certificado>

// Buscar certificado do aluno
getCertificadoByAluno(alunoId): Promise<Certificado | null>

// Validação pública por código QR (sem auth)
validarCertificado(codigoQr): Promise<{
  valido: boolean;
  nome?: string;
  curso?: string;
  dataConclusao?: string;
  numero?: string;
}>

// Bloquear/desbloquear (inadimplência)
toggleBloqueio(certificadoId, bloqueado, motivo?): Promise<void>
```

### `src/services/egressos.service.ts` (novo)

```typescript
createEgresso(alunoId, dados): Promise<Egresso>
updateEgresso(alunoId, dados): Promise<Egresso>
getEgressos(filtros?: { cidade?, denominacao?, especialidade? }): Promise<Egresso[]>
aprovarEgresso(egressoId): Promise<void>   // admin
```

**Commit service:** `feat(service): certificados.service.ts + egressos.service.ts`

---

## Fase 3 — Frontend (Agente 06)

### PDF do Certificado (`CertificadoPdf.tsx`)

Layout (validar mockup com Hélio antes de codificar):
- Formato paisagem (A4)
- Logo ITEC grande centralizado
- "CERTIFICADO DE CONCLUSÃO DE CURSO" (título)
- Texto: "O Instituto de Teologia Cristã certifica que [NOME COMPLETO]..."
- Curso: Graduação em Teologia Livre · Carga Horária: 1.850 horas
- Data de conclusão · Número: ITEC-CERT-2026-0001
- QR Code (canto inferior direito)
- Assinaturas: Pr. Eliel (Reitor) · Pr. Hélio Paiva Jr. (Diretor Acadêmico)
- PNG escaneada de cada assinatura

### Rota Pública de Verificação

`src/pages/VerificarCertificado.tsx`
Rota: `/verificar/:codigoQr`
Sem auth necessária.
Layout:
- Logo ITEC
- "Certificado Válido ✅" ou "Certificado não encontrado ❌"
- Nome, curso, data de conclusão, número
- "Este certificado foi emitido pelo ITEC em [data]"

### Painel do Aluno — Aba Certificado

Em `MeusCursos.tsx` ou nova aba no dashboard:
- Se elegível: botão "Download do Certificado"
- Se não elegível: lista de pendências ("Aguardando lançamento de notas em X disciplinas")
- Se bloqueado: "Certificado bloqueado — regularize sua situação financeira"

### Portal do Egresso (página pública)

`src/pages/Egressos.tsx`
Rota: `/egressos`
Sem auth.
- Grid de cards: foto, nome, ministério, cidade, especialidade
- Filtros: cidade, denominação, especialidade
- Contador: "X líderes e pastores formados pelo ITEC"
- Link para reservar vaga (CTA)

**Commit frontend:** `feat(frontend): CertificadoPdf + /verificar + portal egressos`

---

## Critérios de Aceite do Sprint M

- [ ] Sistema verifica elegibilidade automática (frequência + notas + financeiro)
- [ ] Secretaria emite certificado com 1 clique para aluno elegível
- [ ] PDF do certificado tem QR Code funcional
- [ ] Página /verificar/[codigo] mostra dados do certificado sem login
- [ ] Aluno vê status "Aguardando X disciplinas" ou "Download disponível"
- [ ] Portal /egressos listável publicamente com filtros
- [ ] Aluno formado pode criar/editar perfil no portal

**Commit final Sprint M:**
```
feat(sprint-m): certificados digitais + portal do egresso

- migrations 025-026: certificados + egressos
- certificados.service.ts: elegibilidade + emissão + validação pública
- egressos.service.ts: CRUD + moderação admin
- CertificadoPdf.tsx com QR Code
- Rota pública /verificar/:codigoQr
- Portal /egressos com filtros
```

---

---

# SPRINT N — Calendário Acadêmico + Devocional

**Tipo:** Técnica + Funcional
**Estimativa:** 6-8h
**Risco:** Baixo
**Pré-requisito:** Sprint L concluído (mas pode ser feito paralelamente a M)

---

## Decisões de Negócio Aprovadas

| Item | Decisão |
|------|---------|
| Quem cria devocional | Professor, administracao, admin, superadmin |
| Vinculação devocional | Por disciplina (não por aula/data) |
| Devocional é avaliado? | Não — formativo apenas |
| Calendário — quem cria eventos | Admin, secretaria (administracao), superadmin |
| Tipos de evento | aula, avaliacao, evento_institucional, feriado, retiro |
| Exportação .ics | Sim — Google Calendar |

---

## Fase 1 — Banco de Dados (Agente 04)

### Migration 027 — Calendário Acadêmico

```sql
CREATE TABLE calendario_academico (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo      text NOT NULL,
  descricao   text,
  tipo        text NOT NULL CHECK (tipo IN ('aula','avaliacao','evento_institucional','feriado','retiro','outro')),
  data_inicio date NOT NULL,
  data_fim    date,
  hora_inicio time,
  hora_fim    time,
  turma_id    uuid REFERENCES turmas(id), -- null = evento para todos
  disciplina_id uuid REFERENCES disciplinas_v2(id),
  criado_por  uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE calendario_academico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendario_select" ON calendario_academico FOR SELECT TO authenticated USING (true);
CREATE POLICY "calendario_insert" ON calendario_academico FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao')
  ));
CREATE POLICY "calendario_update" ON calendario_academico FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao')
  ));
CREATE POLICY "calendario_delete" ON calendario_academico FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')
  ));

CREATE INDEX idx_calendario_data ON calendario_academico(data_inicio);
CREATE INDEX idx_calendario_turma ON calendario_academico(turma_id);
```

### Migration 028 — Devocionais

```sql
CREATE TABLE devocionais (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  disciplina_id uuid NOT NULL REFERENCES disciplinas_v2(id) ON DELETE CASCADE,
  titulo        text NOT NULL,
  versiculo_ref text NOT NULL,    -- ex: "João 3:16"
  versiculo_texto text,
  conteudo      text NOT NULL,    -- 200-300 palavras
  pergunta_reflexao text,
  ordem         integer DEFAULT 1, -- 1 a 10 (uma por aula)
  criado_por    uuid REFERENCES profiles(id),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE devocionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "devocionais_select" ON devocionais FOR SELECT TO authenticated USING (true);
CREATE POLICY "devocionais_insert" ON devocionais FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','administracao','professor')
  ));
CREATE POLICY "devocionais_update" ON devocionais FOR UPDATE TO authenticated
  USING (criado_por = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')
  ));

CREATE INDEX idx_devocionais_disciplina ON devocionais(disciplina_id);
```

**Commit:** `feat(db): migrations 027-028 — calendario_academico + devocionais`

---

## Fase 2 — Backend (Agente 05)

### `src/services/calendario.service.ts` (novo)

```typescript
createEvento(dados): Promise<EventoCalendario>
getEventos(turmaId?, mes?, ano?): Promise<EventoCalendario[]>
getProximosEventos(turmaId?, limit = 3): Promise<EventoCalendario[]>
deleteEvento(eventoId): Promise<void>
exportarICS(turmaId?): string  // retorna string no formato iCalendar
```

### `src/services/devocionais.service.ts` (novo)

```typescript
createDevocional(disciplinaId, dados, criadoPor): Promise<Devocional>
getDevocionaisByDisciplina(disciplinaId): Promise<Devocional[]>
getDevocionaisDoAluno(alunoId): Promise<Devocional[]>  // para disciplinas ativas
updateDevocional(id, dados): Promise<void>
deleteDevocional(id): Promise<void>
```

---

## Fase 3 — Frontend (Agente 06)

### Calendário no Painel do Aluno

Nova aba ou card em `MeusCursos.tsx`:
- Mini-calendário mensal (lib sugerida: `react-big-calendar` ou implementação simples)
- Eventos coloridos por tipo (aula=azul, avaliação=vermelho, institucional=verde)
- Próximos 3 eventos no card do dashboard inicial
- Botão "Exportar para Google Calendar"

### Gerenciar Calendário (admin/secretaria)

Nova tela `CalendarioAdmin.tsx`:
- Formulário de criação de evento (data, hora, tipo, turma, descrição)
- Lista de eventos com filtro por mês e turma
- Botão de excluir

### Devocional no Painel do Aluno

Card "Devocional de Hoje" no dashboard (abaixo dos KPIs):
- Título, versículo, texto resumido (150 chars + "Ler mais")
- Modal com texto completo e pergunta de reflexão
- Botão "Adicionar reflexão ao Diário" (integração Sprint N-ext)

### Criar Devocionais (professor/admin)

Extensão de disciplina no `CursosAdmin.tsx` ou nova aba no painel do professor:
- Lista de devocionais por disciplina (ordem 1 a 10)
- Formulário: título, versículo, texto, pergunta de reflexão

**Commit frontend:** `feat(frontend): calendário acadêmico + devocional + admin forms`

---

## Critérios de Aceite do Sprint N

- [ ] Admin/secretaria cria eventos no calendário por turma
- [ ] Aluno vê calendário mensal no painel com eventos coloridos por tipo
- [ ] "Próximos 3 eventos" aparecem no dashboard inicial
- [ ] Aluno exporta calendário para Google Calendar (.ics)
- [ ] Professor cria devocionais por disciplina (versículo + texto + reflexão)
- [ ] Aluno vê "Devocional de Hoje" no dashboard

**Commit final Sprint N:**
```
feat(sprint-n): calendário acadêmico + devocional teológico

- migrations 027-028: calendario_academico + devocionais
- calendario.service.ts + devocionais.service.ts
- Calendário mensal no painel do aluno com export .ics
- Card "Devocional de Hoje" no dashboard
- Forms de criação para admin/professor
```

---

---

# SPRINT O — Financeiro PIX (Asaas)

**Tipo:** Técnica + Billing (Agente 08)
**Estimativa:** 6-8h
**Risco:** Alto (API externa, dinheiro real)
**Pré-requisito:** Conta Asaas aberta e verificada com CNPJ do ITEC

---

## ⚠️ ATENÇÃO — Pré-condições Obrigatórias (antes de codificar)

1. **Conta Asaas:** Acessar asaas.com, cadastrar com CNPJ do ITEC, verificar dados bancários
2. **API Key Sandbox:** Gerar em Configurações → Integrações → API (modo sandbox primeiro)
3. **Webhook:** Configurar URL de webhook no Asaas → aponta para Supabase Edge Function
4. **Validação jurídica:** Confirmar com Adv. Hugo que recebimento via PIX em nome do ITEC está regularizado

**Somente após as 4 condições:** iniciar implementação.

---

## Decisões de Negócio Aprovadas

| Item | Decisão |
|------|---------|
| Gateway | Asaas (PIX + boleto) |
| Registro manual | Continua existindo (fallback) |
| Cobrança automática | PIX gerado automaticamente no vencimento |
| Recibo | PDF gerado após confirmação de pagamento |
| Notificação | E-mail via Resend ao confirmar pagamento |

---

## Fase 1 — Banco de Dados (Agente 04)

```sql
-- Migration 029: campos Asaas em mensalidades
ALTER TABLE mensalidades ADD COLUMN IF NOT EXISTS asaas_charge_id text;
ALTER TABLE mensalidades ADD COLUMN IF NOT EXISTS pix_qr_code text;
ALTER TABLE mensalidades ADD COLUMN IF NOT EXISTS pix_expira_em timestamptz;
ALTER TABLE mensalidades ADD COLUMN IF NOT EXISTS boleto_url text;
ALTER TABLE mensalidades ADD COLUMN IF NOT EXISTS forma_pagamento text CHECK (forma_pagamento IN ('pix','boleto','manual','isento'));

-- Tabela de webhooks Asaas (auditoria)
CREATE TABLE asaas_webhooks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento      text NOT NULL,
  charge_id   text,
  payload     jsonb,
  processado  boolean DEFAULT false,
  received_at timestamptz DEFAULT now()
);
ALTER TABLE asaas_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_superadmin" ON asaas_webhooks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));
```

---

## Fase 2 — Backend + Edge Function (Agentes 05 + 09)

### `src/services/asaas.service.ts` (novo)

```typescript
// Criar cobrança PIX no Asaas
criarCobrancaPix(mensalidadeId, aluno, valor, vencimento): Promise<{ chargeId, pixQrCode, pixExpira }>

// Criar boleto no Asaas
criarBoleto(mensalidadeId, aluno, valor, vencimento): Promise<{ chargeId, boletoUrl }>

// Consultar status da cobrança
consultarCobranca(chargeId): Promise<{ status: 'PENDING'|'RECEIVED'|'OVERDUE'|'CANCELLED' }>

// Cancelar cobrança
cancelarCobranca(chargeId): Promise<void>
```

### Supabase Edge Function: `asaas-webhook`

```typescript
// supabase/functions/asaas-webhook/index.ts
// Recebe eventos do Asaas e atualiza mensalidades
// Eventos: PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_DELETED

// Ao receber PAYMENT_RECEIVED:
// 1. Atualizar mensalidade.status = 'pago'
// 2. Registrar data_pagamento
// 3. Salvar em asaas_webhooks
// 4. Disparar e-mail de confirmação (Resend)
// 5. Gerar recibo PDF (opcional — pode ser on-demand)
```

**Deploy da Edge Function:**
```bash
rtk supabase functions deploy asaas-webhook --project-ref [ref]
```

---

## Fase 3 — Frontend (Agente 06)

### Modal de Cobrança Asaas em `Financeiro.tsx`

Extensão do `ModalPagamento` existente:
- Tabs: "PIX" | "Boleto" | "Registrar manualmente"
- Aba PIX: gerar QR Code → exibir imagem + código copia-e-cola + timer de expiração
- Aba Boleto: botão "Gerar boleto" → link para PDF do Asaas
- Ao confirmar via webhook → badge "Pago" aparece automaticamente (Realtime Supabase)

### Recibo de Pagamento PDF (`ReciboPdf.tsx`)

Conteúdo:
- Logo ITEC
- "RECIBO DE PAGAMENTO"
- Aluno, mês de referência, valor, data de pagamento, forma de pagamento
- Número do recibo (sequencial)
- Assinatura: ITEC

---

## Critérios de Aceite do Sprint O

- [ ] Secretaria/financeiro gera PIX para mensalidade em aberto
- [ ] QR Code exibido com timer de expiração
- [ ] Ao pagar, status atualiza automaticamente (webhook Asaas → Realtime)
- [ ] Recibo PDF gerado automaticamente após confirmação
- [ ] Aluno recebe e-mail de confirmação de pagamento
- [ ] Fallback: registro manual continua funcionando
- [ ] Webhooks logados em `asaas_webhooks` para auditoria

**Commit final Sprint O:**
```
feat(sprint-o): integração financeira Asaas PIX + boleto

- migration 029: campos Asaas em mensalidades + webhooks
- asaas.service.ts: PIX + boleto + consulta
- Edge Function asaas-webhook: atualização automática
- Modal PIX/Boleto no Financeiro
- ReciboPdf.tsx
- E-mail de confirmação de pagamento
```

---

---

## Cronograma Sugerido

Velocidade atual estimada: 1 sprint por sessão de trabalho (2-6h dependendo do sprint)

| Sprint | Estimativa | Quando | Dependência |
|--------|-----------|--------|-------------|
| **J** (Notas) | 8-12h · 2 sessões | Semana 1 | Fix N+1 (pré-req) |
| **K** (Docs + E-mail) | 6-8h · 1-2 sessões | Semana 2 | Sprint J |
| **L** (Vídeos + Upload) | 4-6h · 1 sessão | Semana 2-3 | Pode rodar com K |
| **M** (Certificados) | 8-10h · 2 sessões | Semana 3-4 | J + K + L obrigatórios |
| **N** (Calendário + Devocional) | 6-8h · 1-2 sessões | Semana 4-5 | Pode rodar com M |
| **O** (PIX Asaas) | 6-8h · 1-2 sessões | Semana 5-6 | Conta Asaas verificada |

**Total estimado:** 38-52h · 6-8 semanas no ritmo atual

---

## Próximos Passos Imediatos para o Hélio

1. **Agora (antes do Sprint J):**
   - Confirmar: o modelo de notas é N1 + N2 com recuperação entre 5.0 e 6.9? (Aprovado ✅)
   - Verificar se há disciplinas com modelo diferente (ex: só prova final)

2. **Antes do Sprint K:**
   - Criar conta no Resend: resend.com
   - Configurar domínio itecedu.com (DNS: SPF + DKIM)
   - Adicionar `RESEND_API_KEY` no Vercel

3. **Antes do Sprint M:**
   - Digitalizar (escanear) assinatura do Pr. Eliel e Pr. Hélio em PNG de alta resolução
   - Aprovar layout do certificado (mockup gerado antes de codificar)

4. **Antes do Sprint O:**
   - Abrir conta Asaas com CNPJ do ITEC
   - Validar juridicamente com Adv. Hugo
   - Gerar API Key sandbox para testes

---

## Regras de Execução de Sessão

```
Início de sessão:  ler CLAUDE.md + SYSTEM.md + este plano
Fim de sessão:     commitar tudo + atualizar SYSTEM.md com sprint concluído
Entre sprints:     /clear (contexto limpo)
Testes:            pnpm test:run deve sempre passar antes de qualquer commit
Deploy:            automático via Vercel ao push na main
```

---

*Plano gerado pelo Agente 20 — Gestor de Projeto/Coordenador ITEC*
*Base: Análise do Agente 19 (analise-produto-completa-2026.md)*
*Data: 2026-05-28 · Para aprovação do Hélio antes de qualquer execução*
