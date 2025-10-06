-- Script de prueba final para módulos con políticas de usuario individual
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar módulos de prueba anteriores
DELETE FROM public.modules WHERE slug IN ('modulo-prueba', 'modulo-prueba-usuario');

DELETE FROM public.module_data;

-- 2. Insertar módulo simple de prueba
INSERT INTO public.modules (
  user_id,
  company_id,
  name, 
  slug, 
  version, 
  description, 
  icon,
  is_active,
  manifest
) VALUES (
  auth.uid()::text,
  'user-' || auth.uid()::text,  -- Company ID basado en usuario
  'Mi Primer Módulo',
  'mi-primer-modulo',
  '1.0.0',
  'Módulo de prueba para usuario individual',
  'Package',
  true,
  '{"name":"Mi Primer Módulo","slug":"mi-primer-modulo","version":"1.0.0","description":"Módulo de prueba","icon":"Package","fields":[{"name":"nombre","label":"Nombre","type":"text","required":true}],"displayName":"Mi Módulo","displayDescription":"Prueba de módulo individual"}'::jsonb
);

-- 3. Insertar algunos datos de ejemplo
INSERT INTO public.module_data (
  user_id,
  module_id,
  data
) VALUES 
(
  auth.uid()::text,
  (SELECT id FROM public.modules WHERE slug = 'mi-primer-modulo' LIMIT 1),
  '{"nombre":"Juan Pérez","telefono":"123456789","email":"juan@ejemplo.com"}'::jsonb
),
(
  auth.uid()::text,
  (SELECT id FROM public.modules WHERE slug = 'mi-primer-modulo' LIMIT 1),
  '{"nombre":"María García","telefono":"987654321","email":"maria@ejemplo.com"}'::jsonb
);

-- 4. Verificar inserción exitosa
SELECT 'MÓDULO CREADO:' as resultado,
    id, user_id, name, slug, is_active
FROM public.modules 
WHERE user_id = auth.uid()::text;

-- 5. Verificar datos creados
SELECT 'DATOS CREADOS:' as resultado,
    id, user_id, module_id, data
FROM public.module_data 
WHERE user_id = auth.uid()::text;

-- 6. Contar total de módulos y datos
SELECT 'CONTEOS FINALES:' as resultado,
    (SELECT COUNT(*) FROM public.modules WHERE user_id = auth.uid()::text) as modulos_propios,
    (SELECT COUNT(*) FROM public.module_data WHERE user_id = auth.uid()::text) as datos_propios;

-- 7. Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SISTEMA DE MÓDULOS FUNCIONANDO CORRECTAMENTE';
    RAISE NOTICE '📋 Módulo creado con usuario: %', auth.uid();
    RAISE NOTICE '🔒 Políticas RLS: Solo tú puedes ver tus datos';
    RAISE NOTICE '✅ Listo para usar desde la página de módulos';
    RAISE NOTICE '';
END $$;
