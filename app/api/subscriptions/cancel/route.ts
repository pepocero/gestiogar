import { NextRequest, NextResponse } from 'next/server'
import { cancelPayPalSubscription } from '@/lib/paypal'
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

    // Actualizar estado en la base de datos
    await supabaseAdminTable('companies')
      .update({
        subscription_status: 'cancelled'
      })
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

