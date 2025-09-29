-- Script para corregir las políticas RLS de insurance_companies
-- Cambiar de 'public' a 'authenticated' y asegurar multitenant

-- Eliminar políticas existentes para evitar errores
DROP POLICY IF EXISTS "Users can manage company insurance" ON public.insurance_companies;
DROP POLICY IF EXISTS "Users can view company insurance companies" ON public.insurance_companies;
DROP POLICY IF EXISTS "Users can insert company insurance companies" ON public.insurance_companies;
DROP POLICY IF EXISTS "Users can update company insurance companies" ON public.insurance_companies;
DROP POLICY IF EXISTS "Users can delete company insurance companies" ON public.insurance_companies;

-- Habilitar RLS en la tabla de insurance_companies
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;

-- 1. Policy para SELECT: Los usuarios autenticados pueden ver las aseguradoras de su empresa
CREATE POLICY "Users can view company insurance companies"
ON public.insurance_companies FOR SELECT TO authenticated
USING (company_id = user_company_id());

-- 2. Policy para INSERT: Los usuarios autenticados pueden crear aseguradoras para su empresa
CREATE POLICY "Users can insert company insurance companies"
ON public.insurance_companies FOR INSERT TO authenticated
WITH CHECK (company_id = user_company_id());

-- 3. Policy para UPDATE: Los usuarios autenticados pueden actualizar las aseguradoras de su empresa
CREATE POLICY "Users can update company insurance companies"
ON public.insurance_companies FOR UPDATE TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

-- 4. Policy para DELETE: Los usuarios autenticados pueden eliminar las aseguradoras de su empresa
CREATE POLICY "Users can delete company insurance companies"
ON public.insurance_companies FOR DELETE TO authenticated
USING (company_id = user_company_id());

-- Verificar las políticas creadas
SELECT * FROM pg_policies WHERE tablename = 'insurance_companies';

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'insurance_companies';
