-- Solución para dependencia circular en políticas RLS de users
-- El problema: user_company_id() lee de users, pero users usa user_company_id() en sus políticas

-- 1. Eliminar políticas existentes que causan el problema
DROP POLICY IF EXISTS "Authenticated users can view their company users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert users for their company" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- 2. Crear políticas SIN usar user_company_id() para evitar dependencia circular

-- Política SELECT: Los usuarios pueden ver su propio perfil y otros de su misma empresa
CREATE POLICY "Users can view their company users"
ON public.users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  company_id IN (
    SELECT company_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Política INSERT: Solo mediante service_role (bypass RLS)
-- No creamos política INSERT para usuarios normales
-- El registro usa supabaseAdmin que bypasea RLS

-- Política UPDATE: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política DELETE: Solo service_role (bypass RLS)
-- No creamos política DELETE para usuarios normales

-- 3. Verificar las políticas creadas
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
