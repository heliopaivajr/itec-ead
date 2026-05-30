-- ============================================================
-- SEED DE TESTES — ITEC-EAD
-- Executar no Supabase SQL Editor (service_role / superadmin)
-- 5 professores + 10 alunos + frequências + notas simuladas
-- Senha de todos: Itec@2026
-- ============================================================
-- ⚠️  ATENÇÃO: execute PRIMEIRO as migrations 022, 023 e 024
-- ⚠️  Execute no SQL Editor do Supabase com a Role: service_role
-- ⚠️  Este seed é IDEMPOTENTE via ON CONFLICT DO NOTHING
-- ============================================================

DO $$
DECLARE
  -- UUIDs fixos para referenciar nos inserts seguintes
  u_prof1  UUID := '11000000-0000-0000-0000-000000000001';
  u_prof2  UUID := '11000000-0000-0000-0000-000000000002';
  u_prof3  UUID := '11000000-0000-0000-0000-000000000003';
  u_prof4  UUID := '11000000-0000-0000-0000-000000000004';
  u_prof5  UUID := '11000000-0000-0000-0000-000000000005';

  u_aluno1  UUID := '22000000-0000-0000-0000-000000000001';
  u_aluno2  UUID := '22000000-0000-0000-0000-000000000002';
  u_aluno3  UUID := '22000000-0000-0000-0000-000000000003';
  u_aluno4  UUID := '22000000-0000-0000-0000-000000000004';
  u_aluno5  UUID := '22000000-0000-0000-0000-000000000005';
  u_aluno6  UUID := '22000000-0000-0000-0000-000000000006';
  u_aluno7  UUID := '22000000-0000-0000-0000-000000000007';
  u_aluno8  UUID := '22000000-0000-0000-0000-000000000008';
  u_aluno9  UUID := '22000000-0000-0000-0000-000000000009';
  u_aluno10 UUID := '22000000-0000-0000-0000-000000000010';

  -- IDs dos professores (tabela professores)
  p_prof1  UUID := '33000000-0000-0000-0000-000000000001';
  p_prof2  UUID := '33000000-0000-0000-0000-000000000002';
  p_prof3  UUID := '33000000-0000-0000-0000-000000000003';
  p_prof4  UUID := '33000000-0000-0000-0000-000000000004';
  p_prof5  UUID := '33000000-0000-0000-0000-000000000005';

  -- IDs de turmas (buscados pela migration 018)
  t_2026_1 UUID;
  t_2025_1 UUID;

  -- ID do curso
  v_curso_id UUID;

  -- IDs de disciplinas (primeiras 5 do módulo 1)
  d1 UUID; d2 UUID; d3 UUID; d4 UUID; d5 UUID;

  -- IDs de contratos
  c1 UUID := gen_random_uuid();
  c2 UUID := gen_random_uuid();
  c3 UUID := gen_random_uuid();
  c4 UUID := gen_random_uuid();
  c5 UUID := gen_random_uuid();

  -- IDs de matrículas
  m_aluno1 UUID := gen_random_uuid();
  m_aluno2 UUID := gen_random_uuid();
  m_aluno3 UUID := gen_random_uuid();
  m_aluno4 UUID := gen_random_uuid();
  m_aluno5 UUID := gen_random_uuid();
  m_aluno6 UUID := gen_random_uuid();
  m_aluno7 UUID := gen_random_uuid();
  m_aluno8 UUID := gen_random_uuid();
  m_aluno9 UUID := gen_random_uuid();
  m_aluno10 UUID := gen_random_uuid();

  -- IDs de avaliações
  av1_n1 UUID := gen_random_uuid();
  av1_n2 UUID := gen_random_uuid();
  av1_rec UUID := gen_random_uuid();

  -- senha bcrypt de Itec@2026
  pwd TEXT := crypt('Itec@2026', gen_salt('bf', 10));

BEGIN

  -- ─── 1. BUSCAR IDs DAS TURMAS ──────────────────────────────
  SELECT id INTO t_2026_1 FROM public.turmas WHERE codigo = 'TEO-2026-1';
  SELECT id INTO t_2025_1 FROM public.turmas WHERE codigo = 'TEO-2025-1';

  IF t_2026_1 IS NULL OR t_2025_1 IS NULL THEN
    RAISE EXCEPTION 'Turmas TEO-2026-1 / TEO-2025-1 não encontradas. Execute a migration 018 primeiro.';
  END IF;

  SELECT id INTO v_curso_id FROM public.cursos WHERE codigo = 'GRAD-TEO';
  IF v_curso_id IS NULL THEN
    RAISE EXCEPTION 'Curso GRAD-TEO não encontrado. Execute a migration 014 primeiro.';
  END IF;

  -- ─── 2. BUSCAR IDs DAS DISCIPLINAS (5 primeiras do módulo 1) ─
  SELECT id INTO d1 FROM public.disciplinas_v2
    WHERE modulo_id = (
      SELECT id FROM public.modulos
      WHERE ordem = 1
        AND curso_id = (SELECT id FROM public.cursos WHERE codigo = 'GRAD-TEO')
    ) ORDER BY codigo LIMIT 1 OFFSET 0;

  SELECT id INTO d2 FROM public.disciplinas_v2
    WHERE modulo_id = (
      SELECT id FROM public.modulos
      WHERE ordem = 1
        AND curso_id = (SELECT id FROM public.cursos WHERE codigo = 'GRAD-TEO')
    ) ORDER BY codigo LIMIT 1 OFFSET 1;

  SELECT id INTO d3 FROM public.disciplinas_v2
    WHERE modulo_id = (
      SELECT id FROM public.modulos
      WHERE ordem = 1
        AND curso_id = (SELECT id FROM public.cursos WHERE codigo = 'GRAD-TEO')
    ) ORDER BY codigo LIMIT 1 OFFSET 2;

  SELECT id INTO d4 FROM public.disciplinas_v2
    WHERE modulo_id = (
      SELECT id FROM public.modulos
      WHERE ordem = 1
        AND curso_id = (SELECT id FROM public.cursos WHERE codigo = 'GRAD-TEO')
    ) ORDER BY codigo LIMIT 1 OFFSET 3;

  SELECT id INTO d5 FROM public.disciplinas_v2
    WHERE modulo_id = (
      SELECT id FROM public.modulos
      WHERE ordem = 1
        AND curso_id = (SELECT id FROM public.cursos WHERE codigo = 'GRAD-TEO')
    ) ORDER BY codigo LIMIT 1 OFFSET 4;

  IF d1 IS NULL THEN
    RAISE EXCEPTION 'Nenhuma disciplina encontrada. Execute a migration 014 primeiro.';
  END IF;

  -- ─── 3. CRIAR USUÁRIOS AUTH ────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES
    (u_prof1,  '00000000-0000-0000-0000-000000000000', 'prof1@itecedu.com',  pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_prof2,  '00000000-0000-0000-0000-000000000000', 'prof2@itecedu.com',  pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_prof3,  '00000000-0000-0000-0000-000000000000', 'prof3@itecedu.com',  pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_prof4,  '00000000-0000-0000-0000-000000000000', 'prof4@itecedu.com',  pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_prof5,  '00000000-0000-0000-0000-000000000000', 'prof5@itecedu.com',  pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_aluno1, '00000000-0000-0000-0000-000000000000', 'aluno1@itecedu.com', pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_aluno2, '00000000-0000-0000-0000-000000000000', 'aluno2@itecedu.com', pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_aluno3, '00000000-0000-0000-0000-000000000000', 'aluno3@itecedu.com', pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_aluno4, '00000000-0000-0000-0000-000000000000', 'aluno4@itecedu.com', pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_aluno5, '00000000-0000-0000-0000-000000000000', 'aluno5@itecedu.com', pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_aluno6, '00000000-0000-0000-0000-000000000000', 'aluno6@itecedu.com', pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_aluno7, '00000000-0000-0000-0000-000000000000', 'aluno7@itecedu.com', pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_aluno8, '00000000-0000-0000-0000-000000000000', 'aluno8@itecedu.com', pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_aluno9, '00000000-0000-0000-0000-000000000000', 'aluno9@itecedu.com', pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (u_aluno10,'00000000-0000-0000-0000-000000000000', 'aluno10@itecedu.com',pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- ─── 4. PROFILES ───────────────────────────────────────────
  INSERT INTO public.profiles (id, full_name, email, role) VALUES
    (u_prof1,  'Prof. Carlos Oliveira',  'prof1@itecedu.com',  'professor'),
    (u_prof2,  'Profa. Ana Lima',         'prof2@itecedu.com',  'professor'),
    (u_prof3,  'Prof. Roberto Santos',   'prof3@itecedu.com',  'professor'),
    (u_prof4,  'Profa. Márcia Costa',    'prof4@itecedu.com',  'professor'),
    (u_prof5,  'Prof. Paulo Ferreira',   'prof5@itecedu.com',  'professor'),
    (u_aluno1, 'João Silva',             'aluno1@itecedu.com', 'aluno'),
    (u_aluno2, 'Maria Souza',            'aluno2@itecedu.com', 'aluno'),
    (u_aluno3, 'Pedro Costa',            'aluno3@itecedu.com', 'aluno'),
    (u_aluno4, 'Ana Ferreira',           'aluno4@itecedu.com', 'aluno'),
    (u_aluno5, 'Lucas Oliveira',         'aluno5@itecedu.com', 'aluno'),
    (u_aluno6, 'Juliana Lima',           'aluno6@itecedu.com', 'aluno'),
    (u_aluno7, 'Marcos Santos',          'aluno7@itecedu.com', 'aluno'),
    (u_aluno8, 'Fernanda Costa',         'aluno8@itecedu.com', 'aluno'),
    (u_aluno9, 'Rafael Pereira',         'aluno9@itecedu.com', 'aluno'),
    (u_aluno10,'Camila Rocha',           'aluno10@itecedu.com','aluno')
  ON CONFLICT (id) DO NOTHING;

  -- ─── 5. PROFESSORES ────────────────────────────────────────
  INSERT INTO public.professores
    (id, user_id, nome_completo, cpf, email, formacao, titulacao, ativo)
  VALUES
    (p_prof1, u_prof1, 'Prof. Carlos Oliveira', '111.111.111-01', 'prof1@itecedu.com', 'Teologia', 'Mestre em Teologia', true),
    (p_prof2, u_prof2, 'Profa. Ana Lima',        '111.111.111-02', 'prof2@itecedu.com', 'Letras/Hermenêutica', 'Especialista', true),
    (p_prof3, u_prof3, 'Prof. Roberto Santos',  '111.111.111-03', 'prof3@itecedu.com', 'Filosofia/Teologia', 'Doutor', true),
    (p_prof4, u_prof4, 'Profa. Márcia Costa',   '111.111.111-04', 'prof4@itecedu.com', 'Comunicação/Teologia', 'Mestre', true),
    (p_prof5, u_prof5, 'Prof. Paulo Ferreira',  '111.111.111-05', 'prof5@itecedu.com', 'História/Teologia', 'Mestre em História', true)
  ON CONFLICT (id) DO NOTHING;

  -- ─── 6. CONTRATOS (professor ↔ disciplina) ─────────────────
  IF d1 IS NOT NULL THEN
    INSERT INTO public.contratos_professor (id, professor_id, disciplina_id, status)
    VALUES
      (c1, p_prof1, d1, 'assinado'),
      (c2, p_prof2, d2, 'assinado'),
      (c3, p_prof3, d3, 'assinado'),
      (c4, p_prof4, d4, 'assinado'),
      (c5, p_prof5, d5, 'assinado')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ─── 7. MATRÍCULAS ─────────────────────────────────────────
  -- alunos 1-5 → TEO-2026-1 | alunos 6-10 → TEO-2025-1
  INSERT INTO public.matriculas
    (id, aluno_id, curso_id, turma_id, status)
  VALUES
    (m_aluno1,  u_aluno1,  v_curso_id, t_2026_1, 'ativa'),
    (m_aluno2,  u_aluno2,  v_curso_id, t_2026_1, 'ativa'),
    (m_aluno3,  u_aluno3,  v_curso_id, t_2026_1, 'ativa'),
    (m_aluno4,  u_aluno4,  v_curso_id, t_2026_1, 'ativa'),
    (m_aluno5,  u_aluno5,  v_curso_id, t_2026_1, 'ativa'),
    (m_aluno6,  u_aluno6,  v_curso_id, t_2025_1, 'ativa'),
    (m_aluno7,  u_aluno7,  v_curso_id, t_2025_1, 'ativa'),
    (m_aluno8,  u_aluno8,  v_curso_id, t_2025_1, 'ativa'),
    (m_aluno9,  u_aluno9,  v_curso_id, t_2025_1, 'ativa'),
    (m_aluno10, u_aluno10, v_curso_id, t_2025_1, 'ativa')
  ON CONFLICT DO NOTHING;

  -- ─── 8. MATRÍCULAS POR DISCIPLINA ──────────────────────────
  -- Vincula alunos da TEO-2026-1 à disciplina d1 (do prof1)
  IF d1 IS NOT NULL THEN
    INSERT INTO public.matriculas_disciplina
      (matricula_id, disciplina_id, status)
    VALUES
      (m_aluno1, d1, 'cursando'),
      (m_aluno2, d1, 'cursando'),
      (m_aluno3, d1, 'cursando'),
      (m_aluno4, d1, 'cursando'),
      (m_aluno5, d1, 'cursando')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ─── 9. FREQUÊNCIAS ────────────────────────────────────────
  -- Simula 10 aulas. Presença entre 70% e 95%.
  -- aluno1=95% (19/20), aluno2=90%, aluno3=80%, aluno4=75%, aluno5=70% (em risco)
  IF d1 IS NOT NULL THEN
    INSERT INTO public.frequencia
      (aluno_id, disciplina_id, professor_id, data_aula, presente)
    SELECT
      al.aluno_id,
      d1,
      u_prof1,
      ('2026-02-01'::date + (n || ' days')::interval)::date,
      CASE
        WHEN al.aluno_id = u_aluno1 THEN n < 19   -- 95%
        WHEN al.aluno_id = u_aluno2 THEN n < 18   -- 90%
        WHEN al.aluno_id = u_aluno3 THEN n < 16   -- 80%
        WHEN al.aluno_id = u_aluno4 THEN n < 15   -- 75%
        ELSE n < 14                                -- 70%
      END
    FROM (VALUES
      (u_aluno1),(u_aluno2),(u_aluno3),(u_aluno4),(u_aluno5)
    ) AS al(aluno_id),
    generate_series(0, 19) AS n
    ON CONFLICT DO NOTHING;
  END IF;

  -- ─── 10. AVALIAÇÕES ────────────────────────────────────────
  IF d1 IS NOT NULL THEN
    INSERT INTO public.avaliacoes
      (id, disciplina_id, turma_id, tipo, descricao, criado_por)
    VALUES
      (av1_n1,  d1, t_2026_1, 'N1', 'Prova 1 — Teologia Sistemática I', u_prof1),
      (av1_n2,  d1, t_2026_1, 'N2', 'Prova 2 — Teologia Sistemática I', u_prof1),
      (av1_rec, d1, t_2026_1, 'recuperacao', 'Recuperação Final', u_prof1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ─── 11. NOTAS ─────────────────────────────────────────────
  -- aluno1: N1=8.0, N2=8.5 → média 8.25 → Aprovado direto
  -- aluno2: N1=7.5, N2=7.0 → média 7.25 → Aprovado direto
  -- aluno3: N1=6.0, N2=6.5 → média 6.25 → Recuperação → Rec=7.5 → Aprovado
  -- aluno4: N1=5.0, N2=4.5 → média 4.75 → Reprovado por nota
  -- aluno5: N1=4.0, N2=3.0 → média 3.5  → Reprovado por nota (+ risco de falta)
  IF d1 IS NOT NULL THEN
    -- N1
    INSERT INTO public.notas_aluno
      (avaliacao_id, aluno_id, disciplina_id, turma_id, nota, lancado_por)
    VALUES
      (av1_n1, u_aluno1, d1, t_2026_1, 8.0, u_prof1),
      (av1_n1, u_aluno2, d1, t_2026_1, 7.5, u_prof1),
      (av1_n1, u_aluno3, d1, t_2026_1, 6.0, u_prof1),
      (av1_n1, u_aluno4, d1, t_2026_1, 5.0, u_prof1),
      (av1_n1, u_aluno5, d1, t_2026_1, 4.0, u_prof1)
    ON CONFLICT (avaliacao_id, aluno_id) DO NOTHING;

    -- N2
    INSERT INTO public.notas_aluno
      (avaliacao_id, aluno_id, disciplina_id, turma_id, nota, lancado_por)
    VALUES
      (av1_n2, u_aluno1, d1, t_2026_1, 8.5, u_prof1),
      (av1_n2, u_aluno2, d1, t_2026_1, 7.0, u_prof1),
      (av1_n2, u_aluno3, d1, t_2026_1, 6.5, u_prof1),
      (av1_n2, u_aluno4, d1, t_2026_1, 4.5, u_prof1),
      (av1_n2, u_aluno5, d1, t_2026_1, 3.0, u_prof1)
    ON CONFLICT (avaliacao_id, aluno_id) DO NOTHING;

    -- Recuperação (só aluno3 fez e passou)
    INSERT INTO public.notas_aluno
      (avaliacao_id, aluno_id, disciplina_id, turma_id, nota, lancado_por)
    VALUES
      (av1_rec, u_aluno3, d1, t_2026_1, 7.5, u_prof1)
    ON CONFLICT (avaliacao_id, aluno_id) DO NOTHING;
  END IF;

END $$;

-- ─── RESUMO ────────────────────────────────────────────────────
-- Professores criados:
--   prof1@itecedu.com → Prof. Carlos Oliveira  (disciplina d1)
--   prof2@itecedu.com → Profa. Ana Lima        (disciplina d2)
--   prof3@itecedu.com → Prof. Roberto Santos   (disciplina d3)
--   prof4@itecedu.com → Profa. Márcia Costa    (disciplina d4)
--   prof5@itecedu.com → Prof. Paulo Ferreira   (disciplina d5)
--
-- Alunos criados (TEO-2026-1):
--   aluno1@itecedu.com → João Silva    — N1=8.0, N2=8.5 → Aprovado
--   aluno2@itecedu.com → Maria Souza   — N1=7.5, N2=7.0 → Aprovado
--   aluno3@itecedu.com → Pedro Costa   — N1=6.0, N2=6.5 → Rec=7.5 → Aprovado
--   aluno4@itecedu.com → Ana Ferreira  — N1=5.0, N2=4.5 → Reprovado nota
--   aluno5@itecedu.com → Lucas Oliveira— N1=4.0, N2=3.0 → Reprovado nota+falta
--
-- Alunos criados (TEO-2025-1) — sem notas ainda:
--   aluno6@itecedu.com → Juliana Lima
--   aluno7@itecedu.com → Marcos Santos
--   aluno8@itecedu.com → Fernanda Costa
--   aluno9@itecedu.com → Rafael Pereira
--   aluno10@itecedu.com → Camila Rocha
--
-- Senha de todos: Itec@2026
-- ──────────────────────────────────────────────────────────────
-- Para LIMPAR o seed quando aprovado pelo Hélio:
-- DELETE FROM public.profiles WHERE email LIKE '%@itecedu.com';
-- (em cascata apaga professores, matrículas, notas, frequências)
-- DELETE FROM auth.users WHERE email LIKE '%@itecedu.com';
-- ──────────────────────────────────────────────────────────────
