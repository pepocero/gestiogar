// app/modules/holidays-vacations/src/services/holidaysService.ts
import { supabase, supabaseTable } from '@/lib/supabase'
import type { Holiday, HolidayFormData, HolidayStats } from '../types/holiday'

export class HolidaysService {
  static async getAll(): Promise<Holiday[]> {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('fecha', { ascending: true })
    
    if (error) throw error
    return data || []
  }
  
  static async getById(id: string): Promise<Holiday> {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }
  
  static async create(holiday: HolidayFormData): Promise<Holiday> {
    const { data, error } = await supabaseTable('holidays')
      .insert([holiday])
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  static async update(id: string, updates: Partial<HolidayFormData>): Promise<Holiday> {
    const { data, error } = await supabaseTable('holidays')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseTable('holidays')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
  
  // Métodos específicos del módulo
  static async getUpcomingHolidays(days: number = 30): Promise<Holiday[]> {
    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    const futureDateStr = futureDate.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .gte('fecha', today)
      .lte('fecha', futureDateStr)
      .order('fecha', { ascending: true })
    
    if (error) throw error
    return data || []
  }
  
  static async getHolidaysByType(tipo: string): Promise<Holiday[]> {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('tipo', tipo)
      .order('fecha', { ascending: true })
    
    if (error) throw error
    return data || []
  }
  
  static async getHolidaysByYear(year: number): Promise<Holiday[]> {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: true })
    
    if (error) throw error
    return data || []
  }
  
  static async getStats(): Promise<HolidayStats> {
    const [totalData, upcomingData, nationalData, companyData, localData] = await Promise.all([
      supabaseTable('holidays').select('*', { count: 'exact' }),
      this.getUpcomingHolidays(30),
      supabaseTable('holidays').select('*', { count: 'exact' }).eq('tipo', 'festivo_nacional'),
      supabaseTable('holidays').select('*', { count: 'exact' }).eq('tipo', 'festivo_empresa'),
      supabaseTable('holidays').select('*', { count: 'exact' }).eq('tipo', 'festivo_local')
    ])
    
    return {
      total_holidays: totalData.count || 0,
      upcoming_holidays: upcomingData,
      national_holidays: nationalData.count || 0,
      company_holidays: companyData.count || 0,
      local_holidays: localData.count || 0
    }
  }
  
  static async isHoliday(date: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('holidays')
      .select('id')
      .eq('fecha', date)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return !!data
  }
  
  static async createDefaultHolidays(): Promise<void> {
    const defaultHolidays = [
      { nombre: 'Año Nuevo', fecha: '2024-01-01', tipo: 'festivo_nacional', repetir_anual: true, aplica_todos: true },
      { nombre: 'Día de los Reyes Magos', fecha: '2024-01-06', tipo: 'festivo_nacional', repetir_anual: true, aplica_todos: true },
      { nombre: 'Día de San José', fecha: '2024-03-19', tipo: 'festivo_nacional', repetir_anual: true, aplica_todos: true },
      { nombre: 'Día del Trabajador', fecha: '2024-05-01', tipo: 'festivo_nacional', repetir_anual: true, aplica_todos: true },
      { nombre: 'Independencia de Colombia', fecha: '2024-07-20', tipo: 'festivo_nacional', repetir_anual: true, aplica_todos: true },
      { nombre: 'Batalla de Boyacá', fecha: '2024-08-07', tipo: 'festivo_nacional', repetir_anual: true, aplica_todos: true },
      { nombre: 'Día de la Raza', fecha: '2024-10-14', tipo: 'festivo_nacional', repetir_anual: true, aplica_todos: true },
      { nombre: 'Independencia de Cartagena', fecha: '2024-11-11', tipo: 'festivo_nacional', repetir_anual: true, aplica_todos: true },
      { nombre: 'Inmaculada Concepción', fecha: '2024-12-08', tipo: 'festivo_nacional', repetir_anual: true, aplica_todos: true },
      { nombre: 'Navidad', fecha: '2024-12-25', tipo: 'festivo_nacional', repetir_anual: true, aplica_todos: true }
    ]
    
    const { error } = await supabaseTable('holidays')
      .insert(defaultHolidays)
    
    if (error) throw error
  }
}




