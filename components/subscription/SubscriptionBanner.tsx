'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { AlertCircle, Crown, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function SubscriptionBanner() {
  const { company } = useAuth()
  
  if (!company) return null

  const isFree = company.subscription_plan === 'free' || !company.subscription_plan
  const isCancelled = company.subscription_status === 'cancelled'
  const isExpired = company.subscription_status === 'expired'
  
  // Si es Pro y está activo, no mostrar banner
  if (!isFree && !isCancelled && !isExpired) {
    return null
  }

  // Si está cancelado pero aún no expiró
  if (isCancelled && company.subscription_ends_at) {
    const endsAt = new Date(company.subscription_ends_at)
    const now = new Date()
    
    if (endsAt > now) {
      const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Suscripción cancelada
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Tu suscripción a Gestiogar Pro expirará en {daysLeft} día{daysLeft !== 1 ? 's' : ''}. 
                Después de esa fecha, volverás al plan gratuito con límites reducidos.
              </p>
              <div className="mt-3">
                <Link href="/settings/subscription">
                  <Button variant="outline" size="sm">
                    Reactivar suscripción
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  // Plan gratuito o expirado
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 mb-4">
      <div className="flex items-start">
        <Crown className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900">
            Estás en Gestiogar Free
          </h3>
          <p className="mt-1 text-sm text-blue-700">
            Actualiza a <strong>Gestiogar Pro</strong> por solo 9.99€/mes para desbloquear todas las funcionalidades sin límites.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Link href="/settings/subscription">
              <Button className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Actualizar a Pro
              </Button>
            </Link>
            <Link href="/settings/subscription" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Ver detalles →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

