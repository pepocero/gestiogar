-- Habilitar Row Level Security en tabla modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para la tabla modules
DROP POLICY IF EXISTS "Users can view their company modules" ON public.modules;
CREATE POLICY "Users can view their company modules" ON public.modules
    FOR SELECT USING (company_id = user_company_id());

DROP POLICY IF EXISTS "Users can create modules for their company" ON public.modules;
CREATE POLICY "Users can create modules for their company" ON public.modules
    FOR INSERT WITH CHECK (company_id = user_company_id());

DROP POLICY IF EXISTS "Users can update their company modules" ON public.modules;
CREATE POLICY "Users can update their company modules" ON public.modules
    FOR UPDATE USING (company_id = user_company_id());

DROP POLICY IF EXISTS "Users can delete their company modules" ON public.modules;
CREATE POLICY "Users can delete their company modules" ON public.modules
    FOR DELETE USING (company_id = user_company_id());
