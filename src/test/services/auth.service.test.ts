import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  signInWithPassword,
  signOut,
  resetPasswordForEmail,
} from '@/services/auth.service';

function mockAuthMethod(method: keyof typeof supabase.auth, result: any) {
  vi.mocked(supabase.auth[method] as any).mockResolvedValue(result);
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('auth.service', () => {
  describe('signInWithPassword', () => {
    it('retorna success=true quando credenciais corretas', async () => {
      mockAuthMethod('signInWithPassword', { data: { user: {} }, error: null });

      const result = await signInWithPassword('joao@itec.com', 'senha123');

      expect(result).toEqual({ success: true, error: null });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'joao@itec.com',
        password: 'senha123',
      });
    });

    it('traduz "Invalid login credentials" para PT-BR', async () => {
      mockAuthMethod('signInWithPassword', {
        data: {}, error: { message: 'Invalid login credentials' },
      });

      const result = await signInWithPassword('joao@itec.com', 'errada');

      expect(result.success).toBe(false);
      expect(result.error).toBe('E-mail ou senha incorretos.');
    });

    it('traduz "Email not confirmed" para PT-BR', async () => {
      mockAuthMethod('signInWithPassword', {
        data: {}, error: { message: 'Email not confirmed' },
      });

      const result = await signInWithPassword('joao@itec.com', 'senha123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Confirme seu e-mail antes de entrar.');
    });

    it('retorna a mensagem original para erros desconhecidos', async () => {
      // traduzirErro devolve a mensagem sem alteração quando não está no mapa
      mockAuthMethod('signInWithPassword', {
        data: {}, error: { message: 'some unknown supabase error' },
      });

      const result = await signInWithPassword('joao@itec.com', 'senha123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('some unknown supabase error');
    });
  });

  describe('signOut', () => {
    it('chama supabase.auth.signOut', async () => {
      mockAuthMethod('signOut', { error: null });

      await signOut();

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('limpa localStorage após signOut', async () => {
      mockAuthMethod('signOut', { error: null });
      localStorage.setItem('user', JSON.stringify({ id: '123', role: 'aluno' }));

      await signOut();

      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('resetPasswordForEmail', () => {
    it('retorna success=true quando e-mail existe', async () => {
      mockAuthMethod('resetPasswordForEmail', { data: {}, error: null });

      const result = await resetPasswordForEmail('joao@itec.com');

      expect(result).toEqual({ success: true, error: null });
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'joao@itec.com',
        expect.objectContaining({ redirectTo: expect.stringContaining('/resetar-senha') })
      );
    });
  });
});
