import { supabase } from '@/lib/supabase';

export interface Material {
  id: string;
  disciplina_id: string;
  nome: string;
  tipo: 'pdf' | 'video' | 'link' | 'apostila';
  url: string;
  ordem: number;
  visivel: boolean;
  criado_em: string;
}

export interface ProgressoAluno {
  id: string;
  aluno_id: string;
  material_id: string;
  disciplina_id: string;
  visualizado_em: string;
}

export interface ServiceResult {
  error: string | null;
}

export async function getMateriaisByDisciplina(
  disciplinaId: string,
  apenasVisiveis = true
): Promise<Material[]> {
  let query = supabase
    .from('materiais')
    .select('*')
    .eq('disciplina_id', disciplinaId)
    .order('ordem', { ascending: true });

  if (apenasVisiveis) query = query.eq('visivel', true);

  const { data, error } = await query;
  if (error) return [];
  return (data as Material[]) ?? [];
}

export async function getProgressoByAluno(
  alunoId: string,
  disciplinaId: string
): Promise<ProgressoAluno[]> {
  const { data, error } = await supabase
    .from('progresso_aluno')
    .select('*')
    .eq('aluno_id', alunoId)
    .eq('disciplina_id', disciplinaId);

  if (error) return [];
  return (data as ProgressoAluno[]) ?? [];
}

export async function marcarMaterialVisualizado(
  alunoId: string,
  materialId: string,
  disciplinaId: string
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('progresso_aluno')
    .upsert(
      { aluno_id: alunoId, material_id: materialId, disciplina_id: disciplinaId },
      { onConflict: 'aluno_id,material_id' }
    );

  if (error) return { error: error.message };
  return { error: null };
}

// Retorna percentual de materiais visualizados pelo aluno na disciplina (0-100)
export async function getPercentualProgresso(
  alunoId: string,
  disciplinaId: string
): Promise<number> {
  const [materiais, progresso] = await Promise.all([
    getMateriaisByDisciplina(disciplinaId, true),
    getProgressoByAluno(alunoId, disciplinaId),
  ]);

  if (materiais.length === 0) return 100;
  const percentual = Math.round((progresso.length / materiais.length) * 100);
  return Math.min(percentual, 100);
}

// Upload do manual da disciplina para o Supabase Storage
export async function uploadManualDisciplina(
  disciplinaId: string,
  arquivo: File
): Promise<{ url: string | null; error: string | null }> {
  const path = `manuais/${disciplinaId}/${arquivo.name}`;

  const { error: uploadError } = await supabase.storage
    .from('materiais-disciplinas')
    .upload(path, arquivo, { upsert: true });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage
    .from('materiais-disciplinas')
    .getPublicUrl(path);

  // Atualiza o campo manual_url na disciplina
  await supabase
    .from('disciplinas_v2')
    .update({ manual_url: data.publicUrl, status_manual: 'disponivel' })
    .eq('id', disciplinaId);

  return { url: data.publicUrl, error: null };
}
