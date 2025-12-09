-- Script para hacer el bucket profile-photos completamente público
-- Este script configura el bucket para acceso público sin autenticación

-- 1. Asegurar que el bucket sea público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';

-- 2. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can upload profile photos to their company folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete profile photos" ON storage.objects;

-- 3. Crear políticas simples para bucket público
-- Política para SELECT: Acceso público completo
CREATE POLICY "Public read access for profile photos" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'profile-photos');

-- Política para INSERT: Solo usuarios autenticados pueden subir
CREATE POLICY "Authenticated upload for profile photos" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Política para UPDATE: Solo usuarios autenticados pueden actualizar
CREATE POLICY "Authenticated update for profile photos" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'profile-photos')
WITH CHECK (bucket_id = 'profile-photos');

-- Política para DELETE: Solo usuarios autenticados pueden eliminar
CREATE POLICY "Authenticated delete for profile photos" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'profile-photos');

-- 4. Verificar configuración final
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'profile-photos';

-- 5. Verificar políticas
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
