-- Sistema de Suscripciones para GestioGar
-- Planes: Free y Pro

-- 1. Agregar columnas a la tabla companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paypal_customer_id VARCHAR(255);

-- 2. Crear tabla de suscripciones (historial)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'pro')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
    paypal_subscription_id VARCHAR(255),
    paypal_customer_id VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal ON subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 3. Crear tabla de límites de planes
CREATE TABLE IF NOT EXISTS plan_limits (
    plan VARCHAR(20) PRIMARY KEY CHECK (plan IN ('free', 'pro')),
    max_jobs INTEGER,
    max_clients INTEGER,
    max_estimates INTEGER,
    max_invoices INTEGER,
    max_technicians INTEGER,
    max_insurance_companies INTEGER,
    max_suppliers INTEGER,
    max_materials INTEGER,
    max_appointments INTEGER,
    max_conversations INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar límites del plan gratuito (Gestiogar Free)
INSERT INTO plan_limits (
    plan, 
    max_jobs, 
    max_clients, 
    max_estimates, 
    max_invoices, 
    max_technicians, 
    max_insurance_companies, 
    max_suppliers, 
    max_materials, 
    max_appointments, 
    max_conversations
)
VALUES ('free', 3, 3, 3, 3, 3, 3, 3, 3, 3, 3)
ON CONFLICT (plan) DO UPDATE SET
    max_jobs = EXCLUDED.max_jobs,
    max_clients = EXCLUDED.max_clients,
    max_estimates = EXCLUDED.max_estimates,
    max_invoices = EXCLUDED.max_invoices,
    max_technicians = EXCLUDED.max_technicians,
    max_insurance_companies = EXCLUDED.max_insurance_companies,
    max_suppliers = EXCLUDED.max_suppliers,
    max_materials = EXCLUDED.max_materials,
    max_appointments = EXCLUDED.max_appointments,
    max_conversations = EXCLUDED.max_conversations,
    updated_at = NOW();

-- Insertar límites del plan Pro (Gestiogar Pro - ilimitado = NULL)
INSERT INTO plan_limits (
    plan, 
    max_jobs, 
    max_clients, 
    max_estimates, 
    max_invoices, 
    max_technicians, 
    max_insurance_companies, 
    max_suppliers, 
    max_materials, 
    max_appointments, 
    max_conversations
)
VALUES ('pro', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (plan) DO NOTHING;

-- 4. Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- 5. RLS Policies para subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company subscriptions" ON subscriptions
    FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "Users can create subscriptions for their company" ON subscriptions
    FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "Users can update their company subscriptions" ON subscriptions
    FOR UPDATE USING (company_id = user_company_id());

-- 6. RLS Policies para plan_limits (lectura pública)
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan limits" ON plan_limits
    FOR SELECT USING (true);

-- 7. Función helper para obtener el plan activo de una empresa
CREATE OR REPLACE FUNCTION get_active_plan(company_uuid UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    plan_status VARCHAR(20);
    plan_type VARCHAR(20);
    ends_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT subscription_status, subscription_plan, subscription_ends_at
    INTO plan_status, plan_type, ends_at
    FROM companies
    WHERE id = company_uuid;
    
    -- Si no existe la empresa, retornar free
    IF plan_type IS NULL THEN
        RETURN 'free';
    END IF;
    
    -- Si está cancelada o expirada, retornar free
    IF plan_status = 'cancelled' OR plan_status = 'expired' THEN
        RETURN 'free';
    END IF;
    
    -- Si tiene fecha de expiración y ya pasó, retornar free
    IF ends_at IS NOT NULL AND ends_at < NOW() THEN
        RETURN 'free';
    END IF;
    
    -- Retornar el plan actual
    RETURN COALESCE(plan_type, 'free');
END;
$$ LANGUAGE plpgsql;

