-- Script para verificar que la columna logo_url existe en la tabla companies
-- Este script confirma que la columna ya está presente

-- Verificar que la columna logo_url existe
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name = 'logo_url';

-- Verificar la estructura completa de la tabla companies
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- Verificar si hay datos en la columna logo_url
SELECT 
  id,
  name,
  logo_url,
  created_at
FROM companies 
WHERE logo_url IS NOT NULL
LIMIT 5;
