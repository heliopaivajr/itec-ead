import { supabase } from '@/lib/supabase';

export interface LeadPayload {
  nome: string;
  email: string;
  telefone: string;
  cidade?: string;
  curso_interesse: string;
  como_conheceu?: string;
  mensagem?: string;
  interesse?: string;
}

export interface LeadResult {
  success: boolean;
  error: string | null;
  savedLocally: boolean;
}

export async function createLead(payload: LeadPayload): Promise<LeadResult> {
  const leadData = {
    nome:            payload.nome,
    email:           payload.email,
    telefone:        payload.telefone,
    cidade:          payload.cidade ?? null,
    curso_interesse: payload.curso_interesse,
    como_conheceu:   payload.como_conheceu ?? null,
    mensagem:        payload.mensagem ?? null,
    interesse:       payload.interesse ?? 'candidato',
    lgpd_aceite:     true,
    criado_em:       new Date().toISOString(),
  };

  const { error } = await supabase.from('leads_cursos').insert(leadData);

  if (error) {
    try {
      const pendentes = JSON.parse(localStorage.getItem('leads_pendentes') ?? '[]');
      pendentes.push({ ...leadData, tentativa_em: new Date().toISOString() });
      localStorage.setItem('leads_pendentes', JSON.stringify(pendentes));
      return { success: false, error: error.message, savedLocally: true };
    } catch {
      return { success: false, error: error.message, savedLocally: false };
    }
  }

  return { success: true, error: null, savedLocally: false };
}

export async function getLeadsCount(): Promise<number> {
  const { count } = await supabase
    .from('leads_cursos')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}
