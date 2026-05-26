import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, User, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { signInWithGoogle, signUpWithEmail } from '@/services/auth.service';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Cadastro = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) throw new Error(result.error);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao entrar com Google.');
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      const result = await signUpWithEmail(formData.email, formData.password, formData.name);
      if (result.error) throw new Error(result.error);
      toast.success("Cadastro realizado com sucesso! Você já pode navegar.");
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || "Erro ao tentar cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-primary">Criar Conta</h2>
            <p className="mt-2 text-sm text-muted-foreground">Cadastre-se como novo aluno na plataforma</p>
          </div>

          <div className="mt-8 bg-card p-6 rounded-xl border border-border shadow-lg relative futuristic-card">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 rounded-xl pointer-events-none" />

            <form onSubmit={handleRegister} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <Label className="flex items-center text-foreground text-sm font-medium">
                  <User className="mr-2 h-4 w-4 text-primary" /> Nome Completo
                </Label>
                <Input type="text" placeholder="Seu nome completo" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center text-foreground text-sm font-medium">
                  <Mail className="mr-2 h-4 w-4 text-primary" /> E-mail
                </Label>
                <Input type="email" placeholder="seu.email@exemplo.com" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center text-foreground text-sm font-medium">
                  <Lock className="mr-2 h-4 w-4 text-primary" /> Senha
                </Label>
                <Input type="password" placeholder="Mínimo 6 caracteres" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputClass} />
              </div>

              <Button type="submit" disabled={loading || googleLoading}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-medium mt-6">
                {loading ? "Processando..." : "Finalizar Cadastro"}
              </Button>
            </form>

            <div className="space-y-3 mt-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">ou cadastre-se com</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3"
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                {googleLoading ? 'Redirecionando...' : 'Cadastrar com Google'}
              </Button>
            </div>

            <div className="text-center mt-4 relative z-10">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Já tem uma conta? Faça login
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cadastro;
