import { supabase } from '@/lib/supabase';

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials':                 'E-mail ou senha incorretos.',
  'Email not confirmed':                       'Confirme seu e-mail antes de entrar.',
  'User already registered':                   'Este e-mail já está cadastrado.',
  'Password should be at least 6 characters':  'A senha deve ter pelo menos 6 caracteres.',
};

function traduzirErro(message: string): string {
  return AUTH_ERRORS[message] ?? message;
}

export interface AuthResult {
  success: boolean;
  error: string | null;
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: traduzirErro(error.message) };
  return { success: true, error: null };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
  if (error) return { success: false, error: traduzirErro(error.message) };
  return { success: true, error: null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: 'aluno' } },
  });
  if (error) return { success: false, error: traduzirErro(error.message) };
  return { success: true, error: null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem('user');
}

export async function resetPasswordForEmail(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/resetar-senha`,
  });
  if (error) return { success: false, error: traduzirErro(error.message) };
  return { success: true, error: null };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}
