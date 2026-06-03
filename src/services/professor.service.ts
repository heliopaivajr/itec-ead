import { supabase } from '@/lib/supabase';

export interface Professor {
  id: string;
  user_id: string | null;
  nome_completo: string;
  cpf: string;
  rg: string | null;
  data_nascimento: string | null;
  telefone: string | null;
  email: string;
  endereco: string | null;
  formacao: string | null;
  titulacao: string | null;
  experiencia_ministerial: string | null;
  igreja_local: string | null;
  ativo: boolean;
  // migration 028 — status expandido (sincronizado com ativo via trigger)
  status?: 'ativo' | 'aguardando' | 'afastado' | 'desligado';
  criado_em: string;
  atualizado_em: string;
}

export interface ContratoProfessor {
  id: string;
  professor_id: string;
  disciplina_id: string;
  status: 'pendente' | 'preenchido' | 'impresso' | 'assinado' | 'encerrado';
  dados_preenchidos: Record<string, unknown> | null;
  pdf_url: string | null;
  gerado_por: string | null;
  gerado_em: string | null;
  preenchido_em: string | null;
  impresso_em: string | null;
  assinado_em: string | null;
  criado_em: string;
}

export type ProfessorPayload = Omit<Professor, 'id' | 'criado_em' | 'atualizado_em'>;

export interface ServiceResult {
  error: string | null;
}

export interface PaginatedProfessores {
  data: Professor[];
  total: number;
}

// Paginação + busca + filtro ativo/todos
export async function getProfessores(
  page = 1,
  limit = 20,
  search = '',
  apenasAtivos = true
): Promise<PaginatedProfessores> {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from('professores')
    .select('*', { count: 'exact' });

  if (apenasAtivos) query = query.not('status', 'eq', 'desligado');
  if (search.trim()) {
    query = query.or(
      `nome_completo.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`
    );
  }

  const { data, count, error } = await query
    .order('nome_completo', { ascending: true })
    .range(from, to);

  if (error) return { data: [], total: 0 };
  return { data: (data as Professor[]) ?? [], total: count ?? 0 };
}

export async function getProfessorById(id: string): Promise<Professor | null> {
  const { data, error } = await supabase
    .from('professores')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Professor;
}

export async function getProfessorByUserId(userId: string): Promise<Professor | null> {
  const { data, error } = await supabase
    .from('professores')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as Professor;
}

export async function createProfessor(
  dados: ProfessorPayload
): Promise<{ data: Professor | null; error: string | null }> {
  const { data, error } = await supabase
    .from('professores')
    .insert(dados)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Professor, error: null };
}

export async function updateProfessor(
  id: string,
  dados: Partial<ProfessorPayload>
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('professores')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function getContratosByProfessor(
  professorId: string
): Promise<ContratoProfessor[]> {
  const { data, error } = await supabase
    .from('contratos_professor')
    .select('*')
    .eq('professor_id', professorId)
    .order('criado_em', { ascending: false })
    .limit(50); // máx. realista: 1-6 contratos/professor/ano, proteção ampla

  if (error) return [];
  return (data as ContratoProfessor[]) ?? [];
}

export async function getContratoById(
  id: string
): Promise<ContratoProfessor | null> {
  const { data, error } = await supabase
    .from('contratos_professor')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as ContratoProfessor;
}

export async function getContratoByDisciplina(
  professorId: string,
  disciplinaId: string
): Promise<ContratoProfessor | null> {
  const { data, error } = await supabase
    .from('contratos_professor')
    .select('*')
    .eq('professor_id', professorId)
    .eq('disciplina_id', disciplinaId)
    .single();

  if (error || !data) return null;
  return data as ContratoProfessor;
}

export async function updateStatusContrato(
  id: string,
  status: ContratoProfessor['status']
): Promise<ServiceResult> {
  const now = new Date().toISOString();
  const extra: Record<string, string> = {
    preenchido: 'preenchido_em',
    impresso:   'impresso_em',
    assinado:   'assinado_em',
  };

  const update: Record<string, string> = { status };
  if (extra[status]) update[extra[status]] = now;

  const { error } = await supabase
    .from('contratos_professor')
    .update(update)
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function desativarProfessor(id: string): Promise<ServiceResult> {
  const { error } = await supabase
    .from('professores')
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function reativarProfessor(id: string): Promise<ServiceResult> {
  const { error } = await supabase
    .from('professores')
    .update({ ativo: true, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}
// Atualiza status via campo status (trigger migration 028 sincroniza ativo automaticamente)
export async function updateStatusProfessor(
  professorId: string,
  status: 'ativo' | 'aguardando' | 'afastado' | 'desligado',
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('professores')
    .update({ status })
    .eq('id', professorId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function vincularDisciplina(
  professorId: string,
  disciplinaId: string,
  geradoPor: string
): Promise<{ data: ContratoProfessor | null; error: string | null }> {
  const { data, error } = await supabase
    .from('contratos_professor')
    .insert({
      professor_id: professorId,
      disciplina_id: disciplinaId,
      status: 'pendente',
      gerado_por: geradoPor,
      gerado_em: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as ContratoProfessor, error: null };
}

export async function preencherContrato(
  id: string,
  dados: Record<string, unknown>
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('contratos_professor')
    .update({
      dados_preenchidos: dados,
      status: 'preenchido',
      preenchido_em: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}
