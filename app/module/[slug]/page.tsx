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

export default function ModulePage() {
  const params = useParams()
  const { company, user } = useAuth()
  const { modules } = useModules()
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
    if (!currentModule?.id) return

    try {
      setLoading(true)
      const data = await getModuleData(currentModule.id)
      setModuleData(data)
    } catch (error: any) {
      console.error('Error loading module data:', error)
      toast.error('Error cargando datos del módulo')
    } finally {
      setLoading(false)
    }
  }

  const loadTechnicians = async () => {
    try {
      logger.debug('Loading technicians...')
      const data = await getTechnicians()
      logger.data('Technicians loaded:', data)
      setTechnicians(data)
    } catch (error: any) {
      logger.error('Error loading technicians:', error)
      // No mostrar error si no hay técnicos, simplemente usar lista vacía
    }
  }

  useEffect(() => {
    loadModuleData()
    loadTechnicians()
  }, [currentModule?.id])

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
        await updateModuleData(editingItem.id, { data: formData })
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
      await deleteModuleData(selectedItem.id)
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
        toast.info('ℹ️ No hay actualizaciones disponibles para este módulo.')
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
                  setFormData(prev => ({ ...prev, fecha_fin: '' }))
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    {/* Columna para el botón de expansión */}
                  </th>
                  {currentModule.slug === 'vehicle-management' ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Técnico
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marca
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modelo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Placa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Técnico
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Inicio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Fin
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {moduleData.map((item) => (
                  <React.Fragment key={item.id}>
                    {/* Fila principal */}
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => toggleRowExpansion(item.id)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {isRowExpanded(item.id) ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">
                          {item.data.tecnico === 'todos' || item.data.tecnico === 'sin_asignar' ? 
                            (item.data.tecnico === 'todos' ? 'Todos' : 'Sin asignar') : 
                           (() => {
                             const tech = technicians.find(t => t.id === item.data.tecnico)
                             return tech ? `${tech.first_name} ${tech.last_name}` : item.data.tecnico || '-'
                           })()}
                        </Badge>
                      </td>
                      {currentModule.slug === 'vehicle-management' ? (
                        <>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.data.marca || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.data.modelo || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.data.placa || '-'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge variant={
                              item.data.tipo === 'vacaciones' ? 'primary' : 
                              item.data.tipo === 'festivo' ? 'success' : 
                              item.data.tipo === 'local' ? 'warning' : 'secondary'
                            } className="text-xs">
                              {item.data.tipo === 'vacaciones' ? 'Vacaciones' :
                               item.data.tipo === 'festivo' ? 'Festivo Nacional' :
                               item.data.tipo === 'local' ? 'Festivo Local' :
                               item.data.tipo === 'empresa' ? 'Festivo Empresa' :
                               item.data.tipo || '-'}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.data.fecha_inicio ? new Date(item.data.fecha_inicio).toLocaleDateString('es-ES') : '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.data.fecha_fin ? new Date(item.data.fecha_fin).toLocaleDateString('es-ES') : '-'}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleView(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(item)
                              setShowDeleteModal(true)
                            }}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Fila expandida */}
                    {isRowExpanded(item.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={currentModule.slug === 'vehicle-management' ? 6 : 6} className="px-4 py-4">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                            {/* Header con título y fecha */}
                            <div className="bg-white rounded-t-xl border-b border-gray-200 px-6 py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    {currentModule.slug === 'vehicle-management' ? (
                                      <Truck className="h-5 w-5 text-blue-600" />
                                    ) : (
                                      <Calendar className="h-5 w-5 text-blue-600" />
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {currentModule.slug === 'vehicle-management' 
                                        ? `${item.data.marca || ''} ${item.data.modelo || ''}`.trim() || 'Vehículo'
                                        : item.data.nombre || 'Sin nombre'
                                      }
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      Registro creado el {new Date(item.created_at).toLocaleDateString('es-ES')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  {currentModule.slug === 'vehicle-management' ? (
                                    <Badge variant="outline" className="text-xs">
                                      {item.data.placa || 'Sin placa'}
                                    </Badge>
                                  ) : (
                                    <Badge variant={
                                      item.data.tipo === 'vacaciones' ? 'primary' : 
                                      item.data.tipo === 'festivo' ? 'success' : 
                                      item.data.tipo === 'local' ? 'warning' : 'secondary'
                                    } className="text-xs">
                                      {item.data.tipo === 'vacaciones' ? 'Vacaciones' :
                                       item.data.tipo === 'festivo' ? 'Festivo Nacional' :
                                       item.data.tipo === 'local' ? 'Festivo Local' :
                                       item.data.tipo === 'empresa' ? 'Festivo Empresa' :
                                       item.data.tipo || '-'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Contenido principal */}
                            <div className="p-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Columna izquierda - Información principal */}
                                <div className="space-y-4">
                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                      <Users className="h-4 w-4 mr-2 text-blue-600" />
                                      {currentModule.slug === 'vehicle-management' ? 'Asignación del Vehículo' : 'Asignación'}
                                    </h4>
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">Técnico:</span>
                                        <Badge variant="outline" className="text-xs">
                                          {item.data.tecnico === 'todos' || item.data.tecnico === 'sin_asignar' ? 
                                            (item.data.tecnico === 'todos' ? 'Todos los técnicos' : 'Sin asignar') : 
                                           (() => {
                                             const tech = technicians.find(t => t.id === item.data.tecnico)
                                             return tech ? `${tech.first_name} ${tech.last_name}` : item.data.tecnico || '-'
                                           })()}
                                        </Badge>
                                      </div>
                                      {currentModule.slug !== 'vehicle-management' && (
                                        <div className="flex items-center justify-between py-2">
                                          <span className="text-sm font-medium text-gray-600">Tipo:</span>
                                          <Badge variant={
                                            item.data.tipo === 'vacaciones' ? 'primary' : 
                                            item.data.tipo === 'festivo' ? 'success' : 
                                            item.data.tipo === 'local' ? 'warning' : 'secondary'
                                          } className="text-xs">
                                            {item.data.tipo === 'vacaciones' ? 'Vacaciones' :
                                             item.data.tipo === 'festivo' ? 'Festivo Nacional' :
                                             item.data.tipo === 'local' ? 'Festivo Local' :
                                             item.data.tipo === 'empresa' ? 'Festivo Empresa' :
                                             item.data.tipo || '-'}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Campos adicionales */}
                                  {currentModule.config?.fields?.filter((field: any) => 
                                    !['tecnico', 'tipo', 'nombre', 'fecha_inicio', 'fecha_fin'].includes(field.name)
                                  ).map((field: any) => (
                                    <div key={field.name} className="bg-white rounded-lg border border-gray-200 p-4">
                                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                        {field.name === 'repetir_anual' ? (
                                          <>
                                            <Calendar className="h-4 w-4 mr-2 text-green-600" />
                                            Repetición
                                          </>
                                        ) : field.name === 'descripcion' ? (
                                          <>
                                            <FileText className="h-4 w-4 mr-2 text-purple-600" />
                                            Descripción
                                          </>
                                        ) : (
                                          <>
                                            <FileText className="h-4 w-4 mr-2 text-gray-600" />
                                            {field.label}
                                          </>
                                        )}
                                      </h4>
                                      <div className="text-sm text-gray-900">
                                        {field.type === 'boolean' ? (
                                          <div className="flex items-center justify-between py-2">
                                            <span className="text-sm font-medium text-gray-600">{field.label}:</span>
                                            <Badge variant={item.data[field.name] ? 'success' : 'secondary'} className="text-xs">
                                              {item.data[field.name] ? 'Sí' : 'No'}
                                            </Badge>
                                          </div>
                                        ) : field.type === 'textarea' ? (
                                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border max-h-24 overflow-y-auto">
                                            {item.data[field.name] || '-'}
                                          </div>
                                        ) : (
                                          <div className="text-sm text-gray-900">
                                            {item.data[field.name] || '-'}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Columna derecha - Fechas y metadatos */}
                                <div className="space-y-4">
                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                      <Calendar className="h-4 w-4 mr-2 text-green-600" />
                                      {currentModule.slug === 'vehicle-management' ? 'Información del Vehículo' : 'Fechas'}
                                    </h4>
                                    <div className="space-y-3">
                                      {currentModule.slug === 'vehicle-management' ? (
                                        <>
                                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm font-medium text-gray-600">Marca:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                              {item.data.marca || '-'}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm font-medium text-gray-600">Modelo:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                              {item.data.modelo || '-'}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm font-medium text-gray-600">Año:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                              {item.data.año || '-'}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between py-2">
                                            <span className="text-sm font-medium text-gray-600">Combustible:</span>
                                            <Badge variant="outline" className="text-xs">
                                              {item.data.tipo_combustible === 'gasolina' ? 'Gasolina' :
                                               item.data.tipo_combustible === 'diesel' ? 'Diésel' :
                                               item.data.tipo_combustible === 'electrico' ? 'Eléctrico' :
                                               item.data.tipo_combustible === 'hibrido' ? 'Híbrido' :
                                               item.data.tipo_combustible || '-'}
                                            </Badge>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm font-medium text-gray-600">Inicio:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                              {item.data.fecha_inicio ? new Date(item.data.fecha_inicio).toLocaleDateString('es-ES') : '-'}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between py-2">
                                            <span className="text-sm font-medium text-gray-600">Fin:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                              {item.data.fecha_fin ? new Date(item.data.fecha_fin).toLocaleDateString('es-ES') : '-'}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                      <Clock className="h-4 w-4 mr-2 text-gray-600" />
                                      Metadatos
                                    </h4>
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">Creado:</span>
                                        <span className="text-sm text-gray-900">
                                          {new Date(item.created_at).toLocaleDateString('es-ES')}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between py-2">
                                        <span className="text-sm font-medium text-gray-600">Actualizado:</span>
                                        <span className="text-sm text-gray-900">
                                          {new Date(item.updated_at).toLocaleDateString('es-ES')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal para crear/editar */}
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

      {/* Modal para ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Detalles del Registro`}
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Header con información principal */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {currentModule.slug === 'vehicle-management' ? (
                    <Truck className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Calendar className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentModule.slug === 'vehicle-management' 
                      ? `${selectedItem.data.marca || ''} ${selectedItem.data.modelo || ''}`.trim() || 'Vehículo'
                      : selectedItem.data.nombre || 'Sin nombre'
                    }
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    {currentModule.slug === 'vehicle-management' ? (
                      <Badge variant="outline" className="text-xs">
                        {selectedItem.data.placa || 'Sin placa'}
                      </Badge>
                    ) : (
                      <Badge variant={
                        selectedItem.data.tipo === 'vacaciones' ? 'primary' : 
                        selectedItem.data.tipo === 'festivo' ? 'success' : 
                        selectedItem.data.tipo === 'local' ? 'warning' : 'secondary'
                      } className="text-xs">
                        {selectedItem.data.tipo === 'vacaciones' ? 'Vacaciones' :
                         selectedItem.data.tipo === 'festivo' ? 'Festivo Nacional' :
                         selectedItem.data.tipo === 'local' ? 'Festivo Local' :
                         selectedItem.data.tipo === 'empresa' ? 'Festivo Empresa' :
                         selectedItem.data.tipo || '-'}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {selectedItem.data.tecnico === 'todos' || selectedItem.data.tecnico === 'sin_asignar' ? 
                        (selectedItem.data.tecnico === 'todos' ? 'Todos los técnicos' : 'Sin asignar') : 
                       (() => {
                         const tech = technicians.find(t => t.id === selectedItem.data.tecnico)
                         return tech ? `${tech.first_name} ${tech.last_name}` : selectedItem.data.tecnico || '-'
                       })()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Información detallada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentModule.slug === 'vehicle-management' ? (
                <>
                  {/* Información del vehículo */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      Información del Vehículo
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Marca:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedItem.data.marca || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Modelo:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedItem.data.modelo || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Año:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedItem.data.año || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Combustible:</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedItem.data.tipo_combustible === 'gasolina' ? 'Gasolina' :
                           selectedItem.data.tipo_combustible === 'diesel' ? 'Diésel' :
                           selectedItem.data.tipo_combustible === 'electrico' ? 'Eléctrico' :
                           selectedItem.data.tipo_combustible === 'hibrido' ? 'Híbrido' :
                           selectedItem.data.tipo_combustible || '-'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Asignación */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Asignación
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Técnico:</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedItem.data.tecnico === 'todos' || selectedItem.data.tecnico === 'sin_asignar' ? 
                            (selectedItem.data.tecnico === 'todos' ? 'Todos los técnicos' : 'Sin asignar') : 
                           (() => {
                             const tech = technicians.find(t => t.id === selectedItem.data.tecnico)
                             return tech ? `${tech.first_name} ${tech.last_name}` : selectedItem.data.tecnico || '-'
                           })()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Fechas */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Fechas
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Inicio:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedItem.data.fecha_inicio ? new Date(selectedItem.data.fecha_inicio).toLocaleDateString('es-ES') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fin:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedItem.data.fecha_fin ? new Date(selectedItem.data.fecha_fin).toLocaleDateString('es-ES') : '-'}
                        </span>
                      </div>
                      {selectedItem.data.repetir_anual && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Repetir:</span>
                          <Badge variant="success" className="text-xs">Anualmente</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Información
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Creado:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(selectedItem.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Actualizado:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(selectedItem.updated_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Metadatos */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Metadatos
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Creado:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(selectedItem.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Actualizado:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(selectedItem.updated_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false)
                  handleEdit(selectedItem)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para eliminar */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p>¿Estás seguro de que quieres eliminar este registro?</p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}