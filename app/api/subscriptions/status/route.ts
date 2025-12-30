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

    // CRÍTICO: Verificar con PayPal si la suscripción está activa
    // Esta es la fuente de verdad, nunca confiar en datos locales
    let isActive = false
    try {
      isActive = await isProSubscriptionActive(companyId)
      console.log('[Subscription Status API] PayPal verification result:', { companyId, isActive })
    } catch (error: any) {
      // Si hay error al verificar con PayPal, asumir que NO está activa (fail-safe)
      console.error('[Subscription Status API] Error verifying with PayPal:', error)
      isActive = false
    }

    // También obtener información adicional de la suscripción para mostrar fechas
    // PERO NO usar esto para determinar si está activa
    const { data: company } = await supabaseAdminTable('companies')
      .select('subscription_status, subscription_started_at, subscription_ends_at, paypal_subscription_id')
      .eq('id', companyId)
      .single()

    return NextResponse.json({
      isActive, // Este es el valor real verificado con PayPal
      subscription_status: company?.subscription_status || null, // Solo para mostrar, no para determinar estado
      subscription_started_at: company?.subscription_started_at || null,
      subscription_ends_at: company?.subscription_ends_at || null,
      hasPayPalSubscriptionId: !!company?.paypal_subscription_id
    })
  } catch (error: any) {
    console.error('[Subscription Status API] Unexpected error:', error)
    // En caso de error inesperado, devolver isActive: false (fail-safe)
    return NextResponse.json(
      { 
        isActive: false, // Fail-safe: si hay error, asumir que NO está activa
        error: error.message || 'Error checking subscription status' 
      },
      { status: 500 }
    )
  }
}

