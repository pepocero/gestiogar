// app/modules/holidays-vacations/src/services/vacationsService.ts
import { supabase } from '@/lib/supabase'
import type { VacationRequest, VacationFormData, VacationStats, VacationBalance } from '../types/holiday'

export class VacationsService {
  static async getAll(): Promise<VacationRequest[]> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
  
  static async getById(id: string): Promise<VacationRequest> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }
  
  static async create(vacation: VacationFormData, employeeId: string, employeeName: string): Promise<VacationRequest> {
    // Calcular días solicitados
    const fechaInicio = new Date(vacation.fecha_inicio)
    const fechaFin = new Date(vacation.fecha_fin)
    const diasSolicitados = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    const vacationData = {
      ...vacation,
      employee_id: employeeId,
      employee_name: employeeName,
      dias_solicitados: diasSolicitados,
      estado: 'pendiente'
    }
    
    const { data, error } = await supabase
      .from('vacation_requests')
      .insert([vacationData])
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  static async update(id: string, updates: Partial<VacationRequest>): Promise<VacationRequest> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vacation_requests')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
  
  // Métodos específicos del módulo
  static async getPendingRequests(): Promise<VacationRequest[]> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }
  
  static async getRequestsByEmployee(employeeId: string): Promise<VacationRequest[]> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
  
  static async approveRequest(id: string, aprobadoPor: string, comentarios?: string): Promise<VacationRequest> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .update({
        estado: 'aprobada',
        aprobado_por: aprobadoPor,
        comentarios_aprobacion: comentarios,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  static async rejectRequest(id: string, aprobadoPor: string, comentarios: string): Promise<VacationRequest> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .update({
        estado: 'rechazada',
        aprobado_por: aprobadoPor,
        comentarios_aprobacion: comentarios,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  static async getStats(): Promise<VacationStats> {
    const [totalData, pendingData, approvedData, rejectedData] = await Promise.all([
      supabase.from('vacation_requests').select('*', { count: 'exact' }),
      supabase.from('vacation_requests').select('*', { count: 'exact' }).eq('estado', 'pendiente'),
      supabase.from('vacation_requests').select('*', { count: 'exact' }).eq('estado', 'aprobada'),
      supabase.from('vacation_requests').select('*', { count: 'exact' }).eq('estado', 'rechazada')
    ])
    
    // Calcular promedio de días por solicitud
    const { data: requestsData } = await supabase
      .from('vacation_requests')
      .select('dias_solicitados')
      .eq('estado', 'aprobada')
    
    const totalDays = requestsData?.reduce((sum, req) => sum + req.dias_solicitados, 0) || 0
    const averageDays = requestsData?.length ? totalDays / requestsData.length : 0
    
    return {
      total_requests: totalData.count || 0,
      pending_requests: pendingData.count || 0,
      approved_requests: approvedData.count || 0,
      rejected_requests: rejectedData.count || 0,
      average_days_per_request: Math.round(averageDays * 10) / 10
    }
  }
  
  static async getVacationBalance(employeeId: string, year: number = new Date().getFullYear()): Promise<VacationBalance | null> {
    const { data, error } = await supabase
      .from('vacation_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('ano', year)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }
  
  static async createVacationBalance(employeeId: string, employeeName: string, year: number, diasDisponibles: number = 15): Promise<VacationBalance> {
    const balanceData = {
      employee_id: employeeId,
      employee_name: employeeName,
      ano: year,
      dias_disponibles: diasDisponibles,
      dias_usados: 0,
      dias_pendientes: 0,
      dias_restantes: diasDisponibles
    }
    
    const { data, error } = await supabase
      .from('vacation_balances')
      .insert([balanceData])
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  static async updateVacationBalance(employeeId: string, year: number, updates: Partial<VacationBalance>): Promise<VacationBalance> {
    const { data, error } = await supabase
      .from('vacation_balances')
      .update(updates)
      .eq('employee_id', employeeId)
      .eq('ano', year)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  static async getVacationsByDateRange(startDate: string, endDate: string): Promise<VacationRequest[]> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('estado', 'aprobada')
      .or(`and(fecha_inicio.gte.${startDate},fecha_inicio.lte.${endDate}),and(fecha_fin.gte.${startDate},fecha_fin.lte.${endDate}),and(fecha_inicio.lte.${startDate},fecha_fin.gte.${endDate})`)
      .order('fecha_inicio', { ascending: true })
    
    if (error) throw error
    return data || []
  }
}

