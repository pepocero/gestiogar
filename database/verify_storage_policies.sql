-- Script de verificación para las políticas del bucket profile-photos
-- Este script verifica que las políticas multitenant estén configuradas correctamente

-- 1. Verificar que el bucket existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'profile-photos';

-- 2. Verificar las políticas creadas
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

-- 3. Verificar la función user_company_id
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'user_company_id';

-- 4. Probar la función user_company_id (solo funciona si hay un usuario autenticado)
-- SELECT user_company_id();

-- 5. Verificar estructura de carpetas esperada
-- La estructura debe ser: technicians/{company_id}/{filename}
-- Ejemplo: technicians/123e4567-e89b-12d3-a456-426614174000/technician-456-1234567890.jpg

-- 6. Verificar que RLS está habilitado en storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';
