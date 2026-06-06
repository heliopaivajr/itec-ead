-- Rollback: 20260606_032_user_roles_view_rollback.sql
-- Remove VIEW user_roles

DROP VIEW IF EXISTS public.user_roles CASCADE;
