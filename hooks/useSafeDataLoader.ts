import { useCallback, useRef, useEffect } from 'react'

/**
 * Hook para cargar datos de forma segura evitando loops infinitos
 * y múltiples cargas simultáneas
 */
export function useSafeDataLoader<T>(
  loadFn: () => Promise<T>,
  dependencies: any[],
  enabled: boolean = true
) {
  const loadingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const load = useCallback(async () => {
    if (!enabled || loadingRef.current || !mountedRef.current) {
      return
    }

    loadingRef.current = true
    try {
      await loadFn()
    } catch (error) {
      console.error('[useSafeDataLoader] Error loading data:', error)
    } finally {
      if (mountedRef.current) {
        loadingRef.current = false
      }
    }
  }, [loadFn, enabled])

  useEffect(() => {
    if (enabled) {
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return { load, isLoading: loadingRef.current }
}

