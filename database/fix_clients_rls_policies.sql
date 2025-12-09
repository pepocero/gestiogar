-- Políticas RLS completas para la tabla clients
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view company clients" ON clients;
DROP POLICY IF EXISTS "Users can manage company clients" ON clients;

-- Habilitar RLS si no está habilitado
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (ver clientes)
CREATE POLICY "Users can view company clients" ON clients
FOR SELECT TO authenticated
USING (company_id = user_company_id());

-- Política para INSERT (crear clientes)
CREATE POLICY "Users can insert company clients" ON clients
FOR INSERT TO authenticated
WITH CHECK (company_id = user_company_id());

-- Política para UPDATE (actualizar clientes)
CREATE POLICY "Users can update company clients" ON clients
FOR UPDATE TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

-- Política para DELETE (eliminar clientes)
CREATE POLICY "Users can delete company clients" ON clients
FOR DELETE TO authenticated
USING (company_id = user_company_id());

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'clients'
ORDER BY policyname;
