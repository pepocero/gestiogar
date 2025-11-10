import { supabase, supabaseTable } from './supabase'
import { Module, ModuleData } from '@/types/module'
import { conditionalLog } from './performance'

export async function getTechnicians(companyId: string): Promise<any[]> {
  const { data, error } = await supabaseTable('technicians')
    .select('id, first_name, last_name, is_active')
    .eq('is_active', true)
    .order('first_name')

  if (error) {
    console.error('Error fetching technicians:', error)
    throw error
  }

  return data || []
}

export async function getModules(companyId: string): Promise<Module[]> {
  conditionalLog('debug', '🔍 getModules: Starting module fetch...', { companyId })
  
  const { data, error } = await supabaseTable('modules')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('❌ getModules: Error fetching modules:', error)
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    
    // Si es error de tabla no encontrada, devolver array vacío en lugar de lanzar error
    if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      conditionalLog('debug', '📋 getModules: Modules table not found, returning empty array')
      return []
    }
    throw error
  }

  conditionalLog('debug', '✅ getModules: Successfully fetched modules:', data)
  return data || []
}

export async function createModule(module: Partial<Module>): Promise<Module> {
  const { data, error } = await supabaseTable('modules')
    .insert([module])
    .select()
    .single()

  if (error){
    console.error('Error creating module:', error)
    throw error
  }

  return data
}

export async function updateModule(id: string, updates: Partial<Module>): Promise<Module> {
  const { data, error } = await supabaseTable('modules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating module:', error)
    throw error
  }

  return data
}

export async function deleteModule(id: string, companyId?: string): Promise<void> {
  let query = supabaseTable('modules')
    .delete()
    .eq('id', id)

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { error } = await query

  if (error) {
    console.error('Error deleting module:', error)
    throw error
  }
}

export async function getModuleData(moduleId: string, companyId?: string): Promise<ModuleData[]> {
  let query = supabaseTable('module_data')
    .select('*')
    .eq('module_id', moduleId)

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error && companyId) {
    console.warn('getModuleData fallback without company_id filter due to error:', error)
    const fallback = await supabaseTable('module_data')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at', { ascending: false })

    if (fallback.error) {
      console.error('Error fetching module data:', fallback.error)
      throw fallback.error
    }

    return fallback.data || []
  }

  if (error) {
    console.error('Error fetching module data:', error)
    throw error
  }

  return data || []
}

export async function createModuleData(data: Partial<ModuleData>): Promise<ModuleData> {
  if (!data.module_id) {
    throw new Error('module_id es requerido para crear datos del módulo')
  }

  const { data: result, error } = await supabaseTable('module_data')
    .insert([data])
    .select()
    .single()

  if (error) {
    console.error('Error creating module data:', error)
    throw error
  }

  return result
}

export async function updateModuleData(id: string, updates: Partial<ModuleData>, companyId?: string): Promise<ModuleData> {
  let query = supabaseTable('module_data')
    .update(updates)
    .eq('id', id)

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data, error } = await query.select().single()

  if (error) {
    console.error('Error updating module data:', error)
    throw error
  }

  return data
}

export async function deleteModuleData(id: string, companyId?: string): Promise<void> {
  let query = supabaseTable('module_data')
    .delete()
    .eq('id', id)

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { error } = await query

  if (error) {
    console.error('Error deleting module data:', error)
    throw error
  }
}

export function validateModuleManifest(manifest: any): boolean {
  const required = ['name', 'slug', 'version', 'description', 'fields', 'displayName']
  return required.every(field => manifest[field] !== undefined)
}

export function parseModuleFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const manifest = JSON.parse(content)
        
        if (!validateModuleManifest(manifest)) {
          reject(new Error('Manifest inválido: faltan campos requeridos'))
          return
        }
        
        resolve(manifest)
      } catch (error) {
        reject(new Error('Error procesando archivo del módulo'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Error leyendo archivo'))
    }
    
    reader.readAsText(file)
  })
}

export async function installModule(file: File, companyId: string, userId: string): Promise<Module> {
  try {
    const manifest = await parseModuleFile(file)
    
    const moduleData = {
      company_id: companyId,
      name: manifest.name,
      slug: manifest.slug,
      version: manifest.version,
      description: manifest.description,
      icon: manifest.icon || 'Package',
      is_active: true,
      config: manifest,
      created_by: userId
    }
    
    return await createModule(moduleData)
  } catch (error) {
    console.error('Error installing module:', error)
    throw error
  }
}
