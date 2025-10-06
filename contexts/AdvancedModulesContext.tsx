'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

// Tipos simplificados para compatibilidad
interface Module {
  name: string
  version: string
  [key: string]: any
}

interface ModuleManifest {
  name: string
  version: string
  description?: string
  author?: string
  [key: string]: any
}

interface AdvancedModulesContextType {
  modules: Module[]
  manifests: ModuleManifest[]
  loading: boolean
  error: string | null
  sidebarItems: any[]
  dashboardWidgets: any[]
  headerActions: any[]
  refreshModules: () => Promise<void>
  getModuleManifest: (slug: string) => ModuleManifest | null
  executeModuleHook: (slug: string, hookName: string, data?: any) => Promise<any>
  stats: {
    totalModules: number
    loadedModules: number
    totalHooks: number
    modulesByCategory: Record<string, number>
  }
}

const AdvancedModulesContext = createContext<AdvancedModulesContextType | undefined>(undefined)

export function AdvancedModulesProvider({ children }: { children: ReactNode }) {
  const [modules] = useState<Module[]>([])
  const [manifests] = useState<ModuleManifest[]>([])
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)
  const [sidebarItems] = useState<any[]>([])
  const [dashboardWidgets] = useState<any[]>([])
  const [headerActions] = useState<any[]>([])

  const refreshModules = async () => {
    // No-op: sistema legacy deshabilitado
  }

  const getModuleManifest = (slug: string): ModuleManifest | null => {
    return null
  }

  const executeModuleHook = async (slug: string, hookName: string, data?: any): Promise<any> => {
    return null
  }

  const stats = {
    totalModules: 0,
    loadedModules: 0,
    totalHooks: 0,
    modulesByCategory: {}
  }

  const value: AdvancedModulesContextType = {
    modules,
    manifests,
    loading,
    error,
    sidebarItems,
    dashboardWidgets,
    headerActions,
    refreshModules,
    getModuleManifest,
    executeModuleHook,
    stats
  }

  return (
    <AdvancedModulesContext.Provider value={value}>
      {children}
    </AdvancedModulesContext.Provider>
  )
}

export function useAdvancedModules(): AdvancedModulesContextType {
  const context = useContext(AdvancedModulesContext)
  if (context === undefined) {
    throw new Error('useAdvancedModules must be used within an AdvancedModulesProvider')
  }
  return context
}

// Hook para obtener elementos del sidebar específicamente
export function useModuleSidebarItems() {
  const { sidebarItems } = useAdvancedModules()
  return sidebarItems
}

// Hook para obtener widgets del dashboard
export function useModuleDashboardWidgets() {
  const { dashboardWidgets } = useAdvancedModules()
  return dashboardWidgets
}
