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

// Lista paginada de alunos e pendentes — filtro de role feito no banco (não em memória)
// Usar em Alunos.tsx em vez de getUsuarios + filtro client-side
export async function getAlunos(
  page = 1,
  limit = 20,
  search = '',
): Promise<UsuariosPage> {
  let query = supabase
    .from('profiles')
    .select('*, matriculas(id, status, created_at)', { count: 'exact' })
    .in('role', ['aluno', 'pendente'])
    .order('full_name', { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (search.trim()) {
    query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
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

// Retorna as roles que `meuRole` pode atribuir a um usuário com `roleAtualDoUsuario`.
// Retorna string[] porque inclui valores como 'inativo'/'suspenso'/'trancado'
// que são tratados como roles de perfil mas não constam no type UserRole.
export function getRolesPermitidas(meuRole: string, roleAtualDoUsuario: string): string[] {
  if (meuRole === 'superadmin') {
    return ['pendente', 'aluno', 'professor', 'administracao', 'financeiro', 'admin', 'superadmin'];
  }
  if (meuRole === 'admin') {
    if (roleAtualDoUsuario === 'superadmin') return [];
    return ['pendente', 'aluno', 'professor', 'administracao', 'financeiro', 'admin'];
  }
  if (meuRole === 'administracao') {
    if (['admin', 'superadmin'].includes(roleAtualDoUsuario)) return [];
    if (roleAtualDoUsuario === 'pendente') return ['aluno', 'professor'];
    if (roleAtualDoUsuario === 'aluno') return ['inativo', 'suspenso', 'trancado'];
    return [];
  }
  return [];
}

// Atualização de role — com validação de hierarquia + sync user_roles
export async function updateRole(
  userId: string,
  role: string,
  requesterId: string,
): Promise<ServiceResult> {
  const [requester, alvo] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', requesterId).single(),
    supabase.from('profiles').select('role').eq('id', userId).single(),
  ]);

  if (requester.error || alvo.error) return { error: 'Erro ao verificar permissões' };

  const permitidas = getRolesPermitidas(requester.data.role, alvo.data.role);

  if (permitidas.length === 0) return { error: 'Você não tem permissão para alterar este usuário' };
  if (!permitidas.includes(role)) return { error: 'Permissão insuficiente para esta role' };

  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) return { error: error.message };

  // Sincronizar cache user_roles
  await supabase.from('user_roles').upsert({ user_id: userId, role });

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

// ─── Fila de exclusão (migration 025) ────────────────────────────────────────

// Secretaria/admin solicita exclusão → superadmin autoriza depois
export async function solicitarExclusao(
  userId: string,
  motivo: string,
  requesterId: string,
): Promise<ServiceResult> {
  const { data: req } = await supabase
    .from('profiles').select('role').eq('id', requesterId).single();

  if (!['administracao', 'admin', 'superadmin'].includes(req?.role ?? '')) {
    return { error: 'Permissão insuficiente para solicitar exclusão' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ exclusao_solicitada_em: new Date().toISOString(), exclusao_motivo: motivo })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

// Superadmin recusa exclusão — limpa os campos de fila
export async function recusarExclusao(
  userId: string,
  requesterId: string,
): Promise<ServiceResult> {
  const { data: req } = await supabase
    .from('profiles').select('role').eq('id', requesterId).single();

  if (!['admin', 'superadmin'].includes(req?.role ?? '')) {
    return { error: 'Permissão insuficiente' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ exclusao_solicitada_em: null, exclusao_motivo: null })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

// TODO Sprint L: mover para Edge Function (requer service_role / auth.admin.deleteUser)
// Por enquanto retorna erro explicativo — superadmin usará SQL direto no Supabase
export async function executarExclusao(
  _userId: string,
  _requesterId: string,
): Promise<ServiceResult> {
  return { error: 'Exclusão definitiva requer Edge Function — implementar no Sprint L' };
}

// Lista usuários com exclusão pendente — usado no painel do superadmin
export async function getExclusoesPendentes(): Promise<UserRow[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .not('exclusao_solicitada_em', 'is', null)
    .order('exclusao_solicitada_em', { ascending: true });

  return (data as UserRow[]) ?? [];
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
