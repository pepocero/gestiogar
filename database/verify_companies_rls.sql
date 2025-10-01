-- Verificar políticas RLS de la tabla companies
SELECT 
    policyname, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY policyname;
