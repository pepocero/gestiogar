'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  getCompanySubscription, 
  getPlanLimits, 
  getSubscriptionHistory,
  canCreateItem,
  type PlanLimits as PlanLimitsType
} from '@/lib/subscription'
import { Crown, Check, X, Calendar, CreditCard, Zap, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { LimitIndicator } from '@/components/subscription/LimitIndicator'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PRO_PLAN_PRICE_FORMATTED } from '@/lib/constants'

function SubscriptionPageContent() {
  const { company, refreshProfile } = useAuth()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<any>(null)
  const [limits, setLimits] = useState<PlanLimitsType | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<Record<string, { current: number; limit: number | null }>>({})

  useEffect(() => {
    if (company?.id) {
      loadSubscriptionData()
    }
  }, [company?.id])

  const loadSubscriptionData = async () => {
    if (!company?.id) return

    try {
      setLoading(true)
      const [subData, limitsData, historyData] = await Promise.all([
        getCompanySubscription(company.id),
        getPlanLimits(company.id),
        getSubscriptionHistory(company.id)
      ])

      setSubscription(subData)
      setLimits(limitsData)
      setHistory(historyData)

      // Cargar uso actual
      await loadUsage()
    } catch (error) {
      console.error('Error loading subscription data:', error)
      toast.error('Error al cargar información de suscripción')
    } finally {
      setLoading(false)
    }
  }

  const loadUsage = async () => {
    if (!company?.id) return

    const usageData: Record<string, { current: number; limit: number | null }> = {}

    const checks = [
      { key: 'max_jobs', table: 'jobs' },
      { key: 'max_clients', table: 'clients' },
      { key: 'max_estimates', table: 'estimates' },
      { key: 'max_invoices', table: 'invoices' },
      { key: 'max_technicians', table: 'technicians' },
      { key: 'max_insurance_companies', table: 'insurance_companies' },
      { key: 'max_suppliers', table: 'suppliers' },
      { key: 'max_materials', table: 'materials' },
      { key: 'max_appointments', table: 'appointments' },
      { key: 'max_conversations', table: 'communications' }
    ]

    for (const check of checks) {
      const result = await canCreateItem(company.id, check.key as any)
      usageData[check.key] = {
        current: result.current,
        limit: result.limit
      }
    }

    setUsage(usageData)
  }

  // Verificar si hay parámetros de retorno de PayPal o si viene desde planes
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const subscriptionId = searchParams.get('subscription_id')
    const upgrade = searchParams.get('upgrade')

    // Si viene desde la página de planes con upgrade=true, iniciar proceso automáticamente
    if (upgrade === 'true' && company?.id && !loading) {
      // Esperar un momento para que los datos se carguen
      setTimeout(() => {
        handleUpgrade()
      }, 500)
    }

    if (success) {
      toast.success('¡Suscripción activada correctamente!')
      // Esperar un momento para que el webhook procese la actualización
      // Luego recargar datos y perfil
      setTimeout(async () => {
        // Recargar datos de suscripción
        await loadSubscriptionData()
        // Forzar recarga del perfil para obtener los datos actualizados de la empresa
        await refreshProfile()
      }, 2000)
    } else if (canceled) {
      toast('Suscripción cancelada. No se realizó ningún cargo.', {
        icon: 'ℹ️',
        duration: 4000
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, company?.id, loading])

  const handleUpgrade = async () => {
    if (!company?.id) {
      toast.error('No se pudo obtener la información de la empresa')
      return
    }

    try {
      toast.loading('Redirigiendo a PayPal...', { id: 'upgrade' })
      
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ companyId: company.id })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || 'Error al crear la suscripción'
        const errorDetails = data.details ? `\n\nDetalles: ${data.details}` : ''
        console.error('[Subscription] API Error:', {
          status: response.status,
          error: errorMessage,
          details: data.details
        })
        throw new Error(errorMessage + errorDetails)
      }

      if (data.approvalUrl) {
        console.log('[Subscription] Redirecting to PayPal:', data.approvalUrl)
        // Redirigir a PayPal para aprobar la suscripción
        window.location.href = data.approvalUrl
      } else {
        console.error('[Subscription] No approval URL received:', data)
        throw new Error('No se recibió la URL de aprobación de PayPal')
      }
    } catch (error: any) {
      console.error('[Subscription] Error upgrading subscription:', error)
      toast.error(error.message || 'Error al procesar la suscripción', { 
        id: 'upgrade',
        duration: 6000
      })
    }
  }

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de que quieres cancelar tu suscripción? Podrás seguir usando Pro hasta el final del período pagado.')) {
      return
    }

    if (!company?.paypal_subscription_id) {
      toast.error('No se encontró información de suscripción')
      return
    }

    try {
      toast.loading('Cancelando suscripción...', { id: 'cancel' })
      
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          subscriptionId: company.paypal_subscription_id,
          companyId: company.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar la suscripción')
      }

      toast.success('Suscripción cancelada. Seguirás teniendo acceso hasta el final del período pagado.', { id: 'cancel' })
      
      // Recargar datos y perfil para reflejar los cambios
      setTimeout(async () => {
        await loadSubscriptionData()
        await refreshProfile()
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar la suscripción', { id: 'cancel' })
      console.error('Error cancelling subscription:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Usar datos del contexto (company) como fuente principal, con fallback a subscription
  // Una suscripción Pro está activa si:
  // 1. Tiene plan 'pro' y status 'active' y no ha expirado, O
  // 2. Tiene plan 'pro' y status 'cancelled' pero aún no ha expirado (mantiene acceso hasta el final del período pagado)
  const hasNotExpired = !company?.subscription_ends_at || new Date(company.subscription_ends_at) > new Date()
  const isPro = ((company?.subscription_plan === 'pro' && (company?.subscription_status === 'active' || company?.subscription_status === 'cancelled')) ||
                (subscription?.subscription_plan === 'pro' && (subscription?.subscription_status === 'active' || subscription?.subscription_status === 'cancelled'))) &&
                hasNotExpired
  const isCancelled = company?.subscription_status === 'cancelled' || subscription?.subscription_status === 'cancelled'
  const isExpired = company?.subscription_status === 'expired' || subscription?.subscription_status === 'expired'
  
  // Verificar que la suscripción no haya expirado
  const subscriptionActive = isPro

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Suscripción</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu plan y límites de uso
        </p>
      </div>

      {/* Plan Actual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Plan Actual</h2>
            {isPro && (
              <Badge variant="success" className="flex items-center gap-1">
                <Crown className="h-4 w-4" />
                Gestiogar Pro
              </Badge>
            )}
            {!isPro && (
              <Badge variant="info" className="flex items-center gap-1">
                Gestiogar Free
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {subscriptionActive && (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Suscripción Pro activa</span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-800">
                    <strong>¡Tienes acceso completo!</strong> Todos los límites han sido eliminados. Puedes crear trabajos, clientes, presupuestos y facturas sin restricciones.
                  </p>
                </div>
                {(company?.subscription_started_at || subscription?.subscription_started_at) && (
                  <div className="text-sm text-gray-600">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Activa desde: {new Date((company?.subscription_started_at || subscription?.subscription_started_at)!).toLocaleDateString('es-ES')}
                  </div>
                )}
                {(company?.subscription_ends_at || subscription?.subscription_ends_at) && (
                  <div className="text-sm text-gray-600">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Renovación: {new Date((company?.subscription_ends_at || subscription?.subscription_ends_at)!).toLocaleDateString('es-ES')}
                  </div>
                )}
                {isCancelled && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Suscripción cancelada</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Tu suscripción seguirá activa hasta el final del período pagado ({company?.subscription_ends_at ? new Date(company.subscription_ends_at).toLocaleDateString('es-ES') : 'fecha no disponible'}).
                    </p>
                  </div>
                )}
                <Button variant="danger" onClick={handleCancel}>
                  Cancelar Suscripción
                </Button>
              </>
            )}

            {!subscriptionActive && (
              <>
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Estás en el plan gratuito con límites en el uso del sistema.
                  </p>
                  
                  {/* Límites actuales */}
                  {limits && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {limits.max_jobs !== null && (
                        <LimitIndicator
                          current={usage.max_jobs?.current || 0}
                          limit={limits.max_jobs}
                          label="Trabajos"
                          itemName="trabajos"
                        />
                      )}
                      {limits.max_clients !== null && (
                        <LimitIndicator
                          current={usage.max_clients?.current || 0}
                          limit={limits.max_clients}
                          label="Clientes"
                          itemName="clientes"
                        />
                      )}
                      {limits.max_estimates !== null && (
                        <LimitIndicator
                          current={usage.max_estimates?.current || 0}
                          limit={limits.max_estimates}
                          label="Presupuestos"
                          itemName="presupuestos"
                        />
                      )}
                      {limits.max_invoices !== null && (
                        <LimitIndicator
                          current={usage.max_invoices?.current || 0}
                          limit={limits.max_invoices}
                          label="Facturas"
                          itemName="facturas"
                        />
                      )}
                      {limits.max_technicians !== null && (
                        <LimitIndicator
                          current={usage.max_technicians?.current || 0}
                          limit={limits.max_technicians}
                          label="Técnicos"
                          itemName="técnicos"
                        />
                      )}
                      {limits.max_insurance_companies !== null && (
                        <LimitIndicator
                          current={usage.max_insurance_companies?.current || 0}
                          limit={limits.max_insurance_companies}
                          label="Aseguradoras"
                          itemName="aseguradoras"
                        />
                      )}
                      {limits.max_suppliers !== null && (
                        <LimitIndicator
                          current={usage.max_suppliers?.current || 0}
                          limit={limits.max_suppliers}
                          label="Proveedores"
                          itemName="proveedores"
                        />
                      )}
                      {limits.max_materials !== null && (
                        <LimitIndicator
                          current={usage.max_materials?.current || 0}
                          limit={limits.max_materials}
                          label="Materiales"
                          itemName="materiales"
                        />
                      )}
                      {limits.max_appointments !== null && (
                        <LimitIndicator
                          current={usage.max_appointments?.current || 0}
                          limit={limits.max_appointments}
                          label="Citas"
                          itemName="citas"
                        />
                      )}
                      {limits.max_conversations !== null && (
                        <LimitIndicator
                          current={usage.max_conversations?.current || 0}
                          limit={limits.max_conversations}
                          label="Conversaciones"
                          itemName="conversaciones"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Plan Pro */}
                <div className="mt-6 border-t pt-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="h-6 w-6 text-blue-600" />
                          <h3 className="text-xl font-bold text-gray-900">Gestiogar Pro</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                          Desbloquea todas las funcionalidades sin límites
                        </p>
                        <ul className="space-y-2 mb-4">
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-500" />
                            Trabajos ilimitados
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-500" />
                            Clientes ilimitados
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-500" />
                            Presupuestos y facturas ilimitados
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-500" />
                            Técnicos, aseguradoras y proveedores ilimitados
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-500" />
                            Materiales, citas y conversaciones ilimitados
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-500" />
                            Acceso completo a todas las funcionalidades
                          </li>
                        </ul>
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {PRO_PLAN_PRICE_FORMATTED} <span className="text-sm font-normal text-gray-600">/mes</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                          Cancela en cualquier momento. Sin pérdida de datos.
                        </p>
                        <Button 
                          className="flex items-center gap-2"
                          onClick={handleUpgrade}
                        >
                          <Zap className="h-4 w-4" />
                          Actualizar a Pro
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Historial de Suscripciones */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Historial de Suscripciones</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {history.map((sub) => (
                <div key={sub.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={sub.plan === 'pro' ? 'success' : 'info'}>
                        {sub.plan === 'pro' ? 'Gestiogar Pro' : 'Gestiogar Free'}
                      </Badge>
                      <Badge variant={
                        sub.status === 'active' ? 'success' :
                        sub.status === 'cancelled' ? 'warning' :
                        'danger'
                      }>
                        {sub.status === 'active' ? 'Activa' :
                         sub.status === 'cancelled' ? 'Cancelada' :
                         'Expirada'}
                      </Badge>
                    </div>
                    {sub.amount && (
                      <div className="text-sm font-medium text-gray-900">
                        {sub.amount} {sub.currency}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Inicio: {new Date(sub.started_at).toLocaleDateString('es-ES')}
                    </div>
                    {sub.expires_at && (
                      <div>
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Expira: {new Date(sub.expires_at).toLocaleDateString('es-ES')}
                      </div>
                    )}
                    {sub.cancelled_at && (
                      <div>
                        <X className="h-3 w-3 inline mr-1" />
                        Cancelada: {new Date(sub.cancelled_at).toLocaleDateString('es-ES')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    }>
      <SubscriptionPageContent />
    </Suspense>
  )
}

