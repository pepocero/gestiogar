-- Corregir políticas RLS para la tabla suppliers
-- Este script elimina las políticas públicas existentes y crea políticas multitenant correctas

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can manage company suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view company suppliers" ON public.suppliers;

-- Crear políticas multitenant para suppliers
-- Política para SELECT (ver proveedores de la empresa)
CREATE POLICY "Users can view company suppliers" ON public.suppliers
FOR SELECT TO authenticated
USING (company_id = user_company_id());

-- Política para INSERT (crear proveedores en la empresa)
CREATE POLICY "Users can create company suppliers" ON public.suppliers
FOR INSERT TO authenticated
WITH CHECK (company_id = user_company_id());

-- Política para UPDATE (actualizar proveedores de la empresa)
CREATE POLICY "Users can update company suppliers" ON public.suppliers
FOR UPDATE TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

-- Política para DELETE (eliminar proveedores de la empresa)
CREATE POLICY "Users can delete company suppliers" ON public.suppliers
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
WHERE tablename = 'suppliers'
ORDER BY policyname;
