import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/services/profile.service';
import type { Profile, UserRole } from '@/services/profile.service';
import type { Session, User } from '@supabase/supabase-js';

// Roles que têm acesso ao dashboard. Role 'pendente' → /aguardando;
// qualquer outro role desconhecido → falha segura (unauthenticated → /login).
export const ROLES_COM_ACESSO: string[] = [
  'aluno', 'professor', 'administracao', 'financeiro', 'admin', 'superadmin',
];

export type AuthStatus =
  | 'loading'         // hidratando sessão/profile
  | 'authenticated'   // role com acesso
  | 'unauthenticated' // sem sessão OU role desconhecido (falha segura) → /login
  | 'pending'         // role 'pendente' → /aguardando
  | 'error';          // backend travado/lento (recuperável; NÃO redireciona)

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  retry: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus]   = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // Incrementar reexecuta a hidratação (botão "Tentar novamente").
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let montado = true;
    let subscription: { unsubscribe: () => void } | null = null;

    // Busca o profile UMA vez e deriva o status a partir do role.
    async function hidratar(sess: Session | null) {
      if (!montado) return;
      if (!sess) {
        setSession(null);
        setProfile(null);
        setStatus('unauthenticated');
        return;
      }
      setSession(sess);
      const p = await getProfile(sess.user.id, sess.user.email ?? '', sess.user.user_metadata);
      if (!montado) return;
      setProfile(p);
      if (ROLES_COM_ACESSO.includes(p.role)) {
        setStatus('authenticated');
      } else if (p.role === 'pendente') {
        setStatus('pending');
      } else {
        setStatus('unauthenticated'); // role desconhecido → falha segura
      }
    }

    // 1. Único listener de auth do app inteiro.
    const { data } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!montado) return;
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setStatus('unauthenticated');
        return;
      }
      if (event === 'TOKEN_REFRESHED') {
        // Só atualiza a sessão; NÃO refaz o profile (evita recarga a cada refresh).
        setSession(sess);
        return;
      }
      if (event === 'SIGNED_IN') {
        hidratar(sess);
      }
      // INITIAL_SESSION é ignorado de propósito: a hidratação inicial é feita
      // pela IIFE abaixo (com timeout + escape p/ 'error'), evitando dupla busca.
    });
    subscription = data.subscription;

    // 2. Hidratação inicial — ÚNICO getSession, com timeout → 'error' (sem redirect).
    (async () => {
      try {
        const { data: { session: sess } } = await comTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS);
        if (!montado) return;
        if (!sess) { setStatus('unauthenticated'); return; }

        const now = Math.floor(Date.now() / 1000);
        if ((sess.expires_at || 0) < now) {
          const { data: refreshData, error } =
            await comTimeout(supabase.auth.refreshSession(), AUTH_TIMEOUT_MS);
          if (!montado) return;
          if (error || !refreshData.session) { setStatus('unauthenticated'); return; }
          await hidratar(refreshData.session);
        } else {
          await hidratar(sess);
        }
      } catch {
        // Timeout/erro em getSession/refresh → estado RECUPERÁVEL (sem redirect).
        if (montado) setStatus(prev => (prev === 'loading' ? 'error' : prev));
      }
    })();

    return () => { montado = false; subscription?.unsubscribe(); };
  }, [tentativa]);

  const retry = () => {
    setStatus('loading');
    setTentativa(t => t + 1);
  };

  const signOut = async () => {
    try {
      await comTimeout(supabase.auth.signOut(), 5000);
    } catch {
      /* se signOut travar/falhar, seguimos para o estado deslogado mesmo assim */
    }
    try { localStorage.removeItem('user'); } catch { /* ignore */ }
    setSession(null);
    setProfile(null);
    setStatus('unauthenticated');
  };

  const value: AuthContextValue = {
    status,
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    retry,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
