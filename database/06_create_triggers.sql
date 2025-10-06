-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para tabla modules
DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at 
    BEFORE UPDATE ON public.modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear trigger para tabla module_data
DROP TRIGGER IF EXISTS update_module_data_updated_at ON public.module_data;
CREATE TRIGGER update_module_data_updated_at 
    BEFORE UPDATE ON public.module_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
