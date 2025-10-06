-- Solución directa: Temporalmente desactivar RLS para diagnosticar
-- Ejecutar en Supabase SQL Editor

-- 1. Temporalmente desactivar RLS para ver qué datos hay
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Buscar tu usuario específicamente por email
SELECT 'Búsqueda por email:' as info,
    id, email, company_id, first_name, last_name
FROM public.users 
WHERE email = 'demo@demo.com';  -- Cambiar por tu email real

-- 3. Verificar todos los usuarios y sus company_id
SELECT 'Todos los usuarios:' as info,
    id, email, company_id, first_name, last_name
FROM public.users 
ORDER BY created_at DESC;

-- 4. Verificar que existen las empresas
SELECT 'Empresas existentes:' as info,
    id, name, created_at
FROM public.companies 
ORDER BY created_at DESC;

-- 5. Reactivar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Eliminar TODAS las policies de users para empezar limpio
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can view company users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for users based on company_id" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users based on company_id" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on company_id" ON public.users;
DROP POLICY IF EXISTS "Users can view their company users" ON public.users;

-- 7. Crear políticas simples y funcionales
CREATE POLICY "Users can read own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read company users" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND company_id = users.company_id
  )
);

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- 8. Probar acceso después de limpiar policies
SELECT 'Tras limpiar policies:' as info,
    id, email, company_id, first_name, last_name
FROM public.users 
WHERE id = auth.uid();

-- 9. Probar función user_company_id después de limpieza
SELECT 'Función user_company_id:' as info, user_company_id() as company_id;
