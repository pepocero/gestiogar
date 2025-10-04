export interface Module {
  id: string
  company_id: string
  name: string
  slug: string
  version: string
  description?: string
  icon: string
  is_active: boolean
  config: Record<string, any>
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ModuleData {
  id: string
  company_id: string
  module_id: string
  data: Record<string, any>
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ModuleConfig {
  title: string
  description: string
  icon: string
  routes: ModuleRoute[]
  permissions?: string[]
  database?: ModuleDatabaseConfig
}

export interface ModuleRoute {
  path: string
  component: string
  title: string
  icon: string
  permissions?: string[]
}

export interface ModuleDatabaseConfig {
  tables: ModuleTable[]
}

export interface ModuleTable {
  name: string
  description: string
  columns: ModuleColumn[]
}

export interface ModuleColumn {
  name: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'uuid'
  required: boolean
  description?: string
}

export interface ModuleManifest {
  name: string
  version: string
  description: string
  author: string
  license: string
  config: ModuleConfig
}
