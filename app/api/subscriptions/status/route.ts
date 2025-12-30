import { NextRequest, NextResponse } from 'next/server'
import { isProSubscriptionActive } from '@/lib/subscription'
import { supabaseAdminTable } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      )
    }

    // Verificar con PayPal si la suscripción está activa
    const isActive = await isProSubscriptionActive(companyId)

    // También obtener información adicional de la suscripción para mostrar fechas
    const { data: company } = await supabaseAdminTable('companies')
      .select('subscription_status, subscription_started_at, subscription_ends_at, paypal_subscription_id')
      .eq('id', companyId)
      .single()

    return NextResponse.json({
      isActive,
      subscription_status: company?.subscription_status || null,
      subscription_started_at: company?.subscription_started_at || null,
      subscription_ends_at: company?.subscription_ends_at || null,
      hasPayPalSubscriptionId: !!company?.paypal_subscription_id
    })
  } catch (error: any) {
    console.error('[Subscription Status API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error checking subscription status' },
      { status: 500 }
    )
  }
}

