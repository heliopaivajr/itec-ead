-- Migration: 20260526_006_indices_paginacao.sql
-- Índices para queries de paginação — leads e matrículas.
-- Todos idempotentes (IF NOT EXISTS).

-- Leads ordenados por data — leads_cursos usa criado_em (não created_at)
CREATE INDEX IF NOT EXISTS idx_leads_cursos_criado_em
  ON public.leads_cursos (criado_em DESC);

-- Busca por nome/email/telefone em Leads.tsx (ilike)
-- Índices trigram requerem pg_trgm; usando índice funcional básico como alternativa
CREATE INDEX IF NOT EXISTS idx_leads_cursos_nome
  ON public.leads_cursos (nome);

CREATE INDEX IF NOT EXISTS idx_leads_cursos_email
  ON public.leads_cursos (email);

-- Matrículas por aluno — query do MeusCursos.tsx
CREATE INDEX IF NOT EXISTS idx_matriculas_aluno_id
  ON public.matriculas (aluno_id);

-- Matrículas ordenadas por data — query do Matriculas.tsx
CREATE INDEX IF NOT EXISTS idx_matriculas_created_at
  ON public.matriculas (created_at DESC);

-- Matrículas por status + data — query paginada do Matriculas.tsx (tab filter)
CREATE INDEX IF NOT EXISTS idx_matriculas_status_created_at
  ON public.matriculas (status, created_at DESC);
