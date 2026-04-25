import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { 
        setProfile(null);
        setLoading(false); 
        return; 
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile({ ...data, email: session.user.email });
      } else {
        // Fallback if profile doesn't exist (e.g. trigger failed or RLS blocked)
        setProfile({
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
          role: (session.user.user_metadata?.role as UserRole) || 'aluno',
          email: session.user.email
        });
      }
      setLoading(false);
    }
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, []);

  return { profile, loading };
}
