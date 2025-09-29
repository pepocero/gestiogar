-- Script para limpiar políticas existentes del bucket profile-photos
-- Ejecutar este script antes de setup_profile_photos_storage_policies.sql si hay conflictos

-- Eliminar políticas existentes del bucket profile-photos
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile photos to their company folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos from their company" ON storage.objects;

-- Verificar que no quedan políticas del bucket profile-photos
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%profile%'
ORDER BY policyname;
