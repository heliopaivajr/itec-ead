import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getRole } from '@/services/profile.service';

// Roles allowed to access the dashboard.
// 'pendente' is intentionally excluded — redirected to /aguardando.
// Unknown/missing roles redirect to /login (secure by default).
export const ROLES_COM_ACESSO: string[] = [
  'aluno', 'professor', 'administracao', 'admin', 'superadmin',
];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(undefined);
  const [role, setRole]       = useState<string | null | undefined>(undefined);

  useEffect(() => {
    async function check() {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s ?? null);
      if (!s?.user) { setRole(null); return; }

      setRole(await getRole(s.user.id));
    }

    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => check());
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined || role === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <img src="/logo_itec.png" alt="ITEC" className="h-12 w-auto opacity-60" />
          <span className="text-sm">Validando acesso...</span>
        </div>
      </div>
    );
  }

  if (!session)                         return <Navigate to="/login"     replace />;
  if (role === 'pendente')              return <Navigate to="/aguardando" replace />;
  if (!ROLES_COM_ACESSO.includes(role)) return <Navigate to="/login"     replace />;

  return children;
};

export default ProtectedRoute;
