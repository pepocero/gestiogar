-- Script final para limpiar completamente las políticas de users
-- Ejecutar en Supabase SQL Editor

-- 1. VER TODAS LAS POLÍTICAS ACTUALES ANTES DE LIMPIAR
SELECT 'Políticas ANTES:' as etapa,
    policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES DE USERS (sin excepción)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
        RAISE NOTICE 'Eliminada política: %', r.policyname;
    END LOOP;
END $$;

-- 3. VERIFICAR QUE SE ELIMINARON TODAS
SELECT 'Políticas DESPUÉS de eliminar:' as etapa,
    policyname
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 4. TEMPORALMENTE DESACTIVAR RLS PARA VER DATOS SIN RESTRICCIONES
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 5. MOSTRAR USUARIOS SIN RESTRICCIONES
SELECT 'Usuarios disponibles:' as info,
    id, email, company_id, first_name, last_name, created_at
FROM public.users 
ORDER BY created_at DESC
LIMIT 10;

-- 6. BUSCAR ESPECÍFICAMENTE pepocero@gmail.com
SELECT 'Usuario pepocero@gmail.com:' as info,
    id, email, company_id
FROM public.users 
WHERE email = 'pepocero@gmail.com';

-- 7. MOSTRAR EMPRESAS DISPONIBLES
SELECT 'Empresas disponibles:' as info,
    id, name, created_at
FROM public.companies 
ORDER BY created_at DESC
LIMIT 5;

-- 8. REACTIVAR RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 9. CREAR POLÍTICAS SUPER SIMPLES Y FUNCIONALES
CREATE POLICY "users_select_own" ON public.users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_company" ON public.users  
FOR SELECT USING (
  company_id IS NOT NULL 
  AND company_id = (
    SELECT company_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "users_update_own" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- 10. VERIFICAR POLÍTICAS CREADAS
SELECT 'Políticas NUEVAS creadas:' as etapa,
    policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- 11. PRUEBA FINAL - FUNCIÓN user_company_id
SELECT 'PRUEBA FINAL:' as info, 
    auth.uid() as user_id,
    user_company_id() as company_id;
