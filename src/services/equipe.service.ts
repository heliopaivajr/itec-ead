import { supabase } from '@/lib/supabase';

export interface MembroEquipe {
  id: string;
  user_id: string | null;
  nome: string;
  cargo: string;
  role_sistema: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  criado_em: string;
}

export type MembroPayload = Omit<MembroEquipe, 'id' | 'criado_em'>;

export interface ServiceResult {
  error: string | null;
}

export async function getEquipe(): Promise<MembroEquipe[]> {
  const { data, error } = await supabase
    .from('equipe_itec')
    .select('*')
    .order('nome', { ascending: true });

  if (error) return [];
  return (data as MembroEquipe[]) ?? [];
}

export async function createMembro(
  dados: MembroPayload
): Promise<{ data: MembroEquipe | null; error: string | null }> {
  const { data, error } = await supabase
    .from('equipe_itec')
    .insert(dados)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as MembroEquipe, error: null };
}

export async function updateMembro(
  id: string,
  dados: Partial<MembroPayload>
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('equipe_itec')
    .update(dados)
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function desativarMembro(id: string): Promise<ServiceResult> {
  const { error } = await supabase
    .from('equipe_itec')
    .update({ ativo: false })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}
