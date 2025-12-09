-- Corregir políticas RLS para la tabla communications
-- Este script elimina las políticas públicas existentes y crea políticas multitenant correctas

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can manage company communications" ON public.communications;
DROP POLICY IF EXISTS "Users can view company communications" ON public.communications;

-- Crear políticas multitenant para communications
-- Política para SELECT (ver comunicaciones de la empresa)
CREATE POLICY "Users can view company communications" ON public.communications
FOR SELECT TO authenticated
USING (company_id = user_company_id());

-- Política para INSERT (crear comunicaciones en la empresa)
CREATE POLICY "Users can create company communications" ON public.communications
FOR INSERT TO authenticated
WITH CHECK (company_id = user_company_id());

-- Política para UPDATE (actualizar comunicaciones de la empresa)
CREATE POLICY "Users can update company communications" ON public.communications
FOR UPDATE TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

-- Política para DELETE (eliminar comunicaciones de la empresa)
CREATE POLICY "Users can delete company communications" ON public.communications
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
WHERE tablename = 'communications'
ORDER BY policyname;
