-- Forzar recarga del esquema de PostgREST para la tabla users
-- Este script fuerza a PostgREST a recargar el esquema y reconocer la nueva columna

-- Notificar a PostgREST que el esquema ha cambiado
NOTIFY pgrst, 'reload schema';

-- Verificar que la columna existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'profile_photo_url';

-- Verificar los permisos de la columna
SELECT 
    table_name,
    column_name,
    privilege_type,
    grantee
FROM information_schema.column_privileges
WHERE table_name = 'users'
AND column_name = 'profile_photo_url';
