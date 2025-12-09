-- Agregar campo de logo a la tabla insurance_companies
-- Este script agrega un campo opcional para almacenar la URL del logo de la aseguradora

-- Agregar la columna logo_url a la tabla insurance_companies
ALTER TABLE public.insurance_companies 
ADD COLUMN logo_url TEXT;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.insurance_companies.logo_url IS 'URL del logo de la aseguradora (opcional)';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'insurance_companies' 
AND column_name = 'logo_url';
