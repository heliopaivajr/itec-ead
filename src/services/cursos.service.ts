import { supabase } from '@/lib/supabase';
import type { TipoDisciplina, AreaDisciplina, TipoPrerequisito } from '@/data/disciplinas';

export interface Disciplina {
  codigo: string;
  nome: string;
  modulo: number;
  ano: number;
  carga_horaria: number;
  horas_presencial: number;
  horas_ead: number;
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

export type DisciplinaUpdate = Partial<Pick<Disciplina,
  'nome' | 'carga_horaria' | 'horas_presencial' | 'horas_ead' | 'tipo' | 'area' | 'ativo'
>>;

// Listagem de disciplinas — ordenada por módulo e nome
export async function getDisciplinas(): Promise<Disciplina[]> {
  const { data, error } = await supabase
    .from('disciplinas')
    .select('*')
    .order('modulo', { ascending: true })
    .order('nome',   { ascending: true });

  if (error) return [];
  return (data as Disciplina[]) ?? [];
}

// Listagem de todos os pré-requisitos
export async function getPrerequisitos(): Promise<Prerequisito[]> {
  const { data, error } = await supabase
    .from('prerequisitos_disciplinas')
    .select('*');

  if (error) return [];
  return (data as Prerequisito[]) ?? [];
}

// Atualização parcial de disciplina
export async function updateDisciplina(
  codigo: string,
  dados: DisciplinaUpdate
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('disciplinas')
    .update(dados)
    .eq('codigo', codigo);

  if (error) return { error: error.message };
  return { error: null };
}

// Sincronização de pré-requisitos de uma disciplina.
// ⚠️ Operação crítica: backup → delete → insert → rollback manual se insert falhar.
// Supabase JS não suporta transações no cliente — rollback é feito em JS.
export async function syncPrerequisitos(
  disciplinaCodigo: string,
  novosPrereqs: Prerequisito[]
): Promise<ServiceResult> {

  // 1. Ler estado atual para rollback
  const { data: backup, error: backupError } = await supabase
    .from('prerequisitos_disciplinas')
    .select('disciplina_codigo, prerequisito_codigo, tipo')
    .eq('disciplina_codigo', disciplinaCodigo);

  if (backupError) {
    return { error: 'Erro ao ler pré-requisitos atuais.' };
  }

  // 2. Deletar pré-requisitos da disciplina
  const { error: deleteError } = await supabase
    .from('prerequisitos_disciplinas')
    .delete()
    .eq('disciplina_codigo', disciplinaCodigo);

  if (deleteError) {
    return { error: 'Erro ao remover pré-requisitos antigos.' };
  }

  // 3. Inserir novos pré-requisitos em batch
  if (novosPrereqs.length > 0) {
    const { error: insertError } = await supabase
      .from('prerequisitos_disciplinas')
      .insert(novosPrereqs);

    if (insertError) {
      // 4. Rollback: restaurar estado anterior
      if (backup && backup.length > 0) {
        await supabase
          .from('prerequisitos_disciplinas')
          .insert(backup);
      }
      return { error: 'Erro ao salvar pré-requisitos. Estado anterior restaurado.' };
    }
  }

  return { error: null };
}
