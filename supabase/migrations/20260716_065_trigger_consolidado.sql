-- Migration: 20260716_065_trigger_consolidado.sql
-- Fase B — consolidação automática: o elo entre o professor e os outros dashboards.
-- Origem: diagnóstico "Fase B: consolidação automática" (2026-07-16) — Proposta A
-- APROVADA pelo Hélio (sem coluna status_manual; com guard trancado/convalidado).
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
--
-- ─── CONTEXTO ────────────────────────────────────────────────────────────────
-- O professor lança em `frequencia` e `notas_aluno` (Fase A ✅), mas secretaria/
-- coordenação/aluno leem `matriculas_disciplina` (nota, faltas, frequencia_
-- percentual, status) — e NINGUÉM atualizava esse consolidado (só o lançamento
-- retroativo manual da secretaria). Esta migração cria a função de recálculo +
-- 2 triggers + backfill: professor lança → consolidado atualiza → todos leem
-- o mesmo número.
--
-- ─── RÉGUA (espelho EXATO do front — conferida linha a linha) ────────────────
-- calcularMedia   (notas.service:79):  NULL se N1 ou N2 faltarem; senão
--                                      round(((n1+n2)/2)*10)/10 → 1 casa decimal.
-- calcularStatus  (notas.service:71):  media NULL → 'cursando' (ANTES do teste de
--                                      freq!) · freq<75 → 'reprovado_falta' ·
--                                      ≥7 'aprovado' · ≥5 'recuperacao' ·
--                                      senão 'reprovado_nota'.
-- statusFromNota  (matricula-academica.service:27): 'reprovado_nota'→'reprovado'
--                                      (vocabulário do CHECK do banco); demais idem.
-- Frequência      (frequencia.service): percentual = round(presencas/total*100);
--                                      SEM chamada (total=0) → front trata como
--                                      100 no cálculo de status, e o retroativo
--                                      GRAVA NULL na coluna (input.frequencia ??
--                                      null) calculando status com 100. Espelho:
--                                      frequencia_percentual = NULL sem chamada;
--                                      status usa freq efetiva 100. faltas = NULL
--                                      sem chamada; senão count(presente=false).
-- N1/N2 em SQL:   o front usa .find() (primeira avaliação do tipo — na prática
--                 existe 1 por tipo). Aqui: MAX(nota) FILTER (tipo) — idêntico
--                 com 1 avaliação por tipo, determinístico se houver 2.
-- Arredondamento: Math.round (JS) e round() (Postgres numeric) são ambos
--                 half-away-from-zero para positivos — sem divergência.
--
-- ─── SEGURANÇA / DESENHO ─────────────────────────────────────────────────────
-- - recalcular_consolidado é SECURITY DEFINER: o professor (autor do INSERT que
--   dispara) NÃO tem policy de UPDATE em matriculas_disciplina (staff-only) —
--   sem DEFINER a RLS derrubaria o próprio INSERT da chamada. O gate real são as
--   policies de frequencia/notas_aluno (059/061/062): só write autorizado dispara.
-- - A trigger function em si roda como invocador (não precisa de DEFINER — quem
--   escreve é a worker function).
-- - SEM LOOP: a função escreve só em matriculas_disciplina, que não tem trigger
--   escrevendo de volta em frequencia/notas_aluno. Ciclo impossível.
-- - GUARD: linhas com status IN ('trancado','convalidado') NUNCA são recalculadas
--   (decisão administrativa preservada). Sem coluna status_manual (decisão do
--   Hélio — risco prático zero: disciplinas com override são retroativas).
-- - Camada 2 (D-FALTAS: FF=2/FP=1/teto=7) mudará SÓ esta função, nada mais.
-- - Performance: agregados por (aluno, disciplina) usam idx_frequencia_disc_aluno
--   e idx_notas_aluno_disciplina — ≤60 linhas de freq + ≤5 notas por execução.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Função de recálculo (worker) — SECURITY DEFINER
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.recalcular_consolidado(
  p_aluno_id      uuid,
  p_disciplina_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total     integer;
  v_presencas integer;
  v_freq_pct  numeric;   -- NULL se não há chamada (espelho do retroativo)
  v_faltas    integer;   -- NULL se não há chamada
  v_freq_ef   numeric;   -- freq efetiva p/ status (100 quando sem chamada)
  v_n1        numeric;
  v_n2        numeric;
  v_nota      numeric;   -- média (n1+n2)/2, 1 casa; NULL se faltar N1 ou N2
  v_status    text;
BEGIN
  -- Frequência do par (aluno, disciplina)
  SELECT count(*), count(*) FILTER (WHERE presente)
    INTO v_total, v_presencas
  FROM frequencia
  WHERE aluno_id = p_aluno_id AND disciplina_id = p_disciplina_id;

  IF v_total > 0 THEN
    v_freq_pct := round(v_presencas * 100.0 / v_total);
    v_faltas   := v_total - v_presencas;
  ELSE
    v_freq_pct := NULL;
    v_faltas   := NULL;
  END IF;
  v_freq_ef := COALESCE(v_freq_pct, 100);

  -- Notas N1/N2 (via tipo da avaliação — como o front)
  SELECT max(n.nota) FILTER (WHERE a.tipo = 'N1'),
         max(n.nota) FILTER (WHERE a.tipo = 'N2')
    INTO v_n1, v_n2
  FROM notas_aluno n
  JOIN avaliacoes a ON a.id = n.avaliacao_id
  WHERE n.aluno_id = p_aluno_id AND n.disciplina_id = p_disciplina_id;

  IF v_n1 IS NOT NULL AND v_n2 IS NOT NULL THEN
    v_nota := round((v_n1 + v_n2) / 2.0, 1);
  ELSE
    v_nota := NULL;
  END IF;

  -- Status — ordem EXATA do calcularStatus + statusFromNota do front
  IF v_nota IS NULL THEN
    v_status := 'cursando';
  ELSIF v_freq_ef < 75 THEN
    v_status := 'reprovado_falta';
  ELSIF v_nota >= 7.0 THEN
    v_status := 'aprovado';
  ELSIF v_nota >= 5.0 THEN
    v_status := 'recuperacao';
  ELSE
    v_status := 'reprovado';
  END IF;

  -- Atualiza o consolidado (todas as matrículas do par; hoje 1) — com GUARD
  UPDATE matriculas_disciplina md
     SET nota                  = v_nota,
         faltas                = v_faltas,
         frequencia_percentual = v_freq_pct,
         status                = v_status
  FROM matriculas m
  WHERE m.id = md.matricula_id
    AND m.aluno_id = p_aluno_id
    AND md.disciplina_id = p_disciplina_id
    AND md.status NOT IN ('trancado','convalidado');   -- GUARD administrativo
END;
$$;

-- Superfície mínima: função interna de trigger/backfill — nunca via API.
REVOKE EXECUTE ON FUNCTION public.recalcular_consolidado(uuid, uuid) FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Trigger function (fina — só repassa o par) + triggers nas 2 fontes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_consolida_par()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.recalcular_consolidado(
    COALESCE(NEW.aluno_id,      OLD.aluno_id),
    COALESCE(NEW.disciplina_id, OLD.disciplina_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_frequencia_consolida ON public.frequencia;
CREATE TRIGGER trg_frequencia_consolida
  AFTER INSERT OR UPDATE OR DELETE ON public.frequencia
  FOR EACH ROW EXECUTE FUNCTION public.trg_consolida_par();

DROP TRIGGER IF EXISTS trg_notas_consolida ON public.notas_aluno;
CREATE TRIGGER trg_notas_consolida
  AFTER INSERT OR UPDATE OR DELETE ON public.notas_aluno
  FOR EACH ROW EXECUTE FUNCTION public.trg_consolida_par();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) BACKFILL — roda a função para todos os pares com lançamento live
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  par RECORD;
  v_pares integer := 0;
BEGIN
  FOR par IN
    SELECT DISTINCT aluno_id, disciplina_id FROM public.frequencia
    UNION
    SELECT DISTINCT aluno_id, disciplina_id FROM public.notas_aluno
  LOOP
    PERFORM public.recalcular_consolidado(par.aluno_id, par.disciplina_id);
    v_pares := v_pares + 1;
  END LOOP;
  RAISE NOTICE 'Backfill do consolidado: % pares (aluno, disciplina) recalculados', v_pares;
END;
$$;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- (a) CASO DE TESTE — João em Apologética (N1 8.0 · N2 7.0 · 100% freq):
-- SELECT md.nota, md.faltas, md.frequencia_percentual, md.status
-- FROM matriculas_disciplina md JOIN matriculas m ON m.id = md.matricula_id
-- WHERE m.aluno_id = 'c43c5e9a-73b6-4e81-b83b-f7c2028462d1'
--   AND md.disciplina_id = 'e030e960-f24f-40e9-be32-9a465c518769';
--    Esperado: nota=7.5 · faltas=0 · frequencia_percentual=100 · status='aprovado'
--
-- (b) Triggers criados:
-- SELECT tgname, tgrelid::regclass FROM pg_trigger
-- WHERE tgname IN ('trg_frequencia_consolida','trg_notas_consolida');
--    Esperado: 2 linhas (frequencia e notas_aluno).
--
-- (c) Teste de não-loop + fluxo vivo: como professor, corrigir a chamada de um
--     dia (UPDATE em frequencia) → deve completar sem travar/timeout e o
--     consolidado refletir na hora. (Ciclo é impossível por construção: a função
--     escreve só em matriculas_disciplina, que não tem trigger para as fontes.)
--
-- (d) GUARD: uma linha 'trancado'/'convalidado' NÃO muda após lançamento:
-- UPDATE ... (lançar nota de aluno com md trancado) → md permanece trancado.
--
-- (e) Nº de pares do backfill: aparece no output do run como
--     NOTICE "Backfill do consolidado: N pares ...". Anotar N no ledger.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (congela o consolidado como está — rodar INTEIRO, LICAO-041)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_frequencia_consolida ON public.frequencia;
-- DROP TRIGGER IF EXISTS trg_notas_consolida      ON public.notas_aluno;
-- DROP FUNCTION IF EXISTS public.trg_consolida_par();
-- DROP FUNCTION IF EXISTS public.recalcular_consolidado(uuid, uuid);
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
-- (Os valores já gravados permanecem; apenas param de atualizar automaticamente.)
