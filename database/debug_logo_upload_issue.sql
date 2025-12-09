-- Script para diagnosticar el problema de subida de logo
-- Verificar políticas y configuración del bucket

-- 1. Verificar configuración del bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'profile-photos';

-- 2. Verificar políticas RLS existentes
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

-- 3. Verificar si hay archivos en la carpeta logo
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'profile-photos'
AND name LIKE 'logo/%'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar si hay archivos en la carpeta technicians
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'profile-photos'
AND name LIKE 'technicians/%'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 6. Probar la función user_company_id
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'user_company_id';
