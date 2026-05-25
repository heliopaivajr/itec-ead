import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { env } from '@/config/env';

export type UserRole = 'aluno' | 'professor' | 'administracao' | 'admin' | 'superadmin';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  telefone?: string;
  foto_url?: string;
  bio?: string;
  email?: string;
}

const SUPERADMIN_EMAIL = env.superadminEmail;

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await supabase.auth.signOut();
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

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        // Force superadmin for the main admin regardless of what's stored in DB
        const role: UserRole = userEmail === SUPERADMIN_EMAIL ? 'superadmin' : (data.role as UserRole);
        setProfile({ ...data, email: userEmail, role });
      } else {
        // Fallback if profile row doesn't exist yet
        const role: UserRole = userEmail === SUPERADMIN_EMAIL ? 'superadmin' : 'aluno';
        setProfile({
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || userEmail.split('@')[0] || 'Usuário',
          role,
          email: userEmail,
        });
      }

      setLoading(false);
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, []);

  return { profile, setProfile, loading, logout };
}
