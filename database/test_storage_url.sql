-- Script para probar el acceso a URLs de storage
-- Reemplaza la URL con la que tienes en tu base de datos

-- Ejemplo de URL que mencionaste:
-- https://pbdsuhmwxqiwbpgyrhqt.supabase.co/storage/v1/object/public/profile-photos/technicians/67506f88-d46c-41c2-bb5f-41dd851a17b1/technician-4c6a0c4a-c4c8-485b-8379-962f57c5950d-1759170537388.png

-- 1. Verificar si el archivo existe en storage.objects
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'profile-photos'
AND name LIKE '%technician-4c6a0c4a-c4c8-485b-8379-962f57c5950d-1759170537388.png%';

-- 2. Verificar la estructura de carpetas
SELECT 
  name,
  bucket_id,
  (storage.foldername(name))[1] as folder1,
  (storage.foldername(name))[2] as folder2,
  (storage.foldername(name))[3] as filename
FROM storage.objects 
WHERE bucket_id = 'profile-photos'
AND name LIKE '%technician-4c6a0c4a-c4c8-485b-8379-962f57c5950d-1759170537388.png%';

-- 3. Verificar si hay políticas que bloqueen el acceso
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (qual LIKE '%profile-photos%' OR with_check LIKE '%profile-photos%');
