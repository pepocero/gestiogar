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
  const redirectingRef = useRef(false)
  const mountedRef = useRef(true)

  // Marcar componente como montado
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Timeout de seguridad: si loading está en true por más de 15 segundos, forzar redirección
  useEffect(() => {
    if (loading && !redirectingRef.current) {
      loadingTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && !redirectingRef.current) {
          console.warn('[SessionGuard] Timeout de seguridad: loading está en true por más de 15 segundos')
          redirectingRef.current = true
          // Forzar recarga de la página para resetear el estado
          window.location.href = '/auth/login'
        }
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
        loadingTimeoutRef.current = null
      }
    }
  }, [loading])

  useEffect(() => {
    // Solo redirigir una vez, cuando loading termina y no hay usuario
    // Y solo si no estamos ya redirigiendo
    if (!loading && !user && !sessionChecked && !redirectingRef.current && mountedRef.current) {
      setSessionChecked(true)
      redirectingRef.current = true
      // Usar router.push en lugar de window.location para evitar recargas completas
      router.push('/auth/login')
    } else if (user && redirectingRef.current) {
      // Si el usuario aparece después de marcar como redirigiendo, resetear
      redirectingRef.current = false
      setSessionChecked(false)
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
