import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Lock, User, GraduationCap, BookOpen, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

type RoleTab = 'aluno' | 'professor' | 'admin';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<RoleTab>('aluno');
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
      // 1. Tenta fazer o login com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw new Error(authError.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos.' 
          : 'Falha na autenticação.');
      }

      if (authData.user) {
        // 2. Busca o perfil do usuário para confirmar a 'role'
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', authData.user.id)
          .single();

        const userRole = profile?.role || 'aluno'; // fallback

        // Aqui salvamos o cache da session da nossa aplicação legada (opcional, mas bom pra manter compatibilidade)
        localStorage.setItem('user', JSON.stringify({ 
          id: authData.user.id,
          email: authData.user.email, 
          role: userRole,
          name: profile?.full_name 
        }));
        
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo ao Sistema, ${profile?.full_name || 'Usuário'}.`,
          duration: 3000,
        });

        // Opcional: Se a pessoa acessou a aba errada, você pode avisar.
        if (userRole !== activeTab) {
          toast({
            title: "Redirecionamento automático",
            description: `Sua conta é de ${userRole}, ajustando seu painel...`,
            duration: 4000,
          });
        }
        
        // Redireciona para o dashboard correto com base na role
        navigate('/dashboard');
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message || "Ocorreu um erro inesperado.",
        duration: 3000,
      });
      // Logout in case of hanging session state
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-primary">ITEC Plataforma</h2>
            <p className="mt-2 text-sm text-muted-foreground">Escolha o painel e entre com suas credenciais</p>
          </div>

          <div className="mt-8 bg-card p-6 rounded-xl border border-border shadow-lg relative futuristic-card">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 rounded-xl pointer-events-none" />

            <div className="relative z-10 mb-6">
              <Tabs defaultValue="aluno" onValueChange={(v) => setActiveTab(v as RoleTab)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted">
                  <TabsTrigger value="aluno" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <GraduationCap className="w-4 h-4 mr-2" /> Aluno
                  </TabsTrigger>
                  <TabsTrigger value="professor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <BookOpen className="w-4 h-4 mr-2" /> Prof
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <ShieldAlert className="w-4 h-4 mr-2" /> Admin
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-foreground">
                      <User className="mr-2 h-4 w-4 text-primary" /> E-mail
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="seu.email@exemplo.com" autoComplete="off" {...field}
                        className="bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-foreground">
                      <Lock className="mr-2 h-4 w-4 text-primary" /> Senha
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="******" type="password" {...field}
                        className="bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" disabled={loading}
                  className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-medium">
                  {loading ? "Autenticando..." : `Entrar como ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm relative z-10">
              <Link to="/esqueci-senha" className="text-muted-foreground hover:text-primary transition-colors">
                Esqueceu sua senha?
              </Link>
            </div>
          </div>

          <div className="text-center text-sm mt-6">
            <p className="text-muted-foreground mb-2">
              Ainda não tem conta?{" "}
              <Link to="/cadastro" className="font-medium text-primary hover:text-primary/80">
                Cadastre-se como aluno
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
