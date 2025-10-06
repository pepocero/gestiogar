import { useState, useEffect, useRef } from 'react'

interface UseOptimizedDataOptions {
  enabled?: boolean
  refetchInterval?: number
  staleTime?: number
}

export function useOptimizedData<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = [],
  options: UseOptimizedDataOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const lastFetchRef = useRef<number>(0)
  const { enabled = true, refetchInterval, staleTime = 30000 } = options

  const fetchData = async (force = false) => {
    if (!enabled) return

    const now = Date.now()
    
    // Si no es forzado y los datos son recientes, no hacer fetch
    if (!force && data && (now - lastFetchRef.current) < staleTime) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await fetchFn()
      setData(result)
      lastFetchRef.current = now
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, deps)

  useEffect(() => {
    if (refetchInterval) {
      const interval = setInterval(() => {
        fetchData()
      }, refetchInterval)

      return () => clearInterval(interval)
    }
  }, [refetchInterval])

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true)
  }
}
