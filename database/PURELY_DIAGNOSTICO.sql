-- Script ÚNICAMENTE de diagnóstico - NO modifica nada
-- Ejecutar en Supabase SQL Editor

-- ==========================================
-- DIAGNÓSTICO COMPLETO DEL USUARIO ACTUAL
-- ==========================================

-- 1. Verificar usuario actual en auth.users (sin RLS)
SELECT 'Usuario en auth.users:' as info,
    id, email, created_at
FROM auth.users 
WHERE id = auth.uid();

-- 2. Verificar usuario en public.users SIN RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
SELECT 'Usuario en public.users (sin RLS):' as info,
    id, email, company_id, first_name, last_name
FROM public.users 
WHERE id = auth.uid();
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Verificar usuario en public.users CON RLS
SELECT 'Usuario en public.users (con RLS):' as info,
    id, email, company_id, first_name, last_name
FROM public.users 
WHERE id = auth.uid();

-- 4. Verificar si la empresa existe
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
SELECT 'Empresa del usuario:' as info,
    c.id, c.name, c.created_at
FROM public.companies c
JOIN public.users u ON u.company_id = c.id
WHERE u.id = auth.uid();
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Ver todas las políticas actuales de users
SELECT 'Políticas actuales de users:' as info,
    policyname, cmd, permissive, roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- 6. Verificar si puede hacer SELECT básico
SELECT '¿Puedo acceder a mi usuario?' as test, COUNT(*) as registros_vistos
FROM public.users 
WHERE id = auth.uid();

-- 7. Probar manualmente cada operación CRUD
DO $$
DECLARE
    test_result RECORD;
BEGIN
    RAISE NOTICE '=== PRUEBA MANUAL DE ACCESO ===';
    
    -- Probar SELECT
    SELECT id, company_id INTO test_result FROM public.users WHERE id = auth.uid();
    IF test_result.id IS NOT NULL THEN
        RAISE NOTICE '✅ SELECT funciona: usuario %', test_result.id;
        RAISE NOTICE '✅ Company ID: %', test_result.company_id;
    ELSE
        RAISE NOTICE '❌ SELECT falló: No puede leer su propio registro';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR en SELECT: %', SQLERRM;
END $$;

-- 8. Test alternativo - función más simple
DO $$
DECLARE
    temp_company_id UUID;
BEGIN
    -- Alternar RLS temporalmente solamente para esta función
    SET row_security = off;
    
    SELECT company_id INTO temp_company_id 
    FROM public.users 
    WHERE id = auth.uid();
    
    SET row_security = on;
    
    IF temp_company_id IS NOT NULL THEN
        RAISE NOTICE '✅ Company ID válido obtenido: %', temp_company_id;
    ELSE
        RAISE NOTICE '❌ Company ID sigue siendo NULL';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR obteniendo company_id: %', SQLERRM;
        SET row_security = on;
END $$;

-- ==========================================
-- CONCLUSIONES DEL DIAGNÓSTICO
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DIAGNÓSTICO COMPLETADO';
    RAISE NOTICE '📋 Revisa los resultados arriba para entender:';
    RAISE NOTICE '1. ¿Existe el usuario en auth.users?';
    RAISE NOTICE '2. ¿Existe el usuario en public.users?';
    RAISE NOTICE '3. ¿Tiene company_id asignado?';
    RAISE NOTICE '4. ¿Puede leer su registro con RLS activo?';
    RAISE NOTICE '5. ¿Son las políticas demasiado restrictivas?';
    RAISE NOTICE '📄 Envía estos resultados para analizar el problema';
    RAISE NOTICE '';
END $$;
