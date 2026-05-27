import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getRole } from '@/services/profile.service';
import type { Session } from '@supabase/supabase-js';

export const ROLES_COM_ACESSO: string[] = [
  'aluno', 'professor', 'administracao', 'admin', 'superadmin',
];

// pendente   → /aguardando (conta criada, aguarda aprovação)
// sem-sessao → /login
// bloqueado  → /login (role desconhecido — falha segura)
type Estado = 'carregando' | 'autorizado' | 'pendente' | 'sem-sessao' | 'bloqueado';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('carregando');

  // Timeout de segurança: 30s — Supabase free tier pode pausar e levar 10-30s para acordar
  useEffect(() => {
    if (estado !== 'carregando') return;
    const timer = setTimeout(() => {
      setEstado(prev => prev === 'carregando' ? 'sem-sessao' : prev);
    }, 30000);
    return () => clearTimeout(timer);
  }, [estado]);

  useEffect(() => {
    let montado = true;

    async function verificar(session: Session | null) {
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
        setEstado('bloqueado');
      }
    }

    // 1. Registrar listener PRIMEIRO — captura INITIAL_SESSION e SIGNED_IN do PKCE callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!montado) return;
        if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'INITIAL_SESSION'
        ) {
          await verificar(session);
        }
        if (event === 'SIGNED_OUT') {
          if (montado) setEstado('sem-sessao');
        }
      }
    );

    // 2. Verificar sessão já existente (ex: usuário que voltou à aba)
    // Se null: NÃO redirecionar — aguardar INITIAL_SESSION/SIGNED_IN do onAuthStateChange
    // O timeout de 30s garante que nunca ficará preso para sempre
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) verificar(session);
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
