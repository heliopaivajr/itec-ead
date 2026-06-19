import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getRole } from '@/services/profile.service';
import type { Session } from '@supabase/supabase-js';

export const ROLES_COM_ACESSO: string[] = [
  'aluno', 'professor', 'administracao', 'financeiro', 'admin', 'superadmin',
];

// pendente   → /aguardando (conta criada, aguarda aprovação)
// sem-sessao → /login   (sessão null de fato, refresh falho ou SIGNED_OUT)
// bloqueado  → /login   (role desconhecido — falha segura)
// erro       → backend travado/lento: estado RECUPERÁVEL com ações (Tentar
//              novamente / Ir para login). NUNCA redireciona sozinho.
type Estado = 'carregando' | 'autorizado' | 'pendente' | 'sem-sessao' | 'bloqueado' | 'erro';

// Embrulha uma promise num timeout: se não resolver em `ms`, rejeita.
// Evita que getSession()/refreshSession() travados (lock/cold start) prendam a UI.
function comTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('auth-timeout')), ms);
    promise.then(
      v => { clearTimeout(t); resolve(v); },
      e => { clearTimeout(t); reject(e); },
    );
  });
}

const AUTH_TIMEOUT_MS = 15000;

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('carregando');
  // Incrementar reexecuta o efeito de verificação (botão "Tentar novamente").
  const [tentativa, setTentativa] = useState(0);

  // Log observacional aos 10s — NÃO altera o fluxo (sem redirect).
  useEffect(() => {
    if (estado !== 'carregando') return;
    const timer = setTimeout(() => {
      console.warn('[ProtectedRoute] validação de acesso > 10s (backend lento?).');
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
      // 1. Listener primeiro — captura INITIAL_SESSION e SIGNED_IN do PKCE callback.
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

      // 2. Hidratação inicial — com TIMEOUT para não prender a UI se
      //    getSession()/refreshSession() travarem (lock interno / cold start).
      (async () => {
        try {
          const { data: { session } } = await comTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS);
          if (!montado) return;

          // Session null de fato → login.
          if (!session) {
            setEstado('sem-sessao');
            return;
          }

          // Token expirado → refresh explícito (também com timeout).
          const now = Math.floor(Date.now() / 1000);
          if ((session.expires_at || 0) < now) {
            const { data: refreshData, error } =
              await comTimeout(supabase.auth.refreshSession(), AUTH_TIMEOUT_MS);
            if (!montado) return;
            if (error || !refreshData.session) {
              setEstado('sem-sessao');
            } else {
              await verificar(refreshData.session);
            }
          } else {
            await verificar(session);
          }
        } catch {
          // Timeout/erro de rede em getSession/refresh → estado RECUPERÁVEL.
          // NUNCA redireciona automaticamente; o usuário decide pela UI.
          if (montado) setEstado(prev => (prev === 'carregando' ? 'erro' : prev));
        }
      })();
    }

    iniciar();

    return () => { montado = false; subscription?.unsubscribe(); };
  }, [tentativa]);

  // "Tentar novamente": volta a 'carregando' e reexecuta o efeito inteiro
  // (novo onAuthStateChange + novo getSession/verificação de verdade).
  const tentarNovamente = () => {
    setEstado('carregando');
    setTentativa(t => t + 1);
  };

  // "Ir para login": limpa a sessão (best-effort, com timeout p/ não travar)
  // e redireciona — saída garantida sem precisar de F5.
  const irParaLogin = async () => {
    try {
      await comTimeout(supabase.auth.signOut(), 5000);
    } catch {
      /* se signOut travar/falhar, seguimos para o login mesmo assim */
    }
    setEstado('sem-sessao');
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

  // Estado recuperável — backend travou/demorou demais. Sem redirect automático:
  // o usuário tem duas saídas claras, sem F5.
  if (estado === 'erro') {
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
              onClick={tentarNovamente}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
            >
              Tentar novamente
            </button>
            <button
              onClick={irParaLogin}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all"
            >
              Ir para login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (estado === 'sem-sessao') return <Navigate to="/login"     replace />;
  if (estado === 'pendente')   return <Navigate to="/aguardando" replace />;
  if (estado === 'bloqueado')  return <Navigate to="/login"     replace />;

  return <>{children}</>;
}
