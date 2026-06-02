-- Migration: 20260602_029_calendario_academico.sql
-- Calendário acadêmico híbrido — ADR-007
--
-- ESTRUTURA:
--   aulas_recorrentes  → grade semanal fixa (semestre inteiro em 1 linha)
--   eventos_calendario → feriados, eventos, exceções e cancelamentos por data
--
-- Como usar:
--   1. Secretaria cadastra grade semanal no início do semestre em aulas_recorrentes
--   2. Exceções (feriados, cancelamentos, reposições) entram em eventos_calendario
--   3. O frontend combina as duas tabelas para gerar o calendário visual

-- ─── TABELA 1: aulas_recorrentes ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.aulas_recorrentes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id   UUID        NOT NULL REFERENCES public.disciplinas_v2(id) ON DELETE CASCADE,
  turma_id        UUID        NOT NULL REFERENCES public.turmas(id)          ON DELETE CASCADE,
  professor_id    UUID        REFERENCES public.professores(id)              ON DELETE SET NULL,
  dia_semana      INTEGER     NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  -- 0=Domingo  1=Segunda  2=Terça  3=Quarta  4=Quinta  5=Sexta  6=Sábado
  horario_inicio  TIME        NOT NULL,
  horario_fim     TIME        NOT NULL,
  data_inicio     DATE        NOT NULL,  -- início do semestre/período letivo
  data_fim        DATE        NOT NULL,  -- fim do semestre/período letivo
  sala            TEXT,
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validação: horario_fim deve ser depois de horario_inicio
  CONSTRAINT chk_horario_aula CHECK (horario_fim > horario_inicio),
  -- Validação: data_fim deve ser depois de data_inicio
  CONSTRAINT chk_periodo_letivo CHECK (data_fim > data_inicio)
);

CREATE INDEX IF NOT EXISTS idx_aulas_rec_turma_dia
  ON public.aulas_recorrentes(turma_id, dia_semana);

CREATE INDEX IF NOT EXISTS idx_aulas_rec_professor_dia
  ON public.aulas_recorrentes(professor_id, dia_semana);

CREATE INDEX IF NOT EXISTS idx_aulas_rec_disciplina
  ON public.aulas_recorrentes(disciplina_id);

CREATE INDEX IF NOT EXISTS idx_aulas_rec_ativo
  ON public.aulas_recorrentes(ativo);

COMMENT ON TABLE public.aulas_recorrentes
  IS 'Grade horária semanal fixa. 1 linha = aula que ocorre toda semana '
     'no mesmo dia/horário durante o período letivo (data_inicio até data_fim).';

COMMENT ON COLUMN public.aulas_recorrentes.dia_semana
  IS '0=Dom 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sab';

COMMENT ON COLUMN public.aulas_recorrentes.data_inicio
  IS 'Primeiro dia do semestre/período letivo desta recorrência';

COMMENT ON COLUMN public.aulas_recorrentes.data_fim
  IS 'Último dia do semestre/período letivo desta recorrência';

-- ─── TABELA 2: eventos_calendario ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.eventos_calendario (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          TEXT        NOT NULL,
  descricao       TEXT,
  data            DATE        NOT NULL,
  tipo            TEXT        NOT NULL CHECK (tipo IN (
    'feriado_nacional',       -- feriado nacional (ex: 7 de setembro)
    'feriado_estadual',       -- feriado estadual (ex: dia do estado)
    'feriado_institucional',  -- feriado interno do ITEC
    'evento_itec',            -- evento especial (culto, conferência, formatura)
    'reposicao',              -- aula de reposição por cancelamento anterior
    'recesso',                -- período sem aulas (recesso escolar)
    'cancelamento_aula',      -- cancelamento pontual de uma aula
    'avaliacao',              -- data de prova/avaliação
    'formatura'               -- cerimônia de formatura
  )),
  -- Escopo: null = afeta todo o ITEC | preenchido = afeta só essa turma/disciplina
  turma_id        UUID        REFERENCES public.turmas(id)          ON DELETE CASCADE,
  disciplina_id   UUID        REFERENCES public.disciplinas_v2(id)  ON DELETE CASCADE,
  professor_id    UUID        REFERENCES public.professores(id)     ON DELETE SET NULL,
  -- Se true: cancela a aula recorrente do mesmo dia/turma/disciplina
  cancelar_aula   BOOLEAN     NOT NULL DEFAULT false,
  -- Horário (para eventos com hora específica vs dia inteiro)
  dia_inteiro     BOOLEAN     NOT NULL DEFAULT true,
  horario_inicio  TIME,
  horario_fim     TIME,
  -- Cor para visualização no calendário (hex)
  cor             TEXT        NOT NULL DEFAULT '#3B82F6',
  created_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Se não é dia inteiro, horários são obrigatórios
  CONSTRAINT chk_horario_evento CHECK (
    dia_inteiro = true
    OR (horario_inicio IS NOT NULL AND horario_fim IS NOT NULL AND horario_fim > horario_inicio)
  )
);

CREATE INDEX IF NOT EXISTS idx_eventos_data
  ON public.eventos_calendario(data);

CREATE INDEX IF NOT EXISTS idx_eventos_tipo
  ON public.eventos_calendario(tipo);

CREATE INDEX IF NOT EXISTS idx_eventos_turma_data
  ON public.eventos_calendario(turma_id, data);

CREATE INDEX IF NOT EXISTS idx_eventos_professor_data
  ON public.eventos_calendario(professor_id, data);

COMMENT ON TABLE public.eventos_calendario
  IS 'Exceções e eventos específicos por data. '
     'Complementa aulas_recorrentes com feriados, cancelamentos e eventos especiais. '
     'turma_id/disciplina_id NULL = evento afeta todo o ITEC.';

COMMENT ON COLUMN public.eventos_calendario.cancelar_aula
  IS 'Se true, cancela a(s) aula(s) recorrente(s) daquele dia para a turma/disciplina indicada';

COMMENT ON COLUMN public.eventos_calendario.cor
  IS 'Cor hex para exibição no calendário visual. '
     'Sugestão: feriado=#EF4444 evento=#3B82F6 reposicao=#22C55E recesso=#F59E0B';

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.aulas_recorrentes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;

-- aulas_recorrentes: todos os autenticados podem ler
CREATE POLICY "aulas_rec_select" ON public.aulas_recorrentes
  FOR SELECT TO authenticated USING (true);

-- aulas_recorrentes: apenas staff pode criar/editar/excluir
CREATE POLICY "aulas_rec_staff_write" ON public.aulas_recorrentes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('administracao', 'admin', 'superadmin'))
  );

-- eventos_calendario: todos os autenticados podem ler
CREATE POLICY "eventos_cal_select" ON public.eventos_calendario
  FOR SELECT TO authenticated USING (true);

-- eventos_calendario: apenas staff pode criar/editar/excluir
CREATE POLICY "eventos_cal_staff_write" ON public.eventos_calendario
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('administracao', 'admin', 'superadmin'))
  );
