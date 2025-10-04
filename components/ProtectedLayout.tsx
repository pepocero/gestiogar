'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  
  // Rutas públicas que no deben mostrar el sidebar
  const publicRoutes = [
    '/',           // Página de presentación
    '/auth/login', // Página de login
    '/auth/signup', // Página de registro
    '/auth/forgot-password', // Página de recuperar contraseña
  ]
  
  const isPublicRoute = publicRoutes.includes(pathname)
  
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
  
  // Para rutas protegidas, mostrar el layout con sidebar
  return (
    <Layout>
      {children}
    </Layout>
  )
}
