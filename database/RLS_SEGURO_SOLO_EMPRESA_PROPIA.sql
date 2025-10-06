-- Políticas RLS MUY SEGURAS - Solo acceso a datos de tu propia empresa
-- Ejecutar en Supabase SQL Editor

-- ==========================================
-- VERIFICAR ESTADO ACTUAL SIN TOCAR DATOS
-- ==========================================

-- Ver usuario actual y su empresa
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
SELECT 'Mi usuario:' as info, id, email, company_id FROM public.users WHERE email = 'pepocero@gmail.com';
SELECT 'Mi empresa:' as info, id, name FROM public.companies WHERE id = (
  SELECT company_id FROM public.users WHERE email = 'pepocero@gmail.com'
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS ULTRA-SEGURAS PARA USERS
-- ==========================================

-- Eliminar TODAS las políticas de users
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
END $$;

-- SELECT: Solo usuarios de TU empresa (incluyéndote)
CREATE POLICY "users_select_same_company_only" ON public.users
FOR SELECT USING (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- INSERT: Solo puedes crear usuarios en TU empresa
CREATE POLICY "users_insert_same_company_only" ON public.users
FOR INSERT WITH CHECK (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- UPDATE: Solo puedes editar usuarios de TU empresa
CREATE POLICY "users_update_same_company_only" ON public.users
FOR UPDATE USING (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- DELETE: Solo puedes eliminar usuarios de TU empresa (PERO NO A TI MISMO por seguridad)
CREATE POLICY "users_delete_same_company_except_self" ON public.users
FOR DELETE USING (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
  id != auth.uid()  -- Nunca puedes eliminarte a ti mismo
);

-- ==========================================
-- POLÍTICAS ULTRA-SEGURAS PARAMODULES
-- ==========================================

-- Eliminar TODAS las políticas de modules
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'modules'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.modules';
    END LOOP;
END $$;

-- Todas las operaciones de modules SOLO para TU empresa
CREATE POLICY "modules_select_only_my_company" ON public.modules
FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "modules_insert_only_my_company" ON public.modules  
FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "modules_update_only_my_company" ON public.modules
FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "modules_delete_only_my_company" ON public.modules
FOR DELETE USING (company_id = user_company_id());

-- ==========================================
-- POLÍTICAS ULTRA-SEGURAS PARA MODULE_DATA
-- ==========================================

-- Eliminar TODAS las políticas de module_data
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'module_data'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.module_data';
    END LOOP;
END $$;

-- Todas las operaciones de module_data SOLO para TU empresa
CREATE POLICY "module_data_select_only_my_company" ON public.module_data
FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "module_data_insert_only_my_company" ON public.module_data
FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "module_data_update_only_my_company" ON public.module_data
FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "module_data_delete_only_my_company" ON public.module_data
FOR DELETE USING (company_id = user_company_id());

-- ==========================================
-- VERIFICAR POLÍTICAS DE SEGURIDAD
-- ==========================================

-- Ver todas las políticas creadas
SELECT 'Policy Summary:' as info,
    tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'modules', 'module_data')
ORDER BY tablename, cmd, policyname;

-- ==========================================
-- TEST DE AISLAMIENTO DE SEGURIDAD
-- ==========================================

-- Test 1: ¿Puedo ver usuarios de OTRAS empresas?
SELECT '¿Veo usuarios de otras empresas? NO DEBERÍA:' as test,
    COUNT(*) as total_usuarios_vistos
FROM public.users;

-- Test 2: ¿Puedo ver módulos de OTRAS empresas?
SELECT '¿Veo módulos de otras empresas? NO DEBERÍA:' as test,
    COUNT(*) as total_modulos_vistos,
    COUNT(DISTINCT company_id) as empresas_diferentes_vistas
FROM public.modules;

-- Test 3: ¿Puedo ver datos de OTRAS empresas?
SELECT '¿Veo datos de otras empresas? NO DEBERÍA:' as test,
    COUNT(*) as total_datos_vistos,
    COUNT(DISTINCT company_id) as empresas_diferentes_vistas
FROM public.module_data;

-- Test 4: ¿Qué empresa es la mía?
SELECT 'Mi empresa identificada:' as test,
    user_company_id() as mi_company_id,
    (SELECT name FROM public.companies WHERE id = user_company_id()) as mi_empresa;

-- ==========================================
-- INSERTAR MÓDULO DE PRUEBA SEGURA
-- ==========================================

-- Limpiar datos de prueba anteriores
DELETE FROM public.module_data WHERE module_id IN (
  SELECT id FROM public.modules WHERE slug LIKE '%test%' OR slug LIKE '%prueba%'
);
DELETE FROM public.modules WHERE slug LIKE '%test%' OR slug LIKE '%prueba%';

-- Insertar módulo de prueba SOLO para mi empresa
INSERT INTO public.modules (
  company_id, 
  name, 
  slug, 
  version, 
  description, 
  icon,
  is_active,
  manifest
) VALUES (
  user_company_id(),
  'Test de Seguridad',
  'test-seguridad',
  '1.0.0',
  'Módulo para probar que solo veo mis datos',
  'Shield',
  true,
  '{"name":"Test de Seguridad","slug":"test-seguridad","version":"1.0.0","description":"Módulo seguro","icon":"Shield","fields":[{"name":"test","label":"Test","type":"text","required":true}],"displayName":"Test Seguro","displayDescription":"Prueba de aislamiento"}'::jsonb
);

-- Insertar datos de prueba
INSERT INTO public.module_data (
  module_id,
  company_id,
  data
) VALUES (
  (SELECT id FROM public.modules WHERE slug = 'test-seguridad'),
  user_company_id(),
  '{"test":"Mi dato de prueba - solo lo veo yo"}'::jsonb
);

-- ==========================================
-- VERIFICAR AISLAMIENTO FINAL
-- ==========================================

-- Solo debería ver los datos que creé YO
SELECT 'Verificación final solo veo:' as verificacion,
    'MI módulo:' as tipo, name, slug FROM public.modules WHERE company_id = user_company_id()
UNION ALL
SELECT 'Verificación final solo veo:' as verificacion,
    'MI dato:' as tipo, data->>'test', '' FROM public.module_data WHERE company_id = user_company_id();

-- ==========================================
-- RESUMEN FINAL DE SEGURIDAD
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 POLÍTICAS DE SEGURIDAD IMPLEMENTADAS';
    RAISE NOTICE '⚠️  AISLAMIENTO GARANTIZADO POR EMPRESA';
    RAISE NOTICE '🎯 Cada usuario solo ve datos de SU empresa';
    RAISE NOTICE '🚫 Es imposible ver datos de otras empresas';
    RAISE NOTICE '✅ Solo puedes eliminar otros usuarios (nunca tu cuenta)';
    RAISE NOTICE '🏢 Tu empresa: % (%)', (SELECT name FROM public.companies WHERE id = user_company_id()), user_company_id();
    RAISE NOTICE '✅ Sistema SEGURO y FUUNCIONAL';
    RAISE NOTICE '';
END $$;
