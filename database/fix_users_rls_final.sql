-- Solución final para políticas RLS de users sin recursión
-- Eliminar todas las políticas problemáticas y crear unas nuevas simples

-- 1. Eliminar todas las políticas existentes de users
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their company users" ON public.users;
DROP POLICY IF EXISTS "Users can create users" ON public.users;
DROP POLICY IF EXISTS "Users can delete users" ON public.users;
DROP POLICY IF EXISTS "Users can update users" ON public.users;
DROP POLICY IF EXISTS "Users can view users" ON public.users;

-- 2. Crear políticas SIMPLES usando user_company_id() como en appointments

-- SELECT: Usuarios pueden ver usuarios de su empresa
CREATE POLICY "Users can view company users"
ON public.users
FOR SELECT
TO authenticated
USING (company_id = user_company_id());

-- INSERT: Usuarios pueden crear usuarios en su empresa
CREATE POLICY "Users can create company users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (company_id = user_company_id());

-- UPDATE: Usuarios pueden actualizar usuarios de su empresa
CREATE POLICY "Users can update company users"
ON public.users
FOR UPDATE
TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

-- DELETE: Usuarios pueden eliminar usuarios de su empresa
CREATE POLICY "Users can delete company users"
ON public.users
FOR DELETE
TO authenticated
USING (company_id = user_company_id());

-- 3. Verificar las políticas creadas
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;
