-- Políticas RLS simples basadas en usuario individual (no empresa)
-- Basado en Supabase Docs - cada usuario solo puede acceder a sus propios datos

-- ==========================================
-- TABLA: modules
-- ==========================================

-- Eliminar todas las políticas existentes de modules
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

-- Crear políticas simples para modules (sin dependencias de empresa)
CREATE POLICY "modules_select_own" ON public.modules
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "modules_insert_own" ON public.modules  
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "modules_update_own" ON public.modules
FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "modules_delete_own" ON public.modules
FOR DELETE USING (auth.uid()::text = user_id);

-- ==========================================
-- TABLA: module_data  
-- ==========================================

-- Eliminar todas las políticas existentes de module_data
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

-- Crear políticas simples para module_data (sin dependencias de empresa)
CREATE POLICY "module_data_select_own" ON public.module_data
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "module_data_insert_own" ON public.module_data
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "module_data_update_own" ON public.module_data
FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "module_data_delete_own" ON public.module_data
FOR DELETE USING (auth.uid()::text = user_id);

-- ==========================================
-- VERIFICAR POLÍTICAS CREADAS
-- ==========================================

SELECT 'Políticas MODULES:' as tabla,
    policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'modules'
ORDER BY policyname;

SELECT 'Políticas MODULE_DATA:' as tabla,
    policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'module_data'
ORDER BY policyname;

-- ==========================================
-- PRUEBA: INSERTAR MÓDULO DE PRUEBA
-- ==========================================

-- Eliminar módulo de prueba si existe
DELETE FROM public.modules WHERE slug = 'modulo-prueba';

-- Insertar módulo de prueba usando el ID del usuario actual
INSERT INTO public.modules (
  user_id,
  company_id, 
  name, 
  slug, 
  version, 
  description, 
  icon,
  is_active
) VALUES (
  auth.uid()::text,  -- Usar ID del usuario actual
  'test-company-123',  -- Company ID fijo para prueba
  'Módulo de Prueba Usuario',
  'modulo-prueba-usuario',
  '1.0.0',
  'Este es un módulo de prueba individual',
  'Package',
  true
);

-- Verificar que se insertó correctamente
SELECT 'MÓDULO INSERTADO:' as info,
    id, user_id, name, slug, is_active
FROM public.modules 
WHERE user_id = auth.uid()::text;

-- ==========================================
-- NOTIFICACIÓN FINAL
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '✅ POLÍTICAS RLS SIMPLES CREADAS CORRECTAMENTE';
    RAISE NOTICE '📝 Cada módulo pertenece al usuario que lo crea (auth.uid())';
    RAISE NOTICE '🔒 Los usuarios solo pueden ver/editar sus propios módulos';
    RAISE NOTICE '🎯 Sin empresas, sin complicaciones, solo usuario individual';
END $$;
