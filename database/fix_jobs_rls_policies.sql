-- Políticas RLS completas para la tabla jobs
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view company jobs" ON jobs;
DROP POLICY IF EXISTS "Users can manage company jobs" ON jobs;

-- Habilitar RLS si no está habilitado
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (ver trabajos)
CREATE POLICY "Users can view company jobs" ON jobs
FOR SELECT TO authenticated
USING (company_id = user_company_id());

-- Política para INSERT (crear trabajos)
CREATE POLICY "Users can insert company jobs" ON jobs
FOR INSERT TO authenticated
WITH CHECK (company_id = user_company_id());

-- Política para UPDATE (actualizar trabajos)
CREATE POLICY "Users can update company jobs" ON jobs
FOR UPDATE TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

-- Política para DELETE (eliminar trabajos)
CREATE POLICY "Users can delete company jobs" ON jobs
FOR DELETE TO authenticated
USING (company_id = user_company_id());

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'jobs'
ORDER BY policyname;
