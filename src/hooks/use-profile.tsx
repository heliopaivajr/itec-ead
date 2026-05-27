import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/services/profile.service';
import { signOut as authSignOut } from '@/services/auth.service';

export type UserRole = 'pendente' | 'aluno' | 'professor' | 'administracao' | 'admin' | 'superadmin';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  telefone?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await authSignOut();
    setProfile(null);
  };

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const userEmail = session.user.email ?? '';

      setProfile(await getProfile(session.user.id, userEmail, session.user.user_metadata));

      setLoading(false);
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, []);

  return { profile, setProfile, loading, logout };
}
