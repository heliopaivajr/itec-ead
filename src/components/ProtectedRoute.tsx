import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getRole } from '@/services/profile.service';
import type { Session } from '@supabase/supabase-js';

export const ROLES_COM_ACESSO: string[] = [
  'aluno', 'professor', 'administracao', 'financeiro', 'admin', 'superadmin',
];

// pendente   → /aguardando (conta criada, aguarda aprovação)
// sem-sessao → /login
// bloqueado  → /login (role desconhecido — falha segura)
type Estado = 'carregando' | 'autorizado' | 'pendente' | 'sem-sessao' | 'bloqueado';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('carregando');

  // Timeout de segurança: 10s — evita loading infinito se refresh falhar
  // BUG-UI-003: reduzido de 30s para 10s
  useEffect(() => {
    if (estado !== 'carregando') return;
    const timer = setTimeout(() => {
      setEstado(prev => prev === 'carregando' ? 'sem-sessao' : prev);
    }, 10000);
    return () => clearTimeout(timer);
  }, [estado]);

  useEffect(() => {
    let montado = true;
    let subscription: { unsubscribe: () => void } | null = null;

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

    function iniciar() {
      // 1. Registrar listener PRIMEIRO — captura INITIAL_SESSION e SIGNED_IN do PKCE callback
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!montado) return;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          await verificar(session);
        }
        if (event === 'SIGNED_OUT') {
          if (montado) setEstado('sem-sessao');
        }
      });
      subscription = data.subscription;

      // 2. Verificar sessão já existente (ex: usuário que voltou à aba)
      // BUG-UI-003: correção para evitar loading infinito com token expirado
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!montado) return;

        // Session null → redirecionar IMEDIATAMENTE
        if (!session) {
          setEstado('sem-sessao');
          return;
        }

        // Verificar se token expirou
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at || 0;

        if (expiresAt < now) {
          // Token expirado → forçar refresh explícito
          const { data: refreshData, error } = await supabase.auth.refreshSession();

          if (!montado) return;

          if (error || !refreshData.session) {
            // Refresh falhou → redirecionar para login
            setEstado('sem-sessao');
          } else {
            // Refresh OK → verificar com sessão renovada
            await verificar(refreshData.session);
          }
        } else {
          // Token válido → verificar normalmente
          await verificar(session);
        }
      });
    }

    // Inicia verificação de autenticação
    iniciar();

    return () => { montado = false; subscription?.unsubscribe(); };
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
