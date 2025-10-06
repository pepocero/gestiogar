-- Script simple para verificar tablas de módulos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar tablas existentes
SELECT '1. TABLAS:' as etapa, schemaname, tablename, tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('modules', 'module_data');

-- 2. Verificar RLS activo
SELECT '2. RLS:' as etapa, c.relname as table_name, 
       COALESCE(c.relrowsecurity::text, 'false') as rls_enabled,
       COALESCE(c.relforcerowsecurity::text, 'false') as rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
AND c.relname IN ('modules', 'module_data');

-- 3. Verificar policies
SELECT '3. POLICIES:' as etapa, schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('modules', 'module_data')
ORDER BY tablename, policyname;

-- 4. Probar acceso básico
SELECT '4. ACCESO:' as etapa, 
       COUNT(*) as total_modules 
FROM public.modules;

-- 5. Probar función user_company_id
SELECT '5. FUNCION:' as etapa, 
       auth.uid() as current_user_id,
       user_company_id() as current_company_id;

-- 6. Insertar módulo de prueba si está vacío
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
  'Módulo de Prueba',
  'modulo-prueba',
  '1.0.0',
  'Este es un módulo de prueba para verificar el sistema',
  'Package',
  true
) ON CONFLICT (company_id, slug) DO UPDATE SET 
  name = EXCLUDED.name,
  version = EXCLUDED.version;

-- 7. Confirmar módulo insertado
SELECT '7. CONFIRMACION:' as etapa, id, name, slug, is_active 
FROM public.modules 
WHERE slug = 'modulo-prueba';
