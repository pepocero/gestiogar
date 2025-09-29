-- Script para refrescar el esquema de PostgREST en Supabase
-- Ejecutar este script cuando las tablas existen pero no se pueden acceder

-- 1. Forzar recarga del esquema de PostgREST
NOTIFY pgrst, 'reload schema';

-- 2. Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Verificar permisos en la tabla companies
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name = 'companies' 
AND table_schema = 'public';

-- 4. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'companies';

-- 5. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'companies' 
AND schemaname = 'public';
