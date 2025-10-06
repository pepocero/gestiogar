'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
// import { AdvancedModulesProvider } from '@/contexts/AdvancedModulesContext' // Solo para /module/*

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [shouldShowLayout, setShouldShowLayout] = useState(false)

  // Rutas que NO deben tener el layout completo
  const publicRoutes = ['/', '/auth/login', '/auth/register']
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // Solo las rutas /module/* necesitan módulos avanzados
  const isModuleRoute = pathname.startsWith('/module')

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicRoute) {
        // Redirigir a login si no hay usuario y no es ruta pública
        router.push('/auth/login')
      } else {
        // Mostrar layout solo para rutas protegidas
        setShouldShowLayout(!isPublicRoute && !!user)
      }
    }
  }, [user, loading, pathname, isPublicRoute, router])

  // Para rutas públicas (como landing page y auth), mostrar sin layout
  if (isPublicRoute) {
    return <>{children}</>
  }

  // CRÍTICO: Durante loading de rutas protegidas, mostrar loading state
  // NO permitir acceso sin autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <p className="ml-4 text-gray-600">Verificando autenticación...</p>
      </div>
    )
  }

  // Para rutas protegidas, mostrar con layout
  if (shouldShowLayout) {
    return (
      <Layout>
        {children}
      </Layout>
    )
  }

  // Estado de carga o redirección
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>
  )
}
