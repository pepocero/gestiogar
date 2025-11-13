'use client'

import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { useModules } from '@/contexts/ModulesContext'
import DynamicModulePage from '@/components/modules/DynamicModulePage'

export default function ModulePageClient() {
  const params = useParams()
  const { modules, loading } = useModules()

  const currentModule = modules.find(module => module.slug === params.slug)

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
            <p className="mt-2 text-gray-600">Cargando módulo...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!currentModule) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Módulo no encontrado</h1>
          <p className="text-gray-600">
            El módulo solicitado no está instalado o no existe para tu empresa.
          </p>
        </Card>
      </div>
    )
  }

  if (!currentModule.config || !currentModule.config.fields) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentModule.name}</h1>
          <p className="text-gray-600">
            El módulo no tiene una configuración válida. Reinstálalo desde la tienda o vuelve a
            instalar el paquete correspondiente.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <DynamicModulePage
      moduleId={currentModule.id}
      moduleName={currentModule.name}
      config={currentModule.config}
    />
  )
}



