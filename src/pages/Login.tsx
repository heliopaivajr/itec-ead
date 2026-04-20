
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Lock, User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const formSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      // For now, we'll use mock credentials for demonstration
      // In a real app, this would be connected to a backend/Supabase
      if (data.email === 'professor@itec.com' || data.email === 'aluno@itec.com') {
        if (data.password === 'password123') {
          // Store login state
          localStorage.setItem('user', JSON.stringify({ email: data.email, role: data.email.includes('professor') ? 'professor' : 'aluno' }));
          
          toast({
            title: "Login bem-sucedido",
            description: "Bem-vindo ao Sistema ITEC EAD.",
            duration: 3000,
          });
          
          navigate('/dashboard');
        } else {
          toast({
            variant: "destructive",
            title: "Falha no login",
            description: "Senha incorreta.",
            duration: 3000,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Falha no login",
          description: "Usuário não encontrado.",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: "Ocorreu um erro durante o login.",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-itec-bloodRed">ITEC EAD</h2>
            <p className="mt-2 text-sm">Entre com suas credenciais para acessar o sistema</p>
          </div>
          
          <div className="mt-8 bg-black p-6 rounded-lg border border-gray-800 shadow-lg relative futuristic-card">
            <div className="absolute inset-0 bg-gradient-to-r from-itec-bloodRed/5 to-transparent opacity-50 rounded-lg"></div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-gray-300">
                        <User className="mr-2 h-4 w-4 text-itec-bloodRed" />
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu.email@exemplo.com"
                          {...field}
                          className="bg-gray-900 border-gray-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-gray-300">
                        <Lock className="mr-2 h-4 w-4 text-itec-bloodRed" />
                        Senha
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="******"
                          type="password"
                          {...field}
                          className="bg-gray-900 border-gray-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-itec-bloodRed hover:bg-itec-bloodRed/80 text-white"
                  >
                    {loading ? "Processando..." : "Entrar"}
                  </Button>
                </div>
              </form>
            </Form>
            
            <div className="mt-6 text-center text-sm relative z-10">
              <Link to="#" className="text-itec-bloodRed hover:text-itec-bloodRed/80">
                Esqueceu sua senha?
              </Link>
            </div>
            
            <div className="mt-4 text-center text-xs text-gray-400 relative z-10">
              <p>Credenciais de teste:</p>
              <p>professor@itec.com / password123</p>
              <p>aluno@itec.com / password123</p>
            </div>
          </div>
          
          <div className="text-center text-sm">
            <p>
              Não tem uma conta?{" "}
              <Link to="#" className="font-medium text-itec-bloodRed hover:text-itec-bloodRed/80">
                Contate a administração
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
