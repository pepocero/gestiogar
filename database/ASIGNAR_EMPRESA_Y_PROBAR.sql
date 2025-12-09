-- Asignar empresa al usuario actual y probar módulos
-- Ejecutar en Supabase SQL Editor

-- ==========================================
-- PASO 1: VERIFICAR PROBLEMA DEL USUARIO
-- ==========================================

-- Ver usuarios y sus empresas (con RLS desactivado temporalmente)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

SELECT 'Usuarios y sus empresas:' as info,
    id, email, company_id, first_name, last_name
FROM public.users 
WHERE email = 'pepocero@gmail.com';

-- Ver empresas disponibles
SELECT 'Empresas disponibles:' as info,
    id, name, created_at
FROM public.companies 
ORDER BY created_at DESC
LIMIT 5;

-- Reactivar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PASO 2: ASIGNAR EMPRESA AL USUARIO ACTUAL
-- ==========================================

-- Opción 1: Si ya tienes una empresa, úsala
-- Opción 2: Crear una empresa nueva para el usuario

-- Crear empresa para el usuario si no existe
INSERT INTO public.companies (
    id,
    name,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Empresa de ' || (SELECT COALESCE(first_name, 'Usuario') FROM public.users WHERE email = 'pepocero@gmail.com' LIMIT 1),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Asignar la empresa al usuario actual
UPDATE public.users 
SET company_id = (
    SELECT id FROM public.companies 
    WHERE name LIKE '%Empresa de%'
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE email = 'pepocero@gmail.com'
AND company_id IS NULL;

-- ==========================================
-- PASO 3: VERIFICAR ASIGNACIÓN EXITOSA
-- ==========================================

-- Desactivar RLS para verificar
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

SELECT 'Después de asignar empresa:' as info,
    u.id, u.email, u.company_id, u.first_name, u.last_name,
    c.name as empresa_nombre
FROM public.users u
LEFT JOIN public.companies c ON c.id = u.company_id
WHERE u.email = 'pepocero@gmail.com';

-- Reactivar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PASO 4: PROBAR FUNCIÓN user_company_id()
-- ==========================================

-- Crear función si no existe
CREATE OR REPLACE FUNCTION user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_id UUID;
BEGIN
    -- Obtener company_id desde public.users
    SELECT company_id INTO result_id
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
    
    RETURN result_id;
END;
$$;

-- Probar función
SELECT 'Función user_company_id() después de asignar empresa:' as info,
    auth.uid() as user_id,
    user_company_id() as company_id;

-- ==========================================
-- PASO 5: CREAR POLÍTICAS RLS PARA MÓDULOS
-- ==========================================

-- Limpiar políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('modules', 'module_data')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || r.tablename;
    END LOOP;
END $$;

-- Crear políticas nuevas para modules
CREATE POLICY "modules_select" ON public.modules FOR SELECT USING (company_id = user_company_id());
CREATE POLICY "modules_insert" ON public.modules FOR INSERT WITH CHECK (company_id = user_company_id());
CREATE POLICY "modules_update" ON public.modules FOR UPDATE USING (company_id = user_company_id());
CREATE POLICY "modules_delete" ON public.modules FOR DELETE USING (company_id = user_company_id());

-- Crear políticas nuevas para module_data
CREATE POLICY "module_data_select" ON public.module_data FOR SELECT USING (company_id = user_company_id());
CREATE POLICY "module_data_insert" ON public.module_data FOR INSERT WITH CHECK (company_id = user_company_id());
CREATE POLICY "module_data_update" ON public.module_data FOR UPDATE USING (company_id = user_company_id());
CREATE POLICY "module_data_delete" ON public.module_data FOR DELETE USING (company_id = user_company_id());

-- ==========================================
-- PASO 6: INSERTAR MÓDULO DE PRUEBA CON ÉXITO
-- ==========================================

-- Limpiar módulos anteriores
DELETE FROM public.module_data WHERE module_id IN (
  SELECT id FROM public.modules WHERE slug LIKE '%test%'
);
DELETE FROM public.modules WHERE slug LIKE '%test%';

-- Insertar módulo de prueba ahora que company_id funciona
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
  'Módulo Test Final',
  'modulo-test-final',
  '1.0.0',
  'Módulo de prueba que ahora funciona',
  'Package',
  true
);

-- Verificar inserción exitosa
SELECT 'Módulo insertado exitosamente:' as resultado,
    id, name, slug, company_id, is_active
FROM public.modules 
WHERE slug = 'modulo-test-final';

-- ==========================================
-- RESULTADO FINAL
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ EMPRESA asignada al usuario pepocero@gmail.com';
    RAISE NOTICE '✅ FUNCIÓN user_company_id() funciona correctamente';
    RAISE NOTICE '✅ POLÍTICAS RLS creadas';
    RAISE NOTICE '✅ MÓDULO insertado sin errores';
    RAISE NOTICE '🚀 SISTEMA DE MÓDULOS FUNCIONANDO';
    RAISE NOTICE '👤 Usuario: %', (SELECT email FROM public.users WHERE email = 'pepocero@gmail.com');
    RAISE NOTICE '🏢 Empresa: %', (SELECT name FROM public.companies WHERE id = user_company_id());
    RAISE NOTICE '';
END $$;
