import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const RecuperarSenha = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, digite seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/resetar-senha`, 
      });

      if (error) throw error;
      setSent(true);
      toast.success("Link de recuperação enviado! Verifique seu e-mail.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao tentar enviar o link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-itec-bloodRed">Recuperar Senha</h2>
            <p className="mt-2 text-sm text-gray-400">Digite seu e-mail para receber um link de redefinição</p>
          </div>
          
          <div className="mt-8 bg-black p-6 rounded-lg border border-gray-800 shadow-lg relative futuristic-card">
            <div className="absolute inset-0 bg-gradient-to-r from-itec-bloodRed/5 to-transparent opacity-50 rounded-lg pointer-events-none"></div>
            
            {sent ? (
              <div className="text-center space-y-6 relative z-10">
                <div className="p-4 bg-green-900/30 text-green-400 rounded-md border border-green-800">
                  Um e-mail foi enviado para <b>{email}</b> com as instruções para redefinir sua senha.
                </div>
                <Button variant="outline" className="w-full text-black hover:bg-gray-200" onClick={() => window.location.href = '/login'}>
                  Voltar para o Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="flex items-center text-gray-300 text-sm font-medium">
                    <Mail className="mr-2 h-4 w-4 text-itec-bloodRed" />
                    E-mail
                  </label>
                  <Input
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-900 border-gray-700 focus:border-itec-bloodRed"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-itec-bloodRed hover:bg-itec-bloodRed/80 text-white font-medium my-4"
                >
                  {loading ? "Enviando..." : "Enviar Link de Recuperação"}
                </Button>
                
                <div className="text-center mt-6">
                  <Link to="/login" className="text-sm text-gray-400 hover:text-white flex items-center justify-center mt-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default RecuperarSenha;
