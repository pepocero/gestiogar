-- Script súper simple para probar acceso a módulos
-- Ejecutar estando logeado en Supabase con un usuario que tiene acceso

-- Verificar que podemos ver la tabla modules
SELECT 'modules' as table_name, COUNT(*) as record_count FROM public.modules;

-- Verificar que podemos ver la tabla module_data  
SELECT 'module_data' as table_name, COUNT(*) as record_count FROM public.module_data;

-- Probar función user_company_id
SELECT 
  auth.uid() as current_user_id,
  user_company_id() as current_company_id;

-- Insertar un módulo de prueba si no hay ninguno
INSERT INTO public.modules (
  company_id, 
  name, 
  slug, 
  version, 
  description, 
  icon
) VALUES (
  user_company_id(),
  'Módulo de Prueba',
  'modulo-prueba',
  '1.0.0',
  'Este es un módulo de prueba para verificar el sistema',
  'Package'
) ON CONFLICT (company_id, slug) DO NOTHING;

-- Verificar que el módulo se insertó
SELECT id, name, slug, is_active FROM public.modules WHERE slug = 'modulo-prueba';
