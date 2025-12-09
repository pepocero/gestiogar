-- Tabla principal para la sección de contabilidad
CREATE TABLE IF NOT EXISTS public.accounting_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'tax', 'transfer', 'adjustment')),
    category TEXT NOT NULL,
    sub_category TEXT,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    tax_rate NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    net_amount NUMERIC(12,2) DEFAULT 0,
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'cancelled')),
    due_date DATE,
    related_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    related_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    notes TEXT,
    attachments JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_company_date
    ON public.accounting_transactions(company_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_accounting_transactions_company_type
    ON public.accounting_transactions(company_id, type);

CREATE INDEX IF NOT EXISTS idx_accounting_transactions_company_status
    ON public.accounting_transactions(company_id, status);

-- Habilitar RLS
ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas basadas en company_id
CREATE POLICY "Users can view their accounting transactions"
    ON public.accounting_transactions
    FOR SELECT
    USING (company_id = user_company_id());

CREATE POLICY "Users can insert accounting transactions for their company"
    ON public.accounting_transactions
    FOR INSERT
    WITH CHECK (company_id = user_company_id());

CREATE POLICY "Users can update their accounting transactions"
    ON public.accounting_transactions
    FOR UPDATE
    USING (company_id = user_company_id());

CREATE POLICY "Users can delete their accounting transactions"
    ON public.accounting_transactions
    FOR DELETE
    USING (company_id = user_company_id());

-- Trigger para mantener updated_at
CREATE TRIGGER update_accounting_transactions_updated_at
    BEFORE UPDATE ON public.accounting_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

