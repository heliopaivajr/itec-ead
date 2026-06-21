import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────
// Adapter sobre o currículo v2 (disciplinas_v2 / modulos / prerequisitos_v2).
// Mantém o "shape" Disciplina/Prerequisito que a tela CursosAdmin consome,
// traduzindo de/para as colunas reais do schema v2.
// LICAO-026: sob RLS, query separada + merge em memória — nunca join aninhado.
// ─────────────────────────────────────────────────────────────

// Vocabulário v2 (difere do legado: era obrigatoria|eletiva|eletiva_obrigatoria)
export type TipoDisciplina = 'regular' | 'eletiva' | 'obrigatoria';
export type AreaDisciplina = 'B' | 'T' | 'P';
// Vocabulário v2 de pré-requisito (legado usava formal|recomendado|corequisito)
export type TipoPrerequisito = 'prerequisito' | 'corequisito' | 'recomendado';

// Shape consumido pela tela (adapter)
export interface Disciplina {
  id: string;
  codigo: string;
  nome: string;
  modulo: number;            // = modulos.ordem
  modulo_id: string;         // FK real → modulos.id (para o dropdown de edição)
  ano: number;               // = disciplinas_v2.ano_curso
  carga_horaria: number;     // = presencial + ead (derivado; v2 não guarda total)
  horas_presencial: number;  // = carga_horaria_presencial
  horas_ead: number;         // = carga_horaria_ead
  creditos: number;
  tipo: TipoDisciplina;
  area: AreaDisciplina;
  ativo: boolean;
}

export interface Prerequisito {
  disciplina_codigo: string;
  prerequisito_codigo: string;
  tipo: TipoPrerequisito;
}

export interface ServiceResult {
  error: string | null;
}

// Módulo (para dropdown de cadastro/edição).
// Nome distinto de academico.service.Modulo para não colidir no barrel index.ts.
export interface ModuloOpcao {
  id: string;
  ordem: number;
  nome: string;
}

// Entrada de criação/edição — mapeia direto para as colunas de disciplinas_v2.
// Usa modulo_id (UUID do dropdown), não o número de ordem.
export interface DisciplinaInput {
  codigo: string;
  nome: string;
  area: AreaDisciplina;
  ano_curso: number;
  modulo_id: string;
  horas_presencial: number;
  horas_ead: number;
  creditos: number;
  tipo: TipoDisciplina;
  ativo: boolean;
}

export type DisciplinaUpdate = Partial<DisciplinaInput>;

// ── linhas brutas do banco ───────────────────────────────────
interface DisciplinaV2Row {
  id: string;
  modulo_id: string;
  codigo: string;
  nome: string;
  area: AreaDisciplina;
  ano_curso: number;
  carga_horaria_presencial: number;
  carga_horaria_ead: number;
  creditos: number;
  tipo: TipoDisciplina;
  ativo: boolean;
}
interface ModuloRow { id: string; ordem: number; }
interface PrereqV2Row { disciplina_id: string; prerequisito_id: string; tipo: TipoPrerequisito; }
interface CodigoRow { id: string; codigo: string; }

// Listagem de disciplinas — adapter sobre disciplinas_v2 + modulos (query separada)
export async function getDisciplinas(): Promise<Disciplina[]> {
  // Query 1: disciplinas_v2
  const { data: discs, error: discErr } = await supabase
    .from('disciplinas_v2')
    .select('id, modulo_id, codigo, nome, area, ano_curso, carga_horaria_presencial, carga_horaria_ead, creditos, tipo, ativo')
    .limit(200);
  if (discErr || !discs) return [];

  // Query 2: modulos (separada — LICAO-026) para resolver o número do módulo
  const { data: mods, error: modErr } = await supabase
    .from('modulos')
    .select('id, ordem')
    .limit(50);
  if (modErr) return [];

  const ordemById = new Map((mods as ModuloRow[] ?? []).map(m => [m.id, m.ordem]));

  const mapped: Disciplina[] = (discs as DisciplinaV2Row[]).map(d => ({
    id: d.id,
    codigo: d.codigo,
    nome: d.nome,
    modulo: ordemById.get(d.modulo_id) ?? 0,
    modulo_id: d.modulo_id,
    ano: d.ano_curso,
    horas_presencial: d.carga_horaria_presencial,
    horas_ead: d.carga_horaria_ead,
    carga_horaria: d.carga_horaria_presencial + d.carga_horaria_ead,
    creditos: d.creditos,
    tipo: d.tipo,
    area: d.area,
    ativo: d.ativo,
  }));

  // Ordena por módulo e nome (a ordenação real é feita aqui pois o módulo vem do merge)
  mapped.sort((a, b) => a.modulo - b.modulo || a.nome.localeCompare(b.nome));
  return mapped;
}

// Listagem de todos os pré-requisitos — resolve id→codigo (query separada + merge)
export async function getPrerequisitos(): Promise<Prerequisito[]> {
  const { data: prereqs, error } = await supabase
    .from('prerequisitos_v2')
    .select('disciplina_id, prerequisito_id, tipo')
    .limit(500);
  if (error || !prereqs) return [];

  const { data: discs, error: discErr } = await supabase
    .from('disciplinas_v2')
    .select('id, codigo')
    .limit(200);
  if (discErr) return [];

  const codigoById = new Map((discs as CodigoRow[] ?? []).map(d => [d.id, d.codigo]));

  return (prereqs as PrereqV2Row[])
    .map(p => ({
      disciplina_codigo: codigoById.get(p.disciplina_id) ?? '',
      prerequisito_codigo: codigoById.get(p.prerequisito_id) ?? '',
      tipo: p.tipo,
    }))
    .filter(p => p.disciplina_codigo && p.prerequisito_codigo);
}

// Listagem de módulos do curso — para dropdown de cadastro/edição (query separada)
export async function getModulos(): Promise<ModuloOpcao[]> {
  const { data, error } = await supabase
    .from('modulos')
    .select('id, ordem, nome')
    .order('ordem', { ascending: true })
    .limit(50);
  if (error || !data) return [];
  return data as ModuloOpcao[];
}

// Traduz DisciplinaInput (parcial) → colunas reais de disciplinas_v2
function toV2Patch(dados: Partial<DisciplinaInput>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (dados.codigo !== undefined)           patch.codigo = dados.codigo;
  if (dados.nome !== undefined)             patch.nome = dados.nome;
  if (dados.area !== undefined)             patch.area = dados.area;
  if (dados.ano_curso !== undefined)        patch.ano_curso = dados.ano_curso;
  if (dados.modulo_id !== undefined)        patch.modulo_id = dados.modulo_id;
  if (dados.horas_presencial !== undefined) patch.carga_horaria_presencial = dados.horas_presencial;
  if (dados.horas_ead !== undefined)        patch.carga_horaria_ead = dados.horas_ead;
  if (dados.creditos !== undefined)         patch.creditos = dados.creditos;
  if (dados.tipo !== undefined)             patch.tipo = dados.tipo;
  if (dados.ativo !== undefined)            patch.ativo = dados.ativo;
  // carga_horaria (total) é derivada — disciplinas_v2 não possui coluna de total.
  return patch;
}

// Erro de código duplicado (UNIQUE em disciplinas_v2.codigo)
function isCodigoDuplicado(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

// Criação de disciplina — INSERT em disciplinas_v2 (ativo=true por padrão)
export async function createDisciplina(dados: DisciplinaInput): Promise<ServiceResult> {
  const { error } = await supabase
    .from('disciplinas_v2')
    .insert({ ...toV2Patch(dados), ativo: dados.ativo ?? true });

  if (error) {
    if (isCodigoDuplicado(error)) {
      return { error: `Já existe uma disciplina com o código "${dados.codigo}".` };
    }
    return { error: error.message };
  }
  return { error: null };
}

// Atualização de disciplina — grava em disciplinas_v2, chave por id.
// Aceita TODAS as colunas editáveis (código, área, ano, módulo, CH, créditos, tipo, ativo).
export async function updateDisciplina(
  id: string,
  dados: DisciplinaUpdate
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('disciplinas_v2')
    .update(toV2Patch(dados))
    .eq('id', id);

  if (error) {
    if (isCodigoDuplicado(error)) {
      return { error: `Já existe uma disciplina com o código "${dados.codigo}".` };
    }
    return { error: error.message };
  }
  return { error: null };
}

// Soft delete — desativa a disciplina (NUNCA hard delete; preserva histórico)
export async function desativarDisciplina(id: string): Promise<ServiceResult> {
  const { error } = await supabase
    .from('disciplinas_v2')
    .update({ ativo: false })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

// Sincronização de pré-requisitos de uma disciplina (grava em prerequisitos_v2).
// Traduz codigo→id. ⚠️ Operação crítica: backup → delete → insert → rollback manual.
// Supabase JS não suporta transações no cliente — rollback é feito em JS.
export async function syncPrerequisitos(
  disciplinaCodigo: string,
  novosPrereqs: Prerequisito[]
): Promise<ServiceResult> {

  // 0. Resolver codigo→id de todas as disciplinas
  const { data: discs, error: discErr } = await supabase
    .from('disciplinas_v2')
    .select('id, codigo')
    .limit(200);
  if (discErr || !discs) {
    return { error: 'Erro ao resolver códigos de disciplina.' };
  }
  const idByCodigo = new Map((discs as CodigoRow[]).map(d => [d.codigo, d.id]));

  const disciplinaId = idByCodigo.get(disciplinaCodigo);
  if (!disciplinaId) return { error: 'Disciplina não encontrada.' };

  // Traduzir novos pré-requisitos para ids
  const novasLinhas: PrereqV2Row[] = [];
  for (const p of novosPrereqs) {
    const prereqId = idByCodigo.get(p.prerequisito_codigo);
    if (!prereqId) return { error: `Pré-requisito ${p.prerequisito_codigo} não encontrado.` };
    novasLinhas.push({ disciplina_id: disciplinaId, prerequisito_id: prereqId, tipo: p.tipo });
  }

  // 1. Ler estado atual para rollback
  const { data: backup, error: backupError } = await supabase
    .from('prerequisitos_v2')
    .select('disciplina_id, prerequisito_id, tipo')
    .eq('disciplina_id', disciplinaId);

  if (backupError) {
    return { error: 'Erro ao ler pré-requisitos atuais.' };
  }

  // 2. Deletar pré-requisitos da disciplina
  const { error: deleteError } = await supabase
    .from('prerequisitos_v2')
    .delete()
    .eq('disciplina_id', disciplinaId);

  if (deleteError) {
    return { error: 'Erro ao remover pré-requisitos antigos.' };
  }

  // 3. Inserir novos pré-requisitos em batch
  if (novasLinhas.length > 0) {
    const { error: insertError } = await supabase
      .from('prerequisitos_v2')
      .insert(novasLinhas);

    if (insertError) {
      // 4. Rollback: restaurar estado anterior
      if (backup && backup.length > 0) {
        await supabase
          .from('prerequisitos_v2')
          .insert(backup);
      }
      return { error: 'Erro ao salvar pré-requisitos. Estado anterior restaurado.' };
    }
  }

  return { error: null };
}
