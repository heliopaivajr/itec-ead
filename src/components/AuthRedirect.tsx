import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Refresh único com timeout — garante token fresco sem bloquear.
          // ProtectedRoute NÃO faz outro refresh para evitar loop.
          await Promise.race([
            supabase.auth.refreshSession(),
            new Promise(resolve => setTimeout(resolve, 3000)),
          ]);

          if (isPublicPath(window.location.pathname)) {
            navigate('/dashboard', { replace: true });
          }
        }

        if (event === 'SIGNED_OUT') {
          if (!isPublicPath(window.location.pathname)) {
            navigate('/login', { replace: true });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}
