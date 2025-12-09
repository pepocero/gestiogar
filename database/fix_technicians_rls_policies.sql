-- Script para agregar políticas RLS a la tabla technicians
-- Basado en el esquema real de la tabla

-- Eliminar políticas existentes para evitar errores
DROP POLICY IF EXISTS "Users can view company technicians" ON public.technicians;
DROP POLICY IF EXISTS "Users can insert company technicians" ON public.technicians;
DROP POLICY IF EXISTS "Users can update company technicians" ON public.technicians;
DROP POLICY IF EXISTS "Users can delete company technicians" ON public.technicians;

-- Habilitar RLS en la tabla de technicians
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- 1. Policy para SELECT: Los usuarios autenticados pueden ver los técnicos de su empresa
CREATE POLICY "Users can view company technicians"
ON public.technicians FOR SELECT TO authenticated
USING (company_id = user_company_id());

-- 2. Policy para INSERT: Los usuarios autenticados pueden crear técnicos para su empresa
CREATE POLICY "Users can insert company technicians"
ON public.technicians FOR INSERT TO authenticated
WITH CHECK (company_id = user_company_id());

-- 3. Policy para UPDATE: Los usuarios autenticados pueden actualizar los técnicos de su empresa
CREATE POLICY "Users can update company technicians"
ON public.technicians FOR UPDATE TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

-- 4. Policy para DELETE: Los usuarios autenticados pueden eliminar los técnicos de su empresa
CREATE POLICY "Users can delete company technicians"
ON public.technicians FOR DELETE TO authenticated
USING (company_id = user_company_id());

-- Verificar las políticas creadas
SELECT * FROM pg_policies WHERE tablename = 'technicians';

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'technicians';
