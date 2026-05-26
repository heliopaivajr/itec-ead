import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/services/profile.service';

export interface UserRow {
  id: string;
  full_name: string;
  email?: string;
  role: UserRole;
  telefone?: string;
  bio?: string;
  foto_url?: string;
  updated_at?: string;
  created_at: string;
}

export interface ServiceResult {
  error: string | null;
}

// Listagem de todos os usuários — sem LIMIT (admin vê todos)
export async function getUsuarios(): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data as UserRow[]) ?? [];
}

// Atualização de role — usado pelo admin em Usuarios.tsx
export async function updateRole(userId: string, role: UserRole): Promise<ServiceResult> {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

// Atualização completa de usuário — usado no modal de edição em Usuarios.tsx
export async function updateUsuario(
  userId: string,
  dados: { full_name: string; telefone: string; role: string }
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('profiles')
    .update(dados)
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

// Atualização do próprio perfil — usado em Perfil.tsx
export async function updatePerfil(
  userId: string,
  dados: { full_name: string; telefone: string; bio: string }
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}
