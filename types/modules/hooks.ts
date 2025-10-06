// Tipos específicos para el sistema de hooks

export const SYSTEM_HOOKS = {
  // Sidebar y navegación
  SIDEBAR_MENU: 'sidebar_menu',
  HEADER_ACTIONS: 'header_actions',
  
  // Dashboard y widgets  
  DASHBOARD_WIDGETS: 'dashboard_widgets',
  
  // Eventos de datos
  AFTER_CREATE: 'after_create',
  BEFORE_SAVE: 'before_save', 
  AFTER_UPDATE: 'after_update',
  BEFORE_DELETE: 'before_delete',
  AFTER_DELETE: 'after_delete',
  
  // Formularios
  FORM_FIELDS: 'form_fields',
  FORM_VALIDATION: 'form_validation',
  
  // Tablas
  TABLE_ACTIONS: 'table_actions',
  TABLE_COLUMNS: 'table_columns',
  
  // Notificaciones
  SEND_NOTIFICATION: 'send_notification',
  
  // Sistema
  MODULE_LOADED: 'module_loaded',
  MODULE_UNLOADED: 'module_unloaded'
} as const

export type SystemHook = typeof SYSTEM_HOOKS[keyof typeof SYSTEM_HOOKS]

// Tipos específicos para cada hook

export interface SidebarMenuItem {
  title: string
  icon: string
  href: string
  badge?: string
  children?: SidebarMenuItem[]
  permission?: string
}

export interface DashboardWidget {
  component: string
  priority: number
  width?: 'full' | 'half' | 'quarter'
  title?: string
  data?: any
}

export interface HeaderAction {
  icon: string
  label: string
  onClick: () => void
  permission?: string
}

export interface FormFieldHook {
  field: string
  component: string
  props?: Record<string, any>
}

export interface TableColumnHook {
  field: string
  header: string
  component: string
  props?: Record<string, any>
}

export interface TableActionHook {
  label: string
  icon: string
  onClick: (row: any) => void
  variant?: 'primary' | 'danger' | 'secondary'
}

export interface NotificationData {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

// Tipo genérico para todas las funciones de hook
export type HookFunction<T = any, R = any> = (data?: T) => R | Promise<R>

// Interfaces para hook listeners
export interface HookListener {
  id: string
  hook: SystemHook
  callback: HookFunction
  priority: number
  module: string
}

// Hook context que se pasa a las funciones
export interface HookContext {
  module: string
  timestamp: number
  metadata?: Record<string, any>
}
