import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ShieldCheck, Building2, BookOpen, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Test credentials — visible only in dev; remove before production
const DEMO_USERS = [
  { role: 'superadmin', label: 'Hélio (Admin)', email: 'heliopaiva@gmail.com', password: '', color: 'bg-[#ea384c] hover:bg-[#ea384c]/90 text-white', icon: ShieldCheck },
  { role: 'admin', label: 'Diretoria', email: 'diretoria@itec.edu.br', password: '', color: 'bg-red-800 hover:bg-red-900 text-white', icon: ShieldCheck },
  { role: 'administracao', label: 'Secretaria', email: 'secretaria@itec.edu.br', password: '', color: 'bg-teal-600 hover:bg-teal-700 text-white', icon: Building2 },
  { role: 'professor', label: 'Professor', email: 'professor@itec.edu.br', password: '', color: 'bg-purple-600 hover:bg-purple-700 text-white', icon: BookOpen },
  { role: 'aluno', label: 'Aluno', email: 'aluno@itec.edu.br', password: 'itec2025aluno', color: 'bg-orange-500 hover:bg-orange-600 text-white', icon: GraduationCap },
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
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);

      if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', authData.user.id)
          .single();

        if (remember) {
          localStorage.setItem('user', JSON.stringify({ id: authData.user.id, email: authData.user.email, role: profile?.role, name: profile?.full_name }));
        }

        toast({ title: `Bem-vindo, ${profile?.full_name || 'Usuário'}!`, description: 'Login realizado com sucesso.' });
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast({ title: 'Erro no login', description: err.message, variant: 'destructive' });
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel — brand ────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col items-center justify-center relative overflow-hidden bg-[#0d0d0d]">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Red glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#ea384c]/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center px-12 space-y-6">
          {/* Logo */}
          <div className="h-28 w-28 rounded-full border-2 border-[#ea384c]/40 bg-white/5 flex items-center justify-center shadow-2xl shadow-[#ea384c]/20">
            <img src="/logo_itec.png" alt="ITEC" className="h-20 w-20 object-contain" />
          </div>

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
        <div className="absolute bottom-6 text-white/20 text-xs">
          Unidade Janga · Paulista-PE
        </div>
      </div>

      {/* ── Right Panel — form ────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-12">
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
