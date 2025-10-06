// app/modules/holidays-vacations/src/types/holiday.ts

export interface Holiday {
  id: string
  company_id: string
  nombre: string
  fecha: string
  tipo: 'festivo_nacional' | 'festivo_local' | 'festivo_empresa' | 'puente'
  repetir_anual: boolean
  descripcion?: string
  aplica_todos: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface VacationRequest {
  id: string
  company_id: string
  employee_id: string
  employee_name: string
  fecha_inicio: string
  fecha_fin: string
  dias_solicitados: number
  motivo: string
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  aprobado_por?: string
  comentarios_aprobacion?: string
  created_at: string
  updated_at: string
}

export interface VacationBalance {
  id: string
  company_id: string
  employee_id: string
  employee_name: string
  ano: number
  dias_disponibles: number
  dias_usados: number
  dias_pendientes: number
  dias_restantes: number
  created_at: string
  updated_at: string
}

export interface HolidayFormData {
  nombre: string
  fecha: string
  tipo: string
  repetir_anual: boolean
  descripcion?: string
  aplica_todos: boolean
}

export interface VacationFormData {
  fecha_inicio: string
  fecha_fin: string
  motivo: string
}

export interface HolidayStats {
  total_holidays: number
  upcoming_holidays: Holiday[]
  national_holidays: number
  company_holidays: number
  local_holidays: number
}

export interface VacationStats {
  total_requests: number
  pending_requests: number
  approved_requests: number
  rejected_requests: number
  average_days_per_request: number
}

