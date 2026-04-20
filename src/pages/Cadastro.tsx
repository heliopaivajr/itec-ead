import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, User, Mail, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const Cadastro = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.name, role: 'aluno' } }
      });
      if (error) throw error;
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

              <Button type="submit" disabled={loading}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-medium mt-6">
                {loading ? "Processando..." : "Finalizar Cadastro"}
              </Button>

              <div className="text-center mt-4">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Já tem uma conta? Faça login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cadastro;
