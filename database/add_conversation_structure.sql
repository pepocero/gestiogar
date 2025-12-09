-- Agregar estructura jerárquica para conversaciones
-- Este script agrega un campo parent_id para crear hilos de conversación

-- Agregar columna parent_id para referenciar la comunicación padre
ALTER TABLE public.communications 
ADD COLUMN parent_id UUID REFERENCES communications(id) ON DELETE CASCADE;

-- Agregar columna thread_id para agrupar conversaciones relacionadas
ALTER TABLE public.communications 
ADD COLUMN thread_id UUID;

-- Crear índice para optimizar consultas de hilos
CREATE INDEX idx_communications_parent_id ON communications(parent_id);
CREATE INDEX idx_communications_thread_id ON communications(thread_id);

-- Función para generar thread_id automáticamente
CREATE OR REPLACE FUNCTION generate_thread_id()
RETURNS UUID AS $$
BEGIN
    RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- Trigger para asignar thread_id automáticamente
CREATE OR REPLACE FUNCTION set_thread_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es una nueva comunicación (sin parent_id), generar nuevo thread_id
    IF NEW.parent_id IS NULL AND NEW.thread_id IS NULL THEN
        NEW.thread_id := generate_thread_id();
    -- Si tiene parent_id, usar el thread_id del padre
    ELSIF NEW.parent_id IS NOT NULL THEN
        SELECT thread_id INTO NEW.thread_id 
        FROM communications 
        WHERE id = NEW.parent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_set_thread_id ON communications;
CREATE TRIGGER trigger_set_thread_id
    BEFORE INSERT ON communications
    FOR EACH ROW
    EXECUTE FUNCTION set_thread_id();

-- Comentarios para documentar la nueva estructura
COMMENT ON COLUMN public.communications.parent_id IS 'ID de la comunicación padre (para respuestas)';
COMMENT ON COLUMN public.communications.thread_id IS 'ID del hilo de conversación (agrupa comunicaciones relacionadas)';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'communications'
AND column_name IN ('parent_id', 'thread_id')
ORDER BY column_name;
