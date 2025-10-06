-- Tabla para los módulos instalados
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    description TEXT,
    icon VARCHAR(100) DEFAULT 'Package',
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, slug)
);

-- Tabla dinámica para datos de módulos
CREATE TABLE IF NOT EXISTS public.module_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_module_data_company_module (company_id, module_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_modules_company_active ON public.modules(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules(slug);

-- RLS Policies para modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company modules" ON public.modules
    FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "Users can create modules for their company" ON public.modules
    FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "Users can update their company modules" ON public.modules
    FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "Users can delete their company modules" ON public.modules
    FOR DELETE USING (company_id = user_company_id());

-- RLS Policies para module_data
ALTER TABLE public.module_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company module data" ON public.module_data
    FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "Users can create module data for their company" ON public.module_data
    FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "Users can update their company module data" ON public.module_data
    FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "Users can delete their company module data" ON public.module_data
    FOR DELETE USING (company_id = user_company_id());

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_modules_updated_at 
    BEFORE UPDATE ON public.modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_data_updated_at 
    BEFORE UPDATE ON public.module_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
