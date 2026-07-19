import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { supabase } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/contexts/AuthProvider';
import { getProfile } from '@/services/profile.service';

// Testes do PROVIDER em si (a peça mais crítica do app) — hidratação, estados
// derivados do role, timeout→error recuperável e SIGNED_OUT.
// getProfile é mockado (módulo); supabase.auth vem do mock global do setup.
vi.mock('@/services/profile.service', () => ({
  getProfile: vi.fn(),
}));

// Sonda: expõe o status atual do contexto na tela.
function Probe() {
  const { status } = useAuth();
  return <div data-testid="status">{status}</div>;
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
}

// Sessão válida (expires_at no futuro → não dispara refreshSession)
function makeSession(userId = 'user-123') {
  return {
    user: { id: userId, email: 'test@example.com', user_metadata: {} },
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
}

function mockProfileRole(role: string) {
  vi.mocked(getProfile).mockResolvedValue({
    id: 'user-123', full_name: 'Teste', role,
  } as never);
}

// Handler capturado do onAuthStateChange (para simular eventos do Supabase)
let authHandler: ((event: string, session: unknown) => void) | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  authHandler = null;
  vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(((handler: (e: string, s: unknown) => void) => {
    authHandler = handler;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  }) as never);
});

describe('AuthProvider (fonte única de auth)', () => {
  it('sem sessão → unauthenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null }, error: null,
    } as never);

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
  });

  it('sessão + role com acesso (aluno) → authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: makeSession() }, error: null,
    } as never);
    mockProfileRole('aluno');

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(getProfile).toHaveBeenCalledWith('user-123', 'test@example.com', {});
  });

  it('sessão + role pendente → pending', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: makeSession() }, error: null,
    } as never);
    mockProfileRole('pendente');

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('pending'));
  });

  it('sessão + role DESCONHECIDO → unauthenticated (falha segura)', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: makeSession() }, error: null,
    } as never);
    mockProfileRole('hacker-role');

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
  });

  it('getSession falha (backend travado) → error RECUPERÁVEL, sem redirect', async () => {
    vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('cold start'));

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
  });

  it('evento SIGNED_OUT → unauthenticated (mesmo estando autenticado)', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: makeSession() }, error: null,
    } as never);
    mockProfileRole('aluno');

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    act(() => { authHandler?.('SIGNED_OUT', null); });
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
  });
});
