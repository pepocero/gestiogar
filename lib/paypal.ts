// Integración con PayPal para suscripciones
import paypal from '@paypal/checkout-server-sdk'

// Configuración de PayPal
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'ASei9f5wQmpyvwtFk9vVUJCGnz-h2L69xsOd15_VCCesLkEApOSaQfHF7wBIOeLuCA46mvCr0aKP634S'
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'EE31yltsg3RP4r3mvg33ktakemHSn6-F6_UbAMrUK3LCk2QbvKz7426wk2cZgl-jNOdo7DgBXt6QXSWa'
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '7MG01737B00838134'

// Determinar si estamos en producción o sandbox
// Si PAYPAL_ENVIRONMENT=production, usar LiveEnvironment (producción real)
// Si PAYPAL_ENVIRONMENT=sandbox o no está definido, usar SandboxEnvironment (pruebas)
const isProduction = process.env.PAYPAL_ENVIRONMENT === 'production'

// Log solo en desarrollo para no exponer información sensible
if (process.env.NODE_ENV !== 'production') {
  console.log('[PayPal] Initializing with:', {
    isProduction,
    hasClientId: !!PAYPAL_CLIENT_ID,
    hasClientSecret: !!PAYPAL_CLIENT_SECRET,
    planId: process.env.PAYPAL_PLAN_ID || 'P-00N493055U1248131NEKRZSA',
    environment: isProduction ? 'LIVE (PRODUCTION)' : 'SANDBOX (TEST)',
    paypalEnv: process.env.PAYPAL_ENVIRONMENT || 'not set (defaults to SANDBOX)'
  })
}

const environment = isProduction
  ? new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)

const client = new paypal.core.PayPalHttpClient(environment)

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
    
    // Crear suscripción
    const request = new paypal.billing.SubscriptionsCreateRequest()
    request.requestBody({
      plan_id: planId,
      start_time: new Date(Date.now() + 60000).toISOString(), // 1 minuto desde ahora
      subscriber: {
        email_address: '', // Se completará en el flujo de PayPal
      },
      application_context: {
        brand_name: 'Gestiogar',
        locale: 'es-ES',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: returnUrl,
        cancel_url: cancelUrl
      },
      custom_id: companyId // Guardar companyId en custom_id para referencia
    })
    
    const response = await client.execute(request)
    
    if (response.statusCode !== 201) {
      console.error('[PayPal] Failed to create subscription. Status:', response.statusCode)
      console.error('[PayPal] Response:', JSON.stringify(response, null, 2))
      
      // Intentar obtener más detalles del error
      if (response.result) {
        console.error('[PayPal] Error details:', response.result)
      }
      
      return null
    }
    
    const subscription = response.result
    console.log('[PayPal] Subscription response:', JSON.stringify(subscription, null, 2))
    
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
    return null
  }
}

// Cancelar suscripción en PayPal
export async function cancelPayPalSubscription(subscriptionId: string, reason?: string): Promise<boolean> {
  try {
    console.log('[PayPal] Cancelling subscription:', subscriptionId)
    
    const request = new paypal.billing.SubscriptionsCancelRequest(subscriptionId)
    request.requestBody({
      reason: reason || 'Usuario canceló la suscripción'
    })
    
    const response = await client.execute(request)
    
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
    
    const request = new paypal.billing.SubscriptionsGetRequest(subscriptionId)
    const response = await client.execute(request)
    
    if (response.statusCode !== 200) {
      return null
    }
    
    const subscription = response.result
    
    return {
      id: subscription.id || '',
      status: subscription.status || '',
      plan_id: subscription.plan_id || '',
      start_time: subscription.start_time || '',
      billing_info: subscription.billing_info ? {
        outstanding_balance: subscription.billing_info.outstanding_balance,
        last_payment: subscription.billing_info.last_payment,
        next_billing_time: subscription.billing_info.next_billing_time
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
    
    // Verificar webhook usando PayPal SDK
    const request = new paypal.notifications.WebhooksVerifyRequest()
    request.requestBody({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: JSON.parse(body)
    })
    
    const response = await client.execute(request)
    
    return response.statusCode === 200 && response.result.verification_status === 'SUCCESS'
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
