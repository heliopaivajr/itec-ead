import { useAuth } from '@/contexts/AuthProvider';

export type UserRole = 'pendente' | 'aluno' | 'professor' | 'administracao' | 'financeiro' | 'admin' | 'superadmin';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  telefone?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  // dados pessoais (migration 021)
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  sexo?: 'masculino' | 'feminino' | 'outro';
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  igreja_local?: string;
  observacoes_internas?: string;
}

// Wrapper de compatibilidade sobre o AuthProvider (fonte ÚNICA da verdade).
// Mantém a API antiga { profile, setProfile, loading, logout } para não quebrar
// imports existentes. NÃO faz getSession/onAuthStateChange/getProfile próprios.
export function useProfile() {
  const { profile, status, signOut } = useAuth();
  return {
    profile,
    loading: status === 'loading',
    // setProfile vira no-op: o profile é gerido pelo AuthProvider.
    // (API morta hoje — mantida apenas por compatibilidade de assinatura.)
    setProfile: (_p: Profile | null) => { /* no-op */ },
    // logout delega para a fonte única.
    logout: signOut,
  };
}
