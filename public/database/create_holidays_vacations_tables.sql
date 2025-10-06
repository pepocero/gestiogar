-- Crear tablas para el módulo de Días Festivos y Vacaciones
-- Este archivo debe ejecutarse en Supabase SQL Editor

-- Tabla de días festivos
CREATE TABLE IF NOT EXISTS holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('festivo_nacional', 'festivo_local', 'festivo_empresa', 'puente')),
    repetir_anual BOOLEAN DEFAULT false,
    descripcion TEXT,
    aplica_todos BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de solicitudes de vacaciones
CREATE TABLE IF NOT EXISTS vacation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_name VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dias_solicitados INTEGER NOT NULL,
    motivo TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    aprobado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    comentarios_aprobacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de balance de vacaciones por empleado
CREATE TABLE IF NOT EXISTS vacation_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_name VARCHAR(100) NOT NULL,
    ano INTEGER NOT NULL,
    dias_disponibles INTEGER NOT NULL DEFAULT 15,
    dias_usados INTEGER NOT NULL DEFAULT 0,
    dias_pendientes INTEGER NOT NULL DEFAULT 0,
    dias_restantes INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, ano)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_holidays_company_id ON holidays(company_id);
CREATE INDEX IF NOT EXISTS idx_holidays_fecha ON holidays(fecha);
CREATE INDEX IF NOT EXISTS idx_holidays_tipo ON holidays(tipo);

CREATE INDEX IF NOT EXISTS idx_vacation_requests_company_id ON vacation_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_employee_id ON vacation_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_estado ON vacation_requests(estado);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_fecha_inicio ON vacation_requests(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_vacation_balances_company_id ON vacation_balances(company_id);
CREATE INDEX IF NOT EXISTS idx_vacation_balances_employee_id ON vacation_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_vacation_balances_ano ON vacation_balances(ano);

-- Políticas RLS (Row Level Security)
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_balances ENABLE ROW LEVEL SECURITY;

-- Políticas para holidays
CREATE POLICY "Users can view holidays from their company" ON holidays
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert holidays to their company" ON holidays
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update holidays from their company" ON holidays
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete holidays from their company" ON holidays
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Políticas para vacation_requests
CREATE POLICY "Users can view vacation requests from their company" ON vacation_requests
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert vacation requests to their company" ON vacation_requests
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update vacation requests from their company" ON vacation_requests
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete vacation requests from their company" ON vacation_requests
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Políticas para vacation_balances
CREATE POLICY "Users can view vacation balances from their company" ON vacation_balances
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert vacation balances to their company" ON vacation_balances
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update vacation balances from their company" ON vacation_balances
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete vacation balances from their company" ON vacation_balances
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacation_requests_updated_at BEFORE UPDATE ON vacation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacation_balances_updated_at BEFORE UPDATE ON vacation_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular días restantes de vacaciones automáticamente
CREATE OR REPLACE FUNCTION calculate_vacation_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dias_restantes = NEW.dias_disponibles - NEW.dias_usados - NEW.dias_pendientes;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para calcular días restantes
CREATE TRIGGER calculate_vacation_balance_trigger BEFORE INSERT OR UPDATE ON vacation_balances
    FOR EACH ROW EXECUTE FUNCTION calculate_vacation_balance();

-- Insertar días festivos nacionales por defecto para Colombia 2024
INSERT INTO holidays (company_id, nombre, fecha, tipo, repetir_anual, aplica_todos, created_by)
SELECT 
    c.id as company_id,
    h.nombre,
    h.fecha,
    h.tipo,
    h.repetir_anual,
    true as aplica_todos,
    u.id as created_by
FROM companies c
CROSS JOIN (
    VALUES 
        ('Año Nuevo', '2024-01-01', 'festivo_nacional', true),
        ('Día de los Reyes Magos', '2024-01-06', 'festivo_nacional', true),
        ('Día de San José', '2024-03-19', 'festivo_nacional', true),
        ('Día del Trabajador', '2024-05-01', 'festivo_nacional', true),
        ('Independencia de Colombia', '2024-07-20', 'festivo_nacional', true),
        ('Batalla de Boyacá', '2024-08-07', 'festivo_nacional', true),
        ('Día de la Raza', '2024-10-14', 'festivo_nacional', true),
        ('Independencia de Cartagena', '2024-11-11', 'festivo_nacional', true),
        ('Inmaculada Concepción', '2024-12-08', 'festivo_nacional', true),
        ('Navidad', '2024-12-25', 'festivo_nacional', true)
) AS h(nombre, fecha, tipo, repetir_anual)
CROSS JOIN (
    SELECT id FROM users LIMIT 1
) AS u
WHERE NOT EXISTS (
    SELECT 1 FROM holidays h2 
    WHERE h2.company_id = c.id 
    AND h2.nombre = h.nombre 
    AND h2.fecha = h.fecha::date
);

-- Comentarios en las tablas
COMMENT ON TABLE holidays IS 'Tabla para gestionar días festivos de la empresa';
COMMENT ON TABLE vacation_requests IS 'Tabla para gestionar solicitudes de vacaciones de empleados';
COMMENT ON TABLE vacation_balances IS 'Tabla para gestionar el balance de días de vacaciones por empleado y año';

-- Comentarios en columnas importantes
COMMENT ON COLUMN holidays.tipo IS 'Tipo de día festivo: festivo_nacional, festivo_local, festivo_empresa, puente';
COMMENT ON COLUMN vacation_requests.estado IS 'Estado de la solicitud: pendiente, aprobada, rechazada';
COMMENT ON COLUMN vacation_balances.ano IS 'Año al que corresponde el balance de vacaciones';
