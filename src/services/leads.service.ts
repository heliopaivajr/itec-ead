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
}

// 12.0: as 9 chaves abaixo batem 1:1 com as colunas de leads_cursos (pós-066);
// id/criado_em ficam por conta dos DEFAULTs do banco. Antes o insert enviava
// cidade/como_conheceu/mensagem/lgpd_aceite SEM as colunas existirem → o
// PostgREST rejeitava o INSERT inteiro (42703) e TODO lead falhava.
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
  };

  const { error } = await supabase.from('leads_cursos').insert(leadData);

  if (error) {
    // LICAO-027: NUNCA engolir o erro — objeto completo no console.
    // (O antigo fallback em localStorage foi removido: gravava no navegador do
    // VISITANTE, dado que o ITEC nunca coleta — falsa sensação de resiliência.
    // Em caso de erro, a UI orienta o contato via WhatsApp.)
    console.error('[createLead] erro Supabase:', {
      message: error.message,
      code:    error.code,
      details: error.details,
      hint:    error.hint,
    });
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function getLeadsCount(): Promise<number> {
  const { count } = await supabase
    .from('leads_cursos')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}
