import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, Mail } from 'lucide-react';

const AguardandoAprovacao = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login', { replace: true });
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-merriweather font-bold text-2xl text-foreground">
            Cadastro em análise
          </h1>
          <p className="text-muted-foreground">
            Seu cadastro foi recebido e está sendo analisado pela equipe do ITEC.
            Você receberá um e-mail quando seu acesso for liberado.
          </p>
        </div>

        <div className="bg-muted/40 rounded-lg p-4 flex items-start gap-3 text-left">
          <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Dúvidas? Entre em contato com a secretaria:{' '}
            <a href="mailto:secretaria@itecedu.com" className="text-primary hover:underline">
              secretaria@itecedu.com
            </a>{' '}
            ou WhatsApp{' '}
            <a href="https://wa.me/5581991161448" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              (81) 99116-1448
            </a>
          </p>
        </div>

        <Button onClick={handleLogout} variant="outline" className="w-full">
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </div>
  );
};

export default AguardandoAprovacao;
