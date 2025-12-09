// app/modules/holidays-vacations/src/hooks/useVacations.ts
import { useState, useEffect } from 'react'
import { VacationsService } from '../services/vacationsService'
import type { VacationRequest, VacationFormData, VacationStats, VacationBalance } from '../types/holiday'

export function useVacations() {
  const [vacations, setVacations] = useState<VacationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const refreshVacations = async () => {
    try {
      setLoading(true)
      const data = await VacationsService.getAll()
      setVacations(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error cargando solicitudes de vacaciones')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    refreshVacations()
  }, [])
  
  const createVacationRequest = async (vacation: VacationFormData, employeeId: string, employeeName: string) => {
    try {
      const nueva = await VacationsService.create(vacation, employeeId, employeeName)
      setVacations(prev => [nueva, ...prev])
      return nueva
    } catch (err: any) {
      setError(err.message || 'Error creando solicitud de vacaciones')
      throw err
    }
  }
  
  const updateVacationRequest = async (id: string, updates: Partial<VacationRequest>) => {
    try {
      const actualizada = await VacationsService.update(id, updates)
      setVacations(prev => 
        prev.map(v => v.id === id ? actualizada : v)
      )
      return actualizada
    } catch (err: any) {
      setError(err.message || 'Error actualizando solicitud de vacaciones')
      throw err
    }
  }
  
  const deleteVacationRequest = async (id: string) => {
    try {
      await VacationsService.delete(id)
      setVacations(prev => prev.filter(v => v.id !== id))
    } catch (err: any) {
      setError(err.message || 'Error eliminando solicitud de vacaciones')
      throw err
    }
  }
  
  const approveRequest = async (id: string, aprobadoPor: string, comentarios?: string) => {
    try {
      const aprobada = await VacationsService.approveRequest(id, aprobadoPor, comentarios)
      setVacations(prev => 
        prev.map(v => v.id === id ? aprobada : v)
      )
      return aprobada
    } catch (err: any) {
      setError(err.message || 'Error aprobando solicitud')
      throw err
    }
  }
  
  const rejectRequest = async (id: string, aprobadoPor: string, comentarios: string) => {
    try {
      const rechazada = await VacationsService.rejectRequest(id, aprobadoPor, comentarios)
      setVacations(prev => 
        prev.map(v => v.id === id ? rechazada : v)
      )
      return rechazada
    } catch (err: any) {
      setError(err.message || 'Error rechazando solicitud')
      throw err
    }
  }
  
  return {
    vacations,
    loading,
    error,
    refreshVacations,
    createVacationRequest,
    updateVacationRequest,
    deleteVacationRequest,
    approveRequest,
    rejectRequest
  }
}

export function usePendingVacations() {
  const [pendingVacations, setPendingVacations] = useState<VacationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const refreshPending = async () => {
    try {
      setLoading(true)
      const data = await VacationsService.getPendingRequests()
      setPendingVacations(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error cargando solicitudes pendientes')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    refreshPending()
  }, [])
  
  return {
    pendingVacations,
    loading,
    error,
    refreshPending
  }
}

export function useVacationsStats() {
  const [stats, setStats] = useState<VacationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const refreshStats = async () => {
    try {
      setLoading(true)
      const data = await VacationsService.getStats()
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

export function useVacationBalance(employeeId: string, year: number = new Date().getFullYear()) {
  const [balance, setBalance] = useState<VacationBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const refreshBalance = async () => {
    try {
      setLoading(true)
      const data = await VacationsService.getVacationBalance(employeeId, year)
      setBalance(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error cargando balance de vacaciones')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (employeeId) {
      refreshBalance()
    }
  }, [employeeId, year])
  
  const createBalance = async (employeeId: string, employeeName: string, year: number, diasDisponibles: number = 15) => {
    try {
      const nuevo = await VacationsService.createVacationBalance(employeeId, employeeName, year, diasDisponibles)
      setBalance(nuevo)
      return nuevo
    } catch (err: any) {
      setError(err.message || 'Error creando balance de vacaciones')
      throw err
    }
  }
  
  const updateBalance = async (updates: Partial<VacationBalance>) => {
    if (!employeeId || !balance) return
    
    try {
      const actualizado = await VacationsService.updateVacationBalance(employeeId, year, updates)
      setBalance(actualizado)
      return actualizado
    } catch (err: any) {
      setError(err.message || 'Error actualizando balance de vacaciones')
      throw err
    }
  }
  
  return {
    balance,
    loading,
    error,
    refreshBalance,
    createBalance,
    updateBalance
  }
}






