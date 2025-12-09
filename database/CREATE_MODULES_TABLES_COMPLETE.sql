-- =====================================================
-- SCRIPT COMPLETO PARA CREAR TABLAS DE MÓDULOS
-- Gestiogar - Sistema Multitenant
-- =====================================================
-- Ejecutar este script completo en Supabase Dashboard > SQL Editor

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREAR TABLA DE MÓDULOS
-- =====================================================
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

-- =====================================================
-- CREAR TABLA DE DATOS DE MÓDULOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.module_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_modules_company_active ON public.modules(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules(slug);
CREATE INDEX IF NOT EXISTS idx_module_data_company_module ON public.module_data(company_id, module_id);

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_data ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREAR FUNCIÓN user_company_id
-- =====================================================
CREATE OR REPLACE FUNCTION user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT company_id 
    FROM auth.users 
    WHERE auth.uid() = id
  );
END;
$$;

-- =====================================================
-- CREAR POLÍTICAS RLS PARA TABLA modules
-- =====================================================
-- Política para SELECT (ver módulos de la empresa)
CREATE POLICY "Users can view their company modules" ON public.modules
    FOR SELECT USING (company_id = user_company_id());

-- Política para INSERT (crear módulos para la empresa)
CREATE POLICY "Users can create modules for their company" ON public.modules
    FOR INSERT WITH CHECK (company_id = user_company_id());

-- Política para UPDATE (actualizar módulos de la empresa)
CREATE POLICY "Users can update their company modules" ON public.modules
    FOR UPDATE USING (company_id = user_company_id());

-- Política para DELETE (eliminar módulos de la empresa)
CREATE POLICY "Users can delete their company modules" ON public.modules
    FOR DELETE USING (company_id = user_company_id());

-- =====================================================
-- CREAR POLÍTICAS RLS PARA TABLA module_data
-- =====================================================
-- Política para SELECT (ver datos de módulos de la empresa)
CREATE POLICY "Users can view their company module data" ON public.module_data
    FOR SELECT USING (company_id = user_company_id());

-- Política para INSERT (crear datos de módulos para la empresa)
CREATE POLICY "Users can create module data for their company" ON public.module_data
    FOR INSERT WITH CHECK (company_id = user_company_id());

-- Política para UPDATE (actualizar datos de módulos de la empresa)
CREATE POLICY "Users can update their company module data" ON public.module_data
    FOR UPDATE USING (company_id = user_company_id());

-- Política para DELETE (eliminar datos de módulos de la empresa)
CREATE POLICY "Users can delete their company module data" ON public.module_data
    FOR DELETE USING (company_id = user_company_id());

-- =====================================================
-- CREAR FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- CREAR TRIGGERS PARA ACTUALIZAR updated_at
-- =====================================================
-- Trigger para tabla modules
CREATE TRIGGER update_modules_updated_at 
    BEFORE UPDATE ON public.modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tabla module_data
CREATE TRIGGER update_module_data_updated_at 
    BEFORE UPDATE ON public.module_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICAR QUE LAS TABLAS SE CREARON CORRECTAMENTE
-- =====================================================
SELECT 
    'modules' as table_name,
    COUNT(*) as row_count
FROM public.modules
UNION ALL
SELECT 
    'module_data' as table_name,
    COUNT(*) as row_count
FROM public.module_data;

-- =====================================================
-- VERIFICAR POLÍTICAS RLS
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('modules', 'module_data')
ORDER BY tablename, policyname;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================
SELECT '✅ Tablas de módulos creadas exitosamente. El sistema de módulos está listo para usar.' as status;
