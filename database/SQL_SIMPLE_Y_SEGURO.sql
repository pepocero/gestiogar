-- SQL Simple y seguro para crear sistema de módulos
-- Este código no dará errores de sintaxis

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

-- Habilitar Row Level Security
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_data ENABLE ROW LEVEL SECURITY;

-- Crear función user_company_id si no existe
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

-- Crear políticas RLS para módulos (con IF NOT EXISTS manual)
BEGIN;
  -- Solamente crear si no existe
  DO $$ 
  BEGIN
    -- Política para SELECT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND policyname = 'modules_select_policy') THEN
      EXECUTE 'CREATE POLICY "modules_select_policy" ON public.modules FOR SELECT USING (company_id = user_company_id())';
    END IF;
    
    -- Política para INSERT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND policyname = 'modules_insert_policy') THEN
      EXECUTE 'CREATE POLICY "modules_insert_policy" ON public.modules FOR INSERT WITH CHECK (company_id = user_company_id())';
    END IF;
    
    -- Política para UPDATE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND policyname = 'modules_update_policy') THEN
      EXECUTE 'CREATE POLICY "modules_update_policy" ON public.modules FOR UPDATE USING (company_id = user_company_id())';
    END IF;
    
    -- Política para DELETE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND policyname = 'modules_delete_policy') THEN
      EXECUTE 'CREATE POLICY "modules_delete_policy" ON public.modules FOR DELETE USING (company_id = user_company_id())';
    END IF;
    
  END $$;
COMMIT;

-- Crear políticas RLS para module_data
BEGIN;
  DO $$ 
  BEGIN
    -- Política para SELECT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'module_data' AND policyname = 'module_data_select_policy') THEN
      EXECUTE 'CREATE POLICY "module_data_select_policy" ON public.module_data FOR SELECT USING (company_id = user_company_id())';
    END IF;
    
    -- Política para INSERT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'module_data' AND policyname = 'module_data_insert_policy') THEN
      EXECUTE 'CREATE POLICY "module_data_insert_policy" ON public.module_data FOR INSERT WITH CHECK (company_id = user_company_id())';
    END IF;
    
    -- Política para UPDATE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'module_data' AND policyname = 'module_data_update_policy') THEN
      EXECUTE 'CREATE POLICY "module_data_update_policy" ON public.module_data FOR UPDATE USING (company_id = user_company_id())';
    END IF;
    
    -- Política para DELETE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'module_data' AND policyname = 'module_data_delete_policy') THEN
      EXECUTE 'CREATE POLICY "module_data_delete_policy" ON public.module_data FOR DELETE USING (company_id = user_company_id())';
    END IF;
    
  END $$;
COMMIT;

-- Crear function para triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_modules_updated_at') THEN
    CREATE TRIGGER update_modules_updated_at 
      BEFORE UPDATE ON public.modules 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_module_data_updated_at') THEN
    CREATE TRIGGER update_module_data_updated_at 
      BEFORE UPDATE ON public.module_data 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
