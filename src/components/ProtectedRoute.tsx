import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getRole } from '@/services/profile.service';
import type { Session } from '@supabase/supabase-js';

export const ROLES_COM_ACESSO: string[] = [
  'aluno', 'professor', 'administracao', 'financeiro', 'admin', 'superadmin',
];

// pendente   → /aguardando (conta criada, aguarda aprovação)
// sem-sessao → /login   (somente quando NÃO há sessão de fato, ou SIGNED_OUT)
// bloqueado  → /login   (role desconhecido — falha segura)
// demorado   → backend lento/cold start: continua tentando, com opção "Tentar novamente"
//              (NUNCA redireciona — tolera Supabase Free lento sem falso logout)
type Estado = 'carregando' | 'demorado' | 'autorizado' | 'pendente' | 'sem-sessao' | 'bloqueado';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('carregando');
  // Incrementar força a reexecução da verificação (botão "Tentar novamente")
  const [tentativa, setTentativa] = useState(0);

  // FIX 1: o timeout NÃO desloga. Após 10s ainda carregando, apenas troca a UI
  // para "demorado" (continua aguardando a verificação real). Sem redirect.
  useEffect(() => {
    if (estado !== 'carregando') return;
    const timer = setTimeout(() => {
      setEstado(prev => (prev === 'carregando' ? 'demorado' : prev));
    }, 10000);
    return () => clearTimeout(timer);
  }, [estado]);

  useEffect(() => {
    let montado = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function verificar(session: Session | null) {
      if (!session) {
        // Sessão null de fato → login
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

    // 1. Listener primeiro — captura INITIAL_SESSION, SIGNED_IN e TOKEN_REFRESHED.
    //    FIX 2: confiamos no autoRefreshToken do client; o refresh chega aqui
    //    como TOKEN_REFRESHED. Não há refresh manual concorrente.
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!montado) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        await verificar(session);
      } else if (event === 'SIGNED_OUT') {
        setEstado('sem-sessao');
      }
    });
    subscription = data.subscription;

    // 2. Hidratação inicial via getSession (NÃO faz refresh manual — FIX 2).
    //    Se a sessão existir mas o token estiver expirado, o autoRefreshToken
    //    renova em background e dispara TOKEN_REFRESHED (tratado acima).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!montado) return;
      if (!session) {
        setEstado('sem-sessao');
        return;
      }
      verificar(session);
    });

    return () => { montado = false; subscription?.unsubscribe(); };
  }, [tentativa]);

  const tentarNovamente = () => {
    setEstado('carregando');
    setTentativa(t => t + 1);
  };

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

  // FIX 1: estado "demorado" — backend lento. Continua validando em segundo plano
  // (se a verificação responder, vai para autorizado sozinho). NUNCA redireciona.
  if (estado === 'demorado') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground text-center px-6">
          <img src="/logo_itec.png" alt="ITEC" className="h-12 w-auto opacity-60" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Ainda validando seu acesso...</p>
            <p className="text-xs">O servidor pode estar iniciando. Isso pode levar alguns segundos.</p>
          </div>
          <button
            onClick={tentarNovamente}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (estado === 'sem-sessao') return <Navigate to="/login"     replace />;
  if (estado === 'pendente')   return <Navigate to="/aguardando" replace />;
  if (estado === 'bloqueado')  return <Navigate to="/login"     replace />;

  return <>{children}</>;
}
