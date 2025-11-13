'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getPlanLimits, canCreateItem, type PlanLimits } from '@/lib/subscription'

export function useSubscription() {
  const { company, profile } = useAuth()
  const [limits, setLimits] = useState<PlanLimits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (company?.id) {
      loadLimits()
    } else {
      setLoading(false)
    }
  }, [company?.id, profile?.email])

  const loadLimits = async () => {
    if (!company?.id) return

    try {
      setLoading(true)
      const userEmail = profile?.email || null
      const planLimits = await getPlanLimits(company.id, userEmail)
      setLimits(planLimits)
    } catch (error) {
      console.error('[useSubscription] Error loading limits:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkCanCreate = async (itemType: keyof PlanLimits) => {
    if (!company?.id) return { allowed: false, limit: null, current: 0 }

    const userEmail = profile?.email || null
    return await canCreateItem(company.id, itemType, userEmail)
  }

  // Una suscripción Pro está activa si:
  // 1. Tiene plan 'pro' y status 'active' y no ha expirado, O
  // 2. Tiene plan 'pro' y status 'cancelled' pero aún no ha expirado (mantiene acceso hasta el final del período pagado)
  // 3. Tiene status 'cancelled' pero aún no ha expirado Y tiene paypal_subscription_id (indica que tenía suscripción Pro)
  const hasNotExpired = !company?.subscription_ends_at || new Date(company.subscription_ends_at) > new Date()
  
  // Si tiene suscripción cancelada pero aún no ha expirado Y tiene paypal_subscription_id, es Pro
  const isCancelledButActive = company?.subscription_status === 'cancelled' && 
                                hasNotExpired && 
                                !!company?.paypal_subscription_id &&
                                !!company?.subscription_ends_at
  
  const isPro = (company?.subscription_plan === 'pro' && 
                (company?.subscription_status === 'active' || company?.subscription_status === 'cancelled') &&
                hasNotExpired) ||
                isCancelledButActive

  return {
    limits,
    loading,
    isPro,
    isFree: !isPro,
    checkCanCreate,
    refreshLimits: loadLimits
  }
}

