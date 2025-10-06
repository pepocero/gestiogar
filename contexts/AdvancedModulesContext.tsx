'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ModuleManager } from '@/lib/modules/moduleManager'
import { initializeDemoModule } from '@/lib/modules/initDemoModule'
import { Module, ModuleManifest } from '@/types/modules/module'
import { useAuth } from '@/contexts/AuthContext'

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
  const { company } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [manifests, setManifests] = useState<ModuleManifest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarItems, setSidebarItems] = useState<any[]>([])
  const [dashboardWidgets, setDashboardWidgets] = useState<any[]>([])
  const [headerActions, setHeaderActions] = useState<any[]>([])

  const loadAdvancedModules = async () => {
    if (!company?.id) {
      setModules([])
      setManifests([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('🔥 Inicializando sistema avanzado de módulos...')
      
      // TEMPORALMENTE DESHABILITADO para debugging
      // await initializeDemoModule()
      // await ModuleManager.initializeModulesFromDatabase()
      
      console.log('Sistema avanzado de módulos temporalmente deshabilitado')
      
      // TEMPORALMENTE DESHABILITADO - configuraciones por defecto
      setManifests([])
      setSidebarItems([])
      setDashboardWidgets([])
      setHeaderActions([])
      setModules([])
      
      console.log('✅ Sistema avanzado de módulos temporalmente deshabilitado')
      
    } catch (error: any) {
      console.error('❌ Error inicializando sistema avanzado de módulos:', error)
      setError(error?.message || 'Error inicializando módulos')
      
      // Si hay error, limpiar datos
      setModules([])
      setManifests([])
      setSidebarItems([])
      setDashboardWidgets([])
      setHeaderActions([])
    } finally {
      setLoading(false)
    }
  }

  const refreshModules = async () => {
    await loadAdvancedModules()
  }

  const getModuleManifest = (slug: string): ModuleManifest | null => {
    return ModuleManager.getModuleManifest(slug)
  }

  const executeModuleHook = async (slug: string, hookName: string, data?: any): Promise<any> => {
    try {
      return await ModuleManager.executeModuleHook(slug, hookName, data)
    } catch (error) {
      console.error(`Error ejecutando hook ${hookName} del módulo ${slug}:`, error)
      return null
    }
  }

  useEffect(() => {
    loadAdvancedModules()
  }, [company?.id])

  // Cargar estadísticas del sistema
  const stats = ModuleManager.getStats()

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

// Hook para obtener widgets del dashboard específicamente
export function useModuleDashboardWidgets() {
  const { dashboardWidgets } = useAdvancedModules()
  return dashboardWidgets
}

// Hook para obtener acciones del header específicamente
export function useModuleHeaderActions() {
  const { headerActions } = useAdvancedModules()
  return headerActions
}
