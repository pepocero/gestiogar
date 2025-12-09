// app/modules/holidays-vacations/src/hooks/useHolidays.ts
import { useState, useEffect } from 'react'
import { HolidaysService } from '../services/holidaysService'
import type { Holiday, HolidayFormData, HolidayStats } from '../types/holiday'

export function useHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const refreshHolidays = async () => {
    try {
      setLoading(true)
      const data = await HolidaysService.getAll()
      setHolidays(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error cargando días festivos')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    refreshHolidays()
  }, [])
  
  const createHoliday = async (holiday: HolidayFormData) => {
    try {
      const nuevo = await HolidaysService.create(holiday)
      setHolidays(prev => [...prev, nuevo])
      return nuevo
    } catch (err: any) {
      setError(err.message || 'Error creando día festivo')
      throw err
    }
  }
  
  const updateHoliday = async (id: string, updates: Partial<HolidayFormData>) => {
    try {
      const actualizado = await HolidaysService.update(id, updates)
      setHolidays(prev => 
        prev.map(h => h.id === id ? actualizado : h)
      )
      return actualizado
    } catch (err: any) {
      setError(err.message || 'Error actualizando día festivo')
      throw err
    }
  }
  
  const deleteHoliday = async (id: string) => {
    try {
      await HolidaysService.delete(id)
      setHolidays(prev => prev.filter(h => h.id !== id))
    } catch (err: any) {
      setError(err.message || 'Error eliminando día festivo')
      throw err
    }
  }
  
  return {
    holidays,
    loading,
    error,
    refreshHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday
  }
}

export function useHolidaysStats() {
  const [stats, setStats] = useState<HolidayStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const refreshStats = async () => {
    try {
      setLoading(true)
      const data = await HolidaysService.getStats()
      setStats(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error cargando estadísticas')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    refreshStats()
  }, [])
  
  return {
    stats,
    loading,
    error,
    refreshStats
  }
}

export function useUpcomingHolidays(days: number = 30) {
  const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const refreshUpcoming = async () => {
    try {
      setLoading(true)
      const data = await HolidaysService.getUpcomingHolidays(days)
      setUpcomingHolidays(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error cargando próximos días festivos')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    refreshUpcoming()
  }, [days])
  
  return {
    upcomingHolidays,
    loading,
    error,
    refreshUpcoming
  }
}






