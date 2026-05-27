import { supabase } from '@/lib/supabase';
import type { UserRole, Profile } from '@/hooks/use-profile';

export type { UserRole, Profile };

// Leitura de role — hot path do ProtectedRoute.
// Retorna 'pendente' como fallback seguro se o perfil não existir.
export async function getRole(userId: string): Promise<UserRole> {
  if (!userId) return 'pendente';

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) return 'pendente';
    return (data.role as UserRole) ?? 'pendente';
  } catch {
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

// Upload de foto de perfil → Storage 'avatars' → salva URL no profiles
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const ext  = file.name.split('.').pop() ?? 'jpg';
  const path = `avatars/${userId}.${ext}`;

  const { error: uploadError } = await supabase
    .storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = data.publicUrl;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId);

  if (updateError) return { url: null, error: updateError.message };
  return { url, error: null };
}

// Upsert de perfil — usado pelo DevSetup para criar usuários de teste.
export async function upsertProfile(
  profile: Partial<Profile> & { id: string }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').upsert(profile);
  if (error) return { error: error.message };
  return { error: null };
}
