'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { PERFORMANCE_CONFIG } from '@/lib/performance'

interface SupabaseMonitorProps {
  showDetails?: boolean
}

export function SupabaseMonitor({ showDetails = false }: SupabaseMonitorProps) {
  const { supabase } = useSupabase()
  const [status, setStatus] = useState<{
    initialized: boolean
    session: any
    lastCheck: string
    instances: number
  }>({
    initialized: false,
    session: null,
    lastCheck: '',
    instances: 0
  })

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Verificar inicialización
        const initialized = !!(globalThis as any).__supabaseInitialized
        
        // Verificar sesión
        const { data: { session } } = await supabase.auth.getSession()
        
        // Contar instancias (aproximado)
        const instances = (window as any).__supabaseInstances || 1
        
        setStatus({
          initialized,
          session,
          lastCheck: new Date().toLocaleTimeString(),
          instances
        })
      } catch (error) {
        console.error('Error checking Supabase status:', error)
      }
    }

    // Verificar inmediatamente
    checkStatus()

    // Verificar periódicamente si está habilitado
    if (PERFORMANCE_CONFIG.SUPABASE.CHECK_INITIALIZATION && process.env.NODE_ENV === 'development') {
      const interval = setInterval(checkStatus, 30000) // Cada 30 segundos
      return () => clearInterval(interval)
    }
  }, [supabase])

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-xs z-50">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${
          status.initialized ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="font-medium">Supabase Monitor</span>
      </div>
      
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between">
          <span>Estado:</span>
          <span className={status.initialized ? 'text-green-600' : 'text-red-600'}>
            {status.initialized ? 'Inicializado' : 'No inicializado'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Sesión:</span>
          <span className={status.session ? 'text-green-600' : 'text-gray-500'}>
            {status.session ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Instancias:</span>
          <span className={status.instances === 1 ? 'text-green-600' : 'text-red-600'}>
            {status.instances}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Última verificación:</span>
          <span className="text-gray-500">{status.lastCheck}</span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-gray-500">
            <div>URL: {supabase.supabaseUrl}</div>
            <div>Storage: {typeof window !== 'undefined' ? 'Disponible' : 'No disponible'}</div>
          </div>
        </div>
      )}
    </div>
  )
}
