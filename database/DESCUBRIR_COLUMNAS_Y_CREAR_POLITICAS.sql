-- Descubrir estructura real de tablas y crear políticas RLS
-- Ejecutar en Supabase SQL Editor

-- ==========================================
-- PASO 1: VER ESTRUCTURA REAL DE LAS TABLAS
-- ==========================================

-- Ver estructura de modules
SELECT 'Módulos:' as info,
    column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'modules'
ORDER BY ordinal_position;

-- Ver estructura de module_data
SELECT 'Module_data:' as info,
    column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'module_data'
ORDER BY ordinal_position;

-- ==========================================
-- PASO 2: CREAR FUNCIÓN user_company_id()
-- ==========================================

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
-- PASO 3: PROBAR LA FUNCIÓN
-- ==========================================

-- Test básico
SELECT 'Función creada:' as info, user_company_id() as company_id;

-- ==========================================
-- PASO 4: CREAR POLÍTICAS PARA MODULES
-- ==========================================

-- Limpiar políticas existentes de modules
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'modules') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.modules';
    END LOOP;
END $$;

-- Crear políticas nuevas para modules
CREATE POLICY "modules_select" ON public.modules
FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "modules_insert" ON public.modules  
FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "modules_update" ON public.modules
FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "modules_delete" ON public.modules
FOR DELETE USING (company_id = user_company_id());

-- ==========================================
-- PASO 5: CREAR POLÍTICAS PARA MODULE_DATA
-- ==========================================

-- Limpiar políticas existentes de module_data
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'module_data') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.module_data';
    END LOOP;
END $$;

-- Crear políticas nuevas para module_data
CREATE POLICY "module_data_select" ON public.module_data
FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "module_data_insert" ON public.module_data
FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "module_data_update" ON public.module_data
FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "module_data_delete" ON public.module_data
FOR DELETE USING (company_id = user_company_id());

-- ==========================================
-- PASO 6: INSERTAR MÓDULO DE PRUEBA SIN COLUMNAS INEXISTENTES
-- ==========================================

-- Limpiar módulos de prueba anteriores
DELETE FROM public.module_data WHERE module_id IN (
  SELECT id FROM public.modules WHERE slug LIKE '%test%'
);
DELETE FROM public.modules WHERE slug LIKE '%test%' OR slug LIKE '%prueba%';

-- Insertar módulo de prueba SOLO con columnas básicas conocidas
INSERT INTO public.modules (
  company_id, 
  name, 
  slug, 
  version, 
  description, 
  icon,
  is_active
) VALUES (
  user_company_id(),
  'Módulo Test Simple',
  'modulo-test-simple',
  '1.0.0',
  'Módulo de prueba básico',
  'Package',
  true
);

-- ==========================================
-- PASO 7: VERIFICAR INSERCIÓN EXITOSA
-- ==========================================

-- Ver módulo insertado
SELECT 'Módulo creado:' as resultado,
    id, name, slug, version, description, company_id, is_active
FROM public.modules 
WHERE slug = 'modulo-test-simple';

-- Ver todas las columnas que tiene el módulo insertado
SELECT 'Todas las columnas del módulo:' as info, *
FROM public.modules 
WHERE slug = 'modulo-test-simple';

-- ==========================================
-- PASO 8: VERIFICAR POLÍTICAS CREADAS
-- ==========================================

SELECT 'Políticas modules:' as info,
    policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'modules'
ORDER BY policyname;

SELECT 'Políticas module_data:' as info,
    policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'module_data'
ORDER BY policyname;

-- ==========================================
-- RESULTADO FINAL
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ FUNCIÓN user_company_id() creada o actualizada';
    RAISE NOTICE '✅ POLÍTICAS RLS creadas para modules y module_data';
    RAISE NOTICE '✅ Módulo básico insertado correctamente';
    RAISE NOTICE '🎯 Solo se insertaron columnas que existen';
    RAISE NOTICE '🚀 Sistema listo para probar en la página web';
    RAISE NOTICE '';
END $$;
