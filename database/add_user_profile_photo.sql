-- Agregar campo de foto de perfil a la tabla users
-- Este script agrega un campo opcional para almacenar la URL de la foto de perfil del usuario

-- Agregar la columna profile_photo_url a la tabla users
ALTER TABLE public.users
ADD COLUMN profile_photo_url TEXT;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.users.profile_photo_url IS 'URL de la foto de perfil del usuario (opcional)';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'profile_photo_url';
