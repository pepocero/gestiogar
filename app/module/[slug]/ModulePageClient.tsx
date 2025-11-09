'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui'
import { Modal, Input, Badge } from '@/components/ui'
import { Plus, Edit, Trash2, Eye, Calendar, FileText, ChevronDown, ChevronRight, Users, Clock, Truck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useModules } from '@/contexts/ModulesContext'
import { getModuleData, createModuleData, updateModuleData, deleteModuleData, getTechnicians, updateModule } from '@/lib/modules'
import { getLatestModuleConfig } from '@/lib/module-updates'
import { logger } from '@/lib/logger'
import toast from 'react-hot-toast'

interface ModuleDataItem {
  id: string
  data: any
  created_at: string
  updated_at: string
}

export default function ModulePageClient() {
  const params = useParams()
  const { company, user } = useAuth()
  const { modules, loading: modulesLoading } = useModules()
  const [moduleData, setModuleData] = useState<ModuleDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ModuleDataItem | null>(null)
  const [selectedItem, setSelectedItem] = useState<ModuleDataItem | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [technicians, setTechnicians] = useState<any[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Obtener el módulo actual basado en el slug de la URL
  const currentModule = modules.find(m => m.slug === params.slug)
  
  // Debug: Ver la configuración del módulo
  logger.debug('Current module:', currentModule)
  logger.config('Module config:', currentModule?.config)
  logger.config('Module fields:', currentModule?.config?.fields)

  const loadModuleData = async () => {
    if (!currentModule?.id || !company?.id) {
      setModuleData([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getModuleData(currentModule.id, company.id)
      setModuleData(data)
    } catch (error: any) {
      console.error('Error loading module data:', error)
      toast.error('Error cargando datos del módulo')
    } finally {
      setLoading(false)
    }
  }

  const loadTechnicians = async () => {
    if (!company?.id) {
      setTechnicians([])
      return
    }

    try {
      logger.debug('Loading technicians...')
      const data = await getTechnicians(company.id)
      logger.data('Technicians loaded:', data)
      setTechnicians(data)
    } catch (error: any) {
      logger.error('Error loading technicians:', error)
      setTechnicians([])
    }
  }

  useEffect(() => {
    if (!company?.id) {
      setLoading(false)
      return
    }

    loadModuleData()
    loadTechnicians()
  }, [currentModule?.id, company?.id])

  // Limpiar estado al desmontar el componente para evitar problemas de navegación
  useEffect(() => {
    return () => {
      // Limpiar estados que pueden causar problemas de navegación
      setExpandedRows(new Set())
      setFormData({})
      setEditingItem(null)
      setSelectedItem(null)
      setShowModal(false)
      setShowViewModal(false)
      setShowDeleteModal(false)
      
      // Limpiar logs en producción
      if (process.env.NODE_ENV === 'production') {
        logger.info('Cleaning up module state...')
      }
    }
  }, [])

  const resetForm = () => {
    setFormData({})
    setEditingItem(null)
    setShowModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentModule?.id || !company?.id || !user?.id) {
      toast.error('Faltan datos necesarios')
      return
    }

    try {
      const dataToSave = {
        company_id: company.id,
        module_id: currentModule.id,
        data: formData,
        created_by: user.id
      }

      if (editingItem) {
        await updateModuleData(editingItem.id, { data: formData }, company.id)
        toast.success('Registro actualizado correctamente')
      } else {
        await createModuleData(dataToSave)
        toast.success('Registro creado correctamente')
      }

      resetForm()
      loadModuleData()
    } catch (error: any) {
      logger.error('Error saving module data:', error)
      toast.error('Error guardando datos')
    }
  }

  const handleEdit = (item: ModuleDataItem) => {
    setEditingItem(item)
    setFormData(item.data)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!selectedItem) return

    try {
      if (!company?.id) {
        toast.error('No se pudo obtener la empresa actual')
        return
      }
      await deleteModuleData(selectedItem.id, company.id)
      toast.success('Registro eliminado correctamente')
      setShowDeleteModal(false)
      setSelectedItem(null)
      loadModuleData()
    } catch (error: any) {
      logger.error('Error deleting module data:', error)
      toast.error('Error eliminando registro')
    }
  }

  const handleView = (item: ModuleDataItem) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  // Función para alternar la expansión de una fila
  const toggleRowExpansion = (itemId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Función para verificar si una fila está expandida
  const isRowExpanded = (itemId: string) => {
    return expandedRows.has(itemId)
  }

  // Función para comparar versiones semánticas
  const compareVersions = (version1: string, version2: string): number => {
    const v1parts = version1.split('.').map(Number)
    const v2parts = version2.split('.').map(Number)
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0
      const v2part = v2parts[i] || 0
      
      if (v1part > v2part) return 1
      if (v1part < v2part) return -1
    }
    
    return 0
  }

  // Función para incrementar versión automáticamente
  const incrementVersion = (currentVersion: string, type: 'patch' | 'minor' | 'major' = 'patch'): string => {
    const parts = currentVersion.split('.').map(Number)
    
    switch (type) {
      case 'major':
        return `${parts[0] + 1}.0.0`
      case 'minor':
        return `${parts[0]}.${parts[1] + 1}.0`
      case 'patch':
      default:
        return `${parts[0]}.${parts[1]}.${parts[2] + 1}`
    }
  }

  // Función genérica para actualizar cualquier módulo
  const updateModuleFromStore = async () => {
    if (!currentModule?.id) return
    
    try {
      logger.update('Checking module update...')
      
      // Obtener la configuración más reciente desde la configuración centralizada
      const latestUpdate = getLatestModuleConfig(currentModule.slug)
      
      // Si no hay configuración actualizada disponible, mostrar mensaje
      if (!latestUpdate) {
        toast('ℹ️ No hay actualizaciones disponibles para este módulo.')
        logger.info('No updates available for this module')
        return
      }
      
      // Verificar si el módulo necesita actualización
      const currentConfig = currentModule.config
      const currentVersion = currentModule.version
      const latestConfig = latestUpdate.config
      const latestVersion = latestUpdate.version
      
      // Comparar configuraciones
      const configChanged = JSON.stringify(currentConfig) !== JSON.stringify(latestConfig)
      const versionComparison = compareVersions(latestVersion, currentVersion)
      const needsUpdate = configChanged || versionComparison > 0
      
      if (!needsUpdate) {
        toast.success('✅ El módulo ya está actualizado. No se realizaron cambios.')
        logger.success('Module is already up to date')
        return
      }
      
      logger.update('Updating module...')
      logger.data(`Version: ${currentVersion} → ${latestVersion}`)
      logger.data(`Config changed: ${configChanged}`)
      
      if (latestUpdate.changelog) {
        logger.info('Changelog:', latestUpdate.changelog)
      }
      
      await updateModule(currentModule.id, {
        config: latestConfig,
        version: latestVersion
      })
      
      toast.success(`✅ Módulo actualizado correctamente (v${latestVersion}). Recarga la página.`)
      logger.success('Module updated successfully')
      
      // Recargar la página después de 2 segundos
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error) {
      logger.error('Error updating module:', error)
      toast.error('❌ Error actualizando módulo')
    }
  }

  // Renderizar campos del formulario basado en el manifest del módulo
  const renderFormField = (field: any) => {
    const fieldName = field.name
    const fieldValue = formData[fieldName] || ''

    // Lógica especial para mostrar/ocultar fecha_fin según el tipo
    if (fieldName === 'fecha_fin') {
      const tipoSeleccionado = formData.tipo
      if (tipoSeleccionado !== 'vacaciones') {
        return null // No mostrar fecha_fin si no es vacaciones
      }
    }

    switch (field.type) {
      case 'text':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              type="text"
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              required={field.required}
              placeholder={`Ingresa ${field.label.toLowerCase()}`}
            />
          </div>
        )

      case 'email':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              type="email"
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              required={field.required}
              placeholder={`Ingresa ${field.label.toLowerCase()}`}
            />
          </div>
        )

      case 'number':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              type="number"
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [fieldName]: parseFloat(e.target.value) || 0 })}
              required={field.required}
              placeholder={`Ingresa ${field.label.toLowerCase()}`}
            />
          </div>
        )

      case 'date':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              type="date"
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              required={field.required}
            />
          </div>
        )

      case 'select':
        // Manejar campos dinámicos
        let selectOptions = field.options || []
        
        logger.debug('renderFormField - select field:', field)
        logger.data('technicians loaded:', technicians)
        
        if (field.dynamic && field.source === 'technicians') {
          logger.debug('Field is dynamic for technicians')
          // Agregar técnicos dinámicamente
          const technicianOptions = technicians.map(tech => ({
            value: tech.id,
            label: `${tech.first_name} ${tech.last_name}`
          }))
          logger.data('technicianOptions:', technicianOptions)
          selectOptions = [...field.options, ...technicianOptions]
          logger.data('final selectOptions:', selectOptions)
        }
        
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={fieldValue}
              onChange={(e) => {
                const newValue = e.target.value
                setFormData({ ...formData, [fieldName]: newValue })
                
                // Si cambia el tipo y no es vacaciones, limpiar fecha_fin
                if (fieldName === 'tipo' && newValue !== 'vacaciones') {
                  setFormData((prev: any) => ({ ...prev, fecha_fin: '' }))
                }
              }}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecciona una opción</option>
              {selectOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )

      case 'textarea':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              required={field.required}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={`Ingresa ${field.label.toLowerCase()}`}
            />
          </div>
        )

      case 'boolean':
        return (
          <div key={fieldName} className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={fieldValue || false}
                onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
          </div>
        )

      default:
    return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              type="text"
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              required={field.required}
              placeholder={`Ingresa ${field.label.toLowerCase()}`}
            />
        </div>
    )
    }
  }

  // Si no hay módulo, mostrar mensaje después de todos los hooks
  if (modulesLoading) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando módulos...</p>
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
          <p className="text-gray-600">El módulo solicitado no está instalado o no existe.</p>
        </Card>
        </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentModule.name}</h1>
          <p className="text-gray-600">{currentModule.description}</p>
        </div>
        <div className="flex space-x-3">
         <Button 
           onClick={updateModuleFromStore}
           variant="outline"
           className="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
         >
           🔄 Actualizar Módulo
         </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar {currentModule.name}
          </Button>
        </div>
      </div>

      {/* Lista de datos */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Registros</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando datos...</p>
          </div>
        ) : moduleData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No hay registros aún</p>
            <Button 
              onClick={() => setShowModal(true)}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear primer registro
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Tabla con contenido... (resto del JSX igual) */}
            <p className="text-sm text-gray-600">Tabla de datos del módulo</p>
          </div>
        )}
      </Card>

      {/* Modales */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingItem ? `Editar ${currentModule.name}` : `Agregar ${currentModule.name}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentModule.config?.fields?.map(renderFormField)}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

