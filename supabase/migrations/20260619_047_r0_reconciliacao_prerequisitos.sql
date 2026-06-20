BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'disciplinas_v2_codigo_key') THEN
    ALTER TABLE disciplinas_v2 ADD CONSTRAINT disciplinas_v2_codigo_key UNIQUE (codigo);
  END IF;
END $$;

ALTER TABLE prerequisitos_disciplinas DROP CONSTRAINT IF EXISTS prerequisitos_disciplinas_disciplina_codigo_fkey;
ALTER TABLE prerequisitos_disciplinas DROP CONSTRAINT IF EXISTS prerequisitos_disciplinas_prerequisito_codigo_fkey;

WITH depara(manual,v2) AS (VALUES
 ('B1-ANT01','B1ATG'),('P1-ESPCR','P1ESC'),('B1-BIBLI','B1BIB'),('B1-NOVO1','B1NTG'),('T1-TEOS1','T1DOG'),('P1-MISS1','T1MIS'),
 ('B1-ANT02','B1ATH'),('T1-INTER-E','B1PIE'),('T1-HIST1','T1HIG'),('T1-TEOS2','T1CRI'),('B1-GREK1','B1GRG'),('T1-FILOS-E','T1FIE'),('B1-NOVO2','B1NTA'),('T1-HIST2','T1HIM'),
 ('B2-GREK2','B2GRK'),('T2-HBRAS-E','T2HIB'),('B2-ANT03','B2ATP'),('T2-TEOS3','T2SOT'),('B2-NOVO3','B2NTP'),('T2-ARQCB-E','T2ARQ'),('T2-ETICA','T2ETC'),('T2-MISS2','T2MIS'),
 ('T2-HERMB','B2HER'),('B2-HEBR1-E','B2HEB'),('B2-ANT04','B2ATQ'),('T2-MISS3','T2MIH'),('B2-EXENT','B2EXT'),('B2-HEBR2-E','B2HE2'),('T2-ESCTO','T2ESC'),('B2-NOVO4','B2NTG'),
 ('T3-MISS4','T3MIP'),('B3-EXEAT-E','B3EAT'),('P3-ACOS1','P3ACO'),('P3-ACOS2','P3AC2'),('P3-HOMIT','P3HOM'),('T3-TEOCO','T3TCO'),('P3-HOMIP','P3HO2'),('P3-LIDMI','P3LDM'),
 ('P3-LITCU','P3LIT'),('P3-CAPEL-E','P3CAV'),('T3-APOLO','T3APO'),('B3-TEAT','T3GEO'),('P3-PRATM','P3PRM'),('T3-SEITA-E','T3SEI'),('B3-TENT','T3TNT'),('P3-EDUCA','P3ECD'))
UPDATE prerequisitos_disciplinas p SET disciplina_codigo = d.v2 FROM depara d WHERE p.disciplina_codigo = d.manual;

WITH depara(manual,v2) AS (VALUES
 ('B1-ANT01','B1ATG'),('P1-ESPCR','P1ESC'),('B1-BIBLI','B1BIB'),('B1-NOVO1','B1NTG'),('T1-TEOS1','T1DOG'),('P1-MISS1','T1MIS'),
 ('B1-ANT02','B1ATH'),('T1-INTER-E','B1PIE'),('T1-HIST1','T1HIG'),('T1-TEOS2','T1CRI'),('B1-GREK1','B1GRG'),('T1-FILOS-E','T1FIE'),('B1-NOVO2','B1NTA'),('T1-HIST2','T1HIM'),
 ('B2-GREK2','B2GRK'),('T2-HBRAS-E','T2HIB'),('B2-ANT03','B2ATP'),('T2-TEOS3','T2SOT'),('B2-NOVO3','B2NTP'),('T2-ARQCB-E','T2ARQ'),('T2-ETICA','T2ETC'),('T2-MISS2','T2MIS'),
 ('T2-HERMB','B2HER'),('B2-HEBR1-E','B2HEB'),('B2-ANT04','B2ATQ'),('T2-MISS3','T2MIH'),('B2-EXENT','B2EXT'),('B2-HEBR2-E','B2HE2'),('T2-ESCTO','T2ESC'),('B2-NOVO4','B2NTG'),
 ('T3-MISS4','T3MIP'),('B3-EXEAT-E','B3EAT'),('P3-ACOS1','P3ACO'),('P3-ACOS2','P3AC2'),('P3-HOMIT','P3HOM'),('T3-TEOCO','T3TCO'),('P3-HOMIP','P3HO2'),('P3-LIDMI','P3LDM'),
 ('P3-LITCU','P3LIT'),('P3-CAPEL-E','P3CAV'),('T3-APOLO','T3APO'),('B3-TEAT','T3GEO'),('P3-PRATM','P3PRM'),('T3-SEITA-E','T3SEI'),('B3-TENT','T3TNT'),('P3-EDUCA','P3ECD'))
UPDATE prerequisitos_disciplinas p SET prerequisito_codigo = d.v2 FROM depara d WHERE p.prerequisito_codigo = d.manual;

ALTER TABLE prerequisitos_disciplinas ADD CONSTRAINT prerequisitos_disciplinas_disciplina_codigo_fkey
  FOREIGN KEY (disciplina_codigo) REFERENCES disciplinas_v2(codigo);
ALTER TABLE prerequisitos_disciplinas ADD CONSTRAINT prerequisitos_disciplinas_prerequisito_codigo_fkey
  FOREIGN KEY (prerequisito_codigo) REFERENCES disciplinas_v2(codigo);

COMMIT;
NOTIFY pgrst, 'reload schema';
