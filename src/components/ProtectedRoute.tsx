import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';

// Consumidor do AuthProvider (fonte ÚNICA da verdade de auth).
// Não faz getSession/onAuthStateChange/getRole próprios — só reage ao status.
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status, retry, signOut } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <img src="/logo_itec.png" alt="ITEC" className="h-12 w-auto opacity-60" />
          <span className="text-sm">Validando acesso...</span>
        </div>
      </div>
    );
  }

  // Estado recuperável — backend travou/demorou demais. Sem redirect automático:
  // o usuário tem duas saídas claras, sem F5.
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground text-center px-6 max-w-sm">
          <img src="/logo_itec.png" alt="ITEC" className="h-12 w-auto opacity-60" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Não conseguimos validar seu acesso</p>
            <p className="text-xs">O servidor demorou para responder (pode estar iniciando). Você pode tentar de novo ou ir para o login.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={retry}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => { void signOut(); }}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all"
            >
              Ir para login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return <Navigate to="/login"      replace />;
  if (status === 'pending')         return <Navigate to="/aguardando" replace />;

  return <>{children}</>;
}
