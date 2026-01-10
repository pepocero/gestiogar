'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface SessionGuardProps {
  children: React.ReactNode
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Solo redirigir cuando loading termina y no hay usuario
    // NO redirigir mientras está cargando para evitar loops
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Mostrar loading solo mientras realmente está cargando
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

  // Si no hay usuario después de cargar, mostrar loading mientras redirige
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
