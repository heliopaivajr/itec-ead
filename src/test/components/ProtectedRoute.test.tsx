import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthProvider';
import type { AuthStatus } from '@/contexts/AuthProvider';

// Contrato ATUAL (refactor e9b5946/b6fc4e6, jun/2026): ProtectedRoute é
// consumidor PURO de useAuth() — não faz getSession/onAuthStateChange/getRole
// próprios. O teste antigo mockava esse fluxo interno (que não existe mais) e
// renderizava sem provider → 8 falhas baseline. Aqui mockamos o módulo
// @/contexts/AuthProvider e testamos os 5 status do contrato.
vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

const retryMock   = vi.fn();
const signOutMock = vi.fn().mockResolvedValue(undefined);

function mockStatus(status: AuthStatus) {
  vi.mocked(useAuth).mockReturnValue({
    status,
    session: null,
    user: null,
    profile: null,
    role: null,
    retry: retryMock,
    signOut: signOutMock,
  });
}

// Router com rotas de destino reais para os <Navigate> resolverem sem crash.
function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={<ProtectedRoute><div>conteudo protegido</div></ProtectedRoute>}
        />
        <Route path="/login"      element={<div>pagina login</div>} />
        <Route path="/aguardando" element={<div>pagina aguardando</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProtectedRoute (consumidor de useAuth — 5 status)', () => {
  it('loading → mostra o spinner "Validando acesso" e NÃO renderiza o conteúdo', () => {
    mockStatus('loading');
    renderProtectedRoute();

    expect(screen.getByText(/validando acesso/i)).toBeInTheDocument();
    expect(screen.queryByText('conteudo protegido')).not.toBeInTheDocument();
  });

  it('error → tela recuperável (sem redirect) com as duas saídas', () => {
    mockStatus('error');
    renderProtectedRoute();

    expect(screen.getByText(/não conseguimos validar seu acesso/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ir para login/i })).toBeInTheDocument();
    // SEM redirect automático — não navegou para /login nem /aguardando
    expect(screen.queryByText('pagina login')).not.toBeInTheDocument();
    expect(screen.queryByText('pagina aguardando')).not.toBeInTheDocument();
  });

  it('error → "Tentar novamente" chama retry()', async () => {
    mockStatus('error');
    const user = userEvent.setup();
    renderProtectedRoute();

    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(retryMock).toHaveBeenCalledTimes(1);
  });

  it('error → "Ir para login" chama signOut()', async () => {
    mockStatus('error');
    const user = userEvent.setup();
    renderProtectedRoute();

    await user.click(screen.getByRole('button', { name: /ir para login/i }));
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it('unauthenticated → redireciona para /login', () => {
    mockStatus('unauthenticated');
    renderProtectedRoute();

    expect(screen.getByText('pagina login')).toBeInTheDocument();
    expect(screen.queryByText('conteudo protegido')).not.toBeInTheDocument();
  });

  it('pending → redireciona para /aguardando', () => {
    mockStatus('pending');
    renderProtectedRoute();

    expect(screen.getByText('pagina aguardando')).toBeInTheDocument();
    expect(screen.queryByText('conteudo protegido')).not.toBeInTheDocument();
  });

  it('authenticated → renderiza o conteúdo protegido', () => {
    mockStatus('authenticated');
    renderProtectedRoute();

    expect(screen.getByText('conteudo protegido')).toBeInTheDocument();
  });
});
