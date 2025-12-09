-- Agregar campo de foto de perfil a la tabla technicians
-- Este script agrega un campo opcional para almacenar la URL de la foto de perfil

-- Agregar la columna profile_photo_url a la tabla technicians
ALTER TABLE public.technicians 
ADD COLUMN profile_photo_url TEXT;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.technicians.profile_photo_url IS 'URL de la foto de perfil del técnico (opcional)';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'technicians' 
AND column_name = 'profile_photo_url';