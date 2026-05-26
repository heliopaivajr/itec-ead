import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ShieldCheck, Building2, BookOpen, GraduationCap, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithGoogle, signInWithPassword, signOut, getSession } from '@/services/auth.service';
import { getProfile } from '@/services/profile.service';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Test credentials — visible only in dev; remove before production
const DEMO_USERS = [
  { role: 'admin',         label: 'Diretoria',  email: 'diretoria@itec.edu.br',  password: '', color: 'bg-red-800 hover:bg-red-900 text-white',          icon: ShieldCheck   },
  { role: 'administracao', label: 'Secretaria', email: 'secretaria@itec.edu.br', password: '', color: 'bg-teal-600 hover:bg-teal-700 text-white',          icon: Building2     },
  { role: 'professor',     label: 'Professor',  email: 'professor@itec.edu.br',  password: '', color: 'bg-purple-600 hover:bg-purple-700 text-white',       icon: BookOpen      },
  { role: 'aluno',         label: 'Aluno',      email: 'aluno@itec.edu.br',      password: 'itec2025aluno', color: 'bg-orange-500 hover:bg-orange-600 text-white', icon: GraduationCap },
];

const isDev = import.meta.env.DEV;

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      toast({ title: 'Erro ao entrar com Google', description: result.error, variant: 'destructive' });
      setGoogleLoading(false);
    }
  };

  const fillDemo = (user: typeof DEMO_USERS[0]) => {
    if (!user.email) {
      toast({ title: 'Conta não configurada', description: `Crie um usuário "${user.label}" via DevSetup ou pelo Supabase.`, variant: 'destructive' });
      return;
    }
    setEmail(user.email);
    setPassword(user.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const result = await signInWithPassword(email, password);
      if (result.error) throw new Error(result.error);

      const session = await getSession();
      const user = session?.user;
      if (user) {
        const profile = await getProfile(user.id, user.email ?? '', user.user_metadata);

        if (remember) {
          localStorage.setItem('user', JSON.stringify({ id: user.id, email: user.email, role: profile.role, name: profile.full_name }));
        }

        toast({ title: `Bem-vindo, ${profile.full_name || 'Usuário'}!`, description: 'Login realizado com sucesso.' });
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast({ title: 'Erro no login', description: err.message, variant: 'destructive' });
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel — brand ────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col items-center justify-center relative overflow-hidden bg-gray-900">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Red glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#ea384c]/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center px-12 space-y-6">
          {/* Logo — clicável */}
          <Link to="/" className="h-28 w-28 rounded-full border-2 border-[#ea384c]/40 bg-white/5 flex items-center justify-center shadow-2xl shadow-[#ea384c]/20 hover:border-[#ea384c]/80 hover:bg-white/10 transition-all duration-300 cursor-pointer" title="Voltar ao site">
            <img src="/logo_itec.png" alt="ITEC" className="h-20 w-20 object-contain" />
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-merriweather font-bold text-white tracking-tight">ITEC EAD</h1>
            <p className="text-sm text-white/50 uppercase tracking-[0.2em]">Instituto Teológico</p>
          </div>

          <div className="w-12 h-px bg-[#ea384c]/60" />

          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            "A sabedoria é a coisa principal; adquire pois a sabedoria, e com tudo o que adquirires, adquire o entendimento."
          </p>
          <p className="text-[#ea384c]/80 text-xs tracking-wider">Provérbios 4:7</p>
        </div>

        {/* Bottom */}
        <div className="absolute bottom-6 flex flex-col items-center gap-2">
          <Link to="/" className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs transition-colors group">
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
            Voltar ao site
          </Link>
          <span className="text-white/20 text-xs">Unidade Janga · Paulista-PE</span>
        </div>
      </div>

      {/* ── Right Panel — form ────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-12 relative">
        {/* Back to home — top left */}
        <Link
          to="/"
          className="absolute top-5 left-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Página inicial
        </Link>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img src="/logo_itec.png" alt="ITEC" className="h-10 w-10 object-contain" />
          <span className="font-merriweather font-bold text-xl text-foreground">ITEC EAD</span>
        </div>

        <div className="w-full max-w-[420px] space-y-6">
          <div>
            <h2 className="text-2xl font-merriweather font-bold text-foreground">Bem-vindo de volta 👋</h2>
            <p className="text-muted-foreground text-sm mt-1">Faça login na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Endereço de E-mail <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Senha <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  className="rounded border-border" />
                <span className="text-sm text-muted-foreground">Lembre-se de mim</span>
              </label>
              <Link to="/esqueci-senha" className="text-sm text-primary hover:underline font-medium">
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Autenticando...' : 'Fazer login'}
            </button>
          </form>

          {/* Google OAuth */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">ou continue com</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-medium py-2.5 text-sm transition-all disabled:opacity-60"
            >
              {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              {googleLoading ? 'Redirecionando...' : 'Entrar com Google'}
            </button>
          </div>

          {/* Demo quick-login — dev only */}
          {isDev && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">ou acesse como</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_USERS.map(u => {
                  const Icon = u.icon;
                  return (
                    <button key={u.role} type="button" onClick={() => fillDemo(u)}
                      className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${u.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {u.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">Botões de demo — visíveis apenas em desenvolvimento</p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{' '}
            <Link to="/cadastro" className="font-medium text-primary hover:underline">
              Crie uma conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
