import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getRole } from '@/services/profile.service';

export const ROLES_COM_ACESSO: string[] = [
  'aluno', 'professor', 'administracao', 'admin', 'superadmin',
];

// pendente   → /aguardando (conta criada, aguarda aprovação)
// sem-sessao → /login
// bloqueado  → /login  (role desconhecido — falha segura por padrão)
type Estado = 'carregando' | 'autorizado' | 'pendente' | 'sem-sessao' | 'bloqueado';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('carregando');

  useEffect(() => {
    let montado = true;

    async function verificar() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (montado) setEstado('sem-sessao');
        return;
      }

      const role = await getRole(session.user.id);
      if (!montado) return;

      if (ROLES_COM_ACESSO.includes(role)) {
        setEstado('autorizado');
      } else if (role === 'pendente') {
        setEstado('pendente');
      } else {
        setEstado('bloqueado'); // role desconhecido → /login (seguro por padrão)
      }
    }

    verificar();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && montado) setEstado('sem-sessao');
      if (event === 'SIGNED_IN')             verificar();
    });

    return () => { montado = false; subscription.unsubscribe(); };
  }, []);

  if (estado === 'carregando') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <img src="/logo_itec.png" alt="ITEC" className="h-12 w-auto opacity-60" />
          <span className="text-sm">Validando acesso...</span>
        </div>
      </div>
    );
  }

  if (estado === 'sem-sessao') return <Navigate to="/login"     replace />;
  if (estado === 'pendente')   return <Navigate to="/aguardando" replace />;
  if (estado === 'bloqueado')  return <Navigate to="/login"     replace />;

  return <>{children}</>;
}
