import { 
  HookFunction, 
  HookContext, 
  HookListener, 
  SystemHook,
  SYSTEM_HOOKS,
  SidebarMenuItem,
  DashboardWidget,
  HeaderAction,
  FormFieldHook,
  TableColumnHook,
  TableActionHook,
  NotificationData 
} from '@/types/modules/hooks'

export class HookManager {
  private static listeners: Map<string, HookListener[]> = new Map()
  private static subscriptions: Map<string, HookListener> = new Map()
  private static hookCounter = 0

  /**
   * Agregar un listener a un hook específico
   */
  static addHook<T = any, R = any>(
    hookName: SystemHook,
    callback: HookFunction<T, R>,
    module: string,
    priority: number = 10
  ): string {
    const subscriptionId = `hook_${++this.hookCounter}_${Date.now()}`
    
    const listener: HookListener = {
      id: subscriptionId,
      hook: hookName,
      callback,
      priority,
      module
    }

    // Agregar al listener
    if (!this.listeners.has(hookName)) {
      this.listeners.set(hookName, [])
    }
    
    const listeners = this.listeners.get(hookName)!
    listeners.push(listener)
    
    // Ordenar por prioridad (mayor prioridad primero)
    listeners.sort((a, b) => b.priority - a.priority)
    
    this.subscriptions.set(subscriptionId, listener)
    
    console.log(`Hook ${hookName} agregado por módulo ${module}`)
    return subscriptionId
  }

  /**
   * Remover un listener de hook
   */
  static removeHook(subscriptionId: string): void {
    const listener = this.subscriptions.get(subscriptionId)
    if (!listener) return

    const listeners = this.listeners.get(listener.hook)
    if (listeners) {
      const index = listeners.findIndex(l => l.id === subscriptionId)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }

    this.subscriptions.delete(subscriptionId)
    console.log(`Hook ${listener.hook} removido del módulo ${listener.module}`)
  }

  /**
   * Ejecutar todos los listeners de un hook
   */
  static async executeHook<T = any>(
    hookName: SystemHook,
    data: T,
    context?: Partial<HookContext>
  ): Promise<T> {
    const listeners = this.listeners.get(hookName)
    if (!listeners || listeners.length === 0) {
      return data
    }

    let result = data
    for (const listener of listeners) {
      try {
        const hookContext: HookContext = {
          module: listener.module,
          timestamp: Date.now(),
          ...context
        }

        result = await listener.callback(result, hookContext)
        
        // Si el hook retorna null, mantener el valor anterior
        if (result === null) {
          // No cambiar result, mantener el valor anterior
        }
      } catch (error) {
        console.error(`Error en hook ${hookName} del módulo ${listener.module}:`, error)
        // Continuar con el siguiente listener
      }
    }

    return result
  }

  /**
   * Ejecutar hook específico para módulos de sidebar
   */
  static async getSidebarMenuItems(): Promise<SidebarMenuItem[]> {
    const items: SidebarMenuItem[] = []
    
    const listeners = this.listeners.get(SYSTEM_HOOKS.SIDEBAR_MENU) || []
    for (const listener of listeners) {
      try {
        const result = await listener.callback()
        if (result && typeof result === 'object') {
          if (Array.isArray(result)) {
            items.push(...result)
          } else {
            items.push(result)
          }
        }
      } catch (error) {
        console.error(`Error en sidebar hook del módulo ${listener.module}:`, error)
      }
    }

    return items
  }

  /**
   * Ejecutar hook específico para widgets de dashboard
   */
  static async getDashboardWidgets(): Promise<DashboardWidget[]> {
    const widgets: DashboardWidget[] = []
    
    const listeners = this.listeners.get(SYSTEM_HOOKS.DASHBOARD_WIDGETS) || []
    for (const listener of listeners) {
      try {
        const result = await listener.callback()
        if (result && typeof result === 'object') {
          if (Array.isArray(result)) {
            widgets.push(...result)
          } else {
            widgets.push(result)
          }
        }
      } catch (error) {
        console.error(`Error en dashboard widget hook del módulo ${listener.module}:`, error)
      }
    }

    // Ordenar por prioridad
    widgets.sort((a, b) => b.priority - a.priority)
    
    return widgets
  }

  /**
   * Ejecutar hook específico para acciones de header
   */
  static async getHeaderActions(): Promise<HeaderAction[]> {
    const actions: HeaderAction[] = []
    
    const listeners = this.listeners.get(SYSTEM_HOOKS.HEADER_ACTIONS) || []
    for (const listener of listeners) {
      try {
        const result = await listener.callback()
        if (result && typeof result === 'object') {
          if (Array.isArray(result)) {
            actions.push(...result)
          } else {
            actions.push(result)
          }
        }
      } catch (error) {
        console.error(`Error en header actions hook del módulo ${listener.module}:`, error)
      }
    }

    return actions
  }

  /**
   * Limpiar todos los hooks de un módulo específico
   */
  static clearModuleHooks(moduleName: string): void {
    const toRemove: string[] = []
    
    for (const [subscriptionId, listener] of this.subscriptions.entries()) {
      if (listener.module === moduleName) {
        toRemove.push(subscriptionId)
      }
    }

    toRemove.forEach(id => this.removeHook(id))
    console.log(`Hooks limpiados para módulo ${moduleName}`)
  }

  /**
   * Obtener estadísticas de hooks
   */
  static getHookStats(): {
    totalHooks: number
    moduleCounts: Record<string, number>
    hookCounts: Record<string, number>
  } {
    const stats = {
      totalHooks: this.subscriptions.size,
      moduleCounts: {} as Record<string, number>,
      hookCounts: {} as Record<string, number>
    }

    for (const listener of this.subscriptions.values()) {
      // Contar por módulo
      stats.moduleCounts[listener.module] = (stats.moduleCounts[listener.module] || 0) + 1
      
      // Contar por hook
      stats.hookCounts[listener.hook] = (stats.hookCounts[listener.hook] || 0) + 1
    }

    return stats
  }
}

// Hook middleware helpers específicos para tipos comunes
export class HookMiddleware {
  /**
   * Middleware para datos después de crear
   */
  static async afterCreate<T extends { id: string }>(data: T, moduleName: string): Promise<T> {
    return HookManager.executeHook(SYSTEM_HOOKS.AFTER_CREATE, data, { module: moduleName })
  }

  /**
   * Middleware para datos antes de guardar
   */
  static async beforeSave<T>(data: T, moduleName: string): Promise<T> {
    return HookManager.executeHook(SYSTEM_HOOKS.BEFORE_SAVE, data, { module: moduleName })
  }

  /**
   * Middleware para datos después de actualizar
   */
  static async afterUpdate<T extends { id: string }>(data: T, moduleName: string): Promise<T> {
    return HookManager.executeHook(SYSTEM_HOOKS.AFTER_UPDATE, data, { module: moduleName })
  }

  /**
   * Middleware para datos antes de eliminar
   */
  static async beforeDelete<T>(id: string | number, moduleName: string): Promise<boolean> {
    const result = await HookManager.executeHook(SYSTEM_HOOKS.BEFORE_DELETE, { id }, { module: moduleName })
    return result !== false
  }

  /**
   * Enviar notificación
   */
  static async sendNotification(notification: NotificationData, moduleName: string): Promise<void> {
    await HookManager.executeHook(SYSTEM_HOOKS.SEND_NOTIFICATION, notification, { module: moduleName })
  }
}

console.log('Hook Manager inicializado')
