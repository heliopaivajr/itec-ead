# Relatório de Auditoria — Fluxo de Autenticação
**Projeto:** ITEC EAD
**Auditor:** Agente 14
**Data:** 2026-05-26
**Escopo:** Apenas fluxo de autenticação

---

## 1. Análise de cada arquivo

### App.tsx
- `AuthRedirect` está **dentro** do `BrowserRouter` ✅ (linha 70)
- `/dashboard` está protegido pelo `ProtectedRoute` ✅
- `/` (LP) é pública ✅
- Rotas estão corretamente organizadas em públicas e protegidas

### ProtectedRoute.tsx
- Fluxo: `getSession()` → `getRole(userId)` do banco → decisão de render
- Usa **ambos**: `getSession()` na montagem + `onAuthStateChange` para re-checar
- `getRole()` busca do banco (`profiles`), nunca do JWT ✅
- **Sem `refreshSession()`** (removido no último fix) ✅
- Problema: `onAuthStateChange(check)` — o handler `check` é chamado em **todo evento de auth**, incluindo `TOKEN_REFRESHED` gerado pelo `AuthRedirect.refreshSession()`

### AuthRedirect.tsx
- Escuta `SIGNED_IN` → `refreshSession()` com timeout 3s → `navigate('/dashboard')` se rota pública
- `refreshSession()` está presente ✅ com timeout ✅
- **Problema crítico identificado:** usa `location.pathname` capturado no momento do registro do `useEffect`, não no momento do evento. Se o pathname mudar entre o registro e o evento (o que acontece no OAuth callback), `isPublicPath` pode avaliar o pathname errado.

### Login.tsx
- `handleGoogleLogin()` chama `signInWithGoogle()` e aguarda o resultado
- Se `result.error` → mostra toast
- **Não há `navigate()` manual após Google OAuth** — depende 100% do `AuthRedirect`
- Login email/senha: chama `navigate('/dashboard')` diretamente ✅

### auth.service.ts — signInWithGoogle()
- `redirectTo: ${window.location.origin}/dashboard` — usa `window.location.origin` ✅
- Sem URL hardcoded ✅

### profile.service.ts — getRole()
- Busca de `profiles` no banco ✅
- Fallback: retorna `'pendente'` se erro ou `data === null` ✅
- **Ponto de atenção:** se a tabela `profiles` ainda não tem o registro do usuário (trigger não rodou a tempo), retorna `'pendente'` — o que levaria para `/aguardando`

---

## 2. Fluxo atual (passo a passo do código)

```
1. Usuário clica "Entrar com Google"
2. signInWithGoogle() chama supabase.auth.signInWithOAuth()
3. Supabase redireciona para Google OAuth
4. Google autentica → Supabase recebe callback
5. Supabase redireciona para: https://itecedu.com/dashboard?code=XXX
6. App React carrega em /dashboard
7. ProtectedRoute monta → check() roda
8. getSession() → retorna null (PKCE ainda trocando o code)
9. setSession(null) → setRole(null)
10. ProtectedRoute renderiza <Navigate to="/login"> ← PRIMEIRO PROBLEMA

--- paralelamente ---

11. Supabase JS troca o ?code por token
12. SIGNED_IN dispara em AMBOS os listeners:
    a. AuthRedirect.onAuthStateChange
    b. ProtectedRoute.onAuthStateChange
13. AuthRedirect: refreshSession() (3s timeout)
14. ProtectedRoute.check(): getSession() + getRole() do banco
    - Se getRole() retorna 'pendente' (trigger lento): <Navigate to="/aguardando">
    - Se getRole() retorna role válido: renderiza dashboard
15. AuthRedirect (após refresh): navigate('/dashboard')
    - Mas location.pathname foi capturado no useEffect inicial
    - Se o pathname era '/dashboard' quando o useEffect registrou,
      isPublicPath('/dashboard') = false → NÃO navega ← SEGUNDO PROBLEMA

--- resultado ---
Possível: usuário fica em /login (passo 10) e nada o redireciona de volta
Possível: usuário chega em /dashboard mas ProtectedRoute vê role='pendente'
          e manda para /aguardando (trigger do banco ainda não rodou)
```

---

## 3. Fluxo esperado

```
1-4. [mesmo acima]
5. Supabase redireciona para https://itecedu.com/dashboard?code=XXX
6. App carrega → ProtectedRoute em loading (session=undefined)
7. Supabase JS troca ?code por token
8. SIGNED_IN dispara
9. AuthRedirect: refreshSession() → garante token fresco
10. AuthRedirect: navigate('/dashboard') → garante que estamos em /dashboard
11. ProtectedRoute.check(): getSession() → sessão válida
12. getRole(userId) → 'superadmin' do banco
13. Dashboard renderizado ✅
```

---

## 4. Causa raiz

**B) Race condition entre AuthRedirect e ProtectedRoute**, com agravante de timing do trigger do banco.

**Causa primária:** O `location.pathname` capturado no `useEffect` do `AuthRedirect` está desatualizado quando o evento `SIGNED_IN` dispara. O `useEffect` captura o pathname no momento da montagem do componente. Se o OAuth landing é `/dashboard?code=XXX`, o pathname é `/dashboard` — e `isPublicPath('/dashboard')` retorna `false` — então o `navigate('/dashboard')` **nunca acontece**.

**Causa secundária:** `ProtectedRoute.onAuthStateChange(check)` chama `check()` para **todo** evento de auth. O `TOKEN_REFRESHED` gerado pelo `refreshSession()` do `AuthRedirect` aciona outro `check()`, que pode ler o role antes do banco ter processado o trigger.

---

## 5. Correção cirúrgica

**Uma mudança só:** no `AuthRedirect`, substituir a verificação de `location.pathname` pelo `window.location.pathname` no momento do evento (não capturado no closure do useEffect).

```typescript
// AuthRedirect.tsx — CORREÇÃO
export function AuthRedirect() {
  const navigate = useNavigate();
  // REMOVE: const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await Promise.race([
            supabase.auth.refreshSession(),
            new Promise(resolve => setTimeout(resolve, 3000)),
          ]);

          // USA window.location.pathname ao invés de location.pathname
          // para garantir o pathname ATUAL no momento do evento,
          // não o pathname capturado quando o useEffect registrou o listener.
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
  }, [navigate]); // navigate é estável — sem location nas deps
  
  return null;
}
```

**Por que funciona:**
- Quando o OAuth landing é `/dashboard?code=XXX`, o Supabase processa o code e emite `SIGNED_IN`
- Nesse momento `window.location.pathname` é `/dashboard`
- `isPublicPath('/dashboard')` retorna `false` — correto, já estamos onde queremos
- O `ProtectedRoute` vai checar a sessão (já válida) e o role do banco
- Se o banco retornar `'pendente'` (trigger lento), **ainda há problema** — mas esse é um problema separado de timing do trigger, não do redirect

**O que NÃO muda:** a remoção de `location` das deps e o resto da lógica.

---

## 6. Problema adicional identificado (timing do trigger)

Se o trigger `handle_new_user()` no Supabase demorar a criar o perfil, `getRole()` retorna `'pendente'` e o usuário vai para `/aguardando`.

**Solução complementar (não implementar agora):** adicionar retry com delay em `getRole()` para usuários recém-criados. Mas isso é Sprint F — o problema principal é o pathname.

---

*Relatório gerado pelo Agente 14 — auditoria do fluxo de autenticação*
*Nenhum arquivo de código foi modificado nesta auditoria*
