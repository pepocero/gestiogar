// Tipos base para el sistema de módulos avanzado

export interface ModuleManifest {
  name: string
  slug: string
  version: string
  description: string
  author?: string
  icon: string
  category?: 'inventario' | 'vehiculos' | 'gastos' | 'personal' | 'proveedores' | 'otro'
  dependencies?: string[]
  permissions?: string[]
  routes?: ModuleRoute[]
  hooks?: string[]
  database?: {
    create_tables: boolean
    tables?: string[]
  }
  fields: ModuleField[]
  displayName: string
  displayDescription: string
}

export interface ModuleRoute {
  path: string
  component: string
  title: string
  protected?: boolean
}

export interface ModuleField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'time' | 'textarea' | 'select' | 'multiselect' | 'boolean'
  required: boolean
  description?: string
  validation?: string
  options?: { value: string; label: string }[]
  placeholder?: string
  defaultValue?: any
}

export interface ModuleService {
  getAll(): Promise<any[]>
  getById(id: string): Promise<any>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
  delete(id: string): Promise<void>
  [key: string]: any // Para métodos adicionales específicos del módulo
}

export interface ModuleHook {
  (data?: any): Promise<any> | any
}

export interface Module {
  name: string
  version: string
  services?: {
    [key: string]: ModuleService
  }
  hooks?: {
    [key: string]: (...args: any[]) => any
  }
  middleware?: {
    [hookName: string]: ModuleHook
  }
  init?: () => void | Promise<void>
  destroy?: () => void | Promise<void>
}

export interface ModuleContextValue {
  module: Module | null
  manifest: ModuleManifest | null
  services: {
    [key: string]: ModuleService
  }
  hooks: {
    [key: string]: (...args: any[]) => any
  }
}

// Tipos para el sistema de hooks
export type HookCallback<T = any> = (data: T) => T | Promise<T>

export interface HookSubscription {
  id: string
  callback: HookCallback
  priority: number
}

export interface HookManager {
  addHook<T>(hookName: string, callback: HookCallback<T>, priority?: number): string
  removeHook(subscriptionId: string): void
  executeHook<T>(hookName: string, data: T): Promise<T>
}

// Tipos para la carga de módulos
export interface ModuleLoader {
  loadModule(slug: string): Promise<Module>
  unloadModule(slug: string): void
  getLoadedModule(slug: string): Module | null
  getAllLoadedModules(): Module[]
}

// Tipos para el registro de módulos
export interface ModuleRegistry {
  registerModule(manifest: ModuleManifest): void
  unregisterModule(slug: string): void
  getModuleManifest(slug: string): ModuleManifest | null
  getAllManifests(): ModuleManifest[]
  searchModules(query: string): ModuleManifest[]
}
