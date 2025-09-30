-- Corregir políticas RLS para la tabla materials
-- Este script elimina las políticas públicas existentes y crea políticas multitenant correctas

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can manage company materials" ON public.materials;
DROP POLICY IF EXISTS "Users can view company materials" ON public.materials;

-- Crear políticas multitenant para materials
-- Política para SELECT (ver materiales de la empresa)
CREATE POLICY "Users can view company materials" ON public.materials
FOR SELECT TO authenticated
USING (company_id = user_company_id());

-- Política para INSERT (crear materiales en la empresa)
CREATE POLICY "Users can create company materials" ON public.materials
FOR INSERT TO authenticated
WITH CHECK (company_id = user_company_id());

-- Política para UPDATE (actualizar materiales de la empresa)
CREATE POLICY "Users can update company materials" ON public.materials
FOR UPDATE TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

-- Política para DELETE (eliminar materiales de la empresa)
CREATE POLICY "Users can delete company materials" ON public.materials
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
WHERE tablename = 'materials'
ORDER BY policyname;
