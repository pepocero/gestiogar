import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/',
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
  
  // Para rutas protegidas, simplemente redirigir por ahora
  // TODO: Implementar verificación real de autenticación
  const loginUrl = new URL('/auth/login', request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|favicon.png|logo.png).*)',
  ]
}

