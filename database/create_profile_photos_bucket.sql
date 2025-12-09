-- Script para crear el bucket profile-photos en Supabase Storage
-- Este script crea el bucket y configura las políticas básicas

-- 1. Crear el bucket profile-photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  2097152, -- 2MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- 2. Verificar que el bucket se creó correctamente
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'profile-photos';

-- 3. Crear políticas básicas para el bucket
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

-- 5. Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';
