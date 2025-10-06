-- Corregir políticas RLS de users para permitir acceso propio
-- Ejecutar en Supabase SQL Editor

-- 1. Asegurar que hay políticas básicas para la tabla users
-- (Solo crear si no existen para no romper las existentes)

DO $$ 
BEGIN
    -- Verificar si existe policy de SELECT para usuarios sobre su propio registro
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can view own data'
        AND cmd = 'SELECT'
    ) THEN
        EXECUTE '
        CREATE POLICY "Users can view own data" ON public.users
        FOR SELECT 
        USING (auth.uid() = id)';
        
        RAISE NOTICE 'Política SELECT creada: Users can view own data';
    ELSE
        RAISE NOTICE 'Política SELECT ya existe: Users can view own data';
    END IF;
    
    -- Verificar si existe policy para usuarios del mismo company
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can view company users'
        AND cmd = 'SELECT'
    ) THEN
        EXECUTE '
        CREATE POLICY "Users can view company users" ON public.users
        FOR SELECT 
        USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))';
        
        RAISE NOTICE 'Política SELECT creada: Users can view company users';
    ELSE
        RAISE NOTICE 'Política SELECT ya existe: Users can view company users';
    END IF;
    
    -- Verificar si existe policy para actualizar datos propios
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users可以与 own profile'
        AND cmd = 'UPDATE'
    ) THEN
        EXECUTE '
        CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE 
        USING (auth.uid() = id)';
        
        RAISE NOTICE 'Política UPDATE creada: Users can update own profile';
    ELSE
        RAISE NOTICE 'Política UPDATE ya existe: Users can update own profile';
    END IF;
END $$;

-- 2. Verificar que las políticas se aplicaron
SELECT 'Políticas después:' as info, 
    policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- 3. Probar acceso después de las políticas
SELECT 'Test después:' as info, 
    COUNT(*) as total_accesible,
    COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as con_company
FROM public.users 
WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid());

-- 4. Test función user_company_id después de corrección
SELECT 'Función después:' as info, user_company_id() as company_id;
