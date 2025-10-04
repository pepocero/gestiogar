import { Module, ModuleManifest } from '@/types/modules/module'
import { ModuleLoader as Loader } from './moduleLoader'
import { HookManager } from './hookManager'
import { getModules, Module as ModuleData } from '@/lib/modules'

export class ModuleManager {
  private static manifests: Map<string, ModuleManifest> = new Map()
  
  /**
   * Registrar un módulo desde su manifest
   */
  static async registerModule(manifest: ModuleManifest): Promise<Module> {
    console.log(`Registrando módulo: ${manifest.slug}`)
    
    try {
      // Validar manifest
      this.validateManifest(manifest)
      
      // Verificar dependencias si las hay
      await this.checkDependencies(manifest)
      
      // Cargar módulo
      const module = await Loader.loadModule(manifest.slug, manifest)
      
      // Almacenar manifest
      this.manifests.set(manifest.slug, manifest)
      
      console.log(`Módulo ${manifest.slug} registrado exitosamente`)
      return module
      
    } catch (error) {
      console.error(`Error registrando módulo ${manifest.slug}:`, error)
      throw error
    }
  }

  /**
   * Desregistrar un módulo
   */
  static async unregisterModule(slug: string): Promise<void> {
    console.log(`Desregistrando módulo: ${slug}`)
    
    try {
      // Desmontar módulo
      await Loader.unloadModule(slug)
      
      // Remover manifest
      this.manifests.delete(slug)
      
      console.log(`Módulo ${slug} desregistrado exitosamente`)
      
    } catch (error) {
      console.error(`Error desregistrando módulo ${slug}:`, error)
      throw error
    }
  }

  /**
   * Obtener manifest de un módulo
   */
  static getModuleManifest(slug: string): ModuleManifest | null {
    return this.manifests.get(slug) || null
  }

  /**
   * Obtener todos los manifests registrados
   */
  static getAllManifests(): ModuleManifest[] {
    return Array.from(this.manifests.values())
  }

  /**
   * Buscar módulos por query
   */
  static searchModules(query: string): ModuleManifest[] {
    const q = query.toLowerCase()
    return Array.from(this.manifests.values()).filter(manifest => 
      manifest.name.toLowerCase().includes(q) ||
      manifest.description.toLowerCase().includes(q) ||
      manifest.slug.toLowerCase().includes(q) ||
      (manifest.category && manifest.category.toLowerCase().includes(q))
    )
  }

  /**
   * Inicializar módulos desde base de datos
   */
  static async initializeModulesFromDatabase(): Promise<void> {
    console.log('Inicializando módulos desde base de datos...')
    
    try {
      const modulesData = await getModules()
      console.log(`Encontrados ${modulesData.length} módulos en la base de datos`)
      
      for (const moduleData of modulesData) {
        if (moduleData.is_active && moduleData.config) {
          try {
            const manifest = this.extractManifestFromModuleData(moduleData)
            await this.registerModule(manifest)
          } catch (error) {
            console.error(`Error inicializando módulo ${moduleData.slug}:`, error)
          }
        }
      }
      
      console.log('Inicialización de módulos completada')
      
    } catch (error) {
      console.error('Error inicializando módulos desde base de datos:', error)
    }
  }

  /**
   * Obtener registros de sidebar desde módulos activos
   */
  static async getSidebarItemsFromModules(): Promise<any[]> {
    try {
      return await HookManager.getSidebarMenuItems()
    } catch (error) {
      console.error('Error obteniendo elementos del sidebar desde módulos:', error)
      return []
    }
  }

  /**
   * Obtener widgets de dashboard desde módulos activos
   */
  static async getDashboardWidgetsFromModules(): Promise<any[]> {
    try {
      return await HookManager.getDashboardWidgets()
    } catch (error) {
      console.error('Error obteniendo widgets de dashboard desde módulos:', error)
      return []
    }
  }

  /**
   * Obtener acciones de header desde módulos activos
   */
  static async getHeaderActionsFromModules(): Promise<any[]> {
    try {
      return await HookManager.getHeaderActions()
    } catch (error) {
      console.error('Error obteniendo acciones de header desde módulos:', error)
      return []
    }
  }

  /**
   * Ejecutar hook específico del módulo
   */
  static async executeModuleHook<T>(
    slug: string,
    hookName: string,
    data?: T
  ): Promise<T | null> {
    try {
      const module = Loader.getLoadedModule(slug)
      if (!module || !module.middleware) {
        return null
      }

      const hookFunction = module.middleware[hookName]
      if (!hookFunction) {
        return null
      }

      return await hookFunction(data)

    } catch (error) {
      console.error(`Error ejecutando hook ${hookName} del módulo ${slug}:`, error)
      return null
    }
  }

  /**
   * Obtener estadísticas del manager
   */
  static getStats(): {
    totalModules: number
    loadedModules: number
    totalHooks: number
    modulesByCategory: Record<string, number>
  } {
    const manifestStats = {
      totalModules: this.manifests.size,
      loadedModules: Loader.getAllLoadedModules().size,
      totalHooks: HookManager.getHookStats().totalHooks,
      modulesByCategory: {} as Record<string, number>
    }

    // Contar por categoría
    for (const manifest of this.manifests.values()) {
      const category = manifest.category || 'otro'
      manifestStats.modulesByCategory[category] = (manifestStats.modulesByCategory[category] || 0) + 1
    }

    return manifestStats
  }

  /**
   * Validar manifest del módulo
   */
  private static validateManifest(manifest: ModuleManifest): void {
    const required = ['name', 'slug', 'version', 'description', 'fields', 'displayName']
    
    for (const field of required) {
      if (!manifest[field as keyof ModuleManifest]) {
        throw new Error(`Campo requerido faltante en manifest: ${field}`)
      }
    }

    if (!manifest.permissions || manifest.permissions.length === 0) {
      console.warn(`Módulo ${manifest.slug} sin permisos definidos`)
    }

    if (!manifest.hooks || manifest.hooks.length === 0) {
      console.warn(`Módulo ${manifest.slug} sin hooks definidos`)
    }
  }

  /**
   * Verificar dependencias del módulo
   */
  private static async checkDependencies(manifest: ModuleManifest): Promise<void> {
    if (!manifest.dependencies || manifest.dependencies.length === 0) return

    const missingDependencies: string[] = []

    for (const dependency of manifest.dependencies) {
      if (!this.manifests.has(dependency) && !Loader.isModuleLoaded(dependency)) {
        missingDependencies.push(dependency)
      }
    }

    if (missingDependencies.length > 0) {
      throw new Error(`Dependencias faltantes: ${missingDependencies.join(', ')}`)
    }
  }

  /**
   * Extraer manifest desde datos del módulo en base de datos
   */
  private static extractManifestFromModuleData(moduleData: ModuleData): ModuleManifest {
    const config = typeof moduleData.config === 'string' 
      ? JSON.parse(moduleData.config)
      : moduleData.config

    return {
      name: moduleData.name,
      slug: moduleData.slug,
      version: moduleData.version || '1.0.0',
      description: moduleData.description || '',
      icon: moduleData.icon || 'Package',
      fields: config.fields || [],
      displayName: config.displayName || moduleData.name,
      displayDescription: config.displayDescription || moduleData.description || '',
      hooks: config.hooks || [],
      routes: config.routes || [],
      permissions: config.permissions || [],
      dependencies: config.dependencies || [],
      database: config.database || { create_tables: false, tables: [] },
      category: config.category || 'otro'
    }
  }

  /**
   * Obtener todos los módulos cargados
   */
  static getAllLoadedModules(): Map<string, Module> {
    return Loader.getAllLoadedModules()
  }
}

console.log('Module Manager inicializado')
