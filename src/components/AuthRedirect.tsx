import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// Rotas públicas que não requerem auth
const PUBLIC_PATHS = [
  '/', '/login', '/cadastro', '/esqueci-senha',
  '/cursos', '/professores', '/sobre', '/contato',
  '/comunidade', '/blog', '/reservar-vaga',
  '/privacidade', '/aguardando', '/dev-setup',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

/**
 * Listener global de autenticação.
 * SIGNED_IN  → redireciona para /dashboard se estiver em rota pública
 * SIGNED_OUT → redireciona para /login se estiver em rota protegida
 *
 * Necessário para o fluxo Google OAuth PKCE onde Supabase redireciona
 * de volta para o app e troca o código de forma assíncrona — o ProtectedRoute
 * pode chamar getSession() antes da troca completar e ver sessão null.
 */
export function AuthRedirect() {
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Forçar refresh do token garante que o ProtectedRoute
          // lerá o role mais recente do banco (não o JWT cacheado).
          await supabase.auth.refreshSession();

          if (isPublicPath(location.pathname)) {
            navigate('/dashboard', { replace: true });
          }
        }

        if (event === 'SIGNED_OUT') {
          if (!isPublicPath(location.pathname)) {
            navigate('/login', { replace: true });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  // Intencionalmente sem location.pathname nas deps:
  // queremos capturar o pathname no momento do evento, não re-subscrever.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return null;
}
