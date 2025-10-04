-- Diagnóstico específico de user_company_id
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar usuario actual
SELECT 'Usuario actual:' as info, auth.uid() as user_id;

-- 2. Verificar función user_company_id directamente
SELECT 'Resultado user_company_id()' as info, user_company_id() as company_id;

-- 3. Verificar si el usuario existe en la tabla users
SELECT 'Usuario en tabla users:' as info, 
    id, email, company_id, first_name, last_name
FROM public.users 
WHERE id = auth.uid();

-- 4. Buscar en auth.users si no está en public.users
SELECT 'Sistema de auth:' as info,
    id, email, raw_user_meta_data
FROM auth.users 
WHERE id = auth.uid();

-- 5. Intentar obtener company_id directamente de auth.users
SELECT 'Company desde metadata:' as info,
    (raw_user_meta_data->>'company_id')::uuid as company_id_from_meta
FROM auth.users 
WHERE id = auth.uid();

-- 6. Ver código fuente de la función user_company_id
SELECT 'Código de la función:' as info, 
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'user_company_id';

-- 7. Verificar si hay algún problema de permisos
SET row_security = off;
SELECT 'Con RLS OFF:' as info, 
    COUNT(*) as total_companies,
    COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as with_company,
    COUNT(CASE WHEN company_id IS NULL THEN 1 END) as without_company
FROM public.users;
SET row_security = on;
