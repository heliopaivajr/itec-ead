import { supabase } from '@/lib/supabase';
import { getCursoAtivo } from '@/services/academico.service';

// ─────────────────────────────────────────────────────────────
// Manual do Aluno (handbook institucional) — coluna cursos.manual_aluno_url
// + bucket privado 'manuais-aluno'. Migração 20260622_050_manual_aluno.sql.
// RLS: leitura para qualquer authenticated; escrita só admin/superadmin.
// O download usa signed URL temporária.
// ─────────────────────────────────────────────────────────────

export interface ServiceResult {
  error: string | null;
}

const BUCKET = 'manuais-aluno';
const MANUAL_PATH = 'handbook/manual-aluno.pdf';
export const MAX_MANUAL_BYTES = 50 * 1024 * 1024; // 50 MB

// Sobe o PDF do handbook (substitui o anterior) e grava o path no curso ativo.
export async function uploadManualAluno(file: File): Promise<ServiceResult> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  const ehPdf = ext === 'pdf' || file.type === 'application/pdf';
  if (!ehPdf) return { error: 'O manual do aluno deve ser um arquivo PDF.' };
  if (file.size > MAX_MANUAL_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { error: `Arquivo muito grande (${mb} MB). Limite de 50 MB.` };
  }

  const curso = await getCursoAtivo();
  if (!curso) return { error: 'Nenhum curso ativo encontrado.' };

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(MANUAL_PATH, file, { upsert: true, contentType: 'application/pdf' });
  if (upErr) return { error: upErr.message };

  const { error: updErr } = await supabase
    .from('cursos')
    .update({ manual_aluno_url: MANUAL_PATH })
    .eq('id', curso.id);
  if (updErr) return { error: updErr.message };

  return { error: null };
}

// Retorna uma signed URL (1h) do handbook, ou null se ainda não houver manual.
export async function getManualAlunoUrl(): Promise<{ url: string | null; error: string | null }> {
  const curso = await getCursoAtivo();
  if (!curso?.manual_aluno_url) return { url: null, error: null };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(curso.manual_aluno_url, 3600);
  if (error || !data) return { url: null, error: error?.message ?? 'Não foi possível gerar o link.' };

  return { url: data.signedUrl, error: null };
}
