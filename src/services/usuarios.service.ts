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
  // fila de exclusão (migration 025)
  exclusao_solicitada_em?: string | null;
  exclusao_motivo?: string | null;
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
      ...(perfil as unknown as UserRow),
      matriculas: undefined,
      matricula_id: matriculaAtiva?.id ?? null,
      matricula_status: matriculaAtiva?.status ?? null,
    };
  });

  return { data: rows, total: count ?? 0 };
}

// Lista paginada de alunos e pendentes — filtro de role feito no banco (não em memória)
// Usar em Alunos.tsx em vez de getUsuarios + filtro client-side
// CORRIGIDO: queries separadas para evitar falha do join aninhado com RLS ativo
export async function getAlunos(
  page = 1,
  limit = 20,
  search = '',
): Promise<UsuariosPage> {
  // ─── QUERY 1: buscar profiles sem join ────────────────────────────────────
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .in('role', ['aluno', 'pendente'])
    .order('full_name', { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (search.trim()) {
    query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
  }

  const { data, count, error } = await query;
  if (error) return { data: [], total: 0 };
  if (!data || data.length === 0) return { data: [], total: count ?? 0 };

  // ─── QUERY 2: buscar matriculas dos perfis retornados ─────────────────────
  const alunoIds = data.map(p => p.id);
  const { data: matriculasData } = await supabase
    .from('matriculas')
    .select('id, aluno_id, status, created_at')
    .in('aluno_id', alunoIds);

  // Agrupar matriculas por aluno_id (pegar a mais recente de cada)
  const matriculasPorAluno = new Map<string, { id: string; status: string; created_at: string }>();
  (matriculasData ?? []).forEach(mat => {
    const existente = matriculasPorAluno.get(mat.aluno_id);
    if (!existente || new Date(mat.created_at) > new Date(existente.created_at)) {
      matriculasPorAluno.set(mat.aluno_id, {
        id: mat.id,
        status: mat.status,
        created_at: mat.created_at,
      });
    }
  });

  // ─── MERGE: associar matrícula a cada perfil ──────────────────────────────
  const rows: UserRow[] = data.map((perfil: Record<string, unknown>) => {
    const matriculaAtiva = matriculasPorAluno.get(perfil.id as string) ?? null;
    return {
      ...(perfil as unknown as UserRow),
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

// ─── Criação de aluno pela secretaria ────────────────────────────────────────
// Chama a Edge Function criar-aluno (requer service_role no backend)
// Edge Function: supabase/functions/criar-aluno/index.ts
export interface CriarAlunoPayload {
  email: string;
  senha_temporaria: string;
  full_name: string;
  cpf?: string;
  telefone?: string;
  data_nascimento?: string | null;
  turma_id?: string;
  data_inicio?: string | null;
  semestre_ingresso?: string;
  obs_retroativa?: string;
}

export async function criarAluno(payload: CriarAlunoPayload): Promise<ServiceResult & { user_id?: string; codigo_itec?: string; matricula_id?: string | null }> {
  const { data, error } = await supabase.functions.invoke('criar-aluno', {
    body: payload,
  });

  if (error) return { error: error.message };

  // A Edge Function retorna { user_id, email, full_name, codigo_itec, matricula_id? }
  // ou { error, field? } em caso de erro de validação
  if (data?.error) return { error: data.error };

  return { error: null, user_id: data.user_id, codigo_itec: data.codigo_itec, matricula_id: data.matricula_id };
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
