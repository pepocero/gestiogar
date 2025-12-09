-- Verificar políticas de users después del fix
SELECT 
    policyname, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- También verificar que la función user_company_id tiene SECURITY DEFINER
SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'user_company_id'
AND routine_schema = 'public';
