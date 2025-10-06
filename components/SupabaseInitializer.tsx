'use client'

import { useEffect } from 'react'
import { isSupabaseInitialized } from '@/hooks/useSupabase'
import { diagnoseSupabaseInstances } from '@/lib/supabase-diagnostics'
import { PERFORMANCE_CONFIG } from '@/lib/performance'
import { SupabaseMonitor } from './SupabaseMonitor'

interface SupabaseInitializerProps {
  children: React.ReactNode
  showMonitor?: boolean
}

export function SupabaseInitializer({ children, showMonitor = false }: SupabaseInitializerProps) {
  useEffect(() => {
    // Verificar que Supabase esté inicializado
    if (!isSupabaseInitialized()) {
      console.warn('⚠️ Supabase no está inicializado correctamente')
    } else {
      console.log('✅ Supabase inicializado correctamente')
    }

    // Ejecutar diagnóstico si está habilitado
    if (PERFORMANCE_CONFIG.SUPABASE.CHECK_INITIALIZATION && process.env.NODE_ENV === 'development') {
      const diagnosis = diagnoseSupabaseInstances()
      
      // Verificar si hay problemas
      if (!diagnosis.isInitialized || diagnosis.authListeners > 1) {
        console.warn('⚠️ Posibles problemas detectados:', diagnosis)
      }
    }
  }, [])

  return (
    <>
      {children}
      {showMonitor && <SupabaseMonitor showDetails={false} />}
    </>
  )
}
