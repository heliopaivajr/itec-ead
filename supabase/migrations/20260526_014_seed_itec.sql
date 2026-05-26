-- Migration: 20260526_014_seed_itec.sql
-- Seed com dados reais: curso, 6 módulos, 40 disciplinas, pré-requisitos
-- Idempotente via ON CONFLICT DO NOTHING

-- ─── 1. CURSO ────────────────────────────────────────────────
INSERT INTO public.cursos
  (codigo, nome, modalidade, horario, carga_horaria_total, creditos_total, ativo, inicio_turma)
VALUES
  ('GRAD-TEO',
   'Graduação em Teologia',
   'Hibrida',
   'Seg/Qua/Sex 18h45-22h | Ter/Qui eletivas',
   1850, 185, true, '2026-08-01')
ON CONFLICT (codigo) DO NOTHING;

-- ─── 2. MÓDULOS ──────────────────────────────────────────────
DO $$
DECLARE v_curso_id UUID;
BEGIN
  SELECT id INTO v_curso_id FROM public.cursos WHERE codigo = 'GRAD-TEO';
  IF v_curso_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.modulos (curso_id, nome, ordem, ano_curso, semestre, periodo, data_inicio, data_fim)
  VALUES
    (v_curso_id, '1º Módulo', 1, 1, 1, 'Fevereiro a Junho',   '2026-02-01','2026-06-30'),
    (v_curso_id, '2º Módulo', 2, 1, 2, 'Agosto a Dezembro',   '2026-08-01','2026-12-15'),
    (v_curso_id, '3º Módulo', 3, 2, 1, 'Fevereiro a Junho',   '2027-02-01','2027-06-30'),
    (v_curso_id, '4º Módulo', 4, 2, 2, 'Agosto a Dezembro',   '2027-08-01','2027-12-15'),
    (v_curso_id, '5º Módulo', 5, 3, 1, 'Fevereiro a Junho',   '2028-02-01','2028-06-30'),
    (v_curso_id, '6º Módulo', 6, 3, 2, 'Agosto a Dezembro',   '2028-08-01','2028-12-15')
  ON CONFLICT (curso_id, ordem) DO NOTHING;
END $$;

-- ─── 3. DISCIPLINAS ──────────────────────────────────────────
DO $$
DECLARE
  m1 UUID; m2 UUID; m3 UUID; m4 UUID; m5 UUID; m6 UUID;
BEGIN
  SELECT id INTO m1 FROM public.modulos WHERE ordem=1 AND curso_id=(SELECT id FROM public.cursos WHERE codigo='GRAD-TEO');
  SELECT id INTO m2 FROM public.modulos WHERE ordem=2 AND curso_id=(SELECT id FROM public.cursos WHERE codigo='GRAD-TEO');
  SELECT id INTO m3 FROM public.modulos WHERE ordem=3 AND curso_id=(SELECT id FROM public.cursos WHERE codigo='GRAD-TEO');
  SELECT id INTO m4 FROM public.modulos WHERE ordem=4 AND curso_id=(SELECT id FROM public.cursos WHERE codigo='GRAD-TEO');
  SELECT id INTO m5 FROM public.modulos WHERE ordem=5 AND curso_id=(SELECT id FROM public.cursos WHERE codigo='GRAD-TEO');
  SELECT id INTO m6 FROM public.modulos WHERE ordem=6 AND curso_id=(SELECT id FROM public.cursos WHERE codigo='GRAD-TEO');

  IF m1 IS NULL THEN RETURN; END IF;

  -- ── Módulo 1 ───────────────────────────────────────────────
  INSERT INTO public.disciplinas_v2 (modulo_id, codigo, nome, area, ano_curso, carga_horaria_presencial, carga_horaria_ead, creditos, tipo)
  VALUES
    (m1,'B1NTG','Introdução ao NT I (Evangelhos)',              'B',1, 30,10, 4,'regular'),
    (m1,'P1ESC','Espiritualidade Cristã',                       'P',1, 30,10, 4,'regular'),
    (m1,'B1BIB','Introdução Bíblica: Bibliologia',              'B',1, 20,10, 3,'regular'),
    (m1,'B1ATG','Introdução ao AT I (Pentateuco)',              'B',1, 30,10, 4,'regular'),
    (m1,'T1DOG','Teologia Sistemática I: Deus e Antropologia',  'T',1, 30,30, 6,'regular'),
    (m1,'T1MIS','Missiologia I: Introdução',                    'T',1, 30,30, 6,'regular')
  ON CONFLICT (codigo) DO NOTHING;

  -- ── Módulo 2 ───────────────────────────────────────────────
  INSERT INTO public.disciplinas_v2 (modulo_id, codigo, nome, area, ano_curso, carga_horaria_presencial, carga_horaria_ead, creditos, tipo)
  VALUES
    (m2,'B1ATH','Introdução ao AT II (Históricos)',             'B',1, 30,10, 4,'regular'),
    (m2,'T1HIG','História da Igreja I: Primitiva e Medieval',   'T',1, 30,30, 6,'regular'),
    (m2,'T1CRI','Teologia Sistemática II: Cristologia',         'T',1, 30,30, 6,'regular'),
    (m2,'B1GRG','Língua Grega I',                               'B',1, 30,10, 4,'regular'),
    (m2,'B1NTA','Introdução ao NT II (Atos)',                   'B',1, 30,10, 4,'regular'),
    (m2,'T1HIM','História da Igreja II: Reforma e Modernidade', 'T',1, 30,30, 6,'regular'),
    (m2,'B1PIE','Período Interbíblico',                         'B',1, 30,10, 4,'eletiva'),
    (m2,'T1FIE','Introdução à Filosofia',                       'T',1, 30,10, 4,'eletiva')
  ON CONFLICT (codigo) DO NOTHING;

  -- ── Módulo 3 ───────────────────────────────────────────────
  INSERT INTO public.disciplinas_v2 (modulo_id, codigo, nome, area, ano_curso, carga_horaria_presencial, carga_horaria_ead, creditos, tipo)
  VALUES
    (m3,'B2GRK','Língua Grega II',                                      'B',2, 30,10, 4,'regular'),
    (m3,'B2ATP','Introdução ao AT III (Proféticos)',                    'B',2, 30,10, 4,'regular'),
    (m3,'T2SOT','Teologia Sistemática III: Soteriologia/Pneumatologia', 'T',2, 30,30, 6,'regular'),
    (m3,'B2NTP','Introdução ao NT III (Cartas Paulinas)',               'B',2, 30,10, 4,'regular'),
    (m3,'T2ETC','Ética Cristã',                                         'T',2, 30,10, 4,'regular'),
    (m3,'T2MIS','Missiologia II: Evangelismo',                          'T',2, 30,10, 4,'regular'),
    (m3,'T2HIB','História da Igreja do Brasil',                         'T',2, 30,10, 4,'eletiva'),
    (m3,'T2ARQ','Arqueologia e Costumes Bíblicos',                      'T',2, 30,30, 6,'eletiva')
  ON CONFLICT (codigo) DO NOTHING;

  -- ── Módulo 4 ───────────────────────────────────────────────
  INSERT INTO public.disciplinas_v2 (modulo_id, codigo, nome, area, ano_curso, carga_horaria_presencial, carga_horaria_ead, creditos, tipo)
  VALUES
    (m4,'B2HER','Hermenêutica Bíblica',                         'B',2, 30,30, 6,'regular'),
    (m4,'B2HEB','Língua Hebraica I',                            'B',2, 30,10, 4,'obrigatoria'),
    (m4,'B2ATQ','Introdução ao AT IV (Poéticos)',               'B',2, 30,10, 4,'regular'),
    (m4,'T2MIH','Missiologia III: História em Missões',         'T',2, 30,10, 4,'regular'),
    (m4,'B2EXT','Exegese do Novo Testamento',                   'B',2, 30,10, 4,'regular'),
    (m4,'T2ESC','Escatologia',                                  'T',2, 30,10, 4,'regular'),
    (m4,'B2NTG','Introdução ao NT IV (Cartas Gerais)',          'B',2, 30,10, 4,'regular'),
    (m4,'B2HE2','Língua Hebraica II',                           'B',2, 30,10, 4,'eletiva')
  ON CONFLICT (codigo) DO NOTHING;

  -- ── Módulo 5 ───────────────────────────────────────────────
  INSERT INTO public.disciplinas_v2 (modulo_id, codigo, nome, area, ano_curso, carga_horaria_presencial, carga_horaria_ead, creditos, tipo)
  VALUES
    (m5,'T3MIP','Missiologia IV: Implantação de Igreja',        'T',3, 40,10, 5,'regular'),
    (m5,'P3ACO','Aconselhamento Bíblico I',                     'P',3, 30,30, 6,'regular'),
    (m5,'P3AC2','Aconselhamento Bíblico II',                    'P',3, 30,30, 6,'regular'),
    (m5,'P3HOM','Homilética I (Teoria)',                        'P',3, 30,30, 6,'regular'),
    (m5,'P3HO2','Homilética II (Oratória e Prática)',           'P',3, 30,10, 4,'regular'),
    (m5,'P3LDM','Liderança Ministerial',                        'P',3, 30,30, 6,'regular'),
    (m5,'B3EAT','Exegese do Antigo Testamento',                 'B',3, 30,10, 4,'eletiva'),
    (m5,'T3TCO','Teologia Contemporânea',                       'T',3, 30,10, 4,'eletiva')
  ON CONFLICT (codigo) DO NOTHING;

  -- ── Módulo 6 ───────────────────────────────────────────────
  INSERT INTO public.disciplinas_v2 (modulo_id, codigo, nome, area, ano_curso, carga_horaria_presencial, carga_horaria_ead, creditos, tipo)
  VALUES
    (m6,'P3LIT','Liturgia do Culto Cristão',                    'P',3, 30,10, 4,'regular'),
    (m6,'T3APO','Apologética',                                  'T',3, 30,10, 4,'regular'),
    (m6,'T3GEO','Teologia do Antigo Testamento',                'T',3, 30,30, 6,'regular'),
    (m6,'P3PRM','Prática Ministerial e Adoração',               'P',3, 30,30, 6,'regular'),
    (m6,'P3ECD','Educação Cristã e Discipulado',                'P',3, 30,30, 6,'regular'),
    (m6,'T3TNT','Teologia do Novo Testamento',                  'T',3, 30,30, 6,'regular'),
    (m6,'P3CAV','Capelania e Visitação',                        'P',3, 30,10, 4,'eletiva'),
    (m6,'T3SEI','Seitas e Heresias',                            'T',3, 30,10, 4,'eletiva')
  ON CONFLICT (codigo) DO NOTHING;
END $$;

-- ─── 4. PRÉ-REQUISITOS ───────────────────────────────────────
-- INSERT direto com subquery — sem procedure aninhada
INSERT INTO public.prerequisitos_v2 (disciplina_id, prerequisito_id, tipo)
SELECT d.id, p.id, rel.tp
FROM (VALUES
  -- NT sequência
  ('B1NTA','B1NTG','prerequisito'),
  ('B2NTP','B1NTA','prerequisito'),
  ('B2NTG','B2NTP','prerequisito'),
  -- AT sequência
  ('B1ATH','B1ATG','prerequisito'),
  ('B2ATP','B1ATH','prerequisito'),
  ('B2ATQ','B2ATP','prerequisito'),
  -- Teologia Sistemática
  ('T1CRI','T1DOG','prerequisito'),
  ('T2SOT','T1CRI','prerequisito'),
  ('T2ESC','T2SOT','prerequisito'),
  -- Grego
  ('B2GRK','B1GRG','prerequisito'),
  -- Hebraico
  ('B2HE2','B2HEB','prerequisito'),
  -- Bibliologia → Hermenêutica
  ('B2HER','B1BIB','prerequisito'),
  -- Homilética
  ('P3HO2','P3HOM','prerequisito'),
  -- Aconselhamento
  ('P3AC2','P3ACO','prerequisito'),
  -- Missiologia
  ('T2MIS','T1MIS','prerequisito'),
  ('T2MIH','T2MIS','prerequisito'),
  ('T3MIP','T2MIH','prerequisito'),
  -- História da Igreja
  ('T1HIM','T1HIG','prerequisito'),
  -- Co-requisitos
  ('B2EXT','B2GRK','corequisito'),
  ('B2EXT','B2HER','corequisito'),
  ('B3EAT','B2HE2','corequisito'),
  ('B3EAT','B2HER','corequisito')
) AS rel(cod_disc, cod_pre, tp)
JOIN public.disciplinas_v2 d ON d.codigo = rel.cod_disc
JOIN public.disciplinas_v2 p ON p.codigo = rel.cod_pre
ON CONFLICT (disciplina_id, prerequisito_id) DO NOTHING;
