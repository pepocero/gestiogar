-- Políticas RLS completas para la tabla invoices
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view company invoices" ON invoices;
DROP POLICY IF EXISTS "Users can manage company invoices" ON invoices;

-- Habilitar RLS si no está habilitado
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (ver facturas)
CREATE POLICY "Users can view company invoices" ON invoices
FOR SELECT TO authenticated
USING (company_id = user_company_id());

-- Política para INSERT (crear facturas)
CREATE POLICY "Users can insert company invoices" ON invoices
FOR INSERT TO authenticated
WITH CHECK (company_id = user_company_id());

-- Política para UPDATE (actualizar facturas)
CREATE POLICY "Users can update company invoices" ON invoices
FOR UPDATE TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

-- Política para DELETE (eliminar facturas)
CREATE POLICY "Users can delete company invoices" ON invoices
FOR DELETE TO authenticated
USING (company_id = user_company_id());

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'invoices'
ORDER BY policyname;
