-- Migration: 20260606_034_rls_storage_avatars.sql
-- RLS para bucket storage.avatars
-- Referência: Sprint RLS Fase 1, ERR-INFRA-001
-- Aplicação: SQL Editor (service_role) manual — NUNCA via CLI

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. SELECT (download de avatares)
-- ═══════════════════════════════════════════════════════════════════════════

-- Qualquer autenticado pode ler avatares
DROP POLICY IF EXISTS "avatars_select_all" ON storage.objects;
CREATE POLICY "avatars_select_all" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

-- Público pode ler avatares (para exibir fotos de professores na área pública)
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'avatars');

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. INSERT (upload de avatares)
-- ═══════════════════════════════════════════════════════════════════════════

-- Usuário só pode fazer upload do próprio avatar
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (
      (storage.filename(name)) = auth.uid()::text || '.jpg'
      OR (storage.filename(name)) = auth.uid()::text || '.png'
      OR (storage.filename(name)) = auth.uid()::text || '.jpeg'
      OR (storage.filename(name)) = auth.uid()::text || '.webp'
    )
  );

-- Staff pode fazer upload de qualquer avatar
DROP POLICY IF EXISTS "avatars_insert_staff" ON storage.objects;
CREATE POLICY "avatars_insert_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'administracao')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. UPDATE (substituir avatares)
-- ═══════════════════════════════════════════════════════════════════════════

-- Usuário pode atualizar próprio avatar
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.filename(name)) LIKE auth.uid()::text || '.%'
  );

-- Staff pode atualizar qualquer avatar
DROP POLICY IF EXISTS "avatars_update_staff" ON storage.objects;
CREATE POLICY "avatars_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'administracao')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. DELETE (remover avatares)
-- ═══════════════════════════════════════════════════════════════════════════

-- Apenas superadmin pode deletar avatares
DROP POLICY IF EXISTS "avatars_delete_superadmin" ON storage.objects;
CREATE POLICY "avatars_delete_superadmin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'superadmin'
    )
  );
