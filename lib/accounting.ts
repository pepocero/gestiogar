import { supabaseTable } from '@/lib/supabase'

export type AccountingTransactionType =
  | 'income'
  | 'expense'
  | 'tax'
  | 'transfer'
  | 'adjustment'

export type AccountingTransactionStatus = 'pending' | 'paid' | 'cancelled'

export interface AccountingTransaction {
  id: string
  company_id: string
  date: string
  type: AccountingTransactionType
  category: string
  sub_category?: string | null
  amount: number
  currency: string
  tax_rate: number
  tax_amount: number
  net_amount: number
  payment_method?: string | null
  status: AccountingTransactionStatus
  due_date?: string | null
  related_invoice_id?: string | null
  related_job_id?: string | null
  notes?: string | null
  attachments?: any
  metadata?: Record<string, any>
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface AccountingTransactionInput {
  company_id: string
  date: string
  type: AccountingTransactionType
  category: string
  sub_category?: string | null
  amount: number
  currency?: string
  tax_rate?: number
  tax_amount?: number
  net_amount?: number
  payment_method?: string | null
  status?: AccountingTransactionStatus
  due_date?: string | null
  related_invoice_id?: string | null
  related_job_id?: string | null
  notes?: string | null
  attachments?: any
  metadata?: Record<string, any>
  created_by?: string | null
}

export interface AccountingTransactionFilters {
  fromDate?: string
  toDate?: string
  type?: AccountingTransactionType | 'all'
  status?: AccountingTransactionStatus | 'all'
  search?: string
}

export interface AccountingSummary {
  totalIncome: number
  totalExpenses: number
  totalTaxes: number
  netCashFlow: number
  pendingCount: number
  pendingAmount: number
}

const TABLE_NAME = 'accounting_transactions'

export async function fetchAccountingTransactions(
  companyId: string,
  filters: AccountingTransactionFilters = {}
) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Accounting] fetchAccountingTransactions start', { companyId, filters })
  }

  let query = supabaseTable(TABLE_NAME)
    .select('*')
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.fromDate) {
    query = query.gte('date', filters.fromDate)
  }

  if (filters.toDate) {
    query = query.lte('date', filters.toDate)
  }

  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.search) {
    query = query.or(
      `category.ilike.%${filters.search}%,sub_category.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('[Accounting] fetchAccountingTransactions error', error)
    throw error
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Accounting] fetchAccountingTransactions success', {
      companyId,
      count: data?.length ?? 0
    })
  }

  return data as AccountingTransaction[]
}

export async function createAccountingTransaction(input: AccountingTransactionInput) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Accounting] createAccountingTransaction start', input.company_id)
  }

  const payload = normalizeTransactionInput(input)

  const { data, error } = await supabaseTable(TABLE_NAME).insert(payload).select().single()

  if (error) {
    console.error('[Accounting] createAccountingTransaction error', error)
    throw error
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Accounting] createAccountingTransaction success', data?.id)
  }

  return data as AccountingTransaction
}

export async function updateAccountingTransaction(
  id: string,
  companyId: string,
  updates: Partial<AccountingTransactionInput>
) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Accounting] updateAccountingTransaction start', { id, companyId })
  }

  // Usar normalizeTransactionUpdate que maneja campos opcionales
  const payload = normalizeTransactionUpdate(updates, companyId)

  const { data, error } = await supabaseTable(TABLE_NAME)
    .update(payload)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) {
    console.error('[Accounting] updateAccountingTransaction error', error)
    throw error
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Accounting] updateAccountingTransaction success', id)
  }

  return data as AccountingTransaction
}

export async function deleteAccountingTransaction(id: string, companyId: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Accounting] deleteAccountingTransaction start', { id, companyId })
  }

  const { error } = await supabaseTable(TABLE_NAME).delete().eq('id', id).eq('company_id', companyId)

  if (error) {
    console.error('[Accounting] deleteAccountingTransaction error', error)
    throw error
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Accounting] deleteAccountingTransaction success', id)
  }
}

export function calculateAccountingSummary(transactions: AccountingTransaction[]): AccountingSummary {
  return transactions.reduce<AccountingSummary>(
    (acc, txn) => {
      const amount = Number(txn.amount || 0)
      const taxAmount = Number(txn.tax_amount || 0)

      if (txn.status === 'pending') {
        acc.pendingCount += 1
        acc.pendingAmount += amount
      }

      switch (txn.type) {
        case 'income':
          acc.totalIncome += amount
          acc.totalTaxes += taxAmount
          break
        case 'expense':
        case 'transfer':
        case 'adjustment':
          acc.totalExpenses += amount
          acc.totalTaxes += taxAmount
          break
        case 'tax':
          acc.totalTaxes += amount
          break
      }

      acc.netCashFlow = acc.totalIncome - acc.totalExpenses - acc.totalTaxes

      return acc
    },
    {
      totalIncome: 0,
      totalExpenses: 0,
      totalTaxes: 0,
      netCashFlow: 0,
      pendingCount: 0,
      pendingAmount: 0
    }
  )
}

function normalizeTransactionInput(input: AccountingTransactionInput) {
  return {
    company_id: input.company_id,
    date: input.date,
    type: input.type,
    category: input.category,
    sub_category: input.sub_category ?? null,
    amount: Number(input.amount || 0),
    currency: input.currency ?? 'EUR',
    tax_rate: input.tax_rate ?? 0,
    tax_amount: input.tax_amount ?? 0,
    net_amount:
      input.net_amount ?? Number(input.amount || 0) - Number(input.tax_amount ?? 0),
    payment_method: input.payment_method ?? null,
    status: input.status ?? 'paid',
    due_date: input.due_date ?? null,
    related_invoice_id: input.related_invoice_id ?? null,
    related_job_id: input.related_job_id ?? null,
    notes: input.notes ?? null,
    attachments: input.attachments ?? null,
    metadata: input.metadata ?? {},
    created_by: input.created_by ?? null
  }
}

// Helper para normalizar updates parciales (solo incluye campos presentes)
function normalizeTransactionUpdate(updates: Partial<AccountingTransactionInput>, companyId: string): Partial<Record<keyof AccountingTransactionInput, any>> {
  const payload: Partial<Record<keyof AccountingTransactionInput, any>> = {
    company_id: companyId
  }

  // Solo agregar campos que están presentes en updates
  if (updates.date !== undefined) payload.date = updates.date
  if (updates.type !== undefined) payload.type = updates.type
  if (updates.category !== undefined) payload.category = updates.category
  if (updates.sub_category !== undefined) payload.sub_category = updates.sub_category ?? null
  
  // Manejar amount y cálculos relacionados
  if (updates.amount !== undefined) {
    payload.amount = Number(updates.amount || 0)
    
    // Si se actualiza amount, recalcular tax_amount y net_amount si es necesario
    if (updates.tax_rate !== undefined) {
      payload.tax_rate = updates.tax_rate
      payload.tax_amount = payload.amount * (updates.tax_rate / 100)
      payload.net_amount = payload.amount - payload.tax_amount
    } else if (updates.tax_amount !== undefined) {
      payload.tax_amount = updates.tax_amount
      payload.net_amount = payload.amount - updates.tax_amount
    } else if (updates.net_amount !== undefined) {
      payload.net_amount = updates.net_amount
    }
  } else {
    // Si no se actualiza amount, solo actualizar tax_rate, tax_amount o net_amount si están presentes
    if (updates.tax_rate !== undefined) payload.tax_rate = updates.tax_rate
    if (updates.tax_amount !== undefined) payload.tax_amount = updates.tax_amount
    if (updates.net_amount !== undefined) payload.net_amount = updates.net_amount
  }
  
  if (updates.currency !== undefined) payload.currency = updates.currency ?? 'EUR'
  if (updates.payment_method !== undefined) payload.payment_method = updates.payment_method ?? null
  if (updates.status !== undefined) payload.status = updates.status ?? 'paid'
  if (updates.due_date !== undefined) payload.due_date = updates.due_date ?? null
  if (updates.related_invoice_id !== undefined) payload.related_invoice_id = updates.related_invoice_id ?? null
  if (updates.related_job_id !== undefined) payload.related_job_id = updates.related_job_id ?? null
  if (updates.notes !== undefined) payload.notes = updates.notes ?? null
  if (updates.attachments !== undefined) payload.attachments = updates.attachments ?? null
  if (updates.metadata !== undefined) payload.metadata = updates.metadata ?? {}
  if (updates.created_by !== undefined) payload.created_by = updates.created_by ?? null

  return payload
}

