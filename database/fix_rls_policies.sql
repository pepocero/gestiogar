-- Script para corregir las políticas RLS que bloquean el registro
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Eliminar políticas existentes que bloquean el registro
DROP POLICY IF EXISTS "Users can view own company" ON companies;
DROP POLICY IF EXISTS "Users can view company users" ON users;

-- 2. Crear políticas más permisivas para permitir el registro
-- Política para companies: permitir inserción y lectura para usuarios autenticados
CREATE POLICY "Enable insert for authenticated users" ON companies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON companies
    FOR SELECT USING (true);

CREATE POLICY "Enable update for authenticated users" ON companies
    FOR UPDATE USING (true);

-- Política para users: permitir inserción y lectura para usuarios autenticados
CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Enable update for authenticated users" ON users
    FOR UPDATE USING (true);

-- 3. Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('companies', 'users')
ORDER BY tablename, policyname;
