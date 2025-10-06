-- Ver la estructura real de las tablas modules y module_data
-- Ejecutar en Supabase SQL Editor

-- 1. Ver estructura de la tabla modules
SELECT 'Estructura tabla MODULES:' as info,
    column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'modules'
ORDER BY ordinal_position;

-- 2. Ver estructura de la tabla module_data  
SELECT 'Estructura tabla MODULE_DATA:' as info,
    column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'module_data'
ORDER BY ordinal_position;

-- 3. Ver algunas filas de ejemplo para entender qué columnas tienen datos
SELECT 'Datos de ejemplo MODULES:' as info, *
FROM public.modules 
LIMIT 3;

SELECT 'Datos de ejemplo MODULE_DATA:' as info, *
FROM public.module_data 
LIMIT 3;

-- 4. Ver qué políticas existen actualmente
SELECT 'Políticas MODULES actuales:' as info,
    policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'modules';

SELECT 'Políticas MODULE_DATA actuales:' as info,
    policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'module_data';
