import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';

// Helper: monta o ProtectedRoute num router com rotas de destino reais
// para que os <Navigate> possam resolver sem crash.
function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={<ProtectedRoute><div>conteudo protegido</div></ProtectedRoute>}
        />
        <Route path="/login"     element={<div>pagina login</div>} />
        <Route path="/aguardando" element={<div>pagina aguardando</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// Mocka sessão + role para cada teste
function mockAuth(session: any, role: string | null) {
  const mockSingle = vi.fn().mockResolvedValue({ data: role ? { role } : null, error: null });
  const mockEq     = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session },
    error: null,
  } as any);

  vi.mocked(supabase.from).mockReturnValue({
    select: mockSelect,
  } as any);
}

function makeSession(userId = 'user-123') {
  return { user: { id: userId, email: 'test@example.com' } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProtectedRoute', () => {
  it('redireciona para /login quando não há sessão', async () => {
    mockAuth(null, null);
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.getByText('pagina login')).toBeInTheDocument();
    });
  });

  it('redireciona para /aguardando quando role é pendente', async () => {
    mockAuth(makeSession(), 'pendente');
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.getByText('pagina aguardando')).toBeInTheDocument();
    });
  });

  it('renderiza o conteúdo quando role é aluno', async () => {
    mockAuth(makeSession(), 'aluno');
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.getByText('conteudo protegido')).toBeInTheDocument();
    });
  });

  it('renderiza o conteúdo quando role é professor', async () => {
    mockAuth(makeSession(), 'professor');
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.getByText('conteudo protegido')).toBeInTheDocument();
    });
  });

  it('renderiza o conteúdo quando role é administracao', async () => {
    mockAuth(makeSession(), 'administracao');
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.getByText('conteudo protegido')).toBeInTheDocument();
    });
  });

  it('renderiza o conteúdo quando role é admin', async () => {
    mockAuth(makeSession(), 'admin');
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.getByText('conteudo protegido')).toBeInTheDocument();
    });
  });

  it('renderiza o conteúdo quando role é superadmin', async () => {
    mockAuth(makeSession(), 'superadmin');
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.getByText('conteudo protegido')).toBeInTheDocument();
    });
  });

  it('redireciona para /login quando role é desconhecido', async () => {
    mockAuth(makeSession(), 'desconhecido');
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.getByText('pagina login')).toBeInTheDocument();
    });
  });
});
