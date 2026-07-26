-- Migration: 20260726_077_financeiro_aluno.sql
-- Financeiro 2d — o ALUNO vê o próprio financeiro e envia comprovante.
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI (ERR-INFRA-001).
-- Depende de 073 (comprovante_url, vw_mensalidades) e da família is_staff/is_financeiro (067).
--
-- ─── O QUE ESTA MIGRAÇÃO FAZ ─────────────────────────────────────────────────
-- 1) mensalidades.comprovante_enviado_em — carimbo "aluno enviou, aguardando".
-- 2) aluno_enviar_comprovante(id, path) — o aluno vincula o comprovante à PRÓPRIA
--    mensalidade (SECURITY DEFINER; gate aluno_id=auth.uid() E status pendente/atrasado).
--    Grava comprovante_url + comprovante_enviado_em; NÃO muda status (não auto-confirma —
--    quem confirma é o staff via confirmar_pagamento, 073).
-- 3) config_financeiro (1 linha) — chave PIX + beneficiário, lida pelo aluno na tela.
--    RLS: SELECT authenticated; escrita staff/financeiro.
-- LGPD: o aluno só toca a própria mensalidade (posse validada na RPC) e o bucket já
-- limita por foldername[1]=auth.uid() (073). Sem terceiros.
-- ═════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Carimbo de "comprovante enviado" (aditivo)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.mensalidades
  ADD COLUMN IF NOT EXISTS comprovante_enviado_em timestamptz;

COMMENT ON COLUMN public.mensalidades.comprovante_enviado_em IS
  'Quando o ALUNO subiu o comprovante (status segue pendente até o staff confirmar). '
  'NULL = sem comprovante do aluno. Preenchido + status pendente = aguardando confirmação.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) aluno_enviar_comprovante — o aluno vincula o comprovante à PRÓPRIA mensalidade
--    NÃO confirma (billing sagrado: só o staff via confirmar_pagamento marca 'pago').
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.aluno_enviar_comprovante(
  p_mensalidade_id uuid,
  p_path text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_aluno  uuid;
  v_status text;
BEGIN
  IF p_path IS NULL OR btrim(p_path) = '' THEN
    RAISE EXCEPTION 'Caminho do comprovante é obrigatório';
  END IF;

  SELECT aluno_id, status INTO v_aluno, v_status
    FROM mensalidades WHERE id = p_mensalidade_id;
  IF v_aluno IS NULL THEN
    RAISE EXCEPTION 'Mensalidade não encontrada';
  END IF;

  -- Posse: o aluno só anexa na PRÓPRIA mensalidade (LGPD). Staff/financeiro usam o modal 073.
  IF v_aluno <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissão: a mensalidade não é sua';
  END IF;
  -- Só faz sentido em cobrança em aberto.
  IF v_status NOT IN ('pendente','atrasado') THEN
    RAISE EXCEPTION 'Só é possível enviar comprovante de mensalidade em aberto (status: %)', v_status;
  END IF;

  UPDATE mensalidades
     SET comprovante_url        = p_path,
         comprovante_enviado_em = now()
         -- status INALTERADO de propósito (aguardando confirmação do staff)
   WHERE id = p_mensalidade_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aluno_enviar_comprovante(uuid, text) FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) config_financeiro — chave PIX institucional (1 linha), lida pelo aluno
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.config_financeiro (
  id            smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),   -- singleton
  chave_pix     text,
  tipo_chave    text,      -- 'email' | 'cpf' | 'cnpj' | 'telefone' | 'aleatoria'
  beneficiario  text,
  cidade        text,
  instrucoes    text,
  atualizado_por uuid REFERENCES public.profiles(id),
  atualizado_em  timestamptz DEFAULT now()
);

COMMENT ON TABLE public.config_financeiro IS
  'Configuração financeira institucional (singleton id=1): chave PIX exibida ao aluno. Boleto futuro.';

ALTER TABLE public.config_financeiro ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer autenticado (o aluno precisa ver a chave para pagar). Não é PII de terceiros.
DROP POLICY IF EXISTS "config_financeiro_select" ON public.config_financeiro;
CREATE POLICY "config_financeiro_select" ON public.config_financeiro
  FOR SELECT TO authenticated USING (true);

-- Escrita: só staff/financeiro.
DROP POLICY IF EXISTS "config_financeiro_write" ON public.config_financeiro;
CREATE POLICY "config_financeiro_write" ON public.config_financeiro
  FOR ALL TO authenticated
  USING (is_staff() OR is_financeiro())
  WITH CHECK (is_staff() OR is_financeiro());

REVOKE ALL ON public.config_financeiro FROM anon;

-- SEED (idempotente). ⚠️ CHAVE PLACEHOLDER — o Hélio edita na tela (ou trocar aqui
-- antes de rodar). tipo/beneficiario/cidade também editáveis.
INSERT INTO public.config_financeiro (id, chave_pix, tipo_chave, beneficiario, cidade, instrucoes)
VALUES (1, 'CHAVE-PIX-A-DEFINIR', 'email',
        'Instituto de Teologia Cristã', 'Paulista/PE',
        'Envie o comprovante pelo próprio sistema após o PIX. Dúvidas: WhatsApp (81) 99116-1448.')
ON CONFLICT (id) DO NOTHING;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar após aplicar)
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Coluna + tabela:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='mensalidades' AND column_name='comprovante_enviado_em';        → 1
-- SELECT id, chave_pix FROM config_financeiro;                                        → 1 linha (id=1)
-- SELECT proname FROM pg_proc WHERE proname='aluno_enviar_comprovante';               → 1
--
-- 2. Aluno envia o PRÓPRIO (logado como o aluno dono):
-- SELECT aluno_enviar_comprovante('<mensalidade-do-aluno>', '<uid>/<mens>.pdf');
--    → comprovante_url + comprovante_enviado_em preenchidos; status SEGUE 'pendente' (NÃO 'pago').
-- 3. Posse (logado como OUTRO aluno):
-- SELECT aluno_enviar_comprovante('<mensalidade-alheia>', 'x');   → EXCEPTION 'não é sua'
-- 4. Estado (logado como aluno):
-- SELECT aluno_enviar_comprovante('<paga>', 'x');                 → EXCEPTION 'em aberto'
-- 5. Config: aluno lê (SELECT ok); aluno tenta UPDATE → negado (RLS); staff edita → ok.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (rodar INTEIRO — LICAO-041)
-- ═════════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.aluno_enviar_comprovante(uuid, text);
-- DROP TABLE IF EXISTS public.config_financeiro;
-- -- coluna aditiva pode ficar; remover só se necessário:
-- -- ALTER TABLE public.mensalidades DROP COLUMN IF EXISTS comprovante_enviado_em;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
