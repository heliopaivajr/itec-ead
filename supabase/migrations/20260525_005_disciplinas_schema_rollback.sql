-- Rollback: 20260525_005_disciplinas_schema.sql
-- ATENÇÃO: apaga todas as disciplinas e pré-requisitos do banco.
-- Execute apenas para desfazer a migration 005.

DROP TABLE IF EXISTS public.prerequisitos_disciplinas CASCADE;
DROP TABLE IF EXISTS public.disciplinas CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
