-- Configuración de políticas RLS para el bucket profile-photos
-- Este script configura políticas multitenant para que cada empresa solo acceda a sus propios archivos

-- Crear el bucket profile-photos si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  2097152, -- 2MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Función helper para obtener el company_id del usuario actual
-- (Esta función ya debería existir, pero la incluimos por si acaso)
CREATE OR REPLACE FUNCTION user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$;

-- Política para INSERT: Solo usuarios autenticados pueden subir archivos a su carpeta de empresa
CREATE POLICY "Users can upload profile photos to their company folder" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'technicians'
  AND (storage.foldername(name))[2] = (SELECT company_id::text FROM users WHERE id = auth.uid())
);

-- Política para SELECT: Solo usuarios autenticados pueden ver archivos de su empresa
CREATE POLICY "Users can view profile photos from their company" 
ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'technicians'
  AND (storage.foldername(name))[2] = (SELECT company_id::text FROM users WHERE id = auth.uid())
);

-- Política para UPDATE: Solo usuarios autenticados pueden actualizar archivos de su empresa
CREATE POLICY "Users can update profile photos from their company" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'technicians'
  AND (storage.foldername(name))[2] = (SELECT company_id::text FROM users WHERE id = auth.uid())
)
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'technicians'
  AND (storage.foldername(name))[2] = (SELECT company_id::text FROM users WHERE id = auth.uid())
);

-- Política para DELETE: Solo usuarios autenticados pueden eliminar archivos de su empresa
CREATE POLICY "Users can delete profile photos from their company" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'technicians'
  AND (storage.foldername(name))[2] = (SELECT company_id::text FROM users WHERE id = auth.uid())
);

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
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
