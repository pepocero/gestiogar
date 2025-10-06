'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!loading && !user && !sessionChecked) {
      setSessionChecked(true)
      toast.error('Sesión expirada. Redirigiendo al login...')
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    }
  }, [user, loading, sessionChecked, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
