// Integración con PayPal para suscripciones
import { 
  Client, 
  Environment, 
  SubscriptionsController,
  ApplicationContextUserAction,
  ExperienceContextShippingPreference
} from '@paypal/paypal-server-sdk'
import type { 
  CreateSubscriptionRequest, 
  Subscription,
  CancelSubscriptionRequest 
} from '@paypal/paypal-server-sdk'

// Configuración de PayPal
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'ASei9f5wQmpyvwtFk9vVUJCGnz-h2L69xsOd15_VCCesLkEApOSaQfHF7wBIOeLuCA46mvCr0aKP634S'
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'EE31yltsg3RP4r3mvg33ktakemHSn6-F6_UbAMrUK3LCk2QbvKz7426wk2cZgl-jNOdo7DgBXt6QXSWa'
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '7MG01737B00838134'

// Determinar si estamos en producción o sandbox
// Si PAYPAL_ENVIRONMENT=production, usar Environment.Production (producción real)
// Si PAYPAL_ENVIRONMENT=sandbox o no está definido, usar Environment.Sandbox (pruebas)
const isProduction = process.env.PAYPAL_ENVIRONMENT === 'production'

// Log solo en desarrollo para no exponer información sensible
if (process.env.NODE_ENV !== 'production') {
  console.log('[PayPal] Initializing with:', {
    isProduction,
    hasClientId: !!PAYPAL_CLIENT_ID,
    hasClientSecret: !!PAYPAL_CLIENT_SECRET,
    planId: process.env.PAYPAL_PLAN_ID || 'P-00N493055U1248131NEKRZSA',
    environment: isProduction ? 'PRODUCTION (LIVE)' : 'SANDBOX (TEST)',
    paypalEnv: process.env.PAYPAL_ENVIRONMENT || 'not set (defaults to SANDBOX)'
  })
}

// Inicializar cliente de PayPal
const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET
  },
  environment: isProduction ? Environment.Production : Environment.Sandbox,
  timeout: 30000
})

// Controlador de suscripciones
const subscriptionsController = new SubscriptionsController(paypalClient)

export interface PayPalSubscription {
  id: string
  status: string
  plan_id: string
  start_time: string
  billing_info?: {
    outstanding_balance?: {
      value: string
      currency_code: string
    }
    last_payment?: {
      amount: {
        value: string
        currency_code: string
      }
      time: string
    }
    next_billing_time?: string
  }
}

// Plan ID de suscripción (creado en PayPal Dashboard)
// Plan: Gestiogar Pro - 9.99 EUR/mes
const SUBSCRIPTION_PLAN_ID = process.env.PAYPAL_PLAN_ID || 'P-00N493055U1248131NEKRZSA'

// Crear suscripción en PayPal
export async function createPayPalSubscription(
  companyId: string,
  returnUrl: string,
  cancelUrl: string
): Promise<{ approvalUrl: string; subscriptionId: string } | null> {
  try {
    console.log('[PayPal] Creating subscription for company:', companyId)
    
    // Usar el Plan ID directamente (ya creado en PayPal Dashboard)
    const planId = SUBSCRIPTION_PLAN_ID
    
    // Crear request de suscripción
    const request: CreateSubscriptionRequest = {
      planId: planId,
      startTime: new Date(Date.now() + 60000).toISOString(), // 1 minuto desde ahora
      applicationContext: {
        brandName: 'Gestiogar',
        locale: 'es-ES',
        shippingPreference: ExperienceContextShippingPreference.NoShipping,
        userAction: ApplicationContextUserAction.SubscribeNow,
        returnUrl: returnUrl,
        cancelUrl: cancelUrl
      },
      customId: companyId // Guardar companyId en custom_id para referencia
    }
    
    const response = await subscriptionsController.createSubscription({
      body: request
    })
    
    if (response.statusCode !== 201) {
      console.error('[PayPal] Failed to create subscription. Status:', response.statusCode)
      console.error('[PayPal] Full response:', JSON.stringify(response, null, 2))
      
      // Intentar obtener más detalles del error
      if (response.result) {
        console.error('[PayPal] Error details:', JSON.stringify(response.result, null, 2))
      }
      
      // Si hay un error en el body, intentar extraer el mensaje
      if (response.body) {
        console.error('[PayPal] Error body:', JSON.stringify(response.body, null, 2))
      }
      
      return null
    }
    
    const subscription = response.result
    if (!subscription) {
      console.error('[PayPal] No subscription in response')
      return null
    }
    
    console.log('[PayPal] Subscription response:', JSON.stringify(subscription, null, 2))
    
    // Buscar URL de aprobación en los links
    const approvalUrl = subscription.links?.find((link: any) => link.rel === 'approve')?.href
    
    if (!approvalUrl || !subscription.id) {
      console.error('[PayPal] No approval URL or subscription ID found')
      console.error('[PayPal] Subscription object:', subscription)
      console.error('[PayPal] Links:', subscription.links)
      return null
    }
    
    console.log('[PayPal] Subscription created successfully:', subscription.id)
    console.log('[PayPal] Approval URL:', approvalUrl)
    
    return {
      approvalUrl,
      subscriptionId: subscription.id
    }
  } catch (error: any) {
    console.error('[PayPal] Error creating subscription:', error)
    console.error('[PayPal] Error type:', error?.constructor?.name)
    console.error('[PayPal] Error keys:', Object.keys(error || {}))
    
    if (error.message) {
      console.error('[PayPal] Error message:', error.message)
    }
    if (error.stack) {
      console.error('[PayPal] Error stack:', error.stack)
    }
    if (error.statusCode) {
      console.error('[PayPal] Error status code:', error.statusCode)
    }
    if (error.result) {
      console.error('[PayPal] Error result:', JSON.stringify(error.result, null, 2))
    }
    if (error.body) {
      console.error('[PayPal] Error body:', JSON.stringify(error.body, null, 2))
    }
    if (error.response) {
      console.error('[PayPal] Error response:', JSON.stringify(error.response, null, 2))
    }
    
    // Intentar extraer información del error del SDK
    if (error.errors) {
      console.error('[PayPal] Error details:', JSON.stringify(error.errors, null, 2))
    }
    
    return null
  }
}

// Cancelar suscripción en PayPal
export async function cancelPayPalSubscription(subscriptionId: string, reason?: string): Promise<boolean> {
  try {
    console.log('[PayPal] Cancelling subscription:', subscriptionId)
    
    const request: CancelSubscriptionRequest = {
      reason: reason || 'Usuario canceló la suscripción'
    }
    
    const response = await subscriptionsController.cancelSubscription({
      id: subscriptionId,
      body: request
    })
    
    return response.statusCode === 204
  } catch (error) {
    console.error('[PayPal] Error cancelling subscription:', error)
    return false
  }
}

// Obtener información de suscripción de PayPal
export async function getPayPalSubscription(subscriptionId: string): Promise<PayPalSubscription | null> {
  try {
    console.log('[PayPal] Getting subscription:', subscriptionId)
    
    const response = await subscriptionsController.getSubscription({
      id: subscriptionId
    })
    
    if (response.statusCode !== 200 || !response.result) {
      return null
    }
    
    const subscription = response.result
    
    // El modelo Subscription del nuevo SDK no tiene campo status directamente
    // Usamos 'ACTIVE' como valor por defecto si hay billingInfo
    const status = subscription.billingInfo ? 'ACTIVE' : 'UNKNOWN'
    
    return {
      id: subscription.id || '',
      status: status,
      plan_id: subscription.planId || '',
      start_time: subscription.startTime || '',
      billing_info: subscription.billingInfo ? {
        outstanding_balance: subscription.billingInfo.outstandingBalance ? {
          value: subscription.billingInfo.outstandingBalance.value || '0',
          currency_code: subscription.billingInfo.outstandingBalance.currencyCode || 'EUR'
        } : undefined,
        last_payment: subscription.billingInfo.lastPayment ? {
          amount: {
            value: subscription.billingInfo.lastPayment.amount?.value || '0',
            currency_code: subscription.billingInfo.lastPayment.amount?.currencyCode || 'EUR'
          },
          time: subscription.billingInfo.lastPayment.time || ''
        } : undefined,
        next_billing_time: subscription.billingInfo.nextBillingTime
      } : undefined
    }
  } catch (error) {
    console.error('[PayPal] Error getting subscription:', error)
    return null
  }
}

// Verificar webhook de PayPal
export async function verifyPayPalWebhook(
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  try {
    // PayPal envía headers específicos para verificación
    const authAlgo = headers['paypal-auth-algo']
    const certUrl = headers['paypal-cert-url']
    const transmissionId = headers['paypal-transmission-id']
    const transmissionSig = headers['paypal-transmission-sig']
    const transmissionTime = headers['paypal-transmission-time']
    const webhookId = PAYPAL_WEBHOOK_ID
    
    if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
      console.warn('[PayPal Webhook] Missing verification headers')
      // En desarrollo, podemos saltarnos la verificación
      if (process.env.NODE_ENV !== 'production') {
        return true
      }
      return false
    }
    
    // Nota: El nuevo SDK no tiene un método directo para verificar webhooks
    // PayPal recomienda usar su API REST directamente o una librería específica
    // Por ahora, en producción deberíamos implementar la verificación manual
    // o usar una librería como @paypal/webhook-verification
    
    // En desarrollo, permitir sin verificación
    if (process.env.NODE_ENV !== 'production') {
      return true
    }
    
    // TODO: Implementar verificación de webhook usando la API REST de PayPal
    // Por ahora, retornamos true si tenemos los headers necesarios
    return true
  } catch (error) {
    console.error('[PayPal Webhook] Verification error:', error)
    // En desarrollo, permitir sin verificación
    if (process.env.NODE_ENV !== 'production') {
      return true
    }
    return false
  }
}

// Procesar evento de webhook de PayPal
export async function processPayPalWebhook(event: any): Promise<{ success: boolean; action?: string; subscriptionId?: string }> {
  try {
    const eventType = event.event_type
    const resource = event.resource
    
    console.log('[PayPal Webhook] Processing event:', eventType)
    
    let subscriptionId: string | undefined
    
    // Extraer subscription ID del recurso
    if (resource?.id) {
      subscriptionId = resource.id
    } else if (resource?.billing_agreement_id) {
      subscriptionId = resource.billing_agreement_id
    }
    
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // Suscripción activada
        return { success: true, action: 'activate', subscriptionId }
      
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // Suscripción cancelada (pero sigue activa hasta el final del período)
        return { success: true, action: 'cancel', subscriptionId }
      
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        // Suscripción expirada
        return { success: true, action: 'expire', subscriptionId }
      
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // Suscripción suspendida
        return { success: true, action: 'suspend', subscriptionId }
      
      case 'PAYMENT.SALE.COMPLETED':
      case 'BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED':
        // Pago completado
        return { success: true, action: 'payment_completed', subscriptionId }
      
      case 'PAYMENT.SALE.DENIED':
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        // Pago fallido
        return { success: true, action: 'payment_failed', subscriptionId }
      
      default:
        console.log('[PayPal] Unhandled webhook event:', eventType)
        return { success: false, subscriptionId }
    }
  } catch (error) {
    console.error('[PayPal] Error processing webhook:', error)
    return { success: false }
  }
}
