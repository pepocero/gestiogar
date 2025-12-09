-- Script para limpiar políticas duplicadas y conflictivas
-- Elimina las políticas antiguas que solo cubren technicians y deja las nuevas

-- 1. Eliminar políticas antiguas que solo cubren technicians
DROP POLICY IF EXISTS "Users can upload profile photos to their company folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos from their company" ON storage.objects;

-- 2. Verificar que solo quedan las políticas nuevas
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%profile photos%'
ORDER BY policyname;

-- 3. Verificar que el bucket sea público
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'profile-photos';
