import { Navigate, useOutletContext } from 'react-router-dom';
import type { UserRole } from '@/hooks/use-profile';
import type { DashboardContext } from '@/pages/Dashboard';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

// Protege rotas por role — redireciona para /dashboard se não autorizado.
// Deve ser usado dentro do contexto do Dashboard (após ProtectedRoute).
export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { profile } = useOutletContext<DashboardContext>();

  if (!allowedRoles.includes(profile.role as UserRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
