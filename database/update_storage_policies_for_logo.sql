-- Actualizar políticas de storage para incluir la carpeta logo
-- Este script actualiza las políticas existentes para permitir acceso a la carpeta logo

-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS "Public read access for profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload for profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update for profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete for profile photos" ON storage.objects;

-- 2. Crear políticas actualizadas que incluyan la carpeta logo
-- Política para SELECT: Acceso público para lectura (técnicos y logos)
CREATE POLICY "Public read access for profile photos and logos" 
ON storage.objects
FOR SELECT 
TO public
USING (
  bucket_id = 'profile-photos' 
  AND (
    (storage.foldername(name))[1] = 'technicians' 
    OR (storage.foldername(name))[1] = 'logo'
  )
);

-- Política para INSERT: Solo usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated upload for profile photos and logos" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (
    (storage.foldername(name))[1] = 'technicians' 
    OR (storage.foldername(name))[1] = 'logo'
  )
);

-- Política para UPDATE: Solo usuarios autenticados pueden actualizar archivos
CREATE POLICY "Authenticated update for profile photos and logos" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (
    (storage.foldername(name))[1] = 'technicians' 
    OR (storage.foldername(name))[1] = 'logo'
  )
)
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (
    (storage.foldername(name))[1] = 'technicians' 
    OR (storage.foldername(name))[1] = 'logo'
  )
);

-- Política para DELETE: Solo usuarios autenticados pueden eliminar archivos
CREATE POLICY "Authenticated delete for profile photos and logos" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (
    (storage.foldername(name))[1] = 'technicians' 
    OR (storage.foldername(name))[1] = 'logo'
  )
);

-- 3. Verificar las políticas creadas
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
