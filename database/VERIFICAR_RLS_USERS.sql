-- Verificar políticas RLS de la tabla users
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todas las políticas actuales de la tabla users
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,           -- Operaciones permitidas (SELECT, INSERT, etc.)
    qual,          -- Condición para filtrar filas
    with_check     -- Condición para INSERT/UPDATE
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- 2. Verificar si RLS está activo para users
SELECT 
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_always_enforced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
AND c.relname = 'users';

-- 3. Intentar acceder a datos con RLS activo (como usuario normal)
SELECT 'Con RLS ON:' as test, 
    COUNT(*) as total_users,
    COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as with_company,
    COUNT(CASE WHEN company_id IS NULL THEN 1 END) as without_company
FROM public.users;

-- 4. Test específico - intentar ver el registro del usuario actual
SELECT 'Mi registro:' as test,
    id, email, company_id, first_name, last_name
FROM public.users 
WHERE id = auth.uid();
