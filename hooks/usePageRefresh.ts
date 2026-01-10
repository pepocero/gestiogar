'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface UsePageRefreshOptions {
  inactivityTimeout?: number // Tiempo de inactividad en ms
  loadingTimeout?: number // Tiempo máximo de carga en ms
  enabled?: boolean
}

export function usePageRefresh(options: UsePageRefreshOptions = {}) {
  const {
    inactivityTimeout = 300000, // 5 minutos por defecto
    loadingTimeout = 10000, // 10 segundos por defecto
    enabled = true
  } = options

  const router = useRouter()
  const pathname = usePathname()
  const lastActivityRef = useRef<number>(Date.now())
  const loadingStartRef = useRef<number | null>(null)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Actualizar última actividad
  const updateActivity = () => {
    lastActivityRef.current = Date.now()
  }

  // Verificar si hay inactividad
  const checkInactivity = () => {
    const now = Date.now()
    const timeSinceActivity = now - lastActivityRef.current

    if (timeSinceActivity > inactivityTimeout) {
      console.log('🔄 Inactividad detectada, refrescando página...')
      window.location.reload()
    }
  }

  useEffect(() => {
    if (!enabled) return

    // Eventos que indican actividad del usuario
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    // Verificar inactividad periódicamente
    inactivityTimerRef.current = setInterval(checkInactivity, 60000) // Cada minuto

    // Verificar cuando la página se vuelve visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Solo actualizar actividad cuando la página se vuelve visible
        // NO recargar automáticamente porque puede causar loops infinitos
        // especialmente en móvil cuando se bloquea/desbloquea la pantalla
        updateActivity()
        
        // Solo recargar si ha pasado mucho tiempo Y es una recarga manual del usuario
        // NO recargar automáticamente en visibilitychange para evitar loops
        // const timeSinceActivity = Date.now() - lastActivityRef.current
        // if (timeSinceActivity > inactivityTimeout) {
        //   console.log('🔄 Página inactiva por mucho tiempo, refrescando...')
        //   window.location.reload()
        // }
      } else if (document.visibilityState === 'hidden') {
        // Cuando la página se oculta, actualizar la última actividad para que el cálculo
        // sea más preciso cuando vuelva a ser visible
        updateActivity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
      
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current)
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, inactivityTimeout])

  // Función para forzar refresco en navegación
  const navigateWithRefresh = (path: string) => {
    const timeSinceActivity = Date.now() - lastActivityRef.current
    
    // Si ha pasado mucho tiempo, hacer hard refresh
    if (timeSinceActivity > inactivityTimeout) {
      window.location.href = path
    } else {
      router.push(path)
    }
  }

  // Detectar loading prolongado
  const startLoadingTimer = () => {
    loadingStartRef.current = Date.now()
  }

  const checkLoadingTimeout = () => {
    if (loadingStartRef.current) {
      const loadingTime = Date.now() - loadingStartRef.current
      
      if (loadingTime > loadingTimeout) {
        console.log('⚠️ Tiempo de carga excedido, refrescando página...')
        window.location.reload()
      }
    }
  }

  return {
    navigateWithRefresh,
    updateActivity,
    startLoadingTimer,
    checkLoadingTimeout,
    timeSinceLastActivity: () => Date.now() - lastActivityRef.current
  }
}

