import { supabaseTable } from '@/lib/supabase'
import { FREE_PLAN_ITEM_LIMIT } from '@/lib/constants'

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

// Límites por defecto del plan gratuito (3 items por sección)
export function getDefaultFreeLimits(): PlanLimits {
  return {
    max_jobs: FREE_PLAN_ITEM_LIMIT,
    max_clients: FREE_PLAN_ITEM_LIMIT,
    max_estimates: FREE_PLAN_ITEM_LIMIT,
    max_invoices: FREE_PLAN_ITEM_LIMIT,
    max_technicians: FREE_PLAN_ITEM_LIMIT,
    max_insurance_companies: FREE_PLAN_ITEM_LIMIT,
    max_suppliers: FREE_PLAN_ITEM_LIMIT,
    max_materials: FREE_PLAN_ITEM_LIMIT,
    max_appointments: FREE_PLAN_ITEM_LIMIT,
    max_conversations: FREE_PLAN_ITEM_LIMIT
  }
}

// Obtener límites del plan de una empresa
export async function getPlanLimits(companyId: string): Promise<PlanLimits> {
  try {
    // Obtener información de la empresa
    const { data: company, error: companyError } = await supabaseTable('companies')
      .select('subscription_plan, subscription_status, subscription_ends_at, paypal_subscription_id')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      console.warn('[Subscription] Company not found, using free plan limits')
      return getDefaultFreeLimits()
    }

    // CRÍTICO: La verificación del plan SIEMPRE debe hacerse desde PayPal
    // Si no hay paypal_subscription_id, es Free (no confiar en datos locales)
    let isPro = false
    
    if (company.paypal_subscription_id) {
      try {
        const { getPayPalSubscription } = await import('@/lib/paypal')
        const paypalSub = await getPayPalSubscription(company.paypal_subscription_id)
        
        // CRÍTICO: Solo considerar Pro si PayPal confirma EXPLÍCITAMENTE que el status es 'ACTIVE'
        if (paypalSub && paypalSub.status === 'ACTIVE') {
          isPro = true
          console.log('[Subscription] PayPal subscription is ACTIVE. Using Pro plan limits.')
        } else {
          // Si el status no es 'ACTIVE' o si paypalSub es null, usar Free
          console.warn('[Subscription] PayPal subscription is NOT ACTIVE. Subscription ID:', company.paypal_subscription_id, 'Status:', paypalSub?.status || 'null/error')
          isPro = false
        }
      } catch (error: any) {
        // Si falla la verificación de PayPal (401, 404, etc.), NO confiar en datos locales, usar Free
        console.error('[Subscription] Error checking PayPal subscription:', error)
        console.error('[Subscription] Error details:', {
          message: error?.message,
          statusCode: error?.statusCode,
          subscriptionId: company.paypal_subscription_id
        })
        isPro = false // Fail-safe: si hay error, usar Free
      }
    } else {
      // Si no hay paypal_subscription_id, es Free
      console.log('[Subscription] No PayPal subscription ID found, using free plan')
      isPro = false
    }
    
    const plan: SubscriptionPlan = isPro ? 'pro' : 'free'

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

// Verificar si una empresa tiene una suscripción Pro activa verificando con PayPal
// CRÍTICO: Esta función SIEMPRE debe verificar con PayPal, nunca confiar en datos locales
export async function isProSubscriptionActive(companyId: string): Promise<boolean> {
  try {
    // Obtener información de la empresa
    const { data: company, error: companyError } = await supabaseTable('companies')
      .select('paypal_subscription_id')
      .eq('id', companyId)
      .single()

    if (companyError || !company || !company.paypal_subscription_id) {
      console.log('[Subscription] No PayPal subscription ID found for company:', companyId)
      return false
    }

    // Verificar con PayPal (fuente de verdad)
    try {
      const { getPayPalSubscription } = await import('@/lib/paypal')
      const paypalSub = await getPayPalSubscription(company.paypal_subscription_id)
      
      // CRÍTICO: Solo considerar activa si:
      // 1. PayPal devuelve un objeto válido (no null)
      // 2. El status es EXACTAMENTE 'ACTIVE' (no 'APPROVED', 'SUSPENDED', etc.)
      if (!paypalSub) {
        console.warn('[Subscription] PayPal subscription not found or error:', company.paypal_subscription_id)
        return false
      }
      
      const isActive = paypalSub.status === 'ACTIVE'
      
      if (!isActive) {
        console.log('[Subscription] PayPal subscription is not ACTIVE. Status:', paypalSub.status, 'Subscription ID:', company.paypal_subscription_id)
      }
      
      return isActive
    } catch (error: any) {
      // Si hay un error al verificar con PayPal (401, 404, etc.), NO considerar activa
      console.error('[Subscription] Error checking PayPal subscription:', error)
      console.error('[Subscription] Error details:', {
        message: error?.message,
        statusCode: error?.statusCode,
        subscriptionId: company.paypal_subscription_id
      })
      return false // Fail-safe: si hay error, asumir que NO está activa
    }
  } catch (error) {
    console.error('[Subscription] Error checking if subscription is active:', error)
    return false // Fail-safe: si hay error, asumir que NO está activa
  }
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

