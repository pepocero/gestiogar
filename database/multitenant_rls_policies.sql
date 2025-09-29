-- Políticas RLS para sistema multitenant
-- Cada usuario solo puede gestionar datos de su propia empresa

-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON companies;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON companies;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON users;

-- 2. Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para companies
-- Permitir inserción para usuarios autenticados (registro)
CREATE POLICY "Allow insert for authenticated users" ON companies
    FOR INSERT WITH CHECK (true);

-- Permitir lectura solo de la propia empresa
CREATE POLICY "Users can view own company" ON companies
    FOR SELECT USING (id = user_company_id());

-- Permitir actualización solo de la propia empresa
CREATE POLICY "Users can update own company" ON companies
    FOR UPDATE USING (id = user_company_id());

-- 4. Políticas para users
-- Permitir inserción para usuarios autenticados (registro)
CREATE POLICY "Allow insert for authenticated users" ON users
    FOR INSERT WITH CHECK (true);

-- Permitir lectura solo de usuarios de la misma empresa
CREATE POLICY "Users can view company users" ON users
    FOR SELECT USING (company_id = user_company_id());

-- Permitir actualización solo del propio perfil
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- 5. Políticas para otras tablas (básicas)
-- Clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company clients" ON clients
    FOR ALL USING (company_id = user_company_id());

-- Insurance companies
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company insurance" ON insurance_companies
    FOR ALL USING (company_id = user_company_id());

-- Technicians
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company technicians" ON technicians
    FOR ALL USING (company_id = user_company_id());

-- Jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company jobs" ON jobs
    FOR ALL USING (company_id = user_company_id());

-- Estimates
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company estimates" ON estimates
    FOR ALL USING (company_id = user_company_id());

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company invoices" ON invoices
    FOR ALL USING (company_id = user_company_id());

-- Materials
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company materials" ON materials
    FOR ALL USING (company_id = user_company_id());

-- Suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company suppliers" ON suppliers
    FOR ALL USING (company_id = user_company_id());

-- Appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company appointments" ON appointments
    FOR ALL USING (company_id = user_company_id());

-- Communications
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company communications" ON communications
    FOR ALL USING (company_id = user_company_id());

-- Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company documents" ON documents
    FOR ALL USING (company_id = user_company_id());

-- Estimate items
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage company estimate items" ON estimate_items
    FOR ALL USING (
        estimate_id IN (
            SELECT id FROM estimates WHERE company_id = user_company_id()
        )
    );

-- 6. Verificar políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('companies', 'users', 'clients', 'jobs', 'estimates')
ORDER BY tablename, policyname;
