-- SOLO crear las tablas de módulos sin tocar NADA más
-- Este script solo agrega las nuevas tablas necesarias

-- Crear tabla de módulos
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

-- Crear tabla de datos de módulos
CREATE TABLE IF NOT EXISTS public.module_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_modules_company_active ON public.modules(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules(slug);
CREATE INDEX IF NOT EXISTS idx_module_data_company_module ON public.module_data(company_id, module_id);

-- Habilitar RLS (usa la función user_company_id que YA EXISTE)
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_data ENABLE ROW LEVEL SECURITY;

-- Usar la función user_company_id EXISTENTE para las nuevas policies
CREATE POLICY "modules_view_policy" ON public.modules
    FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "modules_create_policy" ON public.modules
    FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "modules_update_policy" ON public.modules
    FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "modules_delete_policy" ON public.modules
    FOR DELETE USING (company_id = user_company_id());

CREATE POLICY "module_data_view_policy" ON public.module_data
    FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "module_data_create_policy" ON public.module_data
    FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "module_data_update_policy" ON public.module_data
    FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "module_data_delete_policy" ON public.module_data
    FOR DELETE USING (company_id = user_company_id());
