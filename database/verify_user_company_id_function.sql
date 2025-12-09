-- Verificar si existe la función user_company_id()
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'user_company_id'
AND routine_schema = 'public';

-- Si no existe, crearla
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT company_id
  FROM public.users
  WHERE id = auth.uid()
$$;

-- Verificar que se creó correctamente
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'user_company_id'
AND routine_schema = 'public';
