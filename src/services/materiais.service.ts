import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────
// Materiais da disciplina (tabela materiais_disciplina + bucket privado
// materiais-disciplina). Migração 20260622_049_materiais_disciplina.sql.
// RLS: aluno só vê status='aprovado' & ativo das suas disciplinas; staff (admin/
// superadmin) gerencia tudo. O download usa signed URL temporária.
// ─────────────────────────────────────────────────────────────

export type TipoMaterial = 'pdf' | 'doc' | 'xls' | 'video' | 'outro';
export type OrigemMaterial = 'upload' | 'link';
export type StatusMaterial = 'rascunho' | 'pendente' | 'aprovado';

export interface Material {
  id: string;
  disciplina_id: string;
  titulo: string;
  descricao: string | null;
  tipo: TipoMaterial;
  origem: OrigemMaterial;
  arquivo_url: string;        // path no Storage (upload) ou URL (link)
  tamanho_bytes: number | null;
  eh_resumo: boolean;
  status: StatusMaterial;
  versao: number;
  ativo: boolean;
  criado_por: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface MaterialInput {
  disciplina_id: string;
  titulo: string;
  descricao?: string | null;
  tipo: TipoMaterial;
  origem: OrigemMaterial;
  arquivo_url: string;
  tamanho_bytes?: number | null;
  eh_resumo?: boolean;
}

export interface ServiceResult {
  error: string | null;
}

const BUCKET = 'materiais-disciplina';
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
export const EXTENSOES_PERMITIDAS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'mp4'] as const;

async function uidAtual(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// Lista materiais ATIVOS da disciplina (RLS filtra: aluno só vê 'aprovado').
export async function listarMateriais(disciplinaId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materiais_disciplina')
    .select('*')
    .eq('disciplina_id', disciplinaId)
    .eq('ativo', true)
    .order('criado_em', { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data as Material[];
}

// Cria um material (status 'pendente'; criado_por = usuário atual).
export async function criarMaterial(input: MaterialInput): Promise<ServiceResult> {
  const criado_por = await uidAtual();

  const { error } = await supabase
    .from('materiais_disciplina')
    .insert({
      disciplina_id: input.disciplina_id,
      titulo: input.titulo,
      descricao: input.descricao ?? null,
      tipo: input.tipo,
      origem: input.origem,
      arquivo_url: input.arquivo_url,
      tamanho_bytes: input.tamanho_bytes ?? null,
      eh_resumo: input.eh_resumo ?? false,
      status: 'pendente',
      criado_por,
    });

  if (error) return { error: error.message };
  return { error: null };
}

// Faz upload do arquivo para o bucket privado. VALIDA tamanho (<=50MB) e extensão
// ANTES de subir. Retorna o path (para gravar em arquivo_url) e o tamanho.
export async function uploadArquivo(
  disciplinaId: string,
  file: File
): Promise<{ path: string | null; tamanho_bytes: number | null; error: string | null }> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();

  if (!EXTENSOES_PERMITIDAS.includes(ext as typeof EXTENSOES_PERMITIDAS[number])) {
    return { path: null, tamanho_bytes: null, error: `Extensão ".${ext}" não permitida. Use: ${EXTENSOES_PERMITIDAS.join(', ')}.` };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { path: null, tamanho_bytes: null, error: `Arquivo muito grande (${mb} MB). Limite de 50 MB — para vídeos, suba no YouTube e cadastre como link.` };
  }

  const path = `${disciplinaId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (upErr) return { path: null, tamanho_bytes: null, error: upErr.message };

  return { path, tamanho_bytes: file.size, error: null };
}

// Gera URL temporária (1h) para baixar um material de upload.
export async function getDownloadUrl(path: string): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) return { url: null, error: error?.message ?? 'Não foi possível gerar o link.' };
  return { url: data.signedUrl, error: null };
}

// Aprova um material (staff). Marca aprovado_por/aprovado_em.
export async function aprovarMaterial(id: string): Promise<ServiceResult> {
  const aprovado_por = await uidAtual();
  const { error } = await supabase
    .from('materiais_disciplina')
    .update({ status: 'aprovado', aprovado_por, aprovado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

// Soft delete — desativa o material (nunca hard delete; preserva histórico).
export async function desativarMaterial(id: string): Promise<ServiceResult> {
  const { error } = await supabase
    .from('materiais_disciplina')
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}
