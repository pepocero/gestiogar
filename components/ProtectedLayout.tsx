'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { SessionGuard } from '@/components/auth/SessionGuard'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  
  // Rutas públicas que no deben mostrar el sidebar
  const publicRoutes = [
    '/',           // Página de presentación
    '/plans',      // Página de planes
    '/auth/login', // Página de login
    '/auth/register', // Página de registro (corregido)
    '/auth/signup', // Página de registro (alternativa)
    '/auth/forgot-password', // Página de recuperar contraseña
  ]
  
  // Normalizar pathname para comparar (eliminar trailing slash si existe)
  const normalizedPath = pathname.endsWith('/') && pathname !== '/' 
    ? pathname.slice(0, -1) 
    : pathname
  
  const isPublicRoute = publicRoutes.includes(normalizedPath)
  
  // Si es una ruta pública, mostrar solo el contenido sin sidebar
  if (isPublicRoute) {
    return <>{children}</>
  }
  
  // Si está cargando la autenticación, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  // Para rutas protegidas, mostrar el layout con sidebar y verificación de sesión
  // Se fuerza el remount del contenido por ruta para evitar estados de carga atrapados
  return (
    <SessionGuard>
      <Layout>
        <div key={pathname}>
          {children}
        </div>
      </Layout>
    </SessionGuard>
  )
}
