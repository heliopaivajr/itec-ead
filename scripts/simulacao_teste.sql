-- ═══════════════════════════════════════════════════════════════
-- ITEC-EAD — Script de Simulação / Dados de Teste
-- Agente: 04-db-architect | Sprint I
-- Data: 2026-05-27
--
-- INSTRUÇÕES:
-- 1. Crie os 4 usuários em Authentication → Users → Add user:
--      aluno@itec.edu.br        senha: Teste@123
--      professor@itec.edu.br    senha: Teste@123
--      secretaria@itec.edu.br   senha: Teste@123
--      financeiro@itec.edu.br   senha: Teste@123
--
-- 2. Execute este script inteiro no SQL Editor do Supabase.
--
-- NÃO USAR EM PRODUÇÃO — apenas ambiente de testes.
-- ═══════════════════════════════════════════════════════════════

-- ─── Diagnóstico: ver UUIDs criados ──────────────────────────
SELECT id, email, created_at
FROM auth.users
WHERE email IN (
  'aluno@itec.edu.br',
  'professor@itec.edu.br',
  'secretaria@itec.edu.br',
  'financeiro@itec.edu.br'
)
ORDER BY email;

-- ─── Passo 1 — Definir roles e nomes ─────────────────────────

UPDATE public.profiles
SET role = 'administracao',
    full_name = 'Camila Silva (Teste)'
WHERE email = 'secretaria@itec.edu.br';

UPDATE public.profiles
SET role = 'professor',
    full_name = 'Prof. João Santos (Teste)'
WHERE email = 'professor@itec.edu.br';

UPDATE public.profiles
SET role = 'financeiro',
    full_name = 'Rev. Breno Lima (Teste)'
WHERE email = 'financeiro@itec.edu.br';

-- Aluno fica pendente — será aprovado manualmente no fluxo
UPDATE public.profiles
SET full_name = 'João Silva (Aluno Teste)'
WHERE email = 'aluno@itec.edu.br';

-- Confirma roles
SELECT email, role, full_name
FROM public.profiles
WHERE email IN (
  'aluno@itec.edu.br',
  'professor@itec.edu.br',
  'secretaria@itec.edu.br',
  'financeiro@itec.edu.br'
)
ORDER BY email;

-- ─── Passo 2 — Criar registro na tabela professores ──────────
-- Usa subquery para pegar UUID do perfil automaticamente

INSERT INTO public.professores (
  user_id,
  nome_completo,
  cpf,
  telefone,
  email,
  formacao,
  titulacao,
  experiencia_ministerial,
  igreja_local,
  ativo
)
SELECT
  p.id,
  'Prof. João Santos',
  '123.456.789-00',
  '(81) 99999-0001',
  'professor@itec.edu.br',
  'Bacharel em Teologia — Seminário Batista',
  'Mestre em Teologia Bíblica',
  '10 anos como pastor e docente',
  'Igreja Batista Central',
  true
FROM public.profiles p
WHERE p.email = 'professor@itec.edu.br'
ON CONFLICT (cpf) DO NOTHING;

-- ─── Passo 3 — Vincular professor à disciplina B1NTG ─────────

INSERT INTO public.contratos_professor (professor_id, disciplina_id, status)
SELECT
  prof.id,
  disc.id,
  'pendente'
FROM public.professores prof
CROSS JOIN public.disciplinas_v2 disc
WHERE prof.email   = 'professor@itec.edu.br'
  AND disc.codigo  = 'B1NTG'
ON CONFLICT DO NOTHING;

-- ─── Passo 4 — Matrícula do aluno de teste ───────────────────
-- Vincula à turma TEO-2026-1 (Módulo 1, 2026)

INSERT INTO public.matriculas (aluno_id, status, turma_id)
SELECT
  p.id,
  'pendente',
  t.id
FROM public.profiles p
CROSS JOIN public.turmas t
WHERE p.email   = 'aluno@itec.edu.br'
  AND t.codigo  = 'TEO-2026-1'
ON CONFLICT DO NOTHING;

-- ─── Passo 5 — Taxa de matrícula (pendente) ──────────────────

INSERT INTO public.taxa_matricula (aluno_id, matricula_id, valor, status, registrado_por)
SELECT
  p.id,
  m.id,
  150.00,
  'pendente',
  (SELECT id FROM public.profiles WHERE role = 'superadmin' LIMIT 1)
FROM public.profiles p
JOIN public.matriculas m ON m.aluno_id = p.id
WHERE p.email = 'aluno@itec.edu.br'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ─── Diagnóstico final ───────────────────────────────────────

SELECT '=== PROFESSORES ===' AS secao;
SELECT p.email, pr.nome_completo, pr.ativo
FROM public.professores pr
JOIN public.profiles p ON p.id = pr.user_id
WHERE p.email = 'professor@itec.edu.br';

SELECT '=== CONTRATOS ===' AS secao;
SELECT
  pr.nome_completo AS professor,
  d.codigo         AS disciplina,
  d.nome           AS nome_disciplina,
  c.status
FROM public.contratos_professor c
JOIN public.professores pr ON pr.id = c.professor_id
JOIN public.disciplinas_v2 d ON d.id = c.disciplina_id
WHERE pr.email = 'professor@itec.edu.br';

SELECT '=== MATRÍCULAS ===' AS secao;
SELECT
  p.full_name AS aluno,
  m.status,
  t.codigo    AS turma
FROM public.matriculas m
JOIN public.profiles p ON p.id = m.aluno_id
LEFT JOIN public.turmas t ON t.id = m.turma_id
WHERE p.email = 'aluno@itec.edu.br';

SELECT '=== TAXA DE MATRÍCULA ===' AS secao;
SELECT
  p.full_name AS aluno,
  tx.valor,
  tx.status
FROM public.taxa_matricula tx
JOIN public.profiles p ON p.id = tx.aluno_id
WHERE p.email = 'aluno@itec.edu.br';

-- ═══════════════════════════════════════════════════════════════
-- Checklist de aceite:
-- [x] 4 usuários criados em Auth (manual)
-- [x] Roles definidos: aluno(pendente), professor, administracao, financeiro
-- [x] Registro em professores criado
-- [x] Contrato professor → B1NTG (pendente)
-- [x] Matrícula aluno → TEO-2026-1 (pendente)
-- [x] Taxa de matrícula registrada
-- ═══════════════════════════════════════════════════════════════
