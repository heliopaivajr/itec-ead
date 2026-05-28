import { supabase } from '@/lib/supabase';

export interface PerfilAluno {
  id: string;
  full_name: string;
  email: string;
  role: string;
  telefone: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  // dados pessoais (migration 021)
  cpf?: string | null;
  rg?: string | null;
  data_nascimento?: string | null;
  sexo?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  igreja_local?: string | null;
  observacoes_internas?: string | null;
}

export interface MatriculaFicha {
  id: string;
  status: string;
  created_at: string;
  turma?: { codigo: string; nome: string } | null;
}

export interface DocumentoFicha {
  id: string;
  tipo: string;
  url: string;
  status: string;
  observacao?: string;
  enviado_em: string;
}

export interface MensalidadeFicha {
  id: string;
  mes_referencia: string;
  valor: number;
  status: string;
  data_vencimento: string;
  data_pagamento: string | null;
}

export interface FichaAlunoData {
  perfil: PerfilAluno | null;
  matriculas: MatriculaFicha[];
  documentos: DocumentoFicha[];
  mensalidades: MensalidadeFicha[];
}

export async function getFichaAluno(alunoId: string): Promise<FichaAlunoData> {
  const [perfilRes, matRes, docRes, mensRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, role, telefone, bio, avatar_url, created_at, cpf, rg, data_nascimento, sexo, endereco, numero, complemento, bairro, cidade, estado, cep, igreja_local, observacoes_internas')
      .eq('id', alunoId)
      .single(),

    supabase
      .from('matriculas')
      .select('id, status, created_at, turma:turmas(codigo, nome)')
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('documentos_aluno')
      .select('id, tipo, url, status, observacao, enviado_em')
      .eq('aluno_id', alunoId)
      .order('enviado_em', { ascending: false })
      .limit(50),

    supabase
      .from('mensalidades')
      .select('id, mes_referencia, valor, status, data_vencimento, data_pagamento')
      .eq('aluno_id', alunoId)
      .order('data_vencimento', { ascending: false })
      .limit(36),
  ]);

  return {
    perfil:       perfilRes.data as PerfilAluno | null,
    matriculas:   (matRes.data ?? []) as MatriculaFicha[],
    documentos:   (docRes.data ?? []) as DocumentoFicha[],
    mensalidades: (mensRes.data ?? []) as MensalidadeFicha[],
  };
}
