-- Script para corregir el acceso público a archivos de storage
-- Este script permite acceso público a archivos del bucket profile-photos

-- 1. Eliminar políticas existentes que puedan estar bloqueando el acceso
DROP POLICY IF EXISTS "Users can upload profile photos to their company folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos from their company" ON storage.objects;

-- 2. Crear políticas más simples que permitan acceso público
-- Política para INSERT: Solo usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated users can upload profile photos" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Política para SELECT: Acceso público para lectura
CREATE POLICY "Public can view profile photos" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'profile-photos');

-- Política para UPDATE: Solo usuarios autenticados pueden actualizar archivos
CREATE POLICY "Authenticated users can update profile photos" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'profile-photos')
WITH CHECK (bucket_id = 'profile-photos');

-- Política para DELETE: Solo usuarios autenticados pueden eliminar archivos
CREATE POLICY "Authenticated users can delete profile photos" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'profile-photos');

-- 3. Verificar que el bucket sea público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';

-- 4. Verificar las políticas creadas
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
