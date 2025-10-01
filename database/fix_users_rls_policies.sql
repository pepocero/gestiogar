-- Corregir políticas RLS para la tabla users
-- Asegurar que solo usuarios autenticados puedan gestionar sus datos

-- Primero, eliminar las políticas existentes que son demasiado permisivas
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view company users" ON public.users;

-- Habilitar RLS en la tabla (por si acaso)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuarios autenticados pueden ver usuarios de su empresa
CREATE POLICY "Authenticated users can view their company users"
ON public.users
FOR SELECT
TO authenticated
USING (company_id = user_company_id());

-- Política para INSERT: permitir a service_role y a usuarios autenticados insertar
-- (Nota: service_role bypasea RLS automáticamente, esta es para usuarios normales)
CREATE POLICY "Authenticated users can insert users for their company"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (company_id = user_company_id());

-- Política para UPDATE: usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política para DELETE: solo service_role puede eliminar (implícito)
-- No creamos política de DELETE para usuarios normales

-- Verificar las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
