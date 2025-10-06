import { Module, ModuleManifest } from '@/types/modules/module'
import { HookManager } from './hookManager'

export class ModuleLoader {
  private static loadedModules: Map<string, Module> = new Map()
  
  /**
   * Cargar un módulo desde su directorio
   */
  static async loadModule(slug: string, manifest: ModuleManifest): Promise<Module> {
    console.log(`Cargando módulo: ${slug}`)
    
    try {
      // Verificar si ya está cargado
      if (this.loadedModules.has(slug)) {
        console.warn(`Módulo ${slug} ya está cargado`)
        return this.loadedModules.get(slug)!
      }

      // Intentar importar el módulo dinámicamente
      // Para el sistema actual, aquí simularemos la carga
      const module = await this.importModuleFiles(slug, manifest)
      
      if (!module) {
        throw new Error(`No se pudo cargar el módulo ${slug}`)
      }

      // Registrar hooks si los hay
      this.registerModuleHooks(slug, module)

      // Ejecutar inicialización
      if (module.init) {
        await module.init()
      }

      // Agregar al registro
      this.loadedModules.set(slug, module)
      
      // Ejecutar hook de módulo cargado
      await HookManager.executeHook('MODULE_LOADED' as any, { slug, module })

      console.log(`Módulo ${slug} cargado exitosamente`)
      return module

    } catch (error) {
      console.error(`Error cargando módulo ${slug}:`, error)
      throw error
    }
  }

  /**
   * Desmontar un módulo
   */
  static async unloadModule(slug: string): Promise<void> {
    console.log(`Desmontando módulo: ${slug}`)
    
    const module = this.loadedModules.get(slug)
    if (!module) {
      console.warn(`Módulo ${slug} no está cargado`)
      return
    }

    try {
      // Ejecutar hook de módulo desmontado
      await HookManager.executeHook('MODULE_UNLOADED' as any, { slug, module })

      // Limpiar hooks del módulo
      HookManager.clearModuleHooks(slug)

      // Ejecutar cleanup si existe
      if (module.destroy) {
        await module.destroy()
      }

      // Remover del registro
      this.loadedModules.delete(slug)
      
      console.log(`Módulo ${slug} desmontado exitosamente`)
      
    } catch (error) {
      console.error(`Error desmontando módulo ${slug}:`, error)
      throw error
    }
  }

  /**
   * Obtener un módulo cargado
   */
  static getLoadedModule(slug: string): Module | null {
    return this.loadedModules.get(slug) || null
  }

  /**
   * Obtener todos los módulos cargados
   */
  static getAllLoadedModules(): Map<string, Module> {
    return new Map(this.loadedModules)
  }

  /**
   * Verificar si un módulo está cargado
   */
  static isModuleLoaded(slug: string): boolean {
    return this.loadedModules.has(slug)
  }

  /**
   * Importar archivos del módulo
   * Esta función simula la importación dinámica de archivos
   */
  private static async importModuleFiles(slug: string, manifest: ModuleManifest): Promise<Module | null> {
    console.log(`Importando archivos del módulo ${slug}...`)
    
    // Por ahora, simulamos un módulo básico basado en el manifest
    // En una implementación completa, aquí se importarían los archivos reales
    
    const mockModule: Module = {
      name: manifest.name,
      version: manifest.version,
      
      // Simular servicios básicos basados en el manifest
      services: this.createMockServices(manifest),
      
      // Simular hooks básicos
      hooks: {},
      
      // Middleware básico basado en las rutas e hooks definidos
      middleware: this.createMockMiddleware(manifest),
      
      // Inicialización básica
      init: () => {
        console.log(`Inicializando módulo ${manifest.name}`)
      },
      
      // Cleanup básico
      destroy: () => {
        console.log(`Destruyendo módulo ${manifest.name}`)
      }
    }

    return mockModule
  }

  /**
   * Crear servicios mock basados en el manifest
   */
  private static createMockServices(manifest: ModuleManifest): { [key: string]: any } | undefined {
    if (!manifest.database?.tables) return undefined

    const services: { [key: string]: any } = {}

    for (const tableName of manifest.database.tables) {
      const serviceName = tableName.replace(/s$/, '') // Remover 's' plural
      
      services[serviceName] = {
        getAll: async () => {
          console.log(`GetAll desde servicio mock de ${tableName}`)
          return []
        },
        getById: async (id: string) => {
          console.log(`GetById ${id} desde servicio mock de ${tableName}`)
          return null
        },
        create: async (data: any) => {
          console.log(`Create desde servicio mock de ${tableName}:`, data)
          return { id: Date.now().toString(), ...data }
        },
        update: async (id: string, data: any) => {
          console.log(`Update ${id} desde servicio mock de ${tableName}:`, data)
          return { id, ...data }
        },
        delete: async (id: string) => {
          console.log(`Delete ${id} desde servicio mock de ${tableName}`)
        },
        getTableName: () => tableName
      }
    }

    return services
  }

  /**
   * Crear middleware mock basado en el manifest
   */
  private static createMockMiddleware(manifest: ModuleManifest): { [key: string]: any } | undefined {
    if (!manifest.hooks || manifest.hooks.length === 0) return undefined

    const middleware: { [key: string]: any } = {}

    // Middleware para sidebar menu
    if (manifest.hooks.includes('sidebar_menu')) {
      middleware.sidebar_menu = () => ({
        title: manifest.displayName,
        icon: manifest.icon,
        href: `/module/${manifest.slug}`,
        module: manifest.slug
      })
    }

    // Middleware para dashboard widgets si hay rutas principales
    if (manifest.hooks.includes('dashboard_widgets')) {
      middleware.dashboard_widgets = () => ({
        component: 'ModuleWidgetMock',
        priority: 5,
        title: manifest.displayName,
        module: manifest.slug,
        data: { moduleName: manifest.name }
      })
    }

    // Middleware para eventos de datos
    if (manifest.hooks.includes('after_create')) {
      middleware.after_create = (data: any) => {
        console.log(`Módulo ${manifest.slug}: registro creado:`, data)
        return data
      }
    }

    if (manifest.hooks.includes('before_delete')) {
      middleware.before_delete = (data: any) => {
        console.log(`Módulo ${manifest.slug}: confirmando eliminación de:`, data)
        return true
      }
    }

    return Object.keys(middleware).length > 0 ? middleware : undefined
  }

  /**
   * Registrar hooks del módulo con el HookManager
   */
  private static registerModuleHooks(slug: string, module: Module): void {
    if (!module.middleware) return

    for (const [hookName, hookFunction] of Object.entries(module.middleware)) {
      // Registrar con HookManager
      HookManager.addHook(
        hookName as any,
        hookFunction,
        slug,
        5 // Prioridad media
      )
    }
  }

  /**
   * Obtener estadísticas de los módulos cargados
   */
  static getModuleStats(): {
    totalModules: number
    moduleNames: string[]
    totalServices: number
    totalHooks: number
  } {
    const stats = {
      totalModules: this.loadedModules.size,
      moduleNames: Array.from(this.loadedModules.keys()),
      totalServices: 0,
      totalHooks: 0
    }

    for (const module of this.loadedModules.values()) {
      if (module.services) {
        stats.totalServices += Object.keys(module.services).length
      }
      if (module.middleware) {
        stats.totalHooks += Object.keys(module.middleware).length
      }
    }

    return stats
  }
}

console.log('Module Loader inicializado')
