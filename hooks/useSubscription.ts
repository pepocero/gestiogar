'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getPlanLimits, canCreateItem, type PlanLimits } from '@/lib/subscription'

export function useSubscription() {
  const { company } = useAuth()
  const [limits, setLimits] = useState<PlanLimits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (company?.id) {
      loadLimits()
    } else {
      setLoading(false)
    }
  }, [company?.id])

  const loadLimits = async () => {
    if (!company?.id) return

    try {
      setLoading(true)
      const planLimits = await getPlanLimits(company.id)
      setLimits(planLimits)
    } catch (error) {
      console.error('[useSubscription] Error loading limits:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkCanCreate = async (itemType: keyof PlanLimits) => {
    if (!company?.id) return { allowed: false, limit: null, current: 0 }

    return await canCreateItem(company.id, itemType)
  }

  // Una suscripción Pro está activa si:
  // 1. Tiene plan 'pro' y status 'active' y no ha expirado, O
  // 2. Tiene plan 'pro' y status 'cancelled' pero aún no ha expirado (mantiene acceso hasta el final del período pagado)
  const hasNotExpired = !company?.subscription_ends_at || new Date(company.subscription_ends_at) > new Date()
  const isPro = company?.subscription_plan === 'pro' && 
                (company?.subscription_status === 'active' || company?.subscription_status === 'cancelled') &&
                hasNotExpired

  return {
    limits,
    loading,
    isPro,
    isFree: !isPro,
    checkCanCreate,
    refreshLimits: loadLimits
  }
}

