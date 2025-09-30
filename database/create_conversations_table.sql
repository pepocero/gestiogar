-- Crear tabla de conversaciones para agrupar comunicaciones relacionadas
-- Este script implementa la Opción 2: tabla separada para conversaciones

-- Crear tabla de conversaciones
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    technician_id UUID REFERENCES technicians(id),
    job_id UUID REFERENCES jobs(id),
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, closed, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columna conversation_id a la tabla communications
ALTER TABLE public.communications 
ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Crear índices para optimización
CREATE INDEX idx_conversations_company_id ON conversations(company_id);
CREATE INDEX idx_conversations_client_id ON conversations(client_id);
CREATE INDEX idx_conversations_technician_id ON conversations(technician_id);
CREATE INDEX idx_conversations_job_id ON conversations(job_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_communications_conversation_id ON communications(conversation_id);

-- Habilitar RLS en la tabla conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conversations
CREATE POLICY "Users can view their company's conversations"
ON public.conversations
FOR SELECT TO authenticated
USING (company_id = user_company_id());

CREATE POLICY "Users can create conversations for their company"
ON public.conversations
FOR INSERT TO authenticated
WITH CHECK (company_id = user_company_id());

CREATE POLICY "Users can update their company's conversations"
ON public.conversations
FOR UPDATE TO authenticated
USING (company_id = user_company_id())
WITH CHECK (company_id = user_company_id());

CREATE POLICY "Users can delete their company's conversations"
ON public.conversations
FOR DELETE TO authenticated
USING (company_id = user_company_id());

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en conversations
CREATE TRIGGER trigger_update_conversation_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- Función para actualizar updated_at de la conversación cuando se agrega una comunicación
CREATE OR REPLACE FUNCTION update_conversation_on_communication()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar la fecha de actualización de la conversación
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar conversación cuando se inserta una comunicación
CREATE TRIGGER trigger_update_conversation_on_communication
    AFTER INSERT ON communications
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_communication();

-- Comentarios para documentar la estructura
COMMENT ON TABLE public.conversations IS 'Tabla para agrupar comunicaciones relacionadas en hilos de conversación';
COMMENT ON COLUMN public.conversations.subject IS 'Asunto principal de la conversación';
COMMENT ON COLUMN public.conversations.status IS 'Estado de la conversación: active, closed, archived';
COMMENT ON COLUMN public.communications.conversation_id IS 'ID de la conversación a la que pertenece esta comunicación';

-- Verificar que las tablas se crearon correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('conversations', 'communications')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
