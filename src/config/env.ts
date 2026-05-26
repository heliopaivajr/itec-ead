// Ponto central de leitura de variáveis de ambiente.
// Todas as env vars do projeto devem ser lidas aqui — nunca diretamente
// em outros arquivos — para facilitar auditoria e rastreabilidade.

export const env = {
  supabaseUrl:     import.meta.env.VITE_SUPABASE_URL     as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  siteUrl:         import.meta.env.VITE_SITE_URL          as string | undefined,
} as const;
