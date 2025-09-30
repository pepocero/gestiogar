-- Corregir políticas RLS para la tabla appointments
-- Este script elimina las políticas públicas existentes y crea políticas multitenant correctas

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can manage company appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view company appointments" ON public.appointments;

-- Crear políticas multitenant para appointments
-- Política para SELECT (ver citas de la empresa)
CREATE POLICY "Users can view company appointments" ON public.appointments
FOR SELECT TO authenticated
USING (company_id = user_company_id());

-- Política para INSERT (crear citas en la empresa)
CREATE POLICY "Users can create company appointments" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (company_id = user_company_id());

-- Política para UPDATE (actualizar citas de la empresa)
CREATE POLICY "Users can update company appointments" ON public.appointments
FOR UPDATE TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

-- Política para DELETE (eliminar citas de la empresa)
CREATE POLICY "Users can delete company appointments" ON public.appointments
FOR DELETE TO authenticated
USING (company_id = user_company_id());

-- Verificar que las políticas se crearon correctamente
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
WHERE tablename = 'appointments'
ORDER BY policyname;
