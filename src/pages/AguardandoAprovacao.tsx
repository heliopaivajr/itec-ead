import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, signOut } from '@/services/auth.service';
import { getMinhasMatriculas } from '@/services/matriculas.service';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, Mail, Lock } from 'lucide-react';

// E5: esta tela é reaproveitada como bloqueio de inadimplência. Um aluno suspenso
// vira role 'pendente' (078 → ProtectedRoute o manda pra cá — INALTERADO). Aqui só
// diferenciamos a MENSAGEM lendo matriculas.status/motivo_suspensao (conteúdo
// condicional; nenhuma mudança no gate de sessão — cicatriz 2d79368).

const AguardandoAprovacao = () => {
  const navigate = useNavigate();
  const [suspensa, setSuspensa] = useState(false);
  const [motivo, setMotivo]     = useState<string | null>(null);

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { navigate('/login', { replace: true }); return; }
      const uid = session.user?.id;
      if (!uid) return;
      // RLS matriculas_select_own permite o próprio aluno ler a própria matrícula.
      const mats = await getMinhasMatriculas(uid);
      const susp = mats.find(m => m.status === 'suspensa');
      if (susp) { setSuspensa(true); setMotivo(susp.motivo_suspensao ?? null); }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center ${suspensa ? 'bg-red-500/10' : 'bg-primary/10'}`}>
            {suspensa ? <Lock className="h-10 w-10 text-red-600" /> : <Clock className="h-10 w-10 text-primary" />}
          </div>
        </div>

        <div className="space-y-2">
          {suspensa ? (
            <>
              <h1 className="font-merriweather font-bold text-2xl text-foreground">
                Matrícula suspensa
              </h1>
              <p className="text-muted-foreground">
                Sua matrícula está suspensa por <strong>pendência financeira</strong>
                {motivo && motivo.toLowerCase() !== 'inadimplência' ? ` (${motivo})` : ''}.
                Regularize na secretaria para reativar o seu acesso.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-merriweather font-bold text-2xl text-foreground">
                Cadastro em análise
              </h1>
              <p className="text-muted-foreground">
                Seu cadastro foi recebido e está sendo analisado pela equipe do ITEC.
                Você receberá um e-mail quando seu acesso for liberado.
              </p>
            </>
          )}
        </div>

        <div className="bg-muted/40 rounded-lg p-4 flex items-start gap-3 text-left">
          <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            {suspensa ? 'Para regularizar, fale com a secretaria: ' : 'Dúvidas? Entre em contato com a secretaria: '}
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
