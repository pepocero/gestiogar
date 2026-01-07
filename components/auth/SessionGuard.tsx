'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface SessionGuardProps {
  children: React.ReactNode
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sessionChecked, setSessionChecked] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Timeout de seguridad: si loading está en true por más de 15 segundos, forzar redirección
  useEffect(() => {
    if (loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('[SessionGuard] Timeout de seguridad: loading está en true por más de 15 segundos')
        // Forzar recarga de la página para resetear el estado
        window.location.href = '/auth/login'
      }, 15000) // 15 segundos máximo
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [loading])

  useEffect(() => {
    if (!loading && !user && !sessionChecked) {
      setSessionChecked(true)
      // Redirigir sin mostrar toast confuso
      router.push('/auth/login')
    }
  }, [user, loading, sessionChecked, router])

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
