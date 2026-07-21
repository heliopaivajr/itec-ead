import { supabase } from '@/lib/supabase';

// Financeiro Etapa 2a — Tabela de Preços editável (migração 068).
// Preço = ano × tipo (disciplinas|familia) × qtd (1-4) → 4 valores.
// RLS: leitura authenticated; escrita staff+financeiro (is_staff OR is_financeiro).

export type TipoPreco = 'disciplinas' | 'familia';

export interface PrecoLinha {
  id?: string;
  ano: number;
  tipo: TipoPreco;
  qtd_disciplinas: number;                 // 1-4
  valor_matricula_ate: number;             // matrícula até 15/01
  valor_matricula_apos: number;            // matrícula após 15/01
  valor_mensalidade_ate: number;           // mensalidade até dia 10
  valor_mensalidade_apos: number;          // mensalidade após dia 10 (multa simbólica)
  ativo?: boolean;
  atualizado_em?: string | null;
  atualizado_por?: string | null;
}

export interface ServiceResult {
  error: string | null;
}

export async function getTabelaPrecos(ano: number): Promise<PrecoLinha[]> {
  const { data, error } = await supabase
    .from('tabela_precos')
    .select('*')
    .eq('ano', ano)
    .order('tipo', { ascending: true })
    .order('qtd_disciplinas', { ascending: true })
    .limit(16);

  if (error) {
    console.error('[getTabelaPrecos]', error.message);
    return [];
  }
  return (data as PrecoLinha[]) ?? [];
}

// Upsert por (ano, tipo, qtd) — cria a linha do ano se não existir (ex.: virada
// de ano copia/edita). Registra autoria (atualizado_por/atualizado_em).
export async function upsertPreco(
  linha: Omit<PrecoLinha, 'id' | 'atualizado_em' | 'atualizado_por' | 'ativo'>,
  atualizadoPor: string
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('tabela_precos')
    .upsert(
      {
        ano:                    linha.ano,
        tipo:                   linha.tipo,
        qtd_disciplinas:        linha.qtd_disciplinas,
        valor_matricula_ate:    linha.valor_matricula_ate,
        valor_matricula_apos:   linha.valor_matricula_apos,
        valor_mensalidade_ate:  linha.valor_mensalidade_ate,
        valor_mensalidade_apos: linha.valor_mensalidade_apos,
        atualizado_em:          new Date().toISOString(),
        atualizado_por:         atualizadoPor,
      },
      { onConflict: 'ano,tipo,qtd_disciplinas' }
    );

  if (error) {
    console.error('[upsertPreco]', error.message);
    return { error: error.message };
  }
  return { error: null };
}
