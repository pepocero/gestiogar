-- Script para corregir políticas del bucket profile-photos existente
-- Este script elimina políticas problemáticas y crea políticas simples

-- 1. Eliminar todas las políticas existentes del bucket profile-photos
DROP POLICY IF EXISTS "Users can upload profile photos to their company folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete profile photos" ON storage.objects;

-- 2. Asegurar que el bucket sea público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';

-- 3. Crear políticas simples y funcionales
-- Política para INSERT: Solo usuarios autenticados pueden subir archivos
CREATE POLICY "Allow authenticated users to upload profile photos" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Política para SELECT: Acceso público para lectura
CREATE POLICY "Allow public access to profile photos" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'profile-photos');

-- Política para UPDATE: Solo usuarios autenticados pueden actualizar archivos
CREATE POLICY "Allow authenticated users to update profile photos" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'profile-photos')
WITH CHECK (bucket_id = 'profile-photos');

-- Política para DELETE: Solo usuarios autenticados pueden eliminar archivos
CREATE POLICY "Allow authenticated users to delete profile photos" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'profile-photos');

-- 4. Verificar la configuración final
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'profile-photos';

-- 5. Verificar las políticas creadas
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
