import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Copy, ExternalLink } from 'lucide-react';

// ⚠️  PÁGINA APENAS PARA DESENVOLVIMENTO
// Acesse: http://localhost:8081/dev-setup

const TEST_USERS = [
  { email: 'aluno@itec.edu.br',     password: 'itec2025aluno', full_name: 'João Silva (Aluno)',     role: 'aluno'     },
  { email: 'professor@itec.edu.br', password: 'itec2025prof',  full_name: 'Prof. Maria Santos',     role: 'professor' },
  { email: 'admin@itec.edu.br',     password: 'itec2025admin', full_name: 'Admin ITEC',             role: 'admin'     },
];

type Status = 'idle' | 'loading' | 'ok' | 'exists' | 'error';

interface UserResult { email: string; role: string; status: Status; message?: string; }

const roleColor: Record<string, string> = {
  aluno: 'text-blue-400', professor: 'text-green-400', admin: 'text-red-400',
};

const MANUAL_SQL = `-- Cole no Supabase SQL Editor após criar os usuários manualmente:
-- Substitua os UUIDs pelos IDs reais dos usuários criados

-- Para ver os IDs: SELECT id, email FROM auth.users;

-- Exemplo (ajuste os UUIDs):
-- UPDATE public.profiles SET role = 'professor' WHERE id = 'UUID-DO-PROFESSOR';
-- UPDATE public.profiles SET role = 'admin'     WHERE id = 'UUID-DO-ADMIN';`;

const DevSetup = () => {
  const [results, setResults] = useState<UserResult[]>([]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateResult = (email: string, update: Partial<UserResult>) =>
    setResults(prev => prev.map(r => r.email === email ? { ...r, ...update } : r));

  const runSetup = async () => {
    setRunning(true);
    setResults(TEST_USERS.map(u => ({ email: u.email, role: u.role, status: 'loading' })));

    for (const user of TEST_USERS) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: { data: { full_name: user.full_name, role: user.role } },
        });

        if (error?.message?.includes('already registered') || error?.message?.includes('User already registered')) {
          updateResult(user.email, { status: 'exists', message: 'Já existia — OK' });
          continue;
        }
        if (error) throw error;

        // Aguarda trigger e faz upsert do perfil manualmente como fallback
        if (data.user) {
          await new Promise(r => setTimeout(r, 1000));
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: user.full_name,
            role: user.role,
          });
          if (profileError) {
            updateResult(user.email, { status: 'ok', message: `Criado (perfil: ${profileError.message})` });
          } else {
            updateResult(user.email, { status: 'ok', message: 'Criado com sucesso ✓' });
          }
        }
      } catch (err: any) {
        updateResult(user.email, { status: 'error', message: err.message });
      }
    }
    setRunning(false);
  };

  const allDone = results.length > 0 && results.every(r => r.status === 'ok' || r.status === 'exists');
  const hasError = results.some(r => r.status === 'error');

  const copySQL = () => {
    navigator.clipboard.writeText(MANUAL_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-5">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-4 py-2 rounded-full">
            <AlertTriangle className="h-3.5 w-3.5" /> Apenas para Desenvolvimento
          </div>
          <h1 className="text-2xl font-merriweather font-bold text-foreground">Setup de Usuários de Teste</h1>
          <p className="text-sm text-muted-foreground">Cria 3 perfis de teste para validar as roles do dashboard.</p>
        </div>

        {/* Pré-requisito */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Pré-requisito obrigatório
          </p>
          <p className="text-xs text-foreground/80">
            Execute primeiro o arquivo <code className="bg-muted px-1 rounded">migration_002_fix_trigger.sql</code> no Supabase SQL Editor para corrigir o trigger de criação de usuários.
          </p>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-yellow-400 hover:underline"
          >
            Abrir Supabase Dashboard <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Lista de usuários */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Usuários de teste</h2>
          {TEST_USERS.map(u => {
            const result = results.find(r => r.email === u.email);
            return (
              <div key={u.email} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="space-y-0.5">
                  <p className={`text-xs font-bold ${roleColor[u.role]}`}>{u.role.toUpperCase()}</p>
                  <p className="text-sm text-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground">Senha: <code className="bg-muted px-1 rounded text-xs">{u.password}</code></p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  {result?.status === 'loading' && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                  {(result?.status === 'ok' || result?.status === 'exists') && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {result?.status === 'error'  && <XCircle className="h-5 w-5 text-destructive" />}
                  {result?.message && <span className="text-xs text-muted-foreground max-w-[120px] text-right">{result.message}</span>}
                </div>
              </div>
            );
          })}
        </div>

        <Button onClick={runSetup} disabled={running}
          className="w-full bg-primary hover:bg-primary/80 text-primary-foreground">
          {running
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando usuários...</>
            : 'Criar Usuários de Teste'}
        </Button>

        {/* Sucesso */}
        {allDone && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center space-y-3">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
            <p className="text-sm font-semibold text-foreground">Usuários prontos!</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {TEST_USERS.map(u => (
                <div key={u.email} className="bg-card border border-border rounded-lg p-2 space-y-1">
                  <p className={`font-bold ${roleColor[u.role]}`}>{u.role}</p>
                  <p className="text-muted-foreground break-all">{u.email}</p>
                  <p className="text-muted-foreground font-mono">{u.password}</p>
                </div>
              ))}
            </div>
            <a href="/login"
              className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium">
              Ir para o Login →
            </a>
          </div>
        )}

        {/* Erro com alternativa manual */}
        {hasError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-destructive">Erro na criação automática</p>
            <p className="text-xs text-foreground/80">
              Execute o <code>migration_002_fix_trigger.sql</code> no Supabase e tente novamente.
              Ou crie os usuários manualmente em{' '}
              <strong>Supabase → Authentication → Users → Add User</strong> e depois use o SQL abaixo para ajustar as roles.
            </p>
            <div className="bg-muted rounded-lg p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-auto max-h-40">
              {MANUAL_SQL}
            </div>
            <Button variant="outline" size="sm" onClick={copySQL}
              className="border-border text-foreground gap-2">
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copiado!' : 'Copiar SQL'}
            </Button>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          ⚠️ Remova a rota <code>/dev-setup</code> antes de ir para produção.
        </p>
      </div>
    </div>
  );
};

export default DevSetup;
