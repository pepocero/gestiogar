-- Script para corregir la tabla technicians
-- Agregar columnas faltantes que se usan en el formulario

-- Agregar columna address
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address TEXT;

-- Agregar columna specialty (singular) si no existe
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS specialty VARCHAR(100);

-- Agregar columna experience_level
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50);

-- Agregar columna hire_date
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Agregar columna notes
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'technicians' 
ORDER BY ordinal_position;
