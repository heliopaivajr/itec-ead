import { supabase } from '@/lib/supabase';

export interface LeadData {
  nome: string;
  telefone: string;
  email: string;
  interesse: string;
  curso_interesse: string;
}

export async function saveLead(data: LeadData): Promise<void> {
  const record = { ...data, criado_em: new Date().toISOString() };

  // Tenta salvar no Supabase primeiro
  try {
    const { error } = await supabase.from('leads_cursos').insert([record]);
    if (!error) return;
    console.warn('Supabase lead save failed, using localStorage fallback:', error.message);
  } catch {
    // Supabase indisponível — fallback silencioso
  }

  // Fallback: localStorage
  try {
    const existing = JSON.parse(localStorage.getItem('itec_leads') || '[]');
    existing.push(record);
    localStorage.setItem('itec_leads', JSON.stringify(existing));
  } catch {
    // Silently fail — não bloqueia o download
  }
}
