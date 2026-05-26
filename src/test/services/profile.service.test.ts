import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getRole, getProfile } from '@/services/profile.service';

// Monta o mock encadeado: supabase.from().select().eq().single()
function mockProfileQuery(result: { data: any; error: any }) {
  const mockSingle = vi.fn().mockResolvedValue(result);
  const mockEq     = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
  return mockSingle;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('profile.service', () => {
  describe('getRole', () => {
    it('retorna role correto quando perfil existe', async () => {
      mockProfileQuery({ data: { role: 'aluno' }, error: null });

      const role = await getRole('user-123');

      expect(role).toBe('aluno');
    });

    // CRÍTICO: qualquer regressão aqui abre acesso indevido ao dashboard
    it('retorna pendente quando Supabase retorna erro', async () => {
      mockProfileQuery({ data: null, error: { message: 'relation not found' } });

      const role = await getRole('user-123');

      expect(role).toBe('pendente');
      expect(role).not.toBeNull();
      expect(role).not.toBeUndefined();
    });

    it('retorna pendente quando data é null sem erro (perfil ainda não criado)', async () => {
      mockProfileQuery({ data: null, error: null });

      const role = await getRole('user-123');

      expect(role).toBe('pendente');
      expect(role).not.toBeNull();
      expect(role).not.toBeUndefined();
    });
  });

  describe('getProfile', () => {
    it('retorna perfil completo quando usuário existe no banco', async () => {
      mockProfileQuery({
        data: { id: 'user-123', full_name: 'João Silva', role: 'admin' },
        error: null,
      });

      const profile = await getProfile('user-123', 'joao@itec.com');

      expect(profile.id).toBe('user-123');
      expect(profile.email).toBe('joao@itec.com');
      expect(profile.role).toBe('admin');
      expect(profile.full_name).toBe('João Silva');
    });

    it('retorna perfil fallback com role=pendente quando perfil não existe', async () => {
      // getProfile nunca retorna null — retorna objeto seguro com role='pendente'
      mockProfileQuery({ data: null, error: { message: 'not found' } });

      const profile = await getProfile('user-456', 'novo@itec.com', { full_name: 'Maria' });

      expect(profile).not.toBeNull();
      expect(profile.role).toBe('pendente');
      expect(profile.id).toBe('user-456');
      expect(profile.email).toBe('novo@itec.com');
      expect(profile.full_name).toBe('Maria');
    });
  });
});
