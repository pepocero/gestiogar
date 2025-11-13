import { NextRequest, NextResponse } from 'next/server'
import { createPayPalSubscription } from '@/lib/paypal'
import { supabaseAdminTable } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await req.json()

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Verificar variables de entorno
    const paypalClientId = process.env.PAYPAL_CLIENT_ID
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET
    const paypalPlanId = process.env.PAYPAL_PLAN_ID

    if (!paypalClientId || !paypalClientSecret) {
      console.error('[API] PayPal credentials missing')
      return NextResponse.json(
        { error: 'PayPal configuration missing. Please check environment variables.' },
        { status: 500 }
      )
    }

    // URLs de retorno
    // Nota: PayPal NO acepta placeholders como {subscription_id} en las URLs
    // PayPal automáticamente agregará el subscription_id como parámetro al redirigir
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gestiogar.carlinitools.com'
    const returnUrl = `${baseUrl}/settings/subscription?success=true`
    const cancelUrl = `${baseUrl}/settings/subscription?canceled=true`
    
    console.log('[API] PayPal URLs:', { returnUrl, cancelUrl })

    console.log('[API] Creating subscription with:', {
      companyId,
      planId: paypalPlanId || 'P-00N493055U1248131NEKRZSA',
      returnUrl,
      cancelUrl
    })

    // Crear suscripción en PayPal
    let result
    try {
      result = await createPayPalSubscription(companyId, returnUrl, cancelUrl)
    } catch (paypalError: any) {
      console.error('[API] Exception in createPayPalSubscription:', paypalError)
      console.error('[API] Exception details:', {
        message: paypalError?.message,
        stack: paypalError?.stack,
        statusCode: paypalError?.statusCode,
        result: paypalError?.result,
        body: paypalError?.body
      })
      return NextResponse.json(
        { 
          error: 'Failed to create subscription in PayPal',
          details: process.env.NODE_ENV === 'development' ? paypalError?.message : undefined
        },
        { status: 500 }
      )
    }

    if (!result) {
      console.error('[API] createPayPalSubscription returned null')
      return NextResponse.json(
        { error: 'Failed to create subscription in PayPal. Check server logs for details.' },
        { status: 500 }
      )
    }

    // Guardar subscription_id temporalmente en la empresa (se actualizará cuando se active)
    const { error: dbError } = await supabaseAdminTable('companies')
      .update({
        paypal_subscription_id: result.subscriptionId
      })
      .eq('id', companyId)

    if (dbError) {
      console.error('[API] Error updating company:', dbError)
      // No fallar aquí, la suscripción ya se creó en PayPal
    }

    return NextResponse.json({
      approvalUrl: result.approvalUrl,
      subscriptionId: result.subscriptionId
    })
  } catch (error: any) {
    console.error('[API] Error creating subscription:', error)
    console.error('[API] Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

