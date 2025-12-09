-- Script para depurar el acceso a archivos de storage
-- Verificar políticas y configuración del bucket profile-photos

-- 1. Verificar que el bucket existe y su configuración
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'profile-photos';

-- 2. Verificar políticas RLS del bucket
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

-- 3. Verificar si hay archivos en el bucket
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'profile-photos'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar la función user_company_id
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'user_company_id';

-- 5. Probar la función user_company_id (solo funciona si hay un usuario autenticado)
-- SELECT user_company_id();

-- 6. Verificar si RLS está habilitado en storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';
