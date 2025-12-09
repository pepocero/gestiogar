import { supabaseTable } from '@/lib/supabase'

export type SubscriptionPlan = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'

export interface PlanLimits {
  max_jobs: number | null
  max_clients: number | null
  max_estimates: number | null
  max_invoices: number | null
  max_technicians: number | null
  max_insurance_companies: number | null
  max_suppliers: number | null
  max_materials: number | null
  max_appointments: number | null
  max_conversations: number | null
}

export interface CompanySubscription {
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  subscription_started_at: string | null
  subscription_ends_at: string | null
  paypal_subscription_id: string | null
  paypal_customer_id: string | null
}

export interface Subscription {
  id: string
  company_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  paypal_subscription_id: string | null
  paypal_customer_id: string | null
  amount: number | null
  currency: string
  started_at: string
  cancelled_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

// Límites por defecto del plan gratuito
export function getDefaultFreeLimits(): PlanLimits {
  return {
    max_jobs: 5,
    max_clients: 2,
    max_estimates: 2,
    max_invoices: 2,
    max_technicians: 2,
    max_insurance_companies: 2,
    max_suppliers: 2,
    max_materials: 2,
    max_appointments: 2,
    max_conversations: 1
  }
}

// Obtener límites del plan de una empresa
export async function getPlanLimits(companyId: string): Promise<PlanLimits> {
  try {
    // Obtener información de la empresa
    const { data: company, error: companyError } = await supabaseTable('companies')
      .select('subscription_plan, subscription_status, subscription_ends_at')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      console.warn('[Subscription] Company not found, using free plan limits')
      return getDefaultFreeLimits()
    }

    // Determinar si el plan está activo
    // Una suscripción está activa si:
    // 1. Tiene status 'active' y no ha expirado, O
    // 2. Tiene status 'cancelled' pero aún no ha expirado (mantiene acceso hasta el final del período pagado)
    const hasNotExpired = !company.subscription_ends_at || new Date(company.subscription_ends_at) > new Date()
    const isActive = 
      (company.subscription_status === 'active' || company.subscription_status === 'cancelled') && 
      hasNotExpired &&
      company.subscription_plan === 'pro'
    
    const plan: SubscriptionPlan = isActive ? company.subscription_plan : 'free'

    // Obtener límites del plan
    const { data: limits, error: limitsError } = await supabaseTable('plan_limits')
      .select('*')
      .eq('plan', plan)
      .single()

    if (limitsError || !limits) {
      console.warn('[Subscription] Plan limits not found, using free plan limits')
      return getDefaultFreeLimits()
    }

    return {
      max_jobs: limits.max_jobs,
      max_clients: limits.max_clients,
      max_estimates: limits.max_estimates,
      max_invoices: limits.max_invoices,
      max_technicians: limits.max_technicians,
      max_insurance_companies: limits.max_insurance_companies,
      max_suppliers: limits.max_suppliers,
      max_materials: limits.max_materials,
      max_appointments: limits.max_appointments,
      max_conversations: limits.max_conversations
    }
  } catch (error) {
    console.error('[Subscription] Error getting plan limits:', error)
    return getDefaultFreeLimits()
  }
}

// Verificar si una empresa puede crear más elementos de un tipo
export async function canCreateItem(
  companyId: string,
  itemType: keyof PlanLimits
): Promise<{ allowed: boolean; limit: number | null; current: number }> {
  const limits = await getPlanLimits(companyId)
  const limit = limits[itemType]

  // Plan Pro (ilimitado)
  if (limit === null) {
    return { allowed: true, limit: null, current: 0 }
  }

  // Obtener conteo actual
  const tableMap: Record<keyof PlanLimits, string> = {
    max_jobs: 'jobs',
    max_clients: 'clients',
    max_estimates: 'estimates',
    max_invoices: 'invoices',
    max_technicians: 'technicians',
    max_insurance_companies: 'insurance_companies',
    max_suppliers: 'suppliers',
    max_materials: 'materials',
    max_appointments: 'appointments',
    max_conversations: 'communications'
  }

  const table = tableMap[itemType]
  if (!table) {
    return { allowed: true, limit: null, current: 0 }
  }

  const { count, error } = await supabaseTable(table)
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  const current = count || 0
  const allowed = current < limit

  return { allowed, limit, current }
}

// Obtener información de suscripción de una empresa
export async function getCompanySubscription(companyId: string): Promise<CompanySubscription | null> {
  try {
    const { data, error } = await supabaseTable('companies')
      .select('subscription_plan, subscription_status, subscription_started_at, subscription_ends_at, paypal_subscription_id, paypal_customer_id')
      .eq('id', companyId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      subscription_plan: data.subscription_plan || 'free',
      subscription_status: data.subscription_status || 'active',
      subscription_started_at: data.subscription_started_at,
      subscription_ends_at: data.subscription_ends_at,
      paypal_subscription_id: data.paypal_subscription_id,
      paypal_customer_id: data.paypal_customer_id
    }
  } catch (error) {
    console.error('[Subscription] Error getting company subscription:', error)
    return null
  }
}

// Aplicar límite a una query (retorna los N más antiguos para plan free)
export function applyPlanLimit<T>(
  query: any,
  limit: number | null,
  orderBy: string = 'created_at',
  orderAscending: boolean = true
): any {
  if (limit === null) {
    // Plan Pro - sin límites, ordenar descendente por defecto
    return query.order(orderBy, { ascending: !orderAscending })
  }

  // Plan Free - aplicar límite ordenando por created_at (más antiguos primero)
  return query
    .order(orderBy, { ascending: orderAscending })
    .limit(limit)
}

// Obtener historial de suscripciones
export async function getSubscriptionHistory(companyId: string): Promise<Subscription[]> {
  try {
    const { data, error } = await supabaseTable('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Subscription] Error getting subscription history:', error)
      return []
    }

    return (data || []) as Subscription[]
  } catch (error) {
    console.error('[Subscription] Error getting subscription history:', error)
    return []
  }
}

// Actualizar estado de suscripción
export async function updateSubscriptionStatus(
  companyId: string,
  status: SubscriptionStatus,
  plan?: SubscriptionPlan
): Promise<boolean> {
  try {
    const updateData: any = {
      subscription_status: status
    }

    if (plan) {
      updateData.subscription_plan = plan
    }

    if (status === 'expired') {
      // Solo cambiar a plan free cuando realmente expire
      updateData.subscription_plan = 'free'
    }
    // Si se cancela, mantener el plan 'pro' hasta que expire

    const { error } = await supabaseTable('companies')
      .update(updateData)
      .eq('id', companyId)

    if (error) {
      console.error('[Subscription] Error updating subscription status:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Subscription] Error updating subscription status:', error)
    return false
  }
}

