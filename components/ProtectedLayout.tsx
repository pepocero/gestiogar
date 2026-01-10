'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { SessionGuard } from '@/components/auth/SessionGuard'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

const publicRoutes = [
  '/',           // Página de presentación
  '/plans',      // Página de planes
  '/auth/login', // Página de login
  '/auth/register', // Página de registro (corregido)
  '/auth/signup', // Página de registro (alternativa)
  '/auth/forgot-password', // Página de recuperar contraseña
]

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname()
  const { loading } = useAuth()
  
  // Normalizar pathname para comparar (eliminar trailing slash si existe)
  const normalizedPath = pathname.endsWith('/') && pathname !== '/' 
    ? pathname.slice(0, -1) 
    : pathname
  
  const isPublicRoute = publicRoutes.includes(normalizedPath)
  
  // Si es una ruta pública, mostrar solo el contenido sin sidebar
  if (isPublicRoute) {
    return <>{children}</>
  }
  
  // Si está cargando la autenticación, mostrar loading (pero solo por un tiempo razonable)
  // El SessionGuard manejará las redirecciones si es necesario
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }
  
  // Para rutas protegidas, mostrar el layout con sidebar y verificación de sesión
  // NO forzar remount con key={pathname} ya que puede causar loops infinitos
  return (
    <SessionGuard>
      <Layout>
        {children}
      </Layout>
    </SessionGuard>
  )
}
