-- Habilitar Row Level Security en tabla module_data
ALTER TABLE public.module_data ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para la tabla module_data
DROP POLICY IF EXISTS "Users can view their company module data" ON public.module_data;
CREATE POLICY "Users can view their company module data" ON public.module_data
    FOR SELECT USING (company_id = user_company_id());

DROP POLICY IF EXISTS "Users can create module data for their company" ON public.module_data;
CREATE POLICY "Users can create module data for their company" ON public.module_data
    FOR INSERT WITH CHECK (company_id = user_company_id());

DROP POLICY IF EXISTS "Users can update their company module data" ON public.module_data;
CREATE POLICY "Users can update their company module data" ON public.module_data
    FOR UPDATE USING (company_id = user_company_id());

DROP POLICY IF EXISTS "Users can delete their company module data" ON public.module_data;
CREATE POLICY "Users can delete their company module data" ON public.module_data
    FOR DELETE USING (company_id = user_company_id());
