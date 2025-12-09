import { NextRequest, NextResponse } from 'next/server'
import { processPayPalWebhook, verifyPayPalWebhook } from '@/lib/paypal'
import { supabaseAdminTable } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headers = Object.fromEntries(req.headers.entries())

    // Verificar firma del webhook
    const isValid = await verifyPayPalWebhook(headers, body)
    if (!isValid) {
      console.error('[PayPal Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const result = await processPayPalWebhook(event)

    if (!result.success) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Procesar según el tipo de evento
    const subscriptionId = result.subscriptionId || event.resource?.id || event.resource?.billing_agreement_id

    if (!subscriptionId) {
      console.warn('[PayPal Webhook] No subscription ID found')
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Buscar empresa por subscription_id
    const { data: company } = await supabaseAdminTable('companies')
      .select('id')
      .eq('paypal_subscription_id', subscriptionId)
      .single()

    if (!company) {
      console.warn('[PayPal Webhook] Company not found for subscription:', subscriptionId)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Actualizar estado según el evento
    switch (result.action) {
      case 'activate':
        // Activar suscripción
        const expiresAt = event.resource?.billing_info?.next_billing_time
          ? new Date(event.resource.billing_info.next_billing_time)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días por defecto

        await supabaseAdminTable('companies')
          .update({
            subscription_plan: 'pro',
            subscription_status: 'active',
            subscription_started_at: new Date().toISOString(),
            subscription_ends_at: expiresAt.toISOString()
          })
          .eq('id', company.id)

        // Crear registro en historial
        await supabaseAdminTable('subscriptions')
          .insert({
            company_id: company.id,
            plan: 'pro',
            status: 'active',
            paypal_subscription_id: subscriptionId,
            amount: 9.99,
            currency: 'EUR',
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString()
          })

        console.log('[PayPal Webhook] Subscription activated for company:', company.id)
        break

      case 'cancel':
        // Marcar como cancelada (pero sigue activa hasta expires_at)
        // IMPORTANTE: No cambiar el plan a 'free', solo cambiar el status a 'cancelled'
        // El plan 'pro' se mantiene hasta que expire la suscripción
        
        // Obtener la fecha de expiración del evento de PayPal si está disponible
        // PayPal puede enviar next_billing_time en el evento, que indica hasta cuándo sigue activa
        const cancelExpiresAt = event.resource?.billing_info?.next_billing_time
          ? event.resource.billing_info.next_billing_time
          : null
        
        const cancelUpdateData: any = {
          subscription_status: 'cancelled'
        }
        
        // Si tenemos una fecha de expiración del evento, actualizarla
        if (cancelExpiresAt) {
          cancelUpdateData.subscription_ends_at = cancelExpiresAt
        }
        
        await supabaseAdminTable('companies')
          .update(cancelUpdateData)
          .eq('id', company.id)

        // Actualizar registro en historial
        await supabaseAdminTable('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('company_id', company.id)
          .eq('paypal_subscription_id', subscriptionId)
          .order('created_at', { ascending: false })
          .limit(1)

        console.log('[PayPal Webhook] Subscription cancelled for company:', company.id)
        break

      case 'expire':
        // Cambiar a plan free
        await supabaseAdminTable('companies')
          .update({
            subscription_plan: 'free',
            subscription_status: 'expired'
          })
          .eq('id', company.id)

        // Actualizar registro en historial
        await supabaseAdminTable('subscriptions')
          .update({
            status: 'expired'
          })
          .eq('company_id', company.id)
          .eq('paypal_subscription_id', subscriptionId)
          .order('created_at', { ascending: false })
          .limit(1)

        console.log('[PayPal Webhook] Subscription expired for company:', company.id)
        break

      case 'payment_completed':
        // Extender fecha de expiración
        const nextBilling = event.resource?.billing_info?.next_billing_time
        if (nextBilling) {
          const newExpiresAt = new Date(nextBilling)
          await supabaseAdminTable('companies')
            .update({
              subscription_ends_at: newExpiresAt.toISOString()
            })
            .eq('id', company.id)
        }
        console.log('[PayPal Webhook] Payment completed for company:', company.id)
        break
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[PayPal Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

