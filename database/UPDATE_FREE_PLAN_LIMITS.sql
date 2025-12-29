-- Actualizar límites del plan gratuito a 3 items por sección
UPDATE plan_limits
SET 
    max_jobs = 3,
    max_clients = 3,
    max_estimates = 3,
    max_invoices = 3,
    max_technicians = 3,
    max_insurance_companies = 3,
    max_suppliers = 3,
    max_materials = 3,
    max_appointments = 3,
    max_conversations = 3,
    updated_at = NOW()
WHERE plan = 'free';

