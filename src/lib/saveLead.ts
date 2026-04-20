export interface LeadData {
  nome: string;
  telefone: string;
  email: string;
  interesse: string;
  curso_interesse: string;
}

export async function saveLead(data: LeadData): Promise<void> {
  const record = { ...data, criado_em: new Date().toISOString() };

  // Fallback: localStorage (até Supabase ser configurado no Módulo B)
  try {
    const existing = JSON.parse(localStorage.getItem('itec_leads') || '[]');
    existing.push(record);
    localStorage.setItem('itec_leads', JSON.stringify(existing));
  } catch {
    // Silently fail — não bloqueia o download
  }
}
