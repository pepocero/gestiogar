-- Solución completa para errores 500 en todas las tablas
-- El problema es que las políticas RLS usan user_company_id() que depende de la tabla users
-- Esto causa errores 500 cuando hay dependencias circulares

-- PASO 1: Recrear la función user_company_id() de forma más robusta
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1
$$;

-- PASO 2: Agregar comentario para documentar
COMMENT ON FUNCTION public.user_company_id() IS 'Retorna el company_id del usuario autenticado actual';

-- PASO 3: Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_company_id() TO anon;

-- PASO 4: Verificar que la función existe y funciona
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_name = 'user_company_id'
AND routine_schema = 'public';

-- PASO 5: Forzar recarga del schema
NOTIFY pgrst, 'reload schema';

-- Resultado esperado:
-- routine_name: user_company_id
-- routine_type: FUNCTION
-- security_type: DEFINER
