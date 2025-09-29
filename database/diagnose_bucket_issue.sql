-- Script para diagnosticar problemas con el bucket profile-photos existente
-- Verificar configuración del bucket y políticas

-- 1. Verificar configuración del bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'profile-photos';

-- 2. Verificar si hay archivos en el bucket
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

-- 3. Verificar políticas RLS existentes
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
AND (policyname LIKE '%profile%' OR qual LIKE '%profile-photos%' OR with_check LIKE '%profile-photos%')
ORDER BY policyname;

-- 4. Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 5. Verificar la función user_company_id
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'user_company_id';

-- 6. Probar acceso directo a un archivo específico
-- Reemplaza con la ruta real de tu archivo
SELECT 
  name,
  bucket_id,
  (storage.foldername(name))[1] as folder1,
  (storage.foldername(name))[2] as folder2,
  (storage.foldername(name))[3] as filename
FROM storage.objects 
WHERE bucket_id = 'profile-photos'
AND name LIKE '%technician-4c6a0c4a-c4c8-485b-8379-962f57c5950d-1759170537388.png%';
