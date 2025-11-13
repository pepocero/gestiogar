import { NextRequest, NextResponse } from 'next/server'
import { cancelPayPalSubscription, getPayPalSubscription } from '@/lib/paypal'
import { supabaseAdminTable } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId, companyId } = await req.json()

    if (!subscriptionId || !companyId) {
      return NextResponse.json(
        { error: 'Subscription ID and Company ID are required' },
        { status: 400 }
      )
    }

    // Obtener información de la suscripción de PayPal antes de cancelar
    // para obtener la fecha de expiración (next_billing_time)
    const paypalSubscription = await getPayPalSubscription(subscriptionId)
    
    // Cancelar suscripción en PayPal
    const success = await cancelPayPalSubscription(
      subscriptionId,
      'Usuario canceló la suscripción desde el panel'
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel subscription in PayPal' },
        { status: 500 }
      )
    }

    // Obtener la fecha de expiración de PayPal si está disponible
    // Si PayPal tiene next_billing_time, esa es la fecha hasta la cual la suscripción sigue activa
    // Si no, usar la fecha actual de subscription_ends_at de la base de datos
    let expiresAt: string | null = null
    
    if (paypalSubscription?.billing_info?.next_billing_time) {
      // La fecha de next_billing_time es cuando se haría el próximo cargo
      // La suscripción sigue activa hasta esa fecha
      expiresAt = paypalSubscription.billing_info.next_billing_time
    } else {
      // Si no tenemos la fecha de PayPal, obtener la fecha actual de la base de datos
      const { data: company } = await supabaseAdminTable('companies')
        .select('subscription_ends_at')
        .eq('id', companyId)
        .single()
      
      if (company?.subscription_ends_at) {
        expiresAt = company.subscription_ends_at
      }
    }

    // Actualizar estado en la base de datos
    // IMPORTANTE: No cambiar el plan a 'free', solo cambiar el status a 'cancelled'
    // El plan 'pro' se mantiene hasta que expire la suscripción
    const updateData: any = {
      subscription_status: 'cancelled'
    }
    
    // Si tenemos una fecha de expiración de PayPal, actualizarla
    if (expiresAt) {
      updateData.subscription_ends_at = expiresAt
    }

    await supabaseAdminTable('companies')
      .update(updateData)
      .eq('id', companyId)
      .eq('paypal_subscription_id', subscriptionId)

    // Actualizar registro en historial
    await supabaseAdminTable('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .eq('paypal_subscription_id', subscriptionId)
      .order('created_at', { ascending: false })
      .limit(1)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Error cancelling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

