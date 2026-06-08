# SPRINT-RELATORIOS-SPEC
## Módulo de Relatórios da Secretaria — Especificação Técnica

**Data:** 2026-06-07  
**Branch:** sprint-relatorios  
**Semana:** 4/8 até lançamento agosto/2026  
**Responsável:** Hélio Paiva Jr.

---

## 📋 CONTEXTO

### Objetivo
Implementar 6 relatórios essenciais para a secretaria do ITEC com 3 formatos de saída cada:
- **Imprimir** (window.print + CSS @media print)
- **PDF** (@react-pdf/renderer)
- **Excel/CSV** (xlsx library)

### Usuários
- Secretaria (role: `administracao`)
- Admin (role: `admin`)
- Superadmin (role: `superadmin`)

---

## ✅ VERIFICAÇÃO DE DEPENDÊNCIAS

### Instaladas
- ✅ **@react-pdf/renderer** v4.5.1 (linha 46, package.json)
- ✅ **react-router-dom** v6.26.2
- ✅ **lucide-react** v0.462.0 (ícones)
- ✅ **date-fns** v3.6.0 (formatação de datas)

### Faltantes — INSTALAR ANTES
- ❌ **xlsx** (SheetJS) — biblioteca de exportação Excel/CSV

**Comando de instalação:**
```bash
pnpm add xlsx
pnpm add -D @types/xlsx
```

**Tamanho:** ~150KB minified + gzipped  
**Licença:** Apache 2.0  
**Documentação:** https://docs.sheetjs.com/

---

## 📊 MAPEAMENTO DE SERVICES EXISTENTES

### Services disponíveis (21 total)

| Service | Localização | Relevância para Relatórios |
|---------|-------------|----------------------------|
| `usuarios.service.ts` | src/services/ | ✅ R01, R03, R04, R05 (dados de alunos) |
| `turmas.service.ts` | src/services/ | ✅ R01, R02, R03 (turmas e alunos) |
| `frequencia.service.ts` | src/services/ | ✅ R02, R06 (presença por disciplina) |
| `financeiro.service.ts` | src/services/ | ✅ R04, R05 (mensalidades, inadimplência) |
| `academico.service.ts` | src/services/ | ✅ R03, R06 (disciplinas, histórico) |
| `notas.service.ts` | src/services/ | ✅ R06 (notas por disciplina) |
| `matriculas.service.ts` | src/services/ | ✅ R01, R03 (status de matrícula) |
| `ficha-aluno.service.ts` | src/services/ | ⚠️ Pode ser útil para R06 (histórico) |

---

## 📝 ESPECIFICAÇÃO DOS 6 RELATÓRIOS

---

### R01 — Lista de Alunos por Turma

**Descrição:** Lista completa de alunos de uma turma específica.

**Filtros:**
- Turma (dropdown obrigatório)
- Status matrícula (opcional): todos, ativa, trancada, cancelada

**Colunas:**
1. Código ITEC (ex: `ITEC-2025-001`)
2. Nome completo
3. Telefone
4. Status matrícula
5. Data de matrícula

**Service existente:**
```typescript
// turmas.service.ts
getTurma(turmaId: string) → { turma, alunos[] }
```

**Query adicional necessária:**
```typescript
// Novo em relatorios.service.ts
getAlunosPorTurma(turmaId: string, statusFiltro?: string) → {
  turma: { nome, codigo },
  alunos: Array<{
    codigo_itec: string,
    full_name: string,
    telefone: string,
    status_matricula: string,
    data_matricula: string
  }>
}
```

**Ordenação padrão:** Nome alfabético (A-Z)

---

### R02 — Lista de Presença (Folha de Chamada)

**Descrição:** Grade de presença para lançamento manual em aula.

**Filtros:**
- Turma (dropdown obrigatório)
- Disciplina (dropdown obrigatório)
- Período (opcional): data inicial e final

**Formato:**
```
Turma: TEO-2025-1 | Disciplina: Teologia Sistemática I
Professor: Pr. Eliel Santos

┌─────┬──────────────────────┬────────┬──────┬──────┬──────┬──────┐
│ Nº  │ Aluno                │ Cód    │ 01/08│ 08/08│ 15/08│ ...  │
├─────┼──────────────────────┼────────┼──────┼──────┼──────┼──────┤
│ 1   │ João Silva           │ 2025-1 │      │      │      │      │
│ 2   │ Maria Santos         │ 2025-2 │      │      │      │      │
└─────┴──────────────────────┴────────┴──────┴──────┴──────┴──────┘
```

**Service existente:**
```typescript
// frequencia.service.ts
getAlunosDisciplina(disciplinaId: string) → aluno[]
getFrequenciasPorDisciplina(disciplinaId: string, inicio?, fim?) → lancamentos[]
```

**Query adicional necessária:**
```typescript
// Novo em relatorios.service.ts
getListaPresenca(turmaId: string, disciplinaId: string, inicio?: string, fim?: string) → {
  turma: { nome, codigo },
  disciplina: { nome, professor_nome },
  alunos: Array<{ numero: number, nome: string, codigo: string }>,
  datas: string[] // array de datas das aulas no período
}
```

**Formato de saída:**
- **Imprimir:** Grid CSS com células vazias para marcar à mão
- **PDF:** Tabela com bordas e células vazias
- **Excel:** Planilha com fórmulas de contagem automática

---

### R03 — Disciplinas por Aluno

**Descrição:** Mapa de disciplinas que cada aluno está cursando.

**Filtros:**
- Turma (dropdown opcional — se vazio, todos os alunos ativos)
- Status disciplina (opcional): cursando, aprovado, reprovado, trancada

**Colunas:**
1. Nome aluno
2. Turma
3. Disciplinas (lista separada por vírgula ou coluna expandida)
4. Situação de cada disciplina

**Service existente:**
```typescript
// academico.service.ts
getDisciplinasAluno(alunoId: string) → disciplina[]
getHistoricoAluno(alunoId: string) → historico[]
```

**Query adicional necessária:**
```typescript
// Novo em relatorios.service.ts
getDisciplinasPorAluno(turmaId?: string, statusFiltro?: string) → {
  alunos: Array<{
    nome: string,
    turma_nome: string,
    disciplinas: Array<{
      nome: string,
      situacao: 'cursando' | 'aprovado' | 'reprovado' | 'trancada'
    }>
  }>
}
```

**Ordenação padrão:** Nome do aluno (A-Z)

---

### R04 — Situação Financeira

**Descrição:** Visão geral do financeiro de cada aluno.

**Filtros:**
- Turma (opcional)
- Status pagamento (opcional): em dia, atrasado, isento

**Colunas:**
1. Nome aluno
2. Turma
3. Mensalidades pagas
4. Mensalidades pendentes
5. Valor total em aberto
6. Status geral

**Service existente:**
```typescript
// financeiro.service.ts
getMensalidadesAluno(alunoId: string) → mensalidade[]
getInadimplentes() → aluno[]
```

**Query adicional necessária:**
```typescript
// Novo em relatorios.service.ts
getSituacaoFinanceira(turmaId?: string, statusFiltro?: string) → {
  alunos: Array<{
    nome: string,
    turma_nome: string,
    mensalidades_pagas: number,
    mensalidades_pendentes: number,
    valor_total_aberto: number,
    status: 'em dia' | 'atrasado' | 'isento'
  }>
}
```

**Totalizadores:**
- Total de alunos em dia
- Total de alunos em atraso
- Valor total a receber

---

### R05 — Alunos Inadimplentes

**Descrição:** Lista de alunos com pagamentos atrasados.

**Filtros:**
- Turma (opcional)
- Atraso mínimo (opcional): dias em atraso

**Colunas:**
1. Nome aluno
2. Turma
3. Telefone
4. Mensalidades em atraso (quantidade)
5. Valor total em aberto
6. Data vencimento mais antigo
7. Dias em atraso

**Service existente:**
```typescript
// financeiro.service.ts
getInadimplentes() → Array<{
  aluno_id, full_name, turma_nome, telefone,
  mensalidades_atrasadas, valor_total_aberto
}>
```

**Query adicional necessária:**
```typescript
// Extensão do service existente — adicionar campos:
// - data_vencimento_mais_antigo
// - dias_em_atraso (calculado)
```

**Ordenação padrão:** Maior valor em aberto → Menor

---

### R06 — Histórico Acadêmico

**Descrição:** Histórico completo de um aluno (disciplinas, notas, frequência, resultado).

**Filtros:**
- Aluno (busca obrigatória por nome ou código ITEC)

**Seções:**
1. **Dados pessoais:** Nome, CPF, código ITEC, turma
2. **Disciplinas cursadas:**
   - Nome disciplina
   - Módulo
   - Notas (N1, N2, N3, média)
   - Faltas (quantidade + percentual)
   - Resultado (aprovado/reprovado)
3. **Resumo:**
   - Total de disciplinas cursadas
   - Aprovado em X disciplinas
   - Reprovado em Y disciplinas
   - Média geral

**Service existente:**
```typescript
// academico.service.ts
getHistoricoAluno(alunoId: string) → HistoricoAluno[]

// ficha-aluno.service.ts
getFichaAluno(alunoId: string) → { perfil, matriculas, historico }
```

**Query adicional necessária:**
```typescript
// Consolidar dados de múltiplas tabelas:
// - profiles (dados pessoais)
// - matriculas_disciplina (disciplinas cursadas)
// - notas_aluno (N1, N2, N3, média)
// - frequencia (faltas por disciplina)
// - Cálculo de resultado final por disciplina
```

**Formato especial:**
- **Imprimir:** Documento formal tipo histórico escolar
- **PDF:** Layout oficial do ITEC com logo e assinaturas
- **Excel:** NÃO APLICÁVEL (relatório individual)

---

## 🏗️ ESTRUTURA DE ARQUIVOS PROPOSTA

```
src/
├── services/
│   └── relatorios.service.ts          # NOVO — queries dos 6 relatórios
│
├── pages/dashboard/
│   └── Relatorios.tsx                 # NOVO — tela principal (lista + filtros)
│
├── components/dashboard/relatorios/   # NOVO — pasta de componentes
│   ├── R01_AlunosPorTurma.tsx         # Relatório 1 (tela + filtros)
│   ├── R02_ListaPresenca.tsx          # Relatório 2
│   ├── R03_DisciplinasPorAluno.tsx    # Relatório 3
│   ├── R04_SituacaoFinanceira.tsx     # Relatório 4
│   ├── R05_Inadimplentes.tsx          # Relatório 5
│   ├── R06_HistoricoAcademico.tsx     # Relatório 6
│   │
│   ├── pdf/                            # Templates PDF
│   │   ├── R01_PDF.tsx                 # @react-pdf/renderer
│   │   ├── R02_PDF.tsx
│   │   ├── R03_PDF.tsx
│   │   ├── R04_PDF.tsx
│   │   ├── R05_PDF.tsx
│   │   └── R06_PDF.tsx
│   │
│   ├── exporters/                      # Exportadores Excel
│   │   ├── excelExporter.ts            # Função genérica XLSX
│   │   └── csvExporter.ts              # Função genérica CSV
│   │
│   └── RelatorioLayout.tsx             # Layout compartilhado (header, botões)
│
└── App.tsx                             # Adicionar rota /dashboard/relatorios
```

---

## 🎨 LAYOUT E UX

### Tela Principal — `/dashboard/relatorios`

```
┌───────────────────────────────────────────────────────────┐
│  📊 Relatórios da Secretaria                               │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  Selecione o tipo de relatório:                           │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ 📋 R01          │  │ ✓ R02           │                │
│  │ Alunos por      │  │ Lista de        │                │
│  │ Turma           │  │ Presença        │                │
│  └─────────────────┘  └─────────────────┘                │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ 📚 R03          │  │ 💰 R04          │                │
│  │ Disciplinas     │  │ Situação        │                │
│  │ por Aluno       │  │ Financeira      │                │
│  └─────────────────┘  └─────────────────┘                │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ ⚠️ R05          │  │ 🎓 R06          │                │
│  │ Inadimplentes   │  │ Histórico       │                │
│  │                 │  │ Acadêmico       │                │
│  └─────────────────┘  └─────────────────┘                │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

### Tela de Relatório Individual

```
┌───────────────────────────────────────────────────────────┐
│  ← Voltar                R01 — Alunos por Turma           │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  Filtros:                                                  │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ Turma: TEO-2025-1│  │ Status: Todas    │              │
│  └──────────────────┘  └──────────────────┘              │
│                                                            │
│  [🖨️ Imprimir] [📄 PDF] [📊 Excel]                        │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Código  │ Nome          │ Telefone    │ Status      │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ 2025-1  │ João Silva    │ 11-99999... │ Ativa       │  │
│  │ 2025-2  │ Maria Santos  │ 11-98888... │ Ativa       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  Total: 23 alunos                                          │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

### CSS @media print (compartilhado)

```css
/* src/styles/print.css */
@media print {
  /* Ocultar sidebar, header, botões */
  .sidebar, .header, .no-print { display: none; }
  
  /* Forçar página A4 */
  @page { size: A4; margin: 2cm; }
  
  /* Quebra de página antes de cada seção */
  .page-break { page-break-before: always; }
  
  /* Fonte otimizada para impressão */
  body { font-size: 10pt; color: black; }
  
  /* Tabelas com bordas visíveis */
  table { border-collapse: collapse; }
  table, th, td { border: 1px solid black; }
}
```

---

## 🔧 IMPLEMENTAÇÃO — SERVICE

### relatorios.service.ts (NOVO)

```typescript
// src/services/relatorios.service.ts
import { supabase } from '@/lib/supabase';

// ─── R01: Alunos por Turma ───────────────────────────────────────

export async function getAlunosPorTurma(
  turmaId: string,
  statusFiltro?: string
) {
  let query = supabase
    .from('profiles')
    .select(`
      id,
      codigo_itec,
      full_name,
      telefone,
      matriculas!inner(
        status,
        created_at,
        turmas!inner(id, nome, codigo)
      )
    `)
    .eq('matriculas.turma_id', turmaId);

  if (statusFiltro && statusFiltro !== 'todas') {
    query = query.eq('matriculas.status', statusFiltro);
  }

  const { data, error } = await query.order('full_name');

  if (error) {
    console.error('[getAlunosPorTurma]', error);
    return { turma: null, alunos: [] };
  }

  // Processar data para formato esperado
  const turma = data[0]?.matriculas?.turmas || null;
  const alunos = data.map(p => ({
    codigo_itec: p.codigo_itec,
    full_name: p.full_name,
    telefone: p.telefone,
    status_matricula: p.matriculas?.status,
    data_matricula: p.matriculas?.created_at,
  }));

  return { turma, alunos };
}

// ─── R02: Lista de Presença ──────────────────────────────────────

export async function getListaPresenca(
  turmaId: string,
  disciplinaId: string,
  inicio?: string,
  fim?: string
) {
  // Query complexa com join de:
  // - turmas
  // - disciplinas_v2
  // - matriculas_disciplina (alunos da disciplina)
  // - frequencia (para pegar datas das aulas)
  
  // IMPLEMENTAÇÃO: consultar design do banco
  // retornar { turma, disciplina, alunos[], datas[] }
}

// ─── R03 a R06: seguir mesmo padrão ──────────────────────────────

// ... (continuar implementação)
```

---

## 📦 EXPORTADORES

### excelExporter.ts (NOVO)

```typescript
// src/components/dashboard/relatorios/exporters/excelExporter.ts
import * as XLSX from 'xlsx';

export function exportToExcel<T>(
  data: T[],
  filename: string,
  sheetName: string = 'Relatório'
) {
  // Criar worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Criar workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCSV<T>(
  data: T[],
  filename: string
) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  // Criar blob e download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}
```

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO SUGERIDA

### Fase 1 — Setup (1 dia)
1. ✅ Instalar `xlsx` e `@types/xlsx`
2. ✅ Criar arquivo `relatorios.service.ts`
3. ✅ Criar pasta `components/dashboard/relatorios/`
4. ✅ Criar `RelatorioLayout.tsx` (componente compartilhado)
5. ✅ Criar `excelExporter.ts` e `csvExporter.ts`
6. ✅ Adicionar rota `/dashboard/relatorios` no App.tsx
7. ✅ Adicionar CSS de impressão (`print.css`)

### Fase 2 — Relatórios Simples (2 dias)
1. **R01 — Alunos por Turma** (mais simples)
2. **R05 — Inadimplentes** (service já existe quase completo)
3. **R04 — Situação Financeira** (usa service financeiro.service)

### Fase 3 — Relatórios Complexos (2 dias)
1. **R02 — Lista de Presença** (grid dinâmico de datas)
2. **R03 — Disciplinas por Aluno** (join com múltiplas tabelas)

### Fase 4 — Relatório Individual (1 dia)
1. **R06 — Histórico Acadêmico** (único relatório individual)

### Fase 5 — Testes e Ajustes (1 dia)
1. Testar cada relatório com dados reais
2. Ajustar formatação de impressão
3. Validar exports Excel/CSV
4. Testar PDFs (@react-pdf/renderer)

**Total estimado:** 7 dias úteis

---

## ⚠️ PONTOS DE ATENÇÃO

### 1. Performance
- Relatórios podem retornar centenas de linhas
- Implementar paginação na UI (mas export completo)
- Considerar cache de 5min para relatórios pesados

### 2. Permissões RLS
- Todos os relatórios devem respeitar RLS
- Apenas roles `administracao`, `admin`, `superadmin`
- Adicionar policy em `relatorios` se necessário

### 3. Formatação de Dados
- CPF: máscara `000.000.000-00`
- Telefone: máscara `(00) 00000-0000`
- Moeda: `R$ 1.234,56`
- Datas: `dd/MM/yyyy`

### 4. Biblioteca xlsx — Tamanho
- xlsx adiciona ~150KB ao bundle
- Considerar lazy loading do componente de relatórios
- Alternativa: usar CSV puro (menor) se Excel não for crítico

### 5. PDF vs Impressão
- PDF usa `@react-pdf/renderer` (já instalado)
- Impressão usa `window.print()` + CSS
- São implementações SEPARADAS (não reutilizam componente)

---

## 📋 CHECKLIST PRÉ-IMPLEMENTAÇÃO

- [ ] Hélio aprovar esta spec
- [ ] Instalar `xlsx` e `@types/xlsx`
- [ ] Criar branch `sprint-relatorios` a partir de `main`
- [ ] Verificar migrations das tabelas usadas (profiles, turmas, matriculas, frequencia, mensalidades, notas_aluno)
- [ ] Confirmar quais filtros são obrigatórios vs opcionais
- [ ] Definir ícones para cada relatório (lucide-react)
- [ ] Criar mockup de layout para aprovação (opcional)

---

## 🚀 ENTREGÁVEIS

### Código
- [ ] `relatorios.service.ts` com 6 funções de query
- [ ] 6 componentes de relatório (R01 a R06)
- [ ] 6 templates PDF
- [ ] 2 exportadores (Excel e CSV)
- [ ] 1 layout compartilhado
- [ ] 1 tela principal de seleção
- [ ] CSS de impressão

### Testes
- [ ] Teste manual de cada relatório com dados reais
- [ ] Validação de exports (Excel/CSV abrem corretamente)
- [ ] Validação de PDFs (layout correto, sem quebras)
- [ ] Validação de impressão (margens, quebras de página)

### Documentação
- [ ] Atualizar CLAUDE.md com rota de relatórios
- [ ] Registrar lições aprendidas se houver
- [ ] Documentar queries complexas no próprio service

---

**FIM DA ESPECIFICAÇÃO**

Aguardando aprovação do Hélio para iniciar implementação.
