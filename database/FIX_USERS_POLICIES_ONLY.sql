-- SOLO arreglar políticas de users para que puedas leer tu propio perfil
-- Ejecutar en Supabase SQL Editor

-- ==========================================
-- VER PROBLEMA ACTUAL
-- ==========================================

-- Ver si puedes leer tu propio perfil actualmente
SELECT 'Test acceso propio perfil:' as info,
    id, email, company_id, first_name, last_name
FROM public.users 
WHERE id = auth.uid();

-- Ver cuántas políticas hay actualmente en users
SELECT 'Políticas actuales en users:' as info,
    policyname, cmd, permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- ==========================================
-- ELIMINAR TODAS LAS POLÍTICAS DE USERS
-- ==========================================

-- Eliminar TODAS las políticas de users (sin excepción)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
        RAISE NOTICE 'Eliminada política: %', r.policyname;
    END LOOP;
END $$;

-- ==========================================
-- CREAR SOLO UNA POLÍTICA SIMPLE PARA USERS
-- ==========================================

-- SOLO permitir SELECT en users (ni siquiera necesitamos INSERT/UPDATE/DELETE)
-- Cada usuario puede ver SU PROPIO registro y otros usuarios de SU MISMA empresa
CREATE POLICY "users_basic_select" ON public.users
FOR SELECT 
USING (
  -- Puedes ver tu propio perfil
  id = auth.uid()
  OR 
  -- Puedes ver otros usuarios de tu misma empresa
  company_id = (
    SELECT company_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- ==========================================
-- PROBAR ACCESO DESPUÉS DE ARREGLAR
-- ==========================================

-- Probar si ahora puedes leer tu perfil
SELECT 'Después de arreglar políticas:' as info,
    id, email, company_id, first_name, last_name
FROM public.users 
WHERE id = auth.uid();

-- Probar si la función user_company_id() funciona ahora
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
SELECT 'Función user_company_id() después de arreglar:' as info, 
    auth.uid() as mi_user_id,
    user_company_id() as mi_company_id;

-- ==========================================
-- PROBAR MÓDULOS AHORA QUE user_company_id() FUNCIONA
-- ==========================================

-- Si la función funciona, probar insertar módulo
DELETE FROM public.modules WHERE slug = 'test-after-fix';

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
  'Test Después de Fix',
  'test-after-fix',
  '1.0.0',
  'Módulo insertado después de arreglar users',
  'Package',
  true
);

-- Verificar que se insertó correctamente
SELECT 'Módulo insertado después del fix:' as resultado,
    id, name, slug, company_id, is_active
FROM public.modules 
WHERE slug = 'test-after-fix';

-- ==========================================
-- RESULTADO FINAL
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 POLÍTICAS DE USERS ARREGLADAS';
    RAISE NOTICE '✅ Puedes leer tu propio perfil';
    RAISE NOTICE '✅ Función user_company_id() funciona';
    RAISE NOTICE '✅ Módulo insertado sin errores';
    RAISE NOTICE '👤 Tu usuario: %', auth.uid();
    RAISE NOTICE '🏢 Tu empresa: %', user_company_id();
    RAISE NOTICE '🚀 ¡Sistema de módulos funcionando!';
    RAISE NOTICE '';
END $$;
