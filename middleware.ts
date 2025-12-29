import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/',
    '/plans',
    '/auth/login',
    '/auth/register'
  ]
  
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // Debug log para verificar qué está pasando
  console.log(`🔍 Middleware: ${pathname} - Public: ${isPublicRoute}`)
  
  // Si es una ruta pública, permitir acceso SIN verificar auth
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // TEMPORAL: Para todas las demás rutas PERMITIR acceso (sin verificación)
  // TODO: Implementar verificación real de tokens Supabase cuando esté listo
  console.log(`✅ Permitindo acceso a: ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|favicon.png).*)',
  ]
}
