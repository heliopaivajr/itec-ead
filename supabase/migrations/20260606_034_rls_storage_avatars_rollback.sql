-- Rollback: 20260606_034_rls_storage_avatars_rollback.sql
-- Remove policies de storage.avatars

DROP POLICY IF EXISTS "avatars_select_all"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_public"     ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_staff"      ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_staff"      ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_superadmin" ON storage.objects;
