import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/services/profile.service';

export type { UserRole };

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string | null;
  autor_id: string;
  role_destino: UserRole | 'todos';
  fixado: boolean;
  expira_em: string | null;
  criado_em: string;
  autor?: { full_name: string; role: string };
}

export interface CreateAvisoPayload {
  titulo: string;
  conteudo?: string | null;
  autor_id: string;
  role_destino: string;
  fixado?: boolean;
  expira_em?: string | null;
}

export interface AvisosResult {
  data: Aviso[];
  error: string | null;
  noTable?: boolean;
}

// Listagem — ORDER BY fixado DESC, criado_em DESC, com join de autor
export async function getAvisos(): Promise<AvisosResult> {
  const { data, error } = await supabase
    .from('avisos')
    .select('*, autor:profiles(full_name, role)')
    .order('fixado', { ascending: false })
    .order('criado_em', { ascending: false });

  if (error) {
    const noTable = error.message.includes('does not exist') || error.code === '42P01';
    return { data: [], error: error.message, noTable };
  }

  return { data: (data as Aviso[]) ?? [], error: null };
}

// Criação — criado_em gerado pelo banco via DEFAULT NOW()
export async function createAviso(payload: CreateAvisoPayload): Promise<{ error: string | null }> {
  const { error } = await supabase.from('avisos').insert(payload);
  if (error) return { error: error.message };
  return { error: null };
}

// Edição
export interface UpdateAvisoPayload {
  titulo?: string;
  conteudo?: string | null;
  role_destino?: string;
  fixado?: boolean;
  expira_em?: string | null;
}

export async function updateAviso(
  id: string,
  dados: UpdateAvisoPayload
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('avisos').update(dados).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// Exclusão
export async function deleteAviso(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('avisos').delete().eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}
