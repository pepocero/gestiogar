'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Module } from '@/types/module'
import { getModules } from '@/lib/modules'
import { useAuth } from './AuthContext'
import { conditionalLog } from '@/lib/performance'

interface ModulesContextType {
  modules: Module[]
  loading: boolean
  refreshModules: () => Promise<void>
}

const ModulesContext = createContext<ModulesContextType | undefined>(undefined)

export function ModulesProvider({ children }: { children: ReactNode }) {
  const { user, company } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  const loadModules = async () => {
    if (!company?.id) {
      conditionalLog('debug', '🔍 No company ID available, skipping module load')
      setModules([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      conditionalLog('debug', '🔄 Loading modules for company:', company.id)
      
      const data = await getModules()
      conditionalLog('debug', '📦 Raw modules data:', data)
      
      const activeModules = data.filter(module => module.is_active)
      conditionalLog('debug', '✅ Active modules:', activeModules)
      
      setModules(activeModules)
    } catch (error: any) {
      console.error('❌ Error loading modules:', error)
      
      // Si las tablas no existen, simplemente devolver lista vacía
      if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
        conditionalLog('debug', '📋 Modules tables not created yet, returning empty list')
        setModules([])
      } else {
        console.error('❌ Unexpected error loading modules:', error)
        setModules([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModules()
  }, [company?.id])

  const refreshModules = async () => {
    await loadModules()
  }

  const value: ModulesContextType = {
    modules,
    loading,
    refreshModules,
  }

  return (
    <ModulesContext.Provider value={value}>
      {children}
    </ModulesContext.Provider>
  )
}

export function useModules() {
  const context = useContext(ModulesContext)
  if (context === undefined) {
    throw new Error('useModules must be used within a ModulesProvider')
  }
  return context
}
