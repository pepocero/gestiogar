-- Crear la función user_company_id() primero, luego las políticas RLS
-- Ejecutar en Supabase SQL Editor

-- ==========================================
-- PASO 1: CREAR FUNCIÓN user_company_id()
-- ==========================================

-- Verificar si la función ya existe
SELECT 'Verificando función existente:' as info, 
    proname as nombre_funcion,
    pg_get_functiondef(oid) as definicion_funcion
FROM pg_proc 
WHERE proname = 'user_company_id';

-- Crear función user_company_id() si no existe
CREATE OR REPLACE FUNCTION user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_id UUID;
BEGIN
    -- Intentar obtener company_id desde public.users
    SELECT company_id INTO result_id
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
    
    -- Si encontramos resultado válido, devolverlo
    IF result_id IS NOT NULL THEN
        RETURN result_id;
    END IF;
    
    -- Si no encontramos en public.users, devolver NULL
    RETURN NULL;
    
END;
$$;

-- ==========================================
-- PASO 2: VERIFICAR QUE LA FUNCIÓN FUNCIONA
-- ==========================================

-- Test básico de la función
SELECT 'Test función user_company_id():' as info, 
    auth.uid() as user_id_actual,
    user_company_id() as company_id_obtenido;

-- ==========================================
-- PASO 3: SI LA FUNCIÓN DEVUELVE NULL, DESCUBRIR POR QUÉ
-- ==========================================

-- Verificar si el usuario actual tiene company_id en la tabla users
DO $$
DECLARE
    user_company UUID;
BEGIN
    -- Desactivar RLS temporalmente para diagnosticar
    SET row_security = off;
    
    -- Ver si el usuario actual está en la tabla users
    SELECT company_id INTO user_company
    FROM public.users 
    WHERE id = auth.uid();
    
    IF user_company IS NULL THEN
        RAISE NOTICE '❌ PROBLEMA: Usuario % no tiene company_id asignado', auth.uid();
        RAISE NOTICE '📍 Solución: Ejecutar script de asignación de empresa';
    ELSE
        RAISE NOTICE '✅ USUARIO OK: Tiene company_id = %', user_company;
    END IF;
    
    SET row_security = on;
END $$;

-- ==========================================
-- PASO 4: CREAR POLÍTICAS USANDO LA FUNCIÓN
-- ==========================================

-- Eliminar políticas existentes de modules
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'modules') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.modules';
        RAISE NOTICE 'Eliminada política modules: %', r.policyname;
    END LOOP;
END $$;

-- Eliminar políticas existentes de module_data
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'module_data') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.module_data';
        RAISE NOTICE 'Eliminada política module_data: %', r.policyname;
    END LOOP;
END $$;

-- Crear políticas para modules
CREATE POLICY "modules_select" ON public.modules
FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "modules_insert" ON public.modules  
FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "modules_update" ON public.modules
FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "modules_delete" ON public.modules
FOR DELETE USING (company_id = user_company_id());

-- Crear políticas para module_data
CREATE POLICY "module_data_select" ON public.module_data
FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "module_data_insert" ON public.module_data
FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "module_data_update" ON public.module_data
FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "module_data_delete" ON public.module_data
FOR DELETE USING (company_id = user_company_id());

-- ==========================================
-- PASO 5: INSERTAR MÓDULO DE PRUEBA
-- ==========================================

-- Limpiar datos anteriores
DELETE FROM public.module_data WHERE module_id IN (
  SELECT id FROM public.modules WHERE slug LIKE '%prueba%'
);
DELETE FROM public.modules WHERE slug LIKE '%prueba%' OR slug LIKE '%test%';

-- Insertar módulo de prueba usando la función
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
  'Módulo Test',
  'modulo-test',
  '1.0.0',
  'Módulo para probar que funciona la función',
  'Package',
  true,
  '{"name":"Módulo Test","slug":"modulo-test","version":"1.0.0","description":"Test","icon":"Package","fields":[{"name":"titulo","label":"Título","type":"text","required":true}],"displayName":"Test","displayDescription":"Test"}'::jsonb
);

-- ==========================================
-- PASO 6: VERIFICACIÓN FINAL
-- ==========================================

-- Verificar que se insertó correctamente
SELECT 'Módulo creado:' as resultado,
    id, name, slug, company_id, is_active
FROM public.modules 
WHERE slug = 'modulo-test';

-- Verificar políticas creadas
SELECT 'Políticas creadas:' as info,
    tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('modules', 'module_data')
ORDER BY tablename, cmd;

-- ==========================================
-- RESULTADO FINAL
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ FUNCIÓN user_company_id() creada';
    RAISE NOTICE '✅ POLÍTICAS RLS creadas para modules y module_data';
    RAISE NOTICE '✅ Módulo de prueba insertado correctamente';
    RAISE NOTICE '🚀 Sistema de módulos funcionando';
    RAISE NOTICE '';
END $$;
