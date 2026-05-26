import { supabase } from '@/lib/supabase';
import type { UserRole, Profile } from '@/hooks/use-profile';

export type { UserRole, Profile };

// Leitura de role apenas — hot path do ProtectedRoute.
// Retorna 'pendente' como fallback seguro se o perfil não existir.
export async function getRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) return 'pendente';
  return (data.role as UserRole) ?? 'pendente';
}

// Leitura completa do perfil com fallback para usuário novo.
export async function getProfile(
  userId: string,
  userEmail: string,
  userMetadata?: Record<string, any>
): Promise<Profile> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (data) {
    return { ...data, email: userEmail, role: data.role as UserRole };
  }

  // Fallback: perfil ainda não criado — role pendente bloqueia acesso
  return {
    id: userId,
    full_name: userMetadata?.full_name || userEmail.split('@')[0] || 'Usuário',
    role: 'pendente',
    email: userEmail,
  };
}

// Upsert de perfil — usado pelo DevSetup para criar usuários de teste.
export async function upsertProfile(
  profile: Partial<Profile> & { id: string }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').upsert(profile);
  if (error) return { error: error.message };
  return { error: null };
}
