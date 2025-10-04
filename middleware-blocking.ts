import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rutas públicas - permitir acceso directo
  if (pathname === '/' || pathname === '/auth/login' || pathname === '/auth/register') {
    return NextResponse.next()
  }
  
  // Para cualquier otra ruta, redirigir a login
  return NextResponse.redirect(new URL('/auth/login', request.url))
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|favicon.png).*)',
  ]
}
