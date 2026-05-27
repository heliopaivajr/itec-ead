import { supabase } from '@/lib/supabase';
import type { UserRole, Profile } from '@/hooks/use-profile';

export type { UserRole, Profile };

// Leitura de role — hot path do ProtectedRoute.
// Logs detalhados para diagnóstico de auth issues.
export async function getRole(userId: string): Promise<UserRole> {
  console.log('[getRole] iniciando para userId:', userId);

  if (!userId) {
    console.log('[getRole] userId vazio — retornando pendente');
    return 'pendente';
  }

  try {
    console.log('[getRole] fazendo query no banco...');

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    console.log('[getRole] resultado:', { data, error });

    if (error || !data) {
      console.log('[getRole] erro ou sem dados — retornando pendente');
      return 'pendente';
    }

    console.log('[getRole] role encontrado:', data.role);
    return (data.role as UserRole) ?? 'pendente';
  } catch (e) {
    console.log('[getRole] exception:', e);
    return 'pendente';
  }
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
