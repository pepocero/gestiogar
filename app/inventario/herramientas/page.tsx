'use client'

import React from 'react'
import { Card, Button } from '@/components/ui'
import { Wrench, Plus, Settings, BarChart } from 'lucide-react'
import { useAdvancedModules } from '@/contexts/AdvancedModulesContext'

export default function HerramientasPage() {
  let moduleManifest = null
  try {
    const { getModuleManifest } = useAdvancedModules()
    moduleManifest = getModuleManifest('inventario-herramientas')
  } catch (error) {
    console.error('Error loading advanced modules:', error)
    moduleManifest = null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Wrench className="h-8 w-8 mr-3 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {moduleManifest?.displayName || 'Inventario de Herramientas'}
            </h1>
            <p className="text-gray-600">
              {moduleManifest?.displayDescription || 'Gestión completa de herramientas'}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Herramienta
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Mantenimientos
          </Button>
          <Button variant="outline">
            <BarChart className="h-4 w-4 mr-2" />
            Reportes
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Herramientas</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Buenas Condiciones</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Necesitan Mantenimiento</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Wrench className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Averiadas</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Última Actividad</h3>
              <div className="text-center py-12 text-gray-500">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay herramientas registradas aún</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primera Herramienta
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Herramienta
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Programar Mantenimiento
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart className="h-4 w-4 mr-2" />
                  Generar Reporte
                </Button>
              </div>
            </div>
          </Card>

          {/* Module Info */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Información del Módulo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Versión:</span>
                  <span className="font-medium">{moduleManifest?.version || '1.0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Autor:</span>
                  <span className="font-medium">{moduleManifest?.author || 'GestioGar Team'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoría:</span>
                  <span className="font-medium">{moduleManifest?.category || 'inventario'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hooks Activos:</span>
                  <span className="font-medium">{moduleManifest?.hooks?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rutas:</span>
                  <span className="font-medium">{moduleManifest?.routes?.length || 0}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Module Debug Info */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Información de Debug</h3>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{JSON.stringify(moduleManifest, null, 2)}
            </pre>
          </div>
        </div>
      </Card>
   </div>
  )
}
