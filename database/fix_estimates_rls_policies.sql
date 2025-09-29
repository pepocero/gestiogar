-- Políticas RLS completas para las tablas estimates y estimate_items
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view company estimates" ON estimates;
DROP POLICY IF EXISTS "Users can manage company estimates" ON estimates;
DROP POLICY IF EXISTS "Users can view company estimate_items" ON estimate_items;
DROP POLICY IF EXISTS "Users can manage company estimate_items" ON estimate_items;

-- Habilitar RLS si no está habilitado
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;

-- Políticas para estimates
CREATE POLICY "Users can view company estimates" ON estimates
FOR SELECT TO authenticated
USING (company_id = user_company_id());

CREATE POLICY "Users can insert company estimates" ON estimates
FOR INSERT TO authenticated
WITH CHECK (company_id = user_company_id());

CREATE POLICY "Users can update company estimates" ON estimates
FOR UPDATE TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

CREATE POLICY "Users can delete company estimates" ON estimates
FOR DELETE TO authenticated
USING (company_id = user_company_id());

-- Políticas para estimate_items
CREATE POLICY "Users can view company estimate_items" ON estimate_items
FOR SELECT TO authenticated
USING (estimate_id IN (
  SELECT id FROM estimates WHERE company_id = user_company_id()
));

CREATE POLICY "Users can insert company estimate_items" ON estimate_items
FOR INSERT TO authenticated
WITH CHECK (estimate_id IN (
  SELECT id FROM estimates WHERE company_id = user_company_id()
));

CREATE POLICY "Users can update company estimate_items" ON estimate_items
FOR UPDATE TO authenticated
USING (estimate_id IN (
  SELECT id FROM estimates WHERE company_id = user_company_id()
))
WITH CHECK (estimate_id IN (
  SELECT id FROM estimates WHERE company_id = user_company_id()
));

CREATE POLICY "Users can delete company estimate_items" ON estimate_items
FOR DELETE TO authenticated
USING (estimate_id IN (
  SELECT id FROM estimates WHERE company_id = user_company_id()
));

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('estimates', 'estimate_items')
ORDER BY tablename, policyname;
