import { supabase } from '@/lib/supabase';
import type { UserRole, Profile } from '@/hooks/use-profile';

export type { UserRole, Profile };

// Leitura de role apenas — hot path do ProtectedRoute.
// Timeout de 5s: RLS com query lenta não pode travar o login indefinidamente.
// Retorna 'pendente' como fallback seguro se erro ou timeout.
export async function getRole(userId: string): Promise<UserRole> {
  const queryPromise = supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  const timeoutPromise = new Promise<null>(resolve =>
    setTimeout(() => resolve(null), 5000)
  );

  const resultado = await Promise.race([queryPromise, timeoutPromise]);

  if (!resultado || 'error' in resultado && resultado.error) return 'pendente';
  if (!('data' in resultado) || !resultado.data) return 'pendente';
  return (resultado.data.role as UserRole) ?? 'pendente';
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
