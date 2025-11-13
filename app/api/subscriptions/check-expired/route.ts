import { NextRequest, NextResponse } from 'next/server'
import { checkAndUpdateAllExpiredSubscriptions, checkAndUpdateExpiredSubscription } from '@/lib/subscription'

// Verificar autenticación para cron jobs (opcional pero recomendado)
function verifyCronAuth(req: NextRequest): boolean {
  // Vercel envía un header especial para cron jobs
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Si hay un CRON_SECRET configurado, verificar que coincida
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`
  }
  
  // Si no hay CRON_SECRET, permitir si viene de Vercel Cron
  // Vercel envía el header 'x-vercel-cron' para cron jobs
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  
  // En desarrollo, permitir sin autenticación
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  // En producción sin CRON_SECRET, solo permitir desde Vercel Cron
  return isVercelCron
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación para cron jobs (solo si no viene de un usuario autenticado)
    const isCronRequest = !req.headers.get('authorization')?.startsWith('Bearer ') || 
                          req.headers.get('x-vercel-cron') === '1'
    
    if (isCronRequest && !verifyCronAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { companyId } = await req.json()

    // Si se proporciona un companyId, verificar solo esa empresa
    if (companyId) {
      const updated = await checkAndUpdateExpiredSubscription(companyId)
      return NextResponse.json({ 
        success: true, 
        updated,
        message: updated ? 'Subscription status updated' : 'Subscription is still active',
        timestamp: new Date().toISOString()
      })
    }

    // Si no se proporciona companyId, verificar todas las suscripciones
    const result = await checkAndUpdateAllExpiredSubscriptions()
    return NextResponse.json({ 
      success: true, 
      ...result,
      message: `Updated ${result.updated} expired subscriptions`,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[API] Error checking expired subscriptions:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// También permitir GET para facilitar llamadas desde cron jobs
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación para cron jobs
    if (!verifyCronAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    if (companyId) {
      const updated = await checkAndUpdateExpiredSubscription(companyId)
      return NextResponse.json({ 
        success: true, 
        updated,
        message: updated ? 'Subscription status updated' : 'Subscription is still active',
        timestamp: new Date().toISOString()
      })
    }

    const result = await checkAndUpdateAllExpiredSubscriptions()
    return NextResponse.json({ 
      success: true, 
      ...result,
      message: `Updated ${result.updated} expired subscriptions`,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[API] Error checking expired subscriptions:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

