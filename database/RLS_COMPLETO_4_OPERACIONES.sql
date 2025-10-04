-- Script completo con TODAS las operaciones básicas: SELECT, INSERT, UPDATE, DELETE
-- Ejecutar en Supabase SQL Editor

-- ==========================================
-- PASO 1: DESACTIVAR RLS TEMPORALMENTE PARA DIAGNÓSTICO
-- ==========================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Ver usuario actual sin restricciones
SELECT 'Diagnóstico usuario:' as info,
    id, email, company_id, created_at
FROM public.users 
WHERE email = 'pepocero@gmail.com'
LIMIT 1;

-- Cambiar table name si es necesario
SELECT 'Todas las empresas:' as info,
    id, name, created_at
FROM public.companies 
ORDER BY created_at DESC;

-- Reactivar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PASO 2: LIMPIAR TODASLAS POLÍTICAS DE USERS
-- ==========================================

-- Eliminar TODAS las políticas de users
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
        RAISE NOTICE 'Eliminada política users: %', r.policyname;
    END LOOP;
END $$;

-- ==========================================
-- PASO 3: CREAR POLÍTICAS COMPLETAS PARA USERS (4 OPERACIONES)
-- ==========================================

-- SELECT: Los usuarios pueden ver sus propios datos Y otros usuarios de su empresa
CREATE POLICY "users_select" ON public.users
FOR SELECT USING (
  id = auth.uid() OR 
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- INSERT: Los usuarios pueden crear nuevos usuarios en su empresa
CREATE POLICY "users_insert" ON public.users
FOR INSERT WITH CHECK (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- UPDATE: Los usuarios pueden actualizar sus propios datos Y otros usuarios de su empresa  
CREATE POLICY "users_update" ON public.users
FOR UPDATE USING (
  id = auth.uid() OR 
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- DELETE: Los usuarios pueden eliminar otros usuarios de su empresa (SIN incluirlos mismos por seguridad)
CREATE POLICY "users_delete" ON public.users
FOR DELETE USING (
  id != auth.uid() AND 
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- ==========================================
-- PASO 4: LIMPIAR POLÍTICAS DE MÓDULOS
-- ==========================================

-- Eliminar TODAS las políticas de modules
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'modules'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.modules';
        RAISE NOTICE 'Eliminada política modules: %', r.policyname;
    END LOOP;
END $$;

-- Eliminar TODAS las políticas de module_data
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'module_data'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.module_data';
        RAISE NOTICE 'Eliminada política module_data: %', r.policyname;
    END LOOP;
END $$;

-- ==========================================
-- PASO 5: CREAR POLÍTICAS COMPLETAS PARA MÓDULOS (4 OPERACIONES)
-- ==========================================

-- MODULES - SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "modules_select" ON public.modules
FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "modules_insert" ON public.modules  
FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "modules_update" ON public.modules
FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "modules_delete" ON public.modules
FOR DELETE USING (company_id = user_company_id());

-- MODULE_DATA - SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "module_data_select" ON public.module_data
FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "module_data_insert" ON public.module_data
FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "module_data_update" ON public.module_data
FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "module_data_delete" ON public.module_data
FOR DELETE USING (company_id = user_company_id());

-- ==========================================
-- PASO 6: VERIFICAR POLÍTICAS CREADAS
-- ==========================================

SELECT 'Users policies:' as tabla,
    policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

SELECT 'Modules policies:' as tabla,
    policyname, cmd  
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'modules'
ORDER BY policyname;

SELECT 'Module_data policies:' as tabla,
    policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'module_data'
ORDER BY policyname;

-- ==========================================
-- PASO 7: PROBAR FUNCIÓN user_company_id
-- ==========================================

SELECT 'Test función:' as info, 
    auth.uid() as user_id,
    user_company_id() as company_id;

-- ==========================================
-- PASO 8: INSERTAR MÓDULO DE PRUEBA
-- ==========================================

-- Limpiar módulos de prueba anteriores
DELETE FROM public.modules WHERE slug IN ('mi-modulo-prueba', 'test-module');

-- Insertar módulo de prueba usando función user_company_id()
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
  'Mi Módulo Final',
  'mi-modulo-final',
  '1.0.0',
  'Módulo de prueba final con políticas completas',
  'Package',
  true,
  '{"name":"Mi Módulo Final","slug":"mi-modulo-final","version":"1.0.0","description":"Test completo","icon":"Package","fields":[{"name":"titulo","label":"Título","type":"text","required":true},{"name":"descripcion","label":"Descripción","type":"textarea","required":false}],"displayName":"Mi Módulo Final","displayDescription":"Prueba completa"}'::jsonb
);

-- Insertar datos de ejemplo
INSERT INTO public.module_data (
  module_id,
  company_id,
  data
) VALUES (
  (SELECT id FROM public.modules WHERE slug = 'mi-modulo-final'),
  user_company_id(),
  '{"titulo":"Primer elemento","descripcion":"Este es un elemento de prueba"}'::jsonb
),
(
  (SELECT id FROM public.modules WHERE slug = 'mi-modulo-final'),
  user_company_id(),
  '{"titulo":"Segundo elemento","descripcion":"Este es otro elemento de prueba"}'::jsonb
);

-- ==========================================
-- PASO 9: VERIFICAR INSERCIÓN EXITOSA
-- ==========================================

SELECT 'Módulo creado:' as resultado,
    id, name, slug, company_id, is_active
FROM public.modules 
WHERE company_id = user_company_id()
ORDER BY created_at DESC;

SELECT 'Datos creados:' as resultado,
    id, module_id, company_id, data
FROM public.module_data 
WHERE company_id = user_company_id()
ORDER BY created_at DESC;

-- ==========================================
-- NOTIFICACIÓN FINAL
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SISTEMA COMPLETO CONFIGURADO';
    RAISE NOTICE '📋 Usuarios: 4 operaciones (SELECT, INSERT, UPDATE, DELETE)';
    RAISE NOTICE '📦 Módulos: 4 operaciones (SELECT, INSERT, UPDATE, DELETE)';
    RAISE NOTICE '📊 Datos: 4 operaciones (SELECT, INSERT, UPDATE, DELETE)';
    RAISE NOTICE '✅ Company ID funcionando: %', user_company_id();
    RAISE NOTICE '🚀 ¡Sistema listo para usar!';
    RAISE NOTICE '';
END $$;
