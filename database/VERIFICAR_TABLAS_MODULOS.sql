-- Script para verificar que las tablas de módulos existen y son accesibles
-- Ejecuta este SQL para probar

-- Verificar si las tablas existen
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('modules', 'module_data');

-- Verificar RLS está activo
SELECT 
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_always_enforced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
AND c.relname IN ('modules', 'module_data');

-- Verificar policies
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
WHERE schemaname = 'public' 
AND tablename IN ('modules', 'module_data')
ORDER BY tablename, policyname;

-- Intentar hacer una consulta simple para probar acceso
SELECT COUNT(*) as total_modules FROM public.modules;
SELECT COUNT(*) as total_module_data FROM public.module_data;

-- Probar función user_company_id
SELECT user_company_id() as current_company_id;
