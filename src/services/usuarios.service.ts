import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/services/profile.service';
import { sanitizeDate } from '@/utils/sanitize';

export interface UserRow {
  id: string;
  full_name: string;
  email?: string;
  role: UserRole;
  telefone?: string;
  bio?: string;
  foto_url?: string;
  updated_at?: string;
  created_at: string;
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
  // matrícula mais recente (opcional — preenchido por getUsuarios)
  matricula_id?: string | null;
  matricula_status?: string | null;
}

export interface ServiceResult {
  error: string | null;
}

export interface UsuariosPage {
  data: UserRow[];
  total: number;
}

export interface UsuariosStats {
  total: number;
  alunos: number;
  professores: number;
  equipe: number;
}

// Listagem paginada com busca opcional por nome/email
// Inclui matrícula mais recente (id + status) via join
export async function getUsuarios(
  page = 1,
  limit = 20,
  search = ''
): Promise<UsuariosPage> {
  let query = supabase
    .from('profiles')
    .select('*, matriculas(id, status, created_at)', { count: 'exact' })
    .order('full_name', { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (search.trim()) {
    query = query.or(
      `full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`
    );
  }

  const { data, count, error } = await query;
  if (error) return { data: [], total: 0 };

  const rows: UserRow[] = (data ?? []).map((perfil: Record<string, unknown>) => {
    const matriculas = perfil.matriculas as { id: string; status: string; created_at: string }[] | null;
    const matriculaAtiva = matriculas
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      ?? null;
    return {
      ...(perfil as UserRow),
      matriculas: undefined,
      matricula_id: matriculaAtiva?.id ?? null,
      matricula_status: matriculaAtiva?.status ?? null,
    };
  });

  return { data: rows, total: count ?? 0 };
}

// Contagens para os cards KPI — busca apenas a coluna role (leve)
export async function getUsuariosStats(): Promise<UsuariosStats> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role');

  if (error || !data) return { total: 0, alunos: 0, professores: 0, equipe: 0 };

  return {
    total: data.length,
    alunos: data.filter(u => u.role === 'aluno').length,
    professores: data.filter(u => u.role === 'professor').length,
    equipe: data.filter(u => ['administracao', 'admin'].includes(u.role)).length,
  };
}

// Atualização de role — usado pelo admin em Usuarios.tsx
export async function updateRole(userId: string, role: UserRole): Promise<ServiceResult> {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

// Atualização completa de usuário — usado no modal de edição em Usuarios.tsx
export async function updateUsuario(
  userId: string,
  dados: UpdatePerfilPayload & { role?: string }
): Promise<ServiceResult> {
  const payload = {
    ...dados,
    data_nascimento: sanitizeDate(dados.data_nascimento),
  };
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

export interface UpdatePerfilPayload {
  full_name?: string;
  telefone?: string;
  bio?: string;
  avatar_url?: string;
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

// Atualização do próprio perfil — usado em Perfil.tsx
export async function updatePerfil(
  userId: string,
  dados: UpdatePerfilPayload
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('profiles')
    .update(dados)
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}
