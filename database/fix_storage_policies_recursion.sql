-- Solución para recursión infinita en políticas de Storage
-- Eliminar TODAS las políticas existentes y crear unas nuevas sin recursión

-- 1. Eliminar TODAS las políticas del bucket profile-photos
DROP POLICY IF EXISTS "Authenticated delete for profile photos and logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update for profile photos and logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload for profile photos and logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for profile photos and logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile photos to their company folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos from their company" ON storage.objects;

-- 2. Crear políticas SIMPLES sin usar user_company_id() para evitar recursión

-- SELECT: Permitir a usuarios autenticados ver archivos del bucket
CREATE POLICY "Authenticated users can view profile photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos');

-- INSERT: Permitir a usuarios autenticados subir archivos
CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid() IS NOT NULL
);

-- UPDATE: Permitir a usuarios autenticados actualizar archivos
CREATE POLICY "Authenticated users can update profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid() IS NOT NULL
);

-- DELETE: Permitir a usuarios autenticados eliminar archivos
CREATE POLICY "Authenticated users can delete profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  auth.uid() IS NOT NULL
);

-- 3. Verificar las políticas creadas
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%profile photos%'
ORDER BY policyname;
