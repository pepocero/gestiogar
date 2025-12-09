-- Políticas RLS simples y seguras - Solo lo esencial
-- Ejecutar en Supabase SQL Editor

-- ==========================================
-- LIMPIAR Y CREAR POLÍTICAS PARA USERS
-- ==========================================

-- Eliminar políticas existentes de users
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
END $$;

-- Crear políticas simples para users
CREATE POLICY "users_select" ON public.users
FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "users_insert" ON public.users  
FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "users_update" ON public.users
FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "users_delete" ON public.users
FOR DELETE USING (company_id = user_company_id());

-- ==========================================
-- LIMPIAR Y CREAR POLÍTICAS PARA MODULES
-- ==========================================

-- Eliminar políticas existentes de modules
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'modules') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.modules';
    END LOOP;
END $$;

-- Crear políticas simples para modules
CREATE POLICY "modules_select" ON public.modules
FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "modules_insert" ON public.modules  
FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "modules_update" ON public.modules
FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "modules_delete" ON public.modules
FOR DELETE USING (company_id = user_company_id());

-- ==========================================
-- LIMPIAR Y CREAR POLÍTICAS PARA MODULE_DATA
-- ==========================================

-- Eliminar políticas existentes de module_data
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'module_data') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.module_data';
    END LOOP;
END $$;

-- Crear políticas simples para module_data
CREATE POLICY "module_data_select" ON public.module_data
FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "module_data_insert" ON public.module_data
FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "module_data_update" ON public.module_data
FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "module_data_delete" ON public.module_data
FOR DELETE USING (company_id = user_company_id());

-- ==========================================
-- CREAR MÓDULO DE PRUEBA
-- ==========================================

-- Eliminar módulos de prueba anteriores
DELETE FROM public.module_data WHERE slug LIKE '%prueba%';
DELETE FROM public.modules WHERE slug LIKE '%prueba%';

-- Insertar módulo de prueba
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
  'Módulo de Prueba',
  'modulo-prueba',
  '1.0.0',
  'Módulo de prueba simple',
  'Package',
  true,
  '{"name":"Módulo de Prueba","slug":"modulo-prueba","version":"1.0.0","description":"Test","icon":"Package","fields":[{"name":"nombre","label":"Nombre","type":"text","required":true}],"displayName":"Módulo de Prueba","displayDescription":"Test simple"}'::jsonb
);

-- ==========================================
-- CONFIRMAR FUNCIONAMIENTO
-- ==========================================

-- Verificar que la función user_company_id() funciona
SELECT 'Función user_company_id():' as test, user_company_id() as company_id;

-- Verificar módulo insertado
SELECT 'Módulo creado:' as test, id, name, slug, company_id FROM public.modules WHERE slug = 'modulo-prueba';

-- Resumen final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ POLÍTICAS RLS IMPLEMENTADAS';
    RAISE NOTICE '🔒 Cada usuario solo ve datos de su empresa';
    RAISE NOTICE '📦 Módulo de prueba creado correctamente';
    RAISE NOTICE '🚀 Sistema listo para funcionar';
    RAISE NOTICE '';
END $$;
